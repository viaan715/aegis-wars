"""Paving Plan AI - address-to-phasing-map prototype.

This app is intentionally conservative: it produces a preliminary operational map,
not a construction drawing. A paving contractor must verify all field conditions,
ADA access, drainage, fire lanes, utilities, and municipal requirements.
"""
from __future__ import annotations

import base64
import io
import json
import logging
import os
import sqlite3
import textwrap
import threading
import time
import uuid
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal
from urllib.parse import quote

import requests
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from openai import OpenAI
from PIL import Image, ImageDraw, ImageFont
from pydantic import BaseModel, Field, confloat

load_dotenv()

ROOT = Path(__file__).parent
STATIC_DIR = ROOT / "static"
DEMO_DIR = ROOT / "demo_assets"
DATA_DIR = Path(os.getenv("DATA_DIR", str(ROOT / "data")))
HISTORY_DIR = DATA_DIR / "history"
DB_PATH = DATA_DIR / "history.db"

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").strip().upper(),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("paving_plan_ai")

app = FastAPI(title="Paving Plan AI", version="0.2.0")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# ---------- Job types ----------

JobTypeId = Literal["sealcoat", "mill_overlay", "full_depth"]

JOB_TYPES: dict[str, dict] = {
    "sealcoat": {
        "label": "Sealcoating & Restripe",
        "description": "Crack fill, seal coat, and restripe. Fast turnaround, minimal disruption.",
        "default_days": 2,
        "min_days": 1,
        "max_days": 2,
        "job_assumption": "sealcoating, crack fill, and restriping only — no milling or excavation",
    },
    "mill_overlay": {
        "label": "Mill & Overlay",
        "description": "Mill the existing surface and repave with localized base repair.",
        "default_days": 3,
        "min_days": 2,
        "max_days": 4,
        "job_assumption": "mill-and-overlay with localized base repair, not full excavation",
    },
    "full_depth": {
        "label": "Full-Depth Reconstruction",
        "description": "Remove pavement to the subgrade and rebuild. Longest closures, heaviest equipment.",
        "default_days": 5,
        "min_days": 3,
        "max_days": 5,
        "job_assumption": "full-depth reconstruction down to subgrade — expect the heaviest equipment and the longest single-zone closures",
    },
}


def job_type_or_404(job_type: str) -> dict:
    job = JOB_TYPES.get(job_type)
    if job is None:
        raise HTTPException(status_code=400, detail=f"Unknown job type '{job_type}'.")
    return job


# ---------- API request / AI response models ----------

class PlanRequest(BaseModel):
    address: str = Field(min_length=8, max_length=220)
    business_name: str = Field(default="", max_length=120)
    job_type: JobTypeId = "mill_overlay"
    days: int | None = Field(default=None, ge=1, le=5)


class Point(BaseModel):
    # Normalized image coordinate: 0 is left/top and 100 is right/bottom.
    x: confloat(ge=0, le=100)
    y: confloat(ge=0, le=100)


class Phase(BaseModel):
    day: int = Field(ge=1, le=5)
    title: str = Field(max_length=70)
    zone_label: str = Field(max_length=90)
    polygon: list[Point] = Field(min_length=3, max_length=14)
    label_anchor: Point
    guest_instruction: str = Field(max_length=90)
    guest_arrow_to: Point


class SitePlan(BaseModel):
    site_confidence: int = Field(ge=0, le=100)
    human_review_required: bool
    front_description: str = Field(max_length=140)
    assumptions: list[str] = Field(min_length=1, max_length=6)
    phases: list[Phase] = Field(min_length=1, max_length=5)


class RenderPlanRequest(BaseModel):
    plan: SitePlan
    raw_image: str = Field(min_length=10)
    business_name: str = Field(default="", max_length=120)
    formatted_address: str = Field(min_length=1, max_length=220)
    job_type: JobTypeId = "mill_overlay"


class GuestNoticeRequest(BaseModel):
    plan: SitePlan
    business_name: str = Field(default="", max_length=120)
    formatted_address: str = Field(min_length=1, max_length=220)


class HistorySaveRequest(BaseModel):
    plan: SitePlan
    plan_image: str = Field(min_length=10)
    business_name: str = Field(default="", max_length=120)
    formatted_address: str = Field(min_length=1, max_length=220)
    job_type: JobTypeId = "mill_overlay"


