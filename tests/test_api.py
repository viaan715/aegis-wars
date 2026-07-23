import io

from fastapi.testclient import TestClient

from app import main
from app.models import AlertStatus, Creator, MatchType


def _client() -> TestClient:
    return TestClient(main.app)


def test_create_and_list_creators():
    client = _client()
    resp = client.post("/creators", json={"name": "Jane Doe", "email": "jane@example.com"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["name"] == "Jane Doe"
    assert body["face_reference_count"] == 0

    resp = client.get("/creators")
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_duplicate_email_rejected():
    client = _client()
    client.post("/creators", json={"name": "Jane Doe", "email": "jane@example.com"})
    resp = client.post("/creators", json={"name": "Someone Else", "email": "jane@example.com"})
    assert resp.status_code == 400


def test_face_reference_upload_rejects_more_than_three(monkeypatch):
    client = _client()
    creator_id = client.post("/creators", json={"name": "Jane", "email": "jane@example.com"}).json()["id"]

    monkeypatch.setattr(main, "extract_face_embedding", lambda path: [0.1, 0.2])
    files = [("files", (f"p{i}.jpg", io.BytesIO(b"fake"), "image/jpeg")) for i in range(4)]
    resp = client.post(f"/creators/{creator_id}/face-references", files=files)
    assert resp.status_code == 400


def test_face_reference_upload_rejects_photo_with_no_detected_face(monkeypatch):
    client = _client()
    creator_id = client.post("/creators", json={"name": "Jane", "email": "jane@example.com"}).json()["id"]

    monkeypatch.setattr(main, "extract_face_embedding", lambda path: None)
    files = [("files", ("p1.jpg", io.BytesIO(b"fake"), "image/jpeg"))]
    resp = client.post(f"/creators/{creator_id}/face-references", files=files)
    assert resp.status_code == 422


def test_enroll_face_and_voice_references(monkeypatch):
    client = _client()
    creator_id = client.post("/creators", json={"name": "Jane", "email": "jane@example.com"}).json()["id"]

    monkeypatch.setattr(main, "extract_face_embedding", lambda path: [0.1, 0.2, 0.3])
    files = [("files", (f"p{i}.jpg", io.BytesIO(b"fake"), "image/jpeg")) for i in range(3)]
    resp = client.post(f"/creators/{creator_id}/face-references", files=files)
    assert resp.status_code == 200
    assert resp.json()["face_reference_count"] == 3

    monkeypatch.setattr(main, "extract_voice_embedding", lambda path: [0.4, 0.5])
    resp = client.post(
        f"/creators/{creator_id}/voice-reference",
        files={"file": ("voice.wav", io.BytesIO(b"fake"), "audio/wav")},
    )
    assert resp.status_code == 200
    assert resp.json()["voice_reference_count"] == 1


def test_delete_creator_removes_uploaded_files(monkeypatch, tmp_path):
    client = _client()
    creator_id = client.post("/creators", json={"name": "Jane", "email": "jane@example.com"}).json()["id"]

    monkeypatch.setattr(main, "extract_face_embedding", lambda path: [0.1, 0.2])
    client.post(
        f"/creators/{creator_id}/face-references",
        files=[("files", ("p1.jpg", io.BytesIO(b"fake"), "image/jpeg"))],
    )

    from app.config import settings

    creator_dir = settings.uploads_dir / f"creator_{creator_id}"
    assert creator_dir.exists()

    resp = client.delete(f"/creators/{creator_id}")
    assert resp.status_code == 200
    assert not creator_dir.exists()
    assert client.get("/creators").json() == []


def test_alert_status_update():
    from app.database import SessionLocal
    from app.models import Alert, Candidate, ScanSource, SourceType

    db = SessionLocal()
    try:
        creator = Creator(name="Jane", email="jane@example.com")
        db.add(creator)
        db.flush()
        source = ScanSource(name="s", type=SourceType.LOCAL, config={}, enabled=True)
        db.add(source)
        db.flush()
        candidate = Candidate(source_id=source.id, external_id="x", url="http://x")
        db.add(candidate)
        db.flush()
        alert = Alert(
            creator_id=creator.id,
            candidate_id=candidate.id,
            match_type=MatchType.FACE,
            similarity=0.9,
            threshold=0.6,
        )
        db.add(alert)
        db.commit()
        alert_id = alert.id
    finally:
        db.close()

    client = _client()
    resp = client.post(f"/alerts/{alert_id}/status", json={"status": "confirmed"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "confirmed"

    listed = client.get("/alerts").json()
    assert listed[0]["status"] == "confirmed"


def test_trigger_scan_returns_summary(monkeypatch):
    monkeypatch.setattr(
        main, "run_scan_cycle", lambda db: {"sources_checked": 0, "candidates_found": 0, "alerts_created": 0}
    )
    client = _client()
    resp = client.post("/scan/run")
    assert resp.status_code == 200
    assert resp.json() == {"sources_checked": 0, "candidates_found": 0, "alerts_created": 0}
