"""Builds demo_assets/*.png and example_plan.json used by GET /api/demo.

The "satellite" image is a synthesized illustration (not real imagery) so the
demo works offline with zero API keys and with no imagery-licensing questions.
Run with: python scripts/build_demo_assets.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from app import DEMO_DIR, Phase, Point, SitePlan, render_plan_image  # noqa: E402

SIZE = 1280
ASPHALT = (90, 92, 97, 255)
ASPHALT_LIGHT = (108, 110, 116, 255)
STRIPE = (232, 232, 226, 255)
TERRAIN = (118, 128, 101, 255)
BUILDING = (150, 140, 124, 255)
BUILDING_EDGE = (94, 86, 74, 255)
ROAD_LINE = (238, 214, 96, 255)


def pct(v: float) -> int:
    return round(SIZE * v / 100)


def stripe_ticks(draw: ImageDraw.ImageDraw, x0: float, x1: float, y0: float, y1: float, vertical: bool) -> None:
    if vertical:
        step = 4.5
        v = x0
        while v < x1:
            draw.line((pct(v), pct(y0) + 6, pct(v), pct(y1) - 6), fill=STRIPE, width=2)
            v += step
    else:
        step = 4.5
        v = y0
        while v < y1:
            draw.line((pct(x0) + 6, pct(v), pct(x1) - 6, pct(v)), fill=STRIPE, width=2)
            v += step


def build_satellite_image() -> Image.Image:
    img = Image.new("RGB", (SIZE, SIZE), TERRAIN)
    draw = ImageDraw.Draw(img)

    # Top and bottom through-streets for context.
    draw.rectangle((0, 0, SIZE, pct(6)), fill=ASPHALT)
    draw.rectangle((0, pct(94), SIZE, SIZE), fill=ASPHALT)
    for band_y in (3, 97):
        y = pct(band_y)
        for dash_x in range(0, SIZE, 60):
            draw.line((dash_x, y, dash_x + 30, y), fill=ROAD_LINE, width=4)

    # Rear lot (north strip, day-1 zone).
    draw.rectangle((pct(15), pct(8), pct(85), pct(15)), fill=ASPHALT_LIGHT)
    stripe_ticks(draw, 16, 84, 8, 15, vertical=True)

    # Building footprint.
    draw.rectangle((pct(22), pct(17), pct(78), pct(42)), fill=BUILDING, outline=BUILDING_EDGE, width=4)
    for hx in (34, 50, 66):
        draw.ellipse((pct(hx) - 10, pct(28) - 10, pct(hx) + 10, pct(28) + 10), fill=(132, 122, 106, 255))

    # Front lot as a U-shape around the entrance drive (day-2 zone), drawn directly.
    draw.polygon(
        [
            (pct(8), pct(45)), (pct(92), pct(45)), (pct(92), pct(90)),
            (pct(58), pct(90)), (pct(58), pct(72)), (pct(42), pct(72)),
            (pct(42), pct(90)), (pct(8), pct(90)),
        ],
        fill=ASPHALT_LIGHT,
    )
    stripe_ticks(draw, 10, 40, 48, 88, vertical=True)
    stripe_ticks(draw, 60, 90, 48, 88, vertical=True)

    # Entrance drive / apron (day-3 zone).
    draw.rectangle((pct(40), pct(66), pct(60), pct(100)), fill=(100, 102, 108, 255))
    stripe_ticks(draw, 41, 59, 68, 96, vertical=False)

    # A few trees for texture.
    for tx, ty in [(10, 20), (90, 20), (10, 92.5), (90, 92.5), (12, 60), (88, 60)]:
        r = 14
        draw.ellipse((pct(tx) - r, pct(ty) - r, pct(tx) + r, pct(ty) + r), fill=(58, 92, 58, 255))

    return img


def build_demo_plan() -> SitePlan:
    return SitePlan(
        site_confidence=82,
        human_review_required=True,
        front_description="The primary entrance faces south toward the main front parking lot and entrance drive.",
        assumptions=[
            "This is a mill-and-overlay job with localized base repair.",
            "Contractor must verify pavement limits, drainage, fire access, and utility elevations in the field.",
            "A protected accessible route must remain open to the entrance during every phase.",
            "Guest and crew signage should be placed the morning of each phase transition.",
        ],
        phases=[
            Phase(
                day=1,
                title="Rear lot closure",
                zone_label="Rear lot closed for paving",
                polygon=[Point(x=15, y=8), Point(x=85, y=8), Point(x=85, y=15), Point(x=15, y=15)],
                label_anchor=Point(x=50, y=11),
                guest_instruction="use front lot parking",
                guest_arrow_to=Point(x=50, y=65),
            ),
            Phase(
                day=2,
                title="Front lot bays closure",
                zone_label="Front lot bays closed (both sides)",
                polygon=[
                    Point(x=8, y=45), Point(x=92, y=45), Point(x=92, y=90),
                    Point(x=58, y=90), Point(x=58, y=72), Point(x=42, y=72),
                    Point(x=42, y=90), Point(x=8, y=90),
                ],
                label_anchor=Point(x=20, y=65),
                guest_instruction="use the completed rear lot",
                guest_arrow_to=Point(x=50, y=11),
            ),
            Phase(
                day=3,
                title="Entrance drive closure",
                zone_label="Main entrance drive & apron closed",
                polygon=[Point(x=40, y=66), Point(x=60, y=66), Point(x=60, y=100), Point(x=40, y=100)],
                label_anchor=Point(x=50, y=84),
                guest_instruction="park in rear lot and walk to entrance",
                guest_arrow_to=Point(x=50, y=11),
            ),
        ],
    )


def main() -> None:
    DEMO_DIR.mkdir(parents=True, exist_ok=True)
    satellite = build_satellite_image()
    satellite_path = DEMO_DIR / "example_satellite.png"
    satellite.save(satellite_path, format="PNG", optimize=True)

    satellite_bytes = satellite_path.read_bytes()
    plan = build_demo_plan()
    plan_image_bytes = render_plan_image(
        satellite_bytes, plan, "Example Retail Plaza",
        "1500 Example Plaza Drive, Springfield (illustrative demo, not a real satellite image)",
        "mill_overlay",
    )
    (DEMO_DIR / "example_paving_plan.png").write_bytes(plan_image_bytes)
    (DEMO_DIR / "example_plan.json").write_text(json.dumps(plan.model_dump(), indent=2))
    print(f"Wrote demo assets to {DEMO_DIR}")


if __name__ == "__main__":
    main()