# ---------- Rate limiting (lightweight, in-memory, single-process) ----------

RATE_LIMIT_MAX_REQUESTS = int(os.getenv("RATE_LIMIT_MAX_REQUESTS", "6"))
RATE_LIMIT_WINDOW_SECONDS = float(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "300"))

_rate_lock = threading.Lock()
_rate_buckets: dict[str, list[float]] = defaultdict(list)


def enforce_rate_limit(key: str) -> None:
    now = time.monotonic()
    cutoff = now - RATE_LIMIT_WINDOW_SECONDS
    with _rate_lock:
        bucket = _rate_buckets[key]
        while bucket and bucket[0] < cutoff:
            bucket.pop(0)
        if len(bucket) >= RATE_LIMIT_MAX_REQUESTS:
            raise HTTPException(
                status_code=429,
                detail="Too many plan requests from this connection. Please wait a few minutes and try again.",
            )
        bucket.append(now)


# ---------- Configuration / imagery ----------

def require_live_configuration() -> tuple[str, str]:
    openai_key = os.getenv("OPENAI_API_KEY", "").strip()
    mapbox_key = os.getenv("MAPBOX_ACCESS_TOKEN", "").strip()
    confirmation = os.getenv("IMAGERY_LICENSE_CONFIRMED", "false").strip().lower()

    if not openai_key or not mapbox_key:
        raise HTTPException(
            status_code=503,
            detail="Live mode needs OPENAI_API_KEY and MAPBOX_ACCESS_TOKEN in the server .env file.",
        )
    if confirmation not in {"1", "true", "yes"}:
        raise HTTPException(
            status_code=503,
            detail=(
                "Set IMAGERY_LICENSE_CONFIRMED=true after confirming your satellite-imagery "
                "license permits annotated AI-generated plan output."
            ),
        )
    return openai_key, mapbox_key


def geocode_address(address: str, token: str) -> tuple[float, float, str]:
    """Forward geocode with Mapbox Geocoding v6; tolerate minor response differences."""
    response = requests.get(
        "https://api.mapbox.com/search/geocode/v6/forward",
        params={
            "q": address,
            "access_token": token,
            "limit": 1,
            "types": "address,street,place",
            "autocomplete": "false",
        },
        timeout=25,
    )
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail="Address lookup failed. Check the address and Mapbox key.")

    data = response.json()
    features = data.get("features", [])
    if not features:
        raise HTTPException(status_code=404, detail="No location found. Try a full street address, city, state, and ZIP.")

    feature = features[0]
    coordinates = (feature.get("geometry") or {}).get("coordinates")
    if not coordinates:
        prop_coords = (feature.get("properties") or {}).get("coordinates")
        if isinstance(prop_coords, dict):
            coordinates = [prop_coords.get("longitude"), prop_coords.get("latitude")]
        else:
            coordinates = prop_coords
    if not coordinates or len(coordinates) < 2:
        raise HTTPException(status_code=502, detail="The geocoding provider did not return usable coordinates.")

    formatted = feature.get("properties", {}).get("full_address") or feature.get("place_name") or address
    return float(coordinates[0]), float(coordinates[1]), formatted


def fetch_satellite_image(lon: float, lat: float, token: str) -> bytes:
    # 1280 x 1280 is the documented max static image size. zoom 19 usually captures
    # a single commercial property; a human reviewer must still confirm the crop.
    style = os.getenv("MAPBOX_STYLE", "mapbox/satellite-v9").strip()
    if "/" not in style:
        raise HTTPException(status_code=500, detail="MAPBOX_STYLE must be in owner/style-id format.")
    owner, style_id = style.split("/", 1)
    endpoint = (
        f"https://api.mapbox.com/styles/v1/{quote(owner)}/{quote(style_id)}"
        f"/static/{lon:.6f},{lat:.6f},19/1280x1280"
    )
    response = requests.get(endpoint, params={"access_token": token, "logo": "true", "attribution": "true"}, timeout=40)
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail="Satellite image request failed. Confirm the style, token, and imagery plan.")
    if not response.content.startswith((b"\x89PNG", b"\xff\xd8")):
        raise HTTPException(status_code=502, detail="Satellite image provider returned an unexpected response.")
    return response.content


