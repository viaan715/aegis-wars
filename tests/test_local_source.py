from pathlib import Path

from app.ingestion.local_source import LocalFolderSource


def test_fetch_candidates_finds_only_video_files(tmp_path):
    (tmp_path / "clip.mp4").write_bytes(b"fake video bytes")
    (tmp_path / "note.txt").write_text("not a video")
    (tmp_path / "clip2.mov").write_bytes(b"fake video bytes")

    source = LocalFolderSource()
    candidates = source.fetch_candidates({"folder": str(tmp_path)})

    names = sorted(c.external_id for c in candidates)
    assert names == ["clip.mp4", "clip2.mov"]


def test_fetch_candidates_creates_missing_folder(tmp_path):
    folder = tmp_path / "does_not_exist_yet"
    source = LocalFolderSource()

    candidates = source.fetch_candidates({"folder": str(folder)})

    assert candidates == []
    assert folder.exists()


def test_download_copies_file_to_dest_dir(tmp_path):
    incoming = tmp_path / "incoming"
    incoming.mkdir()
    src = incoming / "clip.mp4"
    src.write_bytes(b"fake video bytes")

    source = LocalFolderSource()
    [candidate] = source.fetch_candidates({"folder": str(incoming)})

    dest_dir = tmp_path / "media"
    result_path = source.download(candidate, dest_dir)

    assert result_path == dest_dir / "clip.mp4"
    assert result_path.read_bytes() == b"fake video bytes"
