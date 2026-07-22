#!/usr/bin/env python
"""Start the background scan scheduler as a standalone process.

Run this alongside `uvicorn app.main:app` if you want continuous
monitoring independent of the API/dashboard process's lifecycle.

Usage:
    python scripts/run_scheduler.py
"""

from __future__ import annotations

import logging
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import init_db
from app.pipeline.scheduler import start_scheduler


def main() -> None:
    logging.basicConfig(level=logging.INFO)
    init_db()
    scheduler = start_scheduler()
    try:
        while True:
            time.sleep(3600)
    except (KeyboardInterrupt, SystemExit):
        scheduler.shutdown()


if __name__ == "__main__":
    main()
