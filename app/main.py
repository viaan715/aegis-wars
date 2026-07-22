"""B2B API for the LLM "Hallucination Insurance" Validator.

Given an original source document and an AI-generated summary of it, cross-
references every claim in the summary back to the exact page and line of the
source it should have come from, flagging anything that can't be verified.
"""
from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.responses import FileResponse, HTMLResponse

from app.accounts.store import Customer, account_store
from app.billing.metering import (
    PLAN_FLAT_MONTHLY,
    PLAN_PAY_AS_YOU_GO,
    estimate_charge,
    usage_ledger,
)
from app.config import settings
from app.parsing.document import parse_document
from app.reporting.html import render_report
from app.schemas import (
    ChargeOut,
    ClaimResultOut,
    CustomerOut,
    DemoKeyOut,
    FactOut,
    UsageOut,
    VerificationSummaryOut,
    VerifyResponseOut,
)
from app.verification.matcher import STATUS_REVIEW, STATUS_UNVERIFIED, STATUS_VERIFIED, ClaimVerdict, verify_claims

app = FastAPI(
    title="Hallucination Insurance Validator",
    description=(
        "Independent fact-checking layer for AI-generated document summaries. "
        "Cross-references every claim in a summary against the exact page and "
        "line of the source document it should be traceable to, so a human "
        "reviewer only has to look twice at what's actually in question."
    ),
    version="0.1.0",
)

STATIC_DIR = Path(__file__).parent / "static"
VALID_PLANS = (PLAN_PAY_AS_YOU_GO, PLAN_FLAT_MONTHLY)


def _authenticate(x_api_key: str | None) -> Customer:
    if not x_api_key:
        raise HTTPException(status_code=401, detail="Missing X-API-Key header")
    customer = account_store.get_customer_by_key(x_api_key)
    if customer is None:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return customer


def _require_admin(x_admin_key: str | None) -> None:
    if not x_admin_key or x_admin_key != settings.admin_key:
        raise HTTPException(status_code=401, detail="Missing or invalid X-Admin-Key header")


async def _read_upload_or_text(
    file: UploadFile | None, text: str | None, field_name: str
) -> tuple[str, bytes]:
    if file is not None:
        content = await file.read()
        return file.filename or f"{field_name}.txt", content
    if text is not None:
        return f"{field_name}.txt", text.encode("utf-8")
    raise HTTPException(
        status_code=400, detail=f"Provide either a {field_name}_file or {field_name}_text"
    )


def _to_claim_out(index: int, verdict: ClaimVerdict) -> ClaimResultOut:
    return ClaimResultOut(
        index=index,
        text=verdict.claim.text,
        status=verdict.status,
        similarity=round(verdict.similarity, 4),
        matched_page=verdict.matched_page,
        matched_line_start=verdict.matched_line_start,
        matched_line_end=verdict.matched_line_end,
        matched_text=verdict.matched_text,
        unsupported_facts=[FactOut(kind=f.kind, value=f.value) for f in verdict.unsupported_facts],
    )


async def _run_pipeline(
    source_file: UploadFile | None,
    summary_file: UploadFile | None,
    source_text: str | None,
    summary_text: str | None,
    customer: Customer,
) -> tuple[list[ClaimVerdict], int, ChargeOut]:
    source_filename, source_bytes = await _read_upload_or_text(source_file, source_text, "source")
    _, summary_bytes = await _read_upload_or_text(summary_file, summary_text, "summary")

    source_lines = parse_document(source_filename, source_bytes)
    if not source_lines:
        raise HTTPException(
            status_code=422, detail="Could not extract any text from the source document"
        )

    verdicts = verify_claims(source_lines, summary_bytes.decode("utf-8", errors="replace"))

    pages_scanned = len({ln.page for ln in source_lines})
    charge = estimate_charge(customer.plan, pages_scanned)
    usage_ledger.record_scan(customer.id, pages_scanned, charge.amount_cents)

    return verdicts, pages_scanned, ChargeOut(
        plan=charge.plan, pages_billed=charge.pages_billed, amount_cents=charge.amount_cents
    )


