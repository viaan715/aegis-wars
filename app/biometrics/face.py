"""Face embedding extraction and comparison, backed by DeepFace.

DeepFace embeddings are dense vectors, not cryptographic hashes — two
photos of the same face never produce identical vectors, only *close*
ones. Similarity is therefore measured as cosine similarity between
embeddings, compared against a tunable threshold (see app.config).
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np
from deepface import DeepFace

from app.config import settings

logger = logging.getLogger(__name__)


@dataclass
class FrameMatch:
    timestamp_seconds: float
    similarity: float
    frame_path: str | None = None


def cosine_similarity(a: list[float] | np.ndarray, b: list[float] | np.ndarray) -> float:
    a = np.asarray(a, dtype=np.float64)
    b = np.asarray(b, dtype=np.float64)
    denom = np.linalg.norm(a) * np.linalg.norm(b)
    if denom == 0:
        return 0.0
    return float(np.dot(a, b) / denom)


def extract_face_embedding(image_path: str | Path) -> list[float] | None:
    """Return the embedding for the most prominent face in an image.

    Returns None if no face is detected — callers should surface that to
    the user rather than silently enrolling a blank reference.
    """
    try:
        reps = DeepFace.represent(
            img_path=str(image_path),
            model_name=settings.face_model_name,
            enforce_detection=True,
        )
    except ValueError:
        logger.warning("No face detected in %s", image_path)
        return None

    if not reps:
        return None
    # DeepFace.represent returns one dict per detected face; take the
    # largest (by detected facial-area size) as the primary subject.
    primary = max(reps, key=lambda r: r["facial_area"]["w"] * r["facial_area"]["h"])
    return list(primary["embedding"])


def extract_face_embeddings_from_frame(frame: np.ndarray) -> list[list[float]]:
    """Return embeddings for every face detected in a single video frame."""
    try:
        reps = DeepFace.represent(
            img_path=frame,
            model_name=settings.face_model_name,
            enforce_detection=False,
        )
    except Exception:  # noqa: BLE001 - DeepFace raises assorted backend errors on bad frames
        logger.exception("Face embedding failed on frame")
        return []

    return [r["embedding"] for r in reps if r.get("face_confidence", 1.0) > 0]


def best_match_against_references(
    embedding: list[float], reference_embeddings: list[list[float]]
) -> float:
    """Highest cosine similarity between a candidate embedding and any
    of a creator's enrolled reference embeddings."""
    if not reference_embeddings:
        return 0.0
    return max(cosine_similarity(embedding, ref) for ref in reference_embeddings)


def scan_video_for_face(
    video_path: str | Path,
    reference_embeddings: list[list[float]],
    sample_interval_seconds: float | None = None,
) -> list[FrameMatch]:
    """Sample frames from a video at a fixed interval and compare every
    detected face against the creator's enrolled reference embeddings.

    Returns every frame whose best match crosses settings.face_match_threshold,
    sorted by similarity descending.
    """
    interval = sample_interval_seconds or settings.frame_sample_interval_seconds
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise RuntimeError(f"Could not open video: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    frame_step = max(1, round(fps * interval))

    matches: list[FrameMatch] = []
    frame_index = 0
    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            if frame_index % frame_step == 0:
                timestamp = frame_index / fps
                for embedding in extract_face_embeddings_from_frame(frame):
                    similarity = best_match_against_references(embedding, reference_embeddings)
                    if similarity >= settings.face_match_threshold:
                        matches.append(FrameMatch(timestamp_seconds=timestamp, similarity=similarity))
            frame_index += 1
    finally:
        cap.release()

    matches.sort(key=lambda m: m.similarity, reverse=True)
    return matches
