"""Usage metering + billing ledger for the two B2B pricing plans:

  - pay_as_you_go: $0.10 per page scanned
  - flat_monthly:  $99/month flat fee, unlimited pages

Every verification request writes a usage event to a persistent SQLite
ledger keyed by customer and calendar-month billing period, so usage
survives a process restart and `/v1/usage` reports a real per-period total
rather than an in-process counter.

`estimate_charge` is the seam a real payment processor integration would
sit behind: a production deployment would additionally push each event to,
e.g., Stripe's usage-records API at the point `record_scan` is called.
"""
from __future__ import annotations

import sqlite3
import threading
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from app.config import settings

PLAN_PAY_AS_YOU_GO = "pay_as_you_go"
PLAN_FLAT_MONTHLY = "flat_monthly"


def _current_period() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m")


@dataclass(frozen=True)
class ChargeEstimate:
    plan: str
    pages_billed: int
    amount_cents: int


def estimate_charge(plan: str, pages: int) -> ChargeEstimate:
    if plan == PLAN_FLAT_MONTHLY:
        # Covered by the flat subscription; no marginal per-scan charge.
        return ChargeEstimate(plan=plan, pages_billed=pages, amount_cents=0)
    amount = pages * settings.price_per_page_cents
    return ChargeEstimate(plan=PLAN_PAY_AS_YOU_GO, pages_billed=pages, amount_cents=amount)


@dataclass(frozen=True)
class UsagePeriod:
    period: str
    scans: int
    pages: int
    amount_cents: int


class UsageLedger:
    def __init__(self, db_path: str) -> None:
        if db_path != ":memory:":
            Path(db_path).parent.mkdir(parents=True, exist_ok=True)
        self._conn = sqlite3.connect(db_path, check_same_thread=False)
        self._lock = threading.Lock()
        with self._lock:
            self._conn.execute(
                """
                CREATE TABLE IF NOT EXISTS usage_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    customer_id INTEGER NOT NULL,
                    period TEXT NOT NULL,
                    pages INTEGER NOT NULL,
                    amount_cents INTEGER NOT NULL,
                    created_at TEXT NOT NULL
                )
                """
            )
            self._conn.commit()

    def record_scan(self, customer_id: int, pages: int, amount_cents: int) -> None:
        with self._lock:
            self._conn.execute(
                """
                INSERT INTO usage_events (customer_id, period, pages, amount_cents, created_at)
                VALUES (?, ?, ?, ?, datetime('now'))
                """,
                (customer_id, _current_period(), pages, amount_cents),
            )
            self._conn.commit()

    def get_usage(self, customer_id: int, period: str | None = None) -> UsagePeriod:
        period = period or _current_period()
        with self._lock:
            row = self._conn.execute(
                """
                SELECT COUNT(*), COALESCE(SUM(pages), 0), COALESCE(SUM(amount_cents), 0)
                FROM usage_events WHERE customer_id = ? AND period = ?
                """,
                (customer_id, period),
            ).fetchone()
        scans, pages, amount_cents = row
        return UsagePeriod(period=period, scans=scans, pages=pages, amount_cents=amount_cents)


usage_ledger = UsageLedger(settings.db_path)
