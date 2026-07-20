"""Extract concrete, checkable facts (numbers, dates, proper nouns) from a claim,
plus a negation/polarity signal used to catch flipped meaning.

Semantic similarity alone is the wrong tool for catching the most dangerous
class of hallucination: a sentence that reads as topically on-point but
swaps a specific detail (the wrong date, the wrong dollar figure, the wrong
party name) -- or flips polarity ("shall **not** be liable" vs "shall be
liable"). Two such sentences score nearly identically under embedding
similarity. This module lets the matcher additionally check, literally,
whether each concrete detail in a claim actually appears in the source
passage it was matched to, and whether the two agree on negation.

Known limitation: number-word parsing covers the ranges that show up in
contracts and clinical notes (zero to hundreds of thousands: "thirty days",
"two hundred and fifty dollars"), not exotic large-number phrasing.
"""
from __future__ import annotations

import re
from dataclasses import dataclass

_NUMBER_RE = re.compile(r"\$?\d[\d,]*(?:\.\d+)?%?")

_MONTHS = (
    r"January|February|March|April|May|June|July|August|September|October|"
    r"November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec"
)
_DATE_RE = re.compile(
    rf"\b(?:{_MONTHS})\.?\s+\d{{1,2}}(?:st|nd|rd|th)?,?\s*\d{{0,4}}\b", re.IGNORECASE
)

_PROPER_NOUN_RE = re.compile(r"\b[A-Z][a-zA-Z]{1,}(?:\s+[A-Z][a-zA-Z]{1,})*\b")

# Skipped only when they open the sentence (where capitalization is just
# English grammar, not a proper noun signal).
_COMMON_SENTENCE_STARTERS = {
    "The", "This", "That", "These", "Those", "A", "An", "It", "They", "He",
    "She", "We", "In", "On", "At", "According", "As", "If", "However",
    "Additionally", "Furthermore", "Overall", "Either", "Any", "Both",
}

_ONES = [
    "zero", "one", "two", "three", "four", "five", "six", "seven", "eight",
    "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
    "sixteen", "seventeen", "eighteen", "nineteen",
]
_ONES_WORDS = {word: i for i, word in enumerate(_ONES)}
_TENS = ["twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]
_TENS_WORDS = {word: 20 + 10 * i for i, word in enumerate(_TENS)}
_SCALE_WORDS = {"hundred": 100, "thousand": 1000}
_ALL_NUMBER_WORDS = sorted(
    set(_ONES_WORDS) | set(_TENS_WORDS) | set(_SCALE_WORDS) | {"and"},
    key=len,
    reverse=True,
)
_WORD_NUMBER_RE = re.compile(
    rf"\b(?:{'|'.join(_ALL_NUMBER_WORDS)})(?:[\s-]+(?:{'|'.join(_ALL_NUMBER_WORDS)}))*\b",
    re.IGNORECASE,
)

_NEGATION_RE = re.compile(
    r"\b(not|never|cannot|can't|won't|shan't|isn't|aren't|wasn't|weren't|"
    r"doesn't|don't|didn't|hasn't|haven't|hadn't|without|no longer|"
    r"fails? to|failed to|unable to)\b",
    re.IGNORECASE,
)


def _number_to_words(n: int) -> str:
    """Render an integer as English words, for cross-checking against a
    source that spells numbers out instead of using digits."""
    if n < 0 or n > 999_999:
        return ""
    if n < 20:
        return _ONES[n]
    if n < 100:
        tens, rem = divmod(n, 10)
        return _TENS[tens - 2] + (f"-{_ONES[rem]}" if rem else "")
    if n < 1000:
        hundreds, rem = divmod(n, 100)
        return _ONES[hundreds] + " hundred" + (f" {_number_to_words(rem)}" if rem else "")
    thousands, rem = divmod(n, 1000)
    return _number_to_words(thousands) + " thousand" + (f" {_number_to_words(rem)}" if rem else "")


def _word_number_to_int(text: str) -> int | None:
    tokens = [t for t in re.split(r"[\s-]+", text.strip().lower()) if t and t != "and"]
    if not tokens:
        return None
    total = 0
    current = 0
    for tok in tokens:
        if tok in _ONES_WORDS:
            current += _ONES_WORDS[tok]
        elif tok in _TENS_WORDS:
            current += _TENS_WORDS[tok]
        elif tok in _SCALE_WORDS:
            scale = _SCALE_WORDS[tok]
            current = (current or 1) * scale
            if scale == 1000:
                total += current
                current = 0
        else:
            return None
    return total + current


def _parse_number_value(value: str) -> int | None:
    cleaned = value.strip().lower().rstrip("%").lstrip("$").replace(",", "")
    if cleaned.isdigit():
        return int(cleaned)
    return _word_number_to_int(cleaned)


@dataclass(frozen=True)
class ExtractedFact:
    kind: str  # "date" | "number" | "proper_noun" | "polarity"
    value: str


def extract_facts(sentence: str) -> list[ExtractedFact]:
    facts: list[ExtractedFact] = []
    seen: set[tuple[str, str]] = set()

    def _add(kind: str, value: str) -> None:
        key = (kind, value.lower())
        if key not in seen:
            seen.add(key)
            facts.append(ExtractedFact(kind=kind, value=value))

    date_spans = [m.span() for m in _DATE_RE.finditer(sentence)]
    for start, end in date_spans:
        _add("date", sentence[start:end].strip().rstrip(","))

    def _inside_date(pos: int) -> bool:
        return any(start <= pos < end for start, end in date_spans)

    for match in _NUMBER_RE.finditer(sentence):
        if _inside_date(match.start()):
            continue  # already captured as part of a date
        value = match.group().strip()
        if value.isdigit() and len(value) == 1:
            continue  # bare single digits are too noisy (list markers, etc.)
        _add("number", value)

    for match in _WORD_NUMBER_RE.finditer(sentence):
        if _inside_date(match.start()):
            continue
        value = match.group().strip()
        # A lone "one" is too often a pronoun/article ("either one") rather
        # than a numeral to safely treat as a checkable fact.
        if value.lower() == "one":
            continue
        if _word_number_to_int(value) is None:
            continue
        _add("number", value)

    for match in _PROPER_NOUN_RE.finditer(sentence):
        value = match.group().strip()
        first_word = value.split()[0]
        if match.start() == 0 and first_word in _COMMON_SENTENCE_STARTERS:
            continue
        if len(value) < 3:
            continue
        _add("proper_noun", value)

    return facts


def has_negation(text: str) -> bool:
    return bool(_NEGATION_RE.search(text))


def fact_supported(fact: ExtractedFact, source_text: str) -> bool:
    source_lower = source_text.lower()
    if fact.value.lower() in source_lower:
        return True
    if fact.kind == "number":
        numeric = _parse_number_value(fact.value)
        if numeric is not None:
            candidates = {str(numeric)}
            words = _number_to_words(numeric)
            if words:
                candidates.add(words)
            return any(candidate in source_lower for candidate in candidates)
    return False