# ---------- AI analysis ----------

def build_instructions(job: dict, days: int) -> str:
    return f"""You are an experienced parking-lot phasing planner. Review the aerial image of a business site.
Create a preliminary {days}-day paving circulation plan designed to keep the most guest/customer parking available at all times.
The job assumption is {job['job_assumption']}.

Coordinate system: x and y are percentages of the IMAGE ONLY. (0,0) is the upper-left image corner. (100,100) is lower-right.

Return exactly {days} phase(s), numbered 1 through {days} with no gaps or repeats:
- Day 1 must generally close a rear/least operational parking zone while preserving the main entrance / front drive.
- Each subsequent day should close the next set of remaining parking bays, using zones completed on earlier days for parking.
- The final day (Day {days}) must close the main entry drive, entrance apron, and tie-ins for the shortest window, preferably overnight or early morning.

Use polygons only on pavement/parking areas; do not shade roofs, lawns, or neighboring sites. The image may be imperfect or outdated.
Do not make claims about exact stall counts, ADA compliance, drainage, or fire routes. Set human_review_required=true.
Your assumptions must include that a contractor verifies field conditions and that a protected accessible route/fire access remain available.
Be concise. The labels must be understandable by a guest and a paving crew."""


def analyze_lot(image_bytes: bytes, address: str, business_name: str, job_type: str, days: int) -> SitePlan:
    api_key = os.getenv("OPENAI_API_KEY", "")
    client = OpenAI(api_key=api_key)
    b64 = base64.b64encode(image_bytes).decode("ascii")
    image_url = f"data:image/png;base64,{b64}"

    job = job_type_or_404(job_type)
    instructions = build_instructions(job, days)

    site_name = business_name.strip() or "the business"
    user_prompt = (
        f"Create the preliminary {days}-day paving plan for {site_name} at {address}. "
        "Focus on maximum usable parking and minimal entrance disruption."
    )

    try:
        response = client.responses.parse(
            model=os.getenv("OPENAI_VISION_MODEL", "gpt-5.5"),
            input=[
                {"role": "system", "content": instructions},
                {
                    "role": "user",
                    "content": [
                        {"type": "input_text", "text": user_prompt},
                        {"type": "input_image", "image_url": image_url, "detail": "high"},
                    ],
                },
            ],
            text_format=SitePlan,
            store=False,
        )
    except Exception as exc:  # Keeps API errors from leaking keys / stack traces to browser.
        logger.error("AI site analysis failed: %s", str(exc)[:300])
        raise HTTPException(status_code=502, detail=f"AI site analysis failed: {str(exc)[:260]}") from exc

    plan = response.output_parsed
    if plan is None:
        raise HTTPException(status_code=502, detail="AI site analysis returned no usable plan. Try again with a more precise address.")
    if sorted(phase.day for phase in plan.phases) != list(range(1, days + 1)):
        raise HTTPException(status_code=502, detail="AI site analysis returned an incomplete phasing plan. Please retry.")
    return plan


# ---------- Deterministic map rendering ----------

CANVAS_W = 1280
IMAGE_H = 1280
HEADER_H = 196

GREEN = (22, 163, 74, 255)
TEXT_DARK = (22, 30, 43, 255)
WHITE = (255, 255, 255, 255)

# Ordered blue -> red gradient. Day 1 always reads as "least disruptive",
# the final day always reads as "main entrance / highest disruption",
# regardless of how many total phases the plan has.
_GRADIENT_STOPS = [
    {"fill": (37, 99, 235, 108), "outline": (30, 64, 175, 255)},
    {"fill": (8, 145, 178, 112), "outline": (14, 116, 144, 255)},
    {"fill": (245, 158, 11, 115), "outline": (180, 83, 9, 255)},
    {"fill": (234, 88, 12, 115), "outline": (154, 52, 18, 255)},
    {"fill": (220, 38, 38, 112), "outline": (153, 27, 27, 255)},
]


def style_for_day(day: int, total_days: int) -> dict:
    if total_days <= 1:
        idx = len(_GRADIENT_STOPS) - 1
    else:
        idx = round((day - 1) * (len(_GRADIENT_STOPS) - 1) / (total_days - 1))
    return _GRADIENT_STOPS[max(0, min(idx, len(_GRADIENT_STOPS) - 1))]


