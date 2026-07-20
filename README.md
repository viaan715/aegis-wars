# Hallucination Insurance Validator

An independent, B2B fact-checking tool for AI-generated document summaries.
Law firms and medical clinics want to use LLMs to summarize case files, but
can't risk a hallucinated fact reaching a human reader unchecked. This
service sits between the LLM and the reader: given the original source
document and an AI-generated summary of it, it cross-references every claim
in the summary back to the exact page and line of the source, and flags
anything it can't verify — in an API, or in the built-in side-by-side web
UI.

## Why embeddings alone aren't enough

Semantic similarity is necessary but not sufficient. "Deliver the report by
**October 15, 2021**" and "Deliver the report by **December 1, 2021**" score
almost identically under embedding similarity — same structure, same topic,
wrong date. Likewise, "shall **not** be liable" and "shall be liable" read as
nearly the same sentence to an embedding model despite meaning the opposite.
These are exactly the hallucinations that matter most in a legal or medical
context, and exactly what similarity scoring alone will miss.

So each claim goes through three independent checks against its best-matching
source passage:

1. **Semantic match** — embed the claim and every candidate source passage,
   find the best cosine-similarity match.
2. **Structural fact check** — extract concrete, checkable details (dates,
   numbers/amounts — including spelled-out numbers like "thirty days" —
   and proper nouns) from the claim and verify each one appears in the
   matched passage, in either digit or word form.
3. **Polarity check** — detect negation cues ("not", "without", "fails to", …)
   in both the claim and the matched passage; a mismatch means the claim's
   meaning may have been flipped.

A claim is only marked `verified` if it clears the similarity bar *and*
passes both the fact check and the polarity check. A high similarity score
with an unsupported detail or a flipped negation is downgraded to
`unverified`, not waved through. This makes the tool strict by design — it
will over-flag close paraphrases before it under-flags a swapped fact.

## Architecture

```
app/
  parsing/document.py       Parse PDF or text into page/line-addressable lines
  claims/extractor.py       Split the AI summary into sentence-level claims
  embeddings/                Pluggable embedder (TF-IDF default, optional
                              sentence-transformers backend)
  verification/
    matcher.py               Segments source into line windows, runs semantic
                              matching + structural fact-checking + polarity
                              checking, produces a verdict (verified / review
                              / unverified) with a page + line citation
    entities.py               Extracts dates/numbers (digit and word form)/
                              proper nouns, and detects negation
  accounts/store.py           SQLite-backed customers + hashed API keys
  billing/metering.py         Persistent, per-customer, per-billing-period
                              usage ledger + pricing calculation
  reporting/html.py          Side-by-side HTML report, unverified claims in
                              bright yellow
  static/index.html           Interactive web UI (upload/paste, run, review)
  main.py                    FastAPI app wiring it all together
```

The default embedder is TF-IDF fit on the exact pair of documents being
compared per request — no model download, no external API call, works fully
offline. That matters here: this tool is often handling privileged legal or
medical documents. A production deployment that wants better paraphrase
recall can install `sentence-transformers` and set
`HIV_EMBEDDING_BACKEND=sentence-transformers` — same interface, drop-in
swap.

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt   # includes runtime deps + pytest/httpx
```

Run the test suite:

```bash
pytest
```

Run the app locally:

```bash
uvicorn app.main:app --reload
```

Then open `http://localhost:8000/` for the web UI, or use the API directly
(below). Accounts/usage are stored in a SQLite file at `data/hiv.db` by
default (override with `HIV_DB_PATH`); it's created automatically.

## Web UI

`GET /` serves a single-page app: paste or upload the source document and
the AI summary, click **Run verification**, and review the interactive
side-by-side results (green = verified, amber = needs review, bright yellow
= unverified). Click **Get demo key** for a no-signup API key, and **Load
sample** on either panel to try it instantly with the bundled example
contract.

## API

Every `/v1/*` endpoint except `/v1/pricing` and `/v1/demo/api-key` requires
an `X-API-Key` header tied to a registered customer account.

### `POST /v1/admin/customers`

Provisions a real customer account and its API key. Requires an
`X-Admin-Key` header matching `HIV_ADMIN_KEY` (defaults to a dev-only
placeholder — **must** be overridden via the environment in any real
deployment).

```bash
curl -X POST http://localhost:8000/v1/admin/customers \
  -H "X-Admin-Key: $HIV_ADMIN_KEY" \
  -d "name=Acme Law Firm" -d "plan=pay_as_you_go"
```

### `POST /v1/demo/api-key`

Issues a throwaway `pay_as_you_go` API key with no auth required, for trying
the tool. (A real deployment would gate or rate-limit this rather than leave
it wide open — see Limitations.)

### `POST /v1/verify`

Accepts either file uploads (`source_file`, `summary_file` — PDF or plain
text) or raw text fields (`source_text`, `summary_text`). The billing plan
is whatever the calling customer was provisioned with — it's not a
per-request choice.

```bash
curl -X POST http://localhost:8000/v1/verify \
  -H "X-API-Key: $API_KEY" \
  --data-urlencode "source_text@sample_data/original.txt" \
  --data-urlencode "summary_text@sample_data/summary.txt"
```

Returns a JSON breakdown: per-claim status (`verified` / `review` /
`unverified`), similarity score, matched page/line citation, any unsupported
facts (including polarity conflicts), plus a summary count and the billing
charge for the request.

### `POST /v1/verify/report`

Same inputs, returns a rendered HTML side-by-side report (green = verified,
amber = needs review, **bright yellow = unverified**).

### `GET /v1/pricing`

Returns the two plans: `$0.10/page` pay-as-you-go, or `$99/month` flat fee
for high-volume offices.

### `GET /v1/usage`

Returns the calling customer's usage for the current calendar-month billing
period: scan count, pages scanned, and amount billed (in cents).

## Try it with the sample data

`sample_data/original.txt` is a 2-page mock contract. `sample_data/summary.txt`
is an AI-style summary of it with two deliberately planted problems: a
swapped delivery date (semantically near-identical, factually wrong) and a
fabricated non-compete clause that isn't in the source at all (also caught
by the "five years" figure having no support in the source). The web UI's
**Load sample** buttons load exactly this pair.

## Known limitations (current scope)

- **Number-word parsing covers common contract-scale numbers** (zero to
  hundreds of thousands) but not exotic large-number phrasing or number
  words in languages other than English.
- **Negation detection is cue-based, not full NLU** — it catches the common
  patterns ("not", "without", "fails to", …) but can be fooled by double
  negatives or negation far from the relevant clause.
- **TF-IDF has limited paraphrase recall** — a claim that rewords the source
  heavily with no shared vocabulary may score a false low similarity. The
  optional sentence-transformers backend improves this.
- **The demo-key endpoint is wide open** — fine for a demo, but a real
  deployment would gate it behind an email/captcha or remove it entirely,
  since it hands out working (if low-privilege) API keys to anyone.
- **No real payment processor integration** — the usage ledger tracks
  exactly what a customer owes per billing period, but nothing pushes that
  to Stripe or similar yet. `estimate_charge` in `billing/metering.py` is
  the intended integration seam.
- **PDF parsing relies on `pdfplumber`'s text extraction** — scanned
  (image-only) PDFs would need an OCR pass first, which isn't wired up.
