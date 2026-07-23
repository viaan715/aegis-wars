from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = f"sqlite:///{DATA_DIR / 'aegis.db'}"

    uploads_dir: Path = DATA_DIR / "uploads"
    incoming_dir: Path = DATA_DIR / "incoming"
    media_dir: Path = DATA_DIR / "media"
    evidence_dir: Path = DATA_DIR / "evidence"

    # DeepFace model + distance metric. Facenet512/cosine is a reasonable
    # accuracy/speed tradeoff for CPU-only scanning; swap per DeepFace's docs.
    face_model_name: str = "Facenet512"
    face_distance_metric: str = "cosine"
    # Cosine SIMILARITY threshold (1 - distance) above which a frame is
    # flagged as a candidate match. Tune against your own labeled data —
    # this default favors recall (fewer missed clones, more false alarms
    # that a human reviews) over precision, which matches the product's
    # "alert a human, don't auto-accuse" posture.
    face_match_threshold: float = 0.62

    # Resemblyzer embeddings are 256-d; cosine similarity between
    # same-speaker windows is typically well above this in practice.
    voice_match_threshold: float = 0.75

    # How densely to sample video for scanning.
    frame_sample_interval_seconds: float = 1.0
    voice_window_seconds: float = 4.0

    scan_interval_minutes: int = 30

    youtube_api_key: str | None = None
    # Search terms appended to a creator's name when querying YouTube,
    # biased toward the scam-ad patterns deepfake clones are used for.
    youtube_scam_keywords: list[str] = [
        "giveaway",
        "investment",
        "crypto",
        "sponsored",
        "official statement",
    ]
    youtube_results_per_query: int = 10

    alert_webhook_url: str | None = None
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    alert_email_from: str | None = None

    def ensure_dirs(self) -> None:
        for d in (self.uploads_dir, self.incoming_dir, self.media_dir, self.evidence_dir):
            d.mkdir(parents=True, exist_ok=True)


settings = Settings()
settings.ensure_dirs()