def get_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size=size)
    return ImageFont.load_default()


def wrapped_lines(text: str, width: int) -> list[str]:
    return textwrap.wrap(text, width=max(12, width)) or [text]


def point_px(point: Point, width: int, height: int, y_offset: int = 0) -> tuple[int, int]:
    return (round(width * point.x / 100), y_offset + round(height * point.y / 100))


def _rects_overlap(a: tuple[int, int, int, int], b: tuple[int, int, int, int]) -> bool:
    ax0, ay0, ax1, ay1 = a
    bx0, by0, bx1, by1 = b
    return ax0 < bx1 and ax1 > bx0 and ay0 < by1 and ay1 > by0


class LabelPlacer:
    """Draws rounded-rectangle text labels and nudges them down to avoid
    stacking on top of labels already placed on this render."""

    def __init__(self, draw: ImageDraw.ImageDraw, content_top: int, content_bottom: int) -> None:
        self.draw = draw
        self.content_top = content_top
        self.content_bottom = content_bottom
        self.placed: list[tuple[int, int, int, int]] = []

    def place(self, xy: tuple[int, int], text: str, fill: tuple[int, int, int, int], max_chars: int = 27) -> None:
        font = get_font(26, bold=True)
        lines = wrapped_lines(text.upper(), max_chars)
        widths = [self.draw.textbbox((0, 0), line, font=font)[2] for line in lines]
        line_h = 32
        box_w = min(max(widths) + 36, 530)
        box_h = 22 + line_h * len(lines)
        x, y = xy
        x = max(12, min(x, CANVAS_W - box_w - 12))
        y = max(self.content_top, min(y, self.content_bottom - box_h - 12))

        for _ in range(10):
            candidate = (x, y, x + box_w, y + box_h)
            if not any(_rects_overlap(candidate, other) for other in self.placed):
                break
            y += box_h + 14
            if y + box_h > self.content_bottom:
                y = self.content_top
                x = min(x + box_w + 20, CANVAS_W - box_w - 12)
        y = max(self.content_top, min(y, self.content_bottom - box_h - 12))

        box = (x, y, x + box_w, y + box_h)
        self.placed.append(box)
        self.draw.rounded_rectangle(box, radius=14, fill=fill, outline=WHITE, width=3)
        for i, line in enumerate(lines):
            self.draw.text((x + 18, y + 11 + i * line_h), line, font=font, fill=WHITE)


def draw_arrow(draw: ImageDraw.ImageDraw, start: tuple[int, int], end: tuple[int, int]) -> None:
    draw.line((start, end), fill=GREEN, width=12)
    ex, ey = end
    sx, sy = start
    dx, dy = ex - sx, ey - sy
    length = max((dx * dx + dy * dy) ** 0.5, 1)
    ux, uy = dx / length, dy / length
    px, py = -uy, ux
    head = 28
    wing = 18
    p1 = (ex, ey)
    p2 = (ex - ux * head + px * wing, ey - uy * head + py * wing)
    p3 = (ex - ux * head - px * wing, ey - uy * head - py * wing)
    draw.polygon([p1, p2, p3], fill=GREEN)


def _footer_height(num_phases: int, safety_line_count: int) -> int:
    legend_h = 70 + 37 * num_phases + 24
    safety_h = 80 + 23 * safety_line_count + 30
    return max(legend_h, safety_h) + 20


SAFETY_TEXT = (
    "Move vehicles before work begins. Maintain a protected accessible route and emergency/fire access. "
    "Confirm traffic control, drainage, utilities, ADA layout, and municipal requirements in the field."
)


