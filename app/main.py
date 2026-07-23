from __future__ import annotations

import logging
import shutil
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, UploadFile
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from starlette.requests import Request

from app.biometrics.face import extract_face_embedding
from app.biometrics.voice import extract_voice_embedding
from app.config import BASE_DIR, settings
from app.database import get_db, init_db
from app.models import Alert, Creator, FaceReference, ScanSource, VoiceReference
from app.pipeline.scanner import run_scan_cycle
from app.schemas import (
    AlertOut,
    AlertStatusUpdate,
    CreatorCreate,
    CreatorOut,
    ScanSourceCreate,
    ScanSourceOut,
    ScanSummary,
)

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Aegis — Deepfake Auditing Dashboard", lifespan=lifespan)
templates = Jinja2Templates(directory=str(BASE_DIR / "app" / "templates"))


@app.get("/")
def root() -> RedirectResponse:
    return RedirectResponse(url="/dashboard")


@app.get("/dashboard")
def dashboard(request: Request, db: Session = Depends(get_db)):
    creators = db.query(Creator).all()
    alerts = db.query(Alert).order_by(Alert.created_at.desc()).limit(50).all()
    alert_rows = [_alert_to_out(a) for a in alerts]
    return templates.TemplateResponse(
        request,
        "dashboard.html",
        {"creators": creators, "alerts": alert_rows},
    )


# --- Creators & enrollment -------------------------------------------------


@app.post("/creators", response_model=CreatorOut)
def create_creator(payload: CreatorCreate, db: Session = Depends(get_db)):
    if db.query(Creator).filter_by(email=payload.email).first():
        raise HTTPException(400, "A creator with that email is already enrolled")
    creator = Creator(name=payload.name, email=payload.email)
    db.add(creator)
    db.commit()
    db.refresh(creator)
    return _creator_to_out(creator)


@app.get("/creators", response_model=list[CreatorOut])
def list_creators(db: Session = Depends(get_db)):
    return [_creator_to_out(c) for c in db.query(Creator).all()]


@app.delete("/creators/{creator_id}")
def delete_creator(creator_id: int, db: Session = Depends(get_db)):
    """Privacy control: permanently deletes a creator's enrollment record,
    including every stored face/voice embedding and reference file."""
    creator = _get_creator_or_404(db, creator_id)
    creator_dir = settings.uploads_dir / f"creator_{creator_id}"
    if creator_dir.exists():
        shutil.rmtree(creator_dir)
    db.delete(creator)
    db.commit()
    return {"deleted": True}


@app.post("/creators/{creator_id}/face-references", response_model=CreatorOut)
async def add_face_references(creator_id: int, files: list[UploadFile], db: Session = Depends(get_db)):
    creator = _get_creator_or_404(db, creator_id)
    if len(files) > 3:
        raise HTTPException(400, "Enroll at most 3 reference photos")

    creator_dir = settings.uploads_dir / f"creator_{creator_id}" / "faces"
    creator_dir.mkdir(parents=True, exist_ok=True)

    for upload in files:
        dest = creator_dir / upload.filename
        with dest.open("wb") as f:
            shutil.copyfileobj(upload.file, f)

        embedding = extract_face_embedding(dest)
        if embedding is None:
            dest.unlink(missing_ok=True)
            raise HTTPException(422, f"No face detected in {upload.filename}")

        db.add(
            FaceReference(
                creator_id=creator.id,
                image_path=str(dest),
                embedding=embedding,
                model_name=settings.face_model_name,
            )
        )

    db.commit()
    db.refresh(creator)
    return _creator_to_out(creator)


@app.post("/creators/{creator_id}/voice-reference", response_model=CreatorOut)
async def add_voice_reference(creator_id: int, file: UploadFile, db: Session = Depends(get_db)):
    creator = _get_creator_or_404(db, creator_id)

    creator_dir = settings.uploads_dir / f"creator_{creator_id}" / "voice"
    creator_dir.mkdir(parents=True, exist_ok=True)
    dest = creator_dir / file.filename
    with dest.open("wb") as f:
        shutil.copyfileobj(file.file, f)

    embedding = extract_voice_embedding(dest)
    db.add(VoiceReference(creator_id=creator.id, audio_path=str(dest), embedding=embedding))
    db.commit()
    db.refresh(creator)
    return _creator_to_out(creator)


# --- Alerts ------------------------------------------------------------


@app.get("/alerts", response_model=list[AlertOut])
def list_alerts(db: Session = Depends(get_db)):
    alerts = db.query(Alert).order_by(Alert.created_at.desc()).all()
    return [_alert_to_out(a) for a in alerts]


@app.post("/alerts/{alert_id}/status", response_model=AlertOut)
def update_alert_status(alert_id: int, payload: AlertStatusUpdate, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter_by(id=alert_id).first()
    if alert is None:
        raise HTTPException(404, "Alert not found")
    alert.status = payload.status
    db.commit()
    db.refresh(alert)
    return _alert_to_out(alert)


# --- Sources & manual scan ------------------------------------------------


@app.post("/sources", response_model=ScanSourceOut)
def create_source(payload: ScanSourceCreate, db: Session = Depends(get_db)):
    source = ScanSource(name=payload.name, type=payload.type, config=payload.config, enabled=payload.enabled)
    db.add(source)
    db.commit()
    db.refresh(source)
    return source


@app.get("/sources", response_model=list[ScanSourceOut])
def list_sources(db: Session = Depends(get_db)):
    return db.query(ScanSource).all()


@app.post("/scan/run", response_model=ScanSummary)
def trigger_scan(db: Session = Depends(get_db)):
    """Runs one scan cycle synchronously — handy for demos; the scheduler
    (app/pipeline/scheduler.py) is what does this automatically on a timer."""
    return run_scan_cycle(db)


# --- helpers ----------------------------------------------------------


def _get_creator_or_404(db: Session, creator_id: int) -> Creator:
    creator = db.query(Creator).filter_by(id=creator_id).first()
    if creator is None:
        raise HTTPException(404, "Creator not found")
    return creator


def _creator_to_out(creator: Creator) -> CreatorOut:
    return CreatorOut(
        id=creator.id,
        name=creator.name,
        email=creator.email,
        created_at=creator.created_at,
        face_reference_count=len(creator.face_references),
        voice_reference_count=len(creator.voice_references),
    )


def _alert_to_out(alert: Alert) -> AlertOut:
    return AlertOut(
        id=alert.id,
        creator_id=alert.creator_id,
        candidate_id=alert.candidate_id,
        match_type=alert.match_type,
        similarity=alert.similarity,
        threshold=alert.threshold,
        timestamp_seconds=alert.timestamp_seconds,
        status=alert.status,
        created_at=alert.created_at,
        creator_name=alert.creator.name if alert.creator else "",
        video_title=alert.candidate.title if alert.candidate else "",
        video_url=alert.candidate.url if alert.candidate else "",
    )
