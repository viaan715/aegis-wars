from app.biometrics.face import FrameMatch
from app.biometrics.voice import VoiceWindowMatch
from app.database import SessionLocal, init_db
from app.models import Alert, Candidate, Creator, FaceReference, ScanSource, SourceType, VoiceReference
from app.pipeline import scanner


def _enroll_creator_with_references(db):
    creator = Creator(name="Jane Doe", email="jane@example.com")
    db.add(creator)
    db.flush()
    db.add(
        FaceReference(creator_id=creator.id, image_path="x.jpg", embedding=[1.0, 0.0], model_name="Facenet512")
    )
    db.add(VoiceReference(creator_id=creator.id, audio_path="x.wav", embedding=[1.0, 0.0]))
    db.commit()
    return creator


def test_run_scan_cycle_creates_alerts_and_dedupes_on_rerun(tmp_path, monkeypatch):
    incoming = tmp_path / "incoming"
    incoming.mkdir()
    (incoming / "clip.mp4").write_bytes(b"fake video bytes")

    init_db()
    db = SessionLocal()
    try:
        _enroll_creator_with_references(db)
        db.add(
            ScanSource(
                name="local-test",
                type=SourceType.LOCAL,
                config={"folder": str(incoming)},
                enabled=True,
            )
        )
        db.commit()

        monkeypatch.setattr(
            scanner,
            "scan_video_for_face",
            lambda video_path, refs, **kw: [FrameMatch(timestamp_seconds=3.0, similarity=0.9)],
        )
        monkeypatch.setattr(
            scanner,
            "scan_video_for_voice",
            lambda video_path, refs, **kw: [VoiceWindowMatch(start_seconds=1.0, similarity=0.8)],
        )
        monkeypatch.setattr(scanner, "notify", lambda *a, **kw: None)

        summary = scanner.run_scan_cycle(db)
        assert summary == {"sources_checked": 1, "candidates_found": 1, "alerts_created": 2}
        assert db.query(Candidate).count() == 1
        assert db.query(Alert).count() == 2

        # A second pass over the same "incoming" file must not re-ingest it.
        summary_2 = scanner.run_scan_cycle(db)
        assert summary_2 == {"sources_checked": 1, "candidates_found": 0, "alerts_created": 0}
        assert db.query(Candidate).count() == 1
        assert db.query(Alert).count() == 2
    finally:
        db.close()


def test_run_scan_cycle_skips_when_no_creators_enrolled(tmp_path):
    init_db()
    db = SessionLocal()
    try:
        summary = scanner.run_scan_cycle(db)
        assert summary == {"sources_checked": 0, "candidates_found": 0, "alerts_created": 0}
    finally:
        db.close()
