"""Test setup.

Two things happen here, both *before* any `app.*` module is imported
by a test file (pytest always loads conftest.py first):

1. Point Settings at a throwaway temp directory/DB, via env vars, so
   tests never touch the real data/ folder.
2. Install lightweight stand-ins for `deepface` and `resemblyzer` in
   sys.modules. Those packages pull in TensorFlow/PyTorch and download
   multi-hundred-MB model weights on first use — appropriate for the
   running app, not for a fast unit-test suite. Tests that care about
   real model output belong in a separate, explicitly-opt-in
   integration suite.
"""

from __future__ import annotations

import os
import sys
import tempfile
import types
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

_tmp_data_dir = tempfile.mkdtemp(prefix="aegis-test-")
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp_data_dir}/test.db"
os.environ["UPLOADS_DIR"] = f"{_tmp_data_dir}/uploads"
os.environ["INCOMING_DIR"] = f"{_tmp_data_dir}/incoming"
os.environ["MEDIA_DIR"] = f"{_tmp_data_dir}/media"
os.environ["EVIDENCE_DIR"] = f"{_tmp_data_dir}/evidence"


def _install_stub(name: str, **attrs: object) -> None:
    if name in sys.modules:
        return
    module = types.ModuleType(name)
    for key, value in attrs.items():
        setattr(module, key, value)
    sys.modules[name] = module


class _StubDeepFace:
    """Overridden per-test via monkeypatch when a test needs specific
    embeddings; the default just raises so accidental real use is loud."""

    @staticmethod
    def represent(*args, **kwargs):
        raise NotImplementedError("DeepFace.represent is stubbed in tests; monkeypatch it")


class _StubVoiceEncoder:
    def embed_utterance(self, wav):
        raise NotImplementedError("VoiceEncoder.embed_utterance is stubbed in tests; monkeypatch it")


def _stub_preprocess_wav(path_or_array):
    raise NotImplementedError("preprocess_wav is stubbed in tests; monkeypatch it")


_install_stub("deepface", DeepFace=_StubDeepFace)
_install_stub("resemblyzer", VoiceEncoder=_StubVoiceEncoder, preprocess_wav=_stub_preprocess_wav)

import pytest  # noqa: E402


@pytest.fixture(autouse=True)
def _reset_db():
    """Every test gets a clean schema — these tests share one on-disk
    sqlite file (set up above) for simplicity, so isolate at the table
    level instead of standing up a fresh DB file per test."""
    from app.database import Base, engine, init_db

    init_db()
    yield
    Base.metadata.drop_all(bind=engine)
