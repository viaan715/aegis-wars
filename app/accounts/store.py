"""SQLite-backed customer + API-key store.

Replaces the earlier "any non-empty X-API-Key header works" placeholder with
real, persistent accounts: a customer has exactly one billing plan (set at
provisioning time, not chosen per request), and API keys are stored hashed
so a leaked database dump doesn't hand out live credentials.

Swapping the backing store for something like Postgres later means changing
only this module -- callers only ever see `Customer` and the store's public
methods.
"""
from __future__ import annotations

import hashlib
import secrets
import sqlite3
import threading
from dataclasses import dataclass
from pathlib import Path

from app.config import settings


@dataclass(frozen=True)
class Customer:
    id: int
    name: str
    plan: str


def _hash_key(api_key: str) -> str:
    return hashlib.sha256(api_key.encode("utf-8")).hexdigest()


class AccountStore:
    def __init__(self, db_path: str) -> None:
        if db_path != ":memory:":
            Path(db_path).parent.mkdir(parents=True, exist_ok=True)
        self._conn = sqlite3.connect(db_path, check_same_thread=False)
        self._lock = threading.Lock()
        self._init_schema()

    def _init_schema(self) -> None:
        with self._lock:
            self._conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS customers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    plan TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS api_keys (
                    key_hash TEXT PRIMARY KEY,
                    customer_id INTEGER NOT NULL REFERENCES customers(id)
                );
                """
            )
            self._conn.commit()

    def create_customer(self, name: str, plan: str) -> tuple[Customer, str]:
        api_key = f"hiv_{secrets.token_urlsafe(24)}"
        with self._lock:
            cursor = self._conn.execute(
                "INSERT INTO customers (name, plan) VALUES (?, ?)", (name, plan)
            )
            customer_id = cursor.lastrowid
            self._conn.execute(
                "INSERT INTO api_keys (key_hash, customer_id) VALUES (?, ?)",
                (_hash_key(api_key), customer_id),
            )
            self._conn.commit()
        return Customer(id=customer_id, name=name, plan=plan), api_key

    def get_customer_by_key(self, api_key: str) -> Customer | None:
        with self._lock:
            row = self._conn.execute(
                """
                SELECT customers.id, customers.name, customers.plan
                FROM api_keys JOIN customers ON customers.id = api_keys.customer_id
                WHERE api_keys.key_hash = ?
                """,
                (_hash_key(api_key),),
            ).fetchone()
        if row is None:
            return None
        return Customer(id=row[0], name=row[1], plan=row[2])


account_store = AccountStore(settings.db_path)