def render_plan_image(map_bytes: bytes, plan: SitePlan, site_name: str, formatted_address: str, job_type: str) -> bytes:
    job = job_type_or_404(job_type)
    phases = sorted(plan.phases, key=lambda item: item.day)
    total_days = len(phases)

    safety_lines = wrapped_lines(SAFETY_TEXT, 65)
    footer_h = _footer_height(total_days, len(safety_lines))
    canvas_h = HEADER_H + IMAGE_H + footer_h

    base = Image.open(io.BytesIO(map_bytes)).convert("RGBA")
    base = base.resize((CANVAS_W, IMAGE_H))
    canvas = Image.new("RGBA", (CANVAS_W, canvas_h), WHITE)
    canvas.alpha_composite(base, (0, HEADER_H))
    draw = ImageDraw.Draw(canvas, "RGBA")

    # Header
    draw.rectangle((0, 0, CANVAS_W, HEADER_H), fill=(248, 250, 252, 255))
    draw.text((640, 24), f"{total_days}-DAY {job['label'].upper()} PLAN", anchor="ma", font=get_font(44, True), fill=TEXT_DARK)
    subtitle = f"{site_name or 'Business site'} · {formatted_address}"
    draw.text((640, 82), subtitle[:110], anchor="ma", font=get_font(22, False), fill=(71, 85, 105, 255))
    draw.text((640, 116), job["description"][:110], anchor="ma", font=get_font(19, False), fill=(100, 116, 139, 255))
    draw.text((640, 154), "Preliminary operations map — contractor field verification required", anchor="ma", font=get_font(20, False), fill=(148, 57, 32, 255))

    content_top = HEADER_H + 10
    content_bottom = HEADER_H + IMAGE_H - 12
    labels = LabelPlacer(draw, content_top, content_bottom)

    # Draw every phase's polygon and badge first, then all arrows, then all
    # text labels last so labels always land on top of arrows/polygons and
    # the collision-avoidance pass sees every other label already placed.
    badge_anchors: list[tuple[int, int]] = []
    targets: list[tuple[int, int]] = []
    for phase in phases:
        style = style_for_day(phase.day, total_days)
        polygon = [point_px(p, CANVAS_W, IMAGE_H, HEADER_H) for p in phase.polygon]
        draw.polygon(polygon, fill=style["fill"])
        draw.line(polygon + [polygon[0]], fill=style["outline"], width=7, joint="curve")

        anchor = point_px(phase.label_anchor, CANVAS_W, IMAGE_H, HEADER_H)
        target = point_px(phase.guest_arrow_to, CANVAS_W, IMAGE_H, HEADER_H)
        badge_anchors.append(anchor)
        targets.append(target)
        draw_arrow(draw, (anchor[0], anchor[1] + 52), target)

    for phase, anchor in zip(phases, badge_anchors):
        badge_box = (anchor[0] - 46, anchor[1] - 46, anchor[0] + 46, anchor[1] + 46)
        draw.ellipse(badge_box, fill=(15, 23, 42, 255), outline=WHITE, width=4)
        draw.text((anchor[0], anchor[1] - 2), str(phase.day), anchor="mm", font=get_font(44, True), fill=WHITE)

    for phase, anchor in zip(phases, badge_anchors):
        style = style_for_day(phase.day, total_days)
        labels.place((anchor[0] + 60, anchor[1] - 44), phase.zone_label, style["outline"])

    for phase, target in zip(phases, targets):
        labels.place((target[0] - 40, target[1] - 96), "Guests: " + phase.guest_instruction, GREEN, max_chars=25)

    # Footer: legend and safety note.
    footer_y = HEADER_H + IMAGE_H
    draw.rectangle((0, footer_y, CANVAS_W, canvas_h), fill=(248, 250, 252, 255))
    draw.text((36, footer_y + 24), "LEGEND", font=get_font(25, True), fill=TEXT_DARK)
    legend_y = footer_y + 70
    x = 36
    for phase in phases:
        style = style_for_day(phase.day, total_days)
        draw.rounded_rectangle((x, legend_y, x + 38, legend_y + 34), radius=5, fill=style["fill"], outline=style["outline"], width=3)
        legend_text = f"DAY {phase.day} · {phase.zone_label}"
        draw.text((x + 52, legend_y + 2), legend_text[:78], font=get_font(19, False), fill=TEXT_DARK)
        legend_y += 37

    safety_box_top = footer_y + 25
    safety_box_h = 55 + len(safety_lines) * 23 + 20
    draw.rounded_rectangle(
        (620, safety_box_top, CANVAS_W - 40, safety_box_top + safety_box_h),
        radius=14, fill=(255, 255, 255, 255), outline=(203, 213, 225, 255), width=2,
    )
    draw.text((650, safety_box_top + 20), "Before each phase", font=get_font(24, True), fill=TEXT_DARK)
    y = safety_box_top + 52
    for line in safety_lines:
        draw.text((650, y), line, font=get_font(18, False), fill=(51, 65, 85, 255))
        y += 23

    out = io.BytesIO()
    canvas.convert("RGB").save(out, format="PNG", optimize=True)
    return out.getvalue()


