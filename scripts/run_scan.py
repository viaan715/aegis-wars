#!/usr/bin/env python
"""Run a single scan cycle immediately (no scheduler) — for testing the
full enroll -> ingest -> match -> alert pipeline against whatever's in
data/incoming/ or your configured sources.

Usage:
    python scripts/run_scan.py
"""

from __future__ import annotations

import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import SessionLocal, init_db
from app.pipeline.scanner import run_scan_cycle


def main() -> None:
    logging.basicConfig(level=logging.INFO)
    init_db()
    db = SessionLocal()
    try:
        summary = run_scan_cycle(db)
        print(summary)
    finally:
        db.close()


if __name__ == "__main__":
    main()
