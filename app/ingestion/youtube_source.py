"""YouTube ingestion source, via the official YouTube Data API v3.

This queries YouTube's public search.list endpoint for recent videos
matching a creator's name plus scam-ad keywords (see
settings.youtube_scam_keywords) — a reasonable first pass for catching
"[Creator name] giveaway/investment/crypto" deepfake scam ads, which is
the dominant pattern these clones are used for. It requires a free
Google API key (see README) and respects YouTube's quota and ToS,
unlike scraping the site directly.

Downloading the matched video's *file* still needs the uploader's
permission or a licensed tool — YouTube's API does not hand you raw
video files, by design, to protect creators' content rights. This
source therefore fetches only the public metadata needed to point a
human reviewer at the video (title, URL, thumbnail); see
ingestion/README.md for how a real deployment would extend this to
actually pull frames/audio under an appropriate agreement.
"""

from __future__ import annotations

import datetime
from pathlib import Path

from googleapiclient.discovery import build

from app.config import settings
from app.ingestion.base import CandidateVideo, VideoSource


class YouTubeSearchSource(VideoSource):
    def __init__(self) -> None:
        if not settings.youtube_api_key:
            raise RuntimeError(
                "YOUTUBE_API_KEY is not set. Get a free key at "
                "https://console.cloud.google.com/apis/credentials and add it to .env"
            )
        self._client = build("youtube", "v3", developerKey=settings.youtube_api_key)

    def fetch_candidates(self, config: dict) -> list[CandidateVideo]:
        creator_name: str = config["creator_name"]
        published_after: str | None = config.get("published_after")
        if published_after is None:
            since = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(
                minutes=settings.scan_interval_minutes * 2
            )
            published_after = since.strftime("%Y-%m-%dT%H:%M:%SZ")

        candidates: list[CandidateVideo] = []
        for keyword in settings.youtube_scam_keywords:
            response = (
                self._client.search()
                .list(
                    q=f'"{creator_name}" {keyword}',
                    part="snippet",
                    type="video",
                    order="date",
                    publishedAfter=published_after,
                    maxResults=settings.youtube_results_per_query,
                )
                .execute()
            )
            for item in response.get("items", []):
                video_id = item["id"]["videoId"]
                candidates.append(
                    CandidateVideo(
                        external_id=video_id,
                        url=f"https://www.youtube.com/watch?v={video_id}",
                        title=item["snippet"]["title"],
                    )
                )
        return candidates

    def download(self, candidate: CandidateVideo, dest_dir: Path) -> Path:
        raise NotImplementedError(
            "The YouTube Data API intentionally does not provide raw video "
            "downloads. A production deployment needs a licensed download "
            "path or a manual review step here — see ingestion/README.md."
        )