@app.post("/v1/verify", response_model=VerifyResponseOut)
async def verify(
    source_file: UploadFile | None = File(default=None),
    summary_file: UploadFile | None = File(default=None),
    source_text: str | None = Form(default=None),
    summary_text: str | None = Form(default=None),
    x_api_key: str | None = Header(default=None),
) -> VerifyResponseOut:
    customer = _authenticate(x_api_key)
    verdicts, pages_scanned, charge = await _run_pipeline(
        source_file, summary_file, source_text, summary_text, customer
    )

    counts = {STATUS_VERIFIED: 0, STATUS_REVIEW: 0, STATUS_UNVERIFIED: 0}
    for v in verdicts:
        counts[v.status] += 1

    return VerifyResponseOut(
        summary=VerificationSummaryOut(
            total_claims=len(verdicts),
            verified=counts[STATUS_VERIFIED],
            review=counts[STATUS_REVIEW],
            unverified=counts[STATUS_UNVERIFIED],
        ),
        claims=[_to_claim_out(i, v) for i, v in enumerate(verdicts)],
        source_pages_scanned=pages_scanned,
        charge=charge,
    )


@app.post("/v1/verify/report", response_class=HTMLResponse)
async def verify_report(
    source_file: UploadFile | None = File(default=None),
    summary_file: UploadFile | None = File(default=None),
    source_text: str | None = Form(default=None),
    summary_text: str | None = Form(default=None),
    x_api_key: str | None = Header(default=None),
) -> str:
    customer = _authenticate(x_api_key)
    verdicts, _, _ = await _run_pipeline(
        source_file, summary_file, source_text, summary_text, customer
    )
    return render_report(verdicts)


@app.get("/v1/pricing")
def pricing() -> dict:
    return {
        "pay_as_you_go": {
            "price_per_page_cents": settings.price_per_page_cents,
            "description": "$0.10 per page scanned, billed per verification request.",
        },
        "flat_monthly": {
            "price_cents": settings.flat_monthly_price_cents,
            "description": "$99/month flat fee for high-volume offices, unlimited pages.",
        },
    }


@app.get("/v1/usage", response_model=UsageOut)
def usage(x_api_key: str | None = Header(default=None)) -> UsageOut:
    customer = _authenticate(x_api_key)
    period_usage = usage_ledger.get_usage(customer.id)
    return UsageOut(
        plan=customer.plan,
        period=period_usage.period,
        pages_this_period=period_usage.pages,
        scans_this_period=period_usage.scans,
        amount_cents_this_period=period_usage.amount_cents,
    )


@app.post("/v1/admin/customers", response_model=CustomerOut)
def create_customer(
    name: str = Form(...),
    plan: str = Form(default=PLAN_PAY_AS_YOU_GO),
    x_admin_key: str | None = Header(default=None),
) -> CustomerOut:
    _require_admin(x_admin_key)
    if plan not in VALID_PLANS:
        raise HTTPException(status_code=400, detail=f"plan must be one of {VALID_PLANS}")
    customer, api_key = account_store.create_customer(name, plan)
    return CustomerOut(customer_id=customer.id, name=customer.name, plan=customer.plan, api_key=api_key)


@app.post("/v1/demo/api-key", response_model=DemoKeyOut)
def create_demo_key() -> DemoKeyOut:
    """Issue a throwaway API key for trying the tool with no signup.

    Fine for a demo; a real deployment would rate-limit or gate this behind
    an email/captcha instead of handing out working keys to anyone who asks.
    """
    customer, api_key = account_store.create_customer("Demo User", PLAN_PAY_AS_YOU_GO)
    return DemoKeyOut(
        api_key=api_key,
        plan=customer.plan,
        note="Demo key for trying the tool. Not for production use.",
    )


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/", include_in_schema=False)
def index() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html", media_type="text/html")
