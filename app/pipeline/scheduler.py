"""Runs app.pipeline.scanner.run_scan_cycle on a fixed interval.

Kept deliberately separate from the FastAPI app so it can run as its
own process (`python scripts/run_scheduler.py`) alongside the API/
dashboard, or be imported and started from within the API process for
a single-process demo.
"""

from __future__ import annotations

import logging

from apscheduler.schedulers.background import BackgroundScheduler

from app.config import settings
from app.database import SessionLocal
from app.pipeline.scanner import run_scan_cycle

logger = logging.getLogger(__name__)


def _run_scan_job() -> None:
    db = SessionLocal()
    try:
        summary = run_scan_cycle(db)
        logger.info("Scan cycle complete: %s", summary)
    except Exception:
        logger.exception("Scan cycle failed")
    finally:
        db.close()


def start_scheduler() -> BackgroundScheduler:
    scheduler = BackgroundScheduler()
    # First run fires one interval from now; call run_scan_cycle directly
    # (see scripts/run_scan.py) for an immediate one-off pass.
    scheduler.add_job(
        _run_scan_job,
        "interval",
        minutes=settings.scan_interval_minutes,
        id="deepfake_scan_cycle",
    )
    scheduler.start()
    logger.info("Scheduler started: scanning every %s minutes", settings.scan_interval_minutes)
    return scheduler
