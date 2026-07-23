"""Orchestrates one full scan cycle:

    for each enabled source:
        fetch new candidate videos
        for each candidate:
            download it locally
            run face-matching against every enrolled creator
            run voice-matching against every enrolled creator
            record + notify on anything crossing threshold

This is the "script that connects to DeepFace and schedules checks
against public feeds" the brief asks for; app/pipeline/scheduler.py is
what runs it on a timer.
"""

from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from app.alerts.notifier import notify
from app.biometrics.face import scan_video_for_face
from app.biometrics.voice import scan_video_for_voice
from app.config import settings
from app.ingestion.base import VideoSource
from app.ingestion.local_source import LocalFolderSource
from app.ingestion.youtube_source import YouTubeSearchSource
from app.models import (
    Alert,
    AlertStatus,
    Candidate,
    Creator,
    MatchType,
    ScanSource,
    SourceType,
    utcnow,
)

logger = logging.getLogger(__name__)

_SOURCE_CLASSES: dict[SourceType, type[VideoSource]] = {
    SourceType.LOCAL: LocalFolderSource,
    SourceType.YOUTUBE: YouTubeSearchSource,
}


def run_scan_cycle(db: Session) -> dict:
    """Runs one full ingest+match pass. Returns a small summary dict,
    mainly so CLI/API callers have something to show without re-querying."""
    creators = db.query(Creator).all()
    if not creators:
        logger.info("No enrolled creators; skipping scan cycle")
        return {"sources_checked": 0, "candidates_found": 0, "alerts_created": 0}

    reference_faces = {
        creator.id: [fr.embedding for fr in creator.face_references] for creator in creators
    }
    reference_voices = {
        creator.id: [vr.embedding for vr in creator.voice_references] for creator in creators
    }

    sources = db.query(ScanSource).filter(ScanSource.enabled.is_(True)).all()
    candidates_found = 0
    alerts_created = 0

    for source_row in sources:
        source_impl = _instantiate_source(source_row.type)
        if source_impl is None:
            continue

        try:
            found = source_impl.fetch_candidates(source_row.config)
        except Exception:
            logger.exception("fetch_candidates failed for source %s", source_row.name)
            continue

        for candidate_video in found:
            existing = (
                db.query(Candidate)
                .filter_by(source_id=source_row.id, external_id=candidate_video.external_id)
                .first()
            )
            if existing is not None:
                continue

            candidate_row = Candidate(
                source_id=source_row.id,
                external_id=candidate_video.external_id,
                url=candidate_video.url,
                title=candidate_video.title,
            )
            db.add(candidate_row)
            db.flush()
            candidates_found += 1

            try:
                local_path = source_impl.download(candidate_video, settings.media_dir)
                candidate_row.local_path = str(local_path)
            except NotImplementedError as exc:
                candidate_row.processed = True
                candidate_row.process_error = str(exc)
                db.commit()
                continue
            except Exception as exc:  # noqa: BLE001 - keep the scan loop alive on a bad file
                logger.exception("download failed for candidate %s", candidate_video.external_id)
                candidate_row.processed = True
                candidate_row.process_error = str(exc)
                db.commit()
                continue

            alerts_created += _scan_candidate(
                db, candidate_row, creators, reference_faces, reference_voices
            )

            candidate_row.processed = True
            db.commit()

        source_row.last_checked_at = utcnow()
        db.commit()

    return {
        "sources_checked": len(sources),
        "candidates_found": candidates_found,
        "alerts_created": alerts_created,
    }


def _instantiate_source(source_type: SourceType) -> VideoSource | None:
    cls = _SOURCE_CLASSES.get(source_type)
    if cls is None:
        logger.error("Unknown source type %s", source_type)
        return None
    try:
        return cls()
    except Exception:
        logger.exception("Could not initialize source %s", source_type)
        return None


def _scan_candidate(
    db: Session,
    candidate_row: Candidate,
    creators: list[Creator],
    reference_faces: dict[int, list[list[float]]],
    reference_voices: dict[int, list[list[float]]],
) -> int:
    alerts_created = 0

    for creator in creators:
        face_refs = reference_faces.get(creator.id, [])
        if face_refs:
            try:
                face_matches = scan_video_for_face(candidate_row.local_path, face_refs)
            except Exception:
                logger.exception("Face scan failed for candidate %s", candidate_row.id)
                face_matches = []
            for match in face_matches[:1]:  # one alert per candidate/creator is enough for review
                db.add(
                    Alert(
                        creator_id=creator.id,
                        candidate_id=candidate_row.id,
                        match_type=MatchType.FACE,
                        similarity=match.similarity,
                        threshold=settings.face_match_threshold,
                        timestamp_seconds=match.timestamp_seconds,
                        status=AlertStatus.NEW,
                    )
                )
                alerts_created += 1

        voice_refs = reference_voices.get(creator.id, [])
        if voice_refs:
            try:
                voice_matches = scan_video_for_voice(candidate_row.local_path, voice_refs)
            except Exception:
                logger.exception("Voice scan failed for candidate %s", candidate_row.id)
                voice_matches = []
            for match in voice_matches[:1]:
                db.add(
                    Alert(
                        creator_id=creator.id,
                        candidate_id=candidate_row.id,
                        match_type=MatchType.VOICE,
                        similarity=match.similarity,
                        threshold=settings.voice_match_threshold,
                        timestamp_seconds=match.start_seconds,
                        status=AlertStatus.NEW,
                    )
                )
                alerts_created += 1

    db.commit()

    for alert in db.query(Alert).filter_by(candidate_id=candidate_row.id).all():
        notify(alert, alert.creator, candidate_row.title, candidate_row.url)

    return alerts_created
