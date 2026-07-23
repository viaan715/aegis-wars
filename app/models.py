import datetime
import enum

from sqlalchemy import JSON, DateTime, Enum, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def utcnow() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone.utc)


class Creator(Base):
    __tablename__ = "creators"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    email: Mapped[str] = mapped_column(String(320), unique=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    face_references: Mapped[list["FaceReference"]] = relationship(
        back_populates="creator", cascade="all, delete-orphan"
    )
    voice_references: Mapped[list["VoiceReference"]] = relationship(
        back_populates="creator", cascade="all, delete-orphan"
    )
    alerts: Mapped[list["Alert"]] = relationship(back_populates="creator", cascade="all, delete-orphan")


class FaceReference(Base):
    """One enrolled reference photo and its DeepFace embedding."""

    __tablename__ = "face_references"

    id: Mapped[int] = mapped_column(primary_key=True)
    creator_id: Mapped[int] = mapped_column(ForeignKey("creators.id"))
    image_path: Mapped[str] = mapped_column(String(500))
    embedding: Mapped[list[float]] = mapped_column(JSON)
    model_name: Mapped[str] = mapped_column(String(50))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    creator: Mapped[Creator] = relationship(back_populates="face_references")


class VoiceReference(Base):
    """The enrolled voice clip and its speaker-embedding."""

    __tablename__ = "voice_references"

    id: Mapped[int] = mapped_column(primary_key=True)
    creator_id: Mapped[int] = mapped_column(ForeignKey("creators.id"))
    audio_path: Mapped[str] = mapped_column(String(500))
    embedding: Mapped[list[float]] = mapped_column(JSON)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    creator: Mapped[Creator] = relationship(back_populates="voice_references")


class SourceType(str, enum.Enum):
    LOCAL = "local"
    YOUTUBE = "youtube"


class ScanSource(Base):
    """A configured, pluggable place to look for candidate videos."""

    __tablename__ = "scan_sources"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    type: Mapped[SourceType] = mapped_column(Enum(SourceType))
    config: Mapped[dict] = mapped_column(JSON, default=dict)
    enabled: Mapped[bool] = mapped_column(default=True)
    last_checked_at: Mapped[datetime.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Candidate(Base):
    """A single piece of media fetched from a source, pending or scanned."""

    __tablename__ = "candidates"

    id: Mapped[int] = mapped_column(primary_key=True)
    source_id: Mapped[int] = mapped_column(ForeignKey("scan_sources.id"))
    external_id: Mapped[str] = mapped_column(String(300))
    url: Mapped[str] = mapped_column(String(1000))
    title: Mapped[str] = mapped_column(String(500), default="")
    local_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    fetched_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    processed: Mapped[bool] = mapped_column(default=False)
    process_error: Mapped[str | None] = mapped_column(Text, nullable=True)


class MatchType(str, enum.Enum):
    FACE = "face"
    VOICE = "voice"


class AlertStatus(str, enum.Enum):
    NEW = "new"
    REVIEWED = "reviewed"
    CONFIRMED = "confirmed"
    DISMISSED = "dismissed"


class Alert(Base):
    """A flagged potential clone, awaiting human review."""

    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(primary_key=True)
    creator_id: Mapped[int] = mapped_column(ForeignKey("creators.id"))
    candidate_id: Mapped[int] = mapped_column(ForeignKey("candidates.id"))
    match_type: Mapped[MatchType] = mapped_column(Enum(MatchType))
    similarity: Mapped[float] = mapped_column(Float)
    threshold: Mapped[float] = mapped_column(Float)
    timestamp_seconds: Mapped[float] = mapped_column(Float, default=0.0)
    evidence_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[AlertStatus] = mapped_column(Enum(AlertStatus), default=AlertStatus.NEW)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    creator: Mapped[Creator] = relationship(back_populates="alerts")
    candidate: Mapped[Candidate] = relationship()
