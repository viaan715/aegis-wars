"""Runtime configuration, overridable via environment variables."""
from __future__ import annotations

import os
from dataclasses import dataclass


def _env_float(name: str, default: float) -> float:
    return float(os.getenv(name, default))


def _env_int(name: str, default: int) -> int:
    return int(os.getenv(name, default))


@dataclass
class Settings:
    # "tfidf" works fully offline with no model download. "sentence-transformers"
    # gives better recall on paraphrased claims but requires that optional
    # package to be installed.
    embedding_backend: str = os.getenv("HIV_EMBEDDING_BACKEND", "tfidf")
    sentence_transformer_model: str = os.getenv(
        "HIV_SENTENCE_TRANSFORMER_MODEL", "all-MiniLM-L6-v2"
    )

    # Similarity thresholds (cosine, 0-1) against the best-matching source segment.
    semantic_verified_threshold: float = _env_float("HIV_VERIFIED_THRESHOLD", 0.55)
    semantic_review_threshold: float = _env_float("HIV_REVIEW_THRESHOLD", 0.32)

    # Source lines are matched individually and as sliding windows of up to
    # this many consecutive lines, so claims spanning multiple lines can still
    # be matched precisely to a page/line range.
    max_line_window: int = _env_int("HIV_MAX_LINE_WINDOW", 3)

    # Pricing, per the B2B monetization model.
    price_per_page_cents: int = _env_int("HIV_PRICE_PER_PAGE_CENTS", 10)
    flat_monthly_price_cents: int = _env_int("HIV_FLAT_MONTHLY_PRICE_CENTS", 9900)

    # Persistent store for customer accounts, API keys, and the usage ledger.
    db_path: str = os.getenv("HIV_DB_PATH", "data/hiv.db")

    # Master key for the account-provisioning admin endpoint. MUST be
    # overridden via the HIV_ADMIN_KEY env var in any real deployment.
    admin_key: str = os.getenv("HIV_ADMIN_KEY", "dev-admin-key-change-me")


settings = Settings()
