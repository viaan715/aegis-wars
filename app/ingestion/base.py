"""Pluggable ingestion sources.

A "source" is anywhere the pipeline looks for newly published public
video that might contain a cloned face or voice. See ingestion/README.md
for why this only ships an official-API source (YouTube) and a local
mock source, not scrapers for logged-in social platforms.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from pathlib import Path


@dataclass
class CandidateVideo:
    external_id: str
    url: str
    title: str = ""


class VideoSource(ABC):
    """Implement this to plug in a new place to look for candidate videos."""

    @abstractmethod
    def fetch_candidates(self, config: dict) -> list[CandidateVideo]:
        """Return newly available candidate videos. Must be safe to call
        repeatedly (e.g. on a schedule) — implementations are responsible
        for their own de-duplication/pagination bookkeeping if the
        underlying API needs it."""

    @abstractmethod
    def download(self, candidate: CandidateVideo, dest_dir: Path) -> Path:
        """Fetch the media for a candidate to a local file and return its path."""
