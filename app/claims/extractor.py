"""Split an AI-generated summary into discrete, independently verifiable claims."""
from __future__ import annotations

import re
from dataclasses import dataclass

_SENTENCE_SPLIT_RE = re.compile(r"(?<=[.!?])\s+(?=[A-Z0-9\"'(])")
_LEADING_BULLET_RE = re.compile(r"^[\-\*•\d]+[\.\)]?\s*")


@dataclass(frozen=True)
class Claim:
    index: int
    text: str


def extract_claims(summary_text: str) -> list[Claim]:
    """Split a summary into sentence-level claims.

    Paragraphs are split first so that sentence-boundary detection never
    bleeds across an intentional break, then each paragraph is split into
    sentences. Very short fragments (headings, stray punctuation) are
    dropped since they carry no verifiable content.
    """
    claims: list[Claim] = []
    for paragraph in summary_text.split("\n\n"):
        normalized = re.sub(r"\s+", " ", paragraph).strip()
        if not normalized:
            continue
        for sentence in _SENTENCE_SPLIT_RE.split(normalized):
            sentence = _LEADING_BULLET_RE.sub("", sentence).strip()
            if len(sentence) < 8:
                continue
            claims.append(Claim(index=len(claims), text=sentence))
    return claims