def to_data_url(raw: bytes, mime: str = "image/png") -> str:
    return f"data:{mime};base64,{base64.b64encode(raw).decode('ascii')}"


def decode_data_url(data_url: str) -> bytes:
    if "," not in data_url:
        raise HTTPException(status_code=400, detail="Invalid image data.")
    header, _, b64data = data_url.partition(",")
    if "base64" not in header:
        raise HTTPException(status_code=400, detail="Invalid image data encoding.")
    try:
        return base64.b64decode(b64data, validate=True)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid image data.") from exc


def load_validated_image(data_url: str, field_name: str) -> bytes:
    raw = decode_data_url(data_url)
    try:
        Image.open(io.BytesIO(raw)).verify()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"{field_name} is not a valid image.") from exc
    return raw


# ---------- Guest notice ----------

def build_guest_notice(plan: SitePlan, business_name: str, formatted_address: str) -> str:
    site = business_name.strip() or "our business"
    phases = sorted(plan.phases, key=lambda item: item.day)
    lines = [
        f"Parking Notice — {site}",
        formatted_address,
        "",
        f"We're repaving our parking lot over the next {len(phases)} day(s). Here's where to park each day:",
        "",
    ]
    for phase in phases:
        lines.append(f"Day {phase.day}: {phase.zone_label}. Please {phase.guest_instruction}.")
    lines.append("")
    lines.append("Thank you for your patience — reach out if you need accessible parking directions.")
    return "\n".join(lines)


# ---------- History storage (SQLite, opt-in per plan) ----------

