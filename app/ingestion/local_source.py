"""Local-folder ingestion source.

Watches a directory for video files and treats each one as a "newly
uploaded" candidate. This is what lets you run and demo the full
enroll -> scan -> alert pipeline end-to-end without any external API:
drop a video into data/incoming/ and it gets picked up on the next
scan cycle. It also doubles as the integration point for any pipeline
that legitimately hands you video files directly — e.g. a bulk export
from an official platform API, or files a creator's team forwards you.
"""

from __future__ import annotations

import shutil
from pathlib import Path

from app.ingestion.base import CandidateVideo, VideoSource

VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".webm"}


class LocalFolderSource(VideoSource):
    def fetch_candidates(self, config: dict) -> list[CandidateVideo]:
        folder = Path(config["folder"])
        folder.mkdir(parents=True, exist_ok=True)
        return [
            CandidateVideo(external_id=path.name, url=str(path), title=path.stem)
            for path in sorted(folder.iterdir())
            if path.is_file() and path.suffix.lower() in VIDEO_EXTENSIONS
        ]

    def download(self, candidate: CandidateVideo, dest_dir: Path) -> Path:
        dest_dir.mkdir(parents=True, exist_ok=True)
        src = Path(candidate.url)
        dest = dest_dir / src.name
        if src.resolve() != dest.resolve():
            shutil.copy2(src, dest)
        return dest
