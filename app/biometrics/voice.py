"""Voice embedding extraction and comparison, backed by Resemblyzer.

Same idea as face.py: Resemblyzer produces a 256-d speaker-embedding
vector per audio clip, and "matching" means cosine similarity above a
tunable threshold, not exact equality.
"""

from __future__ import annotations

import logging
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path

from resemblyzer import VoiceEncoder, preprocess_wav

from app.biometrics.face import cosine_similarity
from app.config import settings

logger = logging.getLogger(__name__)

_encoder: VoiceEncoder | None = None


def _get_encoder() -> VoiceEncoder:
    global _encoder
    if _encoder is None:
        _encoder = VoiceEncoder()
    return _encoder


@dataclass
class VoiceWindowMatch:
    start_seconds: float
    similarity: float


def extract_voice_embedding(audio_path: str | Path) -> list[float]:
    wav = preprocess_wav(Path(audio_path))
    embedding = _get_encoder().embed_utterance(wav)
    return embedding.tolist()


def extract_audio_track(video_path: str | Path, out_dir: str | Path) -> Path | None:
    """Extract a mono 16kHz WAV audio track from a video using ffmpeg.

    Returns None (rather than raising) if the video has no audio stream
    or ffmpeg is unavailable — callers should treat that as "voice scan
    skipped for this candidate", not a fatal pipeline error.
    """
    out_path = Path(out_dir) / f"{Path(video_path).stem}.wav"
    try:
        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-i",
                str(video_path),
                "-vn",
                "-ac",
                "1",
                "-ar",
                "16000",
                str(out_path),
            ],
            check=True,
            capture_output=True,
        )
    except (subprocess.CalledProcessError, FileNotFoundError) as exc:
        logger.warning("Audio extraction failed for %s: %s", video_path, exc)
        return None
    return out_path if out_path.exists() else None


def best_match_against_references(embedding: list[float], reference_embeddings: list[list[float]]) -> float:
    if not reference_embeddings:
        return 0.0
    return max(cosine_similarity(embedding, ref) for ref in reference_embeddings)


def scan_video_for_voice(
    video_path: str | Path,
    reference_embeddings: list[list[float]],
    window_seconds: float | None = None,
) -> list[VoiceWindowMatch]:
    """Extract the audio track and slide a fixed window over it, comparing
    each window's speaker embedding against the creator's enrolled voice.
    """
    window = window_seconds or settings.voice_window_seconds

    with tempfile.TemporaryDirectory() as tmp:
        audio_path = extract_audio_track(video_path, tmp)
        if audio_path is None:
            return []

        wav = preprocess_wav(audio_path)
        sample_rate = 16000
        window_samples = int(window * sample_rate)
        if window_samples <= 0 or len(wav) < window_samples:
            return []

        encoder = _get_encoder()
        matches: list[VoiceWindowMatch] = []
        for start in range(0, len(wav) - window_samples + 1, window_samples):
            chunk = wav[start : start + window_samples]
            embedding = encoder.embed_utterance(chunk)
            similarity = best_match_against_references(embedding.tolist(), reference_embeddings)
            if similarity >= settings.voice_match_threshold:
                matches.append(
                    VoiceWindowMatch(start_seconds=start / sample_rate, similarity=similarity)
                )

    matches.sort(key=lambda m: m.similarity, reverse=True)
    return matches
