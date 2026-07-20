"""The core cross-referencing engine.

For every claim in the AI summary:
  1. Find the best-matching passage in the source document by semantic
     (embedding cosine) similarity.
  2. Extract concrete facts (dates, numbers, proper nouns) from the claim and
     check each one appears verbatim in the matched passage.
  3. A claim is only "verified" if it clears the similarity bar *and* every
     concrete fact it asserts is actually backed by the source -- a claim
     that is topically similar but swaps a date or figure is flagged, not
     waved through.

Source text is segmented into every individual line plus sliding windows of
up to `max_line_window` consecutive lines on the same page, so a claim that
paraphrases a sentence split across two source lines can still be matched
and cited as a precise page + line range.
"""
from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np

from app.claims.extractor import Claim, extract_claims
from app.config import settings
from app.embeddings import get_embedder
from app.parsing.document import SourceLine
from app.verification.entities import ExtractedFact, extract_facts, fact_supported, has_negation

STATUS_VERIFIED = "verified"
STATUS_REVIEW = "review"
STATUS_UNVERIFIED = "unverified"


@dataclass(frozen=True)
class SourceSegment:
    page: int
    line_start: int
    line_end: int
    text: str


def build_segments(
    lines: list[SourceLine], max_window: int | None = None
) -> list[SourceSegment]:
    max_window = max_window or settings.max_line_window
    by_page: dict[int, list[SourceLine]] = {}
    for ln in lines:
        by_page.setdefault(ln.page, []).append(ln)

    segments: list[SourceSegment] = []
    for page in sorted(by_page):
        page_lines = by_page[page]
        for window in range(1, max_window + 1):
            for i in range(len(page_lines) - window + 1):
                chunk = page_lines[i : i + window]
                segments.append(
                    SourceSegment(
                        page=page,
                        line_start=chunk[0].line,
                        line_end=chunk[-1].line,
                        text=" ".join(c.text for c in chunk),
                    )
                )
    return segments


@dataclass
class ClaimVerdict:
    claim: Claim
    status: str
    similarity: float
    matched_page: int | None
    matched_line_start: int | None
    matched_line_end: int | None
    matched_text: str | None
    unsupported_facts: list[ExtractedFact] = field(default_factory=list)


def _unmatched_verdict(claim: Claim) -> ClaimVerdict:
    return ClaimVerdict(
        claim=claim,
        status=STATUS_UNVERIFIED,
        similarity=0.0,
        matched_page=None,
        matched_line_start=None,
        matched_line_end=None,
        matched_text=None,
    )


def verify_claims(source_lines: list[SourceLine], summary_text: str) -> list[ClaimVerdict]:
    claims = extract_claims(summary_text)
    if not claims:
        return []

    segments = build_segments(source_lines)
    if not segments:
        return [_unmatched_verdict(c) for c in claims]

    embedder = get_embedder()
    segment_texts = [s.text for s in segments]
    claim_texts = [c.text for c in claims]
    if hasattr(embedder, "fit"):
        embedder.fit(segment_texts + claim_texts)

    segment_vectors = embedder.embed(segment_texts)
    claim_vectors = embedder.embed(claim_texts)
    similarity = claim_vectors @ segment_vectors.T  # rows are L2-normalized -> cosine

    verdicts: list[ClaimVerdict] = []
    for row_idx, claim in enumerate(claims):
        scores = similarity[row_idx]
        best_idx = int(np.argmax(scores))
        best_score = float(scores[best_idx])
        best_segment = segments[best_idx]

        facts = extract_facts(claim.text)
        unsupported = [f for f in facts if not fact_supported(f, best_segment.text)]

        if has_negation(claim.text) != has_negation(best_segment.text):
            # The claim and its best-matched passage disagree on negation --
            # e.g. "shall not be liable" vs "shall be liable". Similarity
            # alone can't tell these apart, so treat it as an unsupported
            # detail regardless of how close the wording otherwise is.
            unsupported = [
                *unsupported,
                ExtractedFact(kind="polarity", value="negation does not match source"),
            ]

        if unsupported:
            # A concrete, checkable detail doesn't appear in the cited
            # passage -- this overrides similarity, however high.
            status = STATUS_UNVERIFIED
        elif best_score >= settings.semantic_verified_threshold:
            status = STATUS_VERIFIED
        elif best_score >= settings.semantic_review_threshold:
            status = STATUS_REVIEW
        else:
            status = STATUS_UNVERIFIED

        verdicts.append(
            ClaimVerdict(
                claim=claim,
                status=status,
                similarity=best_score,
                matched_page=best_segment.page,
                matched_line_start=best_segment.line_start,
                matched_line_end=best_segment.line_end,
                matched_text=best_segment.text,
                unsupported_facts=unsupported,
            )
        )
    return verdicts
