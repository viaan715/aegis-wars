import datetime

from pydantic import BaseModel, ConfigDict

from app.models import AlertStatus, MatchType, SourceType


class CreatorCreate(BaseModel):
    name: str
    email: str


class CreatorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    created_at: datetime.datetime
    face_reference_count: int = 0
    voice_reference_count: int = 0


class AlertOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    creator_id: int
    candidate_id: int
    match_type: MatchType
    similarity: float
    threshold: float
    timestamp_seconds: float
    status: AlertStatus
    created_at: datetime.datetime
    creator_name: str = ""
    video_title: str = ""
    video_url: str = ""


class AlertStatusUpdate(BaseModel):
    status: AlertStatus


class ScanSourceCreate(BaseModel):
    name: str
    type: SourceType
    config: dict = {}
    enabled: bool = True


class ScanSourceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    type: SourceType
    config: dict
    enabled: bool
    last_checked_at: datetime.datetime | None


class ScanSummary(BaseModel):
    sources_checked: int
    candidates_found: int
    alerts_created: int
