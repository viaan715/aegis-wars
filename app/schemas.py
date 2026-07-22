"""Pydantic request/response models for the public API."""
from __future__ import annotations

from pydantic import BaseModel


class FactOut(BaseModel):
    kind: str
    value: str


class ClaimResultOut(BaseModel):
    index: int
    text: str
    status: str
    similarity: float
    matched_page: int | None
    matched_line_start: int | None
    matched_line_end: int | None
    matched_text: str | None
    unsupported_facts: list[FactOut]


class VerificationSummaryOut(BaseModel):
    total_claims: int
    verified: int
    review: int
    unverified: int


class ChargeOut(BaseModel):
    plan: str
    pages_billed: int
    amount_cents: int


class VerifyResponseOut(BaseModel):
    summary: VerificationSummaryOut
    claims: list[ClaimResultOut]
    source_pages_scanned: int
    charge: ChargeOut


class UsageOut(BaseModel):
    plan: str
    period: str
    pages_this_period: int
    scans_this_period: int
    amount_cents_this_period: int


class CustomerOut(BaseModel):
    customer_id: int
    name: str
    plan: str
    api_key: str


class DemoKeyOut(BaseModel):
    api_key: str
    plan: str
    note: str