def init_db() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    HISTORY_DIR.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS history (
                id TEXT PRIMARY KEY,
                created_at TEXT NOT NULL,
                business_name TEXT NOT NULL DEFAULT '',
                formatted_address TEXT NOT NULL,
                job_type TEXT NOT NULL,
                days INTEGER NOT NULL,
                plan_json TEXT NOT NULL,
                image_filename TEXT NOT NULL
            )
            """
        )


init_db()


# ---------- endpoints ----------

@app.get("/", include_in_schema=False)
def home() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/health")
def health() -> dict:
    return {"ok": True, "service": "paving-plan-ai"}


@app.get("/api/status")
def status() -> dict:
    """Expose setup readiness without ever returning secret values."""
    missing: list[str] = []
    if not os.getenv("OPENAI_API_KEY", "").strip():
        missing.append("OPENAI_API_KEY")
    if not os.getenv("MAPBOX_ACCESS_TOKEN", "").strip():
        missing.append("MAPBOX_ACCESS_TOKEN")
    confirmed = os.getenv("IMAGERY_LICENSE_CONFIRMED", "false").strip().lower() in {"1", "true", "yes"}
    if not confirmed:
        missing.append("IMAGERY_LICENSE_CONFIRMED")
    return {
        "demo_available": True,
        "live_ready": not missing,
        "missing": missing,
    }


@app.get("/api/job-types")
def job_types() -> dict:
    return {
        "job_types": [
            {"id": key, "label": val["label"], "description": val["description"],
             "default_days": val["default_days"], "min_days": val["min_days"], "max_days": val["max_days"]}
            for key, val in JOB_TYPES.items()
        ]
    }


@app.get("/api/demo")
def demo() -> dict:
    plan_path = DEMO_DIR / "example_plan.json"
    plan_data = json.loads(plan_path.read_text())
    return {
        "mode": "demo",
        "job_type": "mill_overlay",
        "plan_image": to_data_url((DEMO_DIR / "example_paving_plan.png").read_bytes()),
        "raw_image": to_data_url((DEMO_DIR / "example_satellite.png").read_bytes()),
        "formatted_address": "1500 Example Plaza Drive, Springfield (illustrative demo, not a real satellite image)",
        "business_name": "Example Retail Plaza",
        "plan": plan_data,
    }


@app.post("/api/generate-plan")
def generate_plan(payload: PlanRequest, request: Request) -> dict:
    client_key = request.client.host if request.client else "unknown"
    enforce_rate_limit(client_key)

    job = job_type_or_404(payload.job_type)
    days = payload.days or job["default_days"]
    if not (job["min_days"] <= days <= job["max_days"]):
        raise HTTPException(
            status_code=400,
            detail=f"For {job['label']}, choose a plan length between {job['min_days']} and {job['max_days']} days.",
        )

    _, mapbox_token = require_live_configuration()
    lon, lat, formatted_address = geocode_address(payload.address, mapbox_token)
    map_bytes = fetch_satellite_image(lon, lat, mapbox_token)
    plan = analyze_lot(map_bytes, formatted_address, payload.business_name, payload.job_type, days)
    output = render_plan_image(map_bytes, plan, payload.business_name, formatted_address, payload.job_type)

    logger.info("generated plan job_type=%s days=%s address=%s", payload.job_type, days, formatted_address)

    return {
        "mode": "live",
        "job_type": payload.job_type,
        "plan_image": to_data_url(output),
        "raw_image": to_data_url(map_bytes),
        "formatted_address": formatted_address,
        "business_name": payload.business_name,
        "coordinates": {"longitude": lon, "latitude": lat},
        "plan": plan.model_dump(),
    }


@app.post("/api/render-plan")
def render_plan(payload: RenderPlanRequest) -> dict:
    raw_image = load_validated_image(payload.raw_image, "raw_image")
    try:
        output = render_plan_image(raw_image, payload.plan, payload.business_name, payload.formatted_address, payload.job_type)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("render_plan_image failed")
        raise HTTPException(status_code=500, detail="Could not render the plan image with those edits.") from exc
    return {"plan_image": to_data_url(output)}


@app.post("/api/guest-notice")
def guest_notice(payload: GuestNoticeRequest) -> dict:
    return {"notice": build_guest_notice(payload.plan, payload.business_name, payload.formatted_address)}


@app.post("/api/history")
def save_history(payload: HistorySaveRequest) -> dict:
    image_bytes = load_validated_image(payload.plan_image, "plan_image")
    record_id = uuid.uuid4().hex
    filename = f"{record_id}.png"
    (HISTORY_DIR / filename).write_bytes(image_bytes)
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            "INSERT INTO history (id, created_at, business_name, formatted_address, job_type, days, plan_json, image_filename)"
            " VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (
                record_id,
                datetime.now(timezone.utc).isoformat(),
                payload.business_name,
                payload.formatted_address,
                payload.job_type,
                len(payload.plan.phases),
                payload.plan.model_dump_json(),
                filename,
            ),
        )
    logger.info("history saved id=%s", record_id)
    return {"id": record_id}


@app.get("/api/history")
def list_history() -> dict:
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            "SELECT id, created_at, business_name, formatted_address, job_type, days"
            " FROM history ORDER BY created_at DESC LIMIT 50"
        ).fetchall()
    return {"items": [dict(row) for row in rows]}


@app.get("/api/history/{record_id}")
def get_history_item(record_id: str) -> dict:
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        row = conn.execute("SELECT * FROM history WHERE id = ?", (record_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="History item not found.")
    image_path = HISTORY_DIR / row["image_filename"]
    if not image_path.exists():
        raise HTTPException(status_code=404, detail="Stored plan image is missing.")
    return {
        "id": row["id"],
        "created_at": row["created_at"],
        "business_name": row["business_name"],
        "formatted_address": row["formatted_address"],
        "job_type": row["job_type"],
        "days": row["days"],
        "plan": json.loads(row["plan_json"]),
        "plan_image": to_data_url(image_path.read_bytes()),
    }


@app.delete("/api/history/{record_id}")
def delete_history_item(record_id: str) -> dict:
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        row = conn.execute("SELECT image_filename FROM history WHERE id = ?", (record_id,)).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="History item not found.")
        conn.execute("DELETE FROM history WHERE id = ?", (record_id,))
    image_path = HISTORY_DIR / row["image_filename"]
    image_path.unlink(missing_ok=True)
    logger.info("history deleted id=%s", record_id)
    return {"deleted": record_id}
