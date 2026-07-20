from pathlib import Path

from app.parsing.document import parse_text
from app.verification.matcher import STATUS_UNVERIFIED, STATUS_VERIFIED, verify_claims

SAMPLE_DIR = Path(__file__).parent.parent / "sample_data"


def _load_sample():
    original = (SAMPLE_DIR / "original.txt").read_text()
    summary = (SAMPLE_DIR / "summary.txt").read_text()
    return parse_text(original), summary


def test_accurately_restated_claims_are_verified_with_citation():
    source_lines, summary = _load_sample()
    verdicts = verify_claims(source_lines, summary)

    signed_claim = verdicts[0]
    assert signed_claim.status == STATUS_VERIFIED
    assert signed_claim.matched_page == 1
    assert signed_claim.matched_line_start == 2


def test_swapped_date_is_flagged_even_though_wording_is_close():
    source_lines, summary = _load_sample()
    verdicts = verify_claims(source_lines, summary)

    # "must deliver ... by December 1, 2021" vs source's "October 15, 2021" --
    # near-identical phrasing, wrong date. This is exactly the hallucination
    # class embedding similarity alone would miss.
    date_claim = next(v for v in verdicts if "December 1, 2021" in v.claim.text)
    assert date_claim.status == STATUS_UNVERIFIED
    assert any(f.kind == "date" for f in date_claim.unsupported_facts)


def test_fabricated_clause_with_no_source_support_is_unverified():
    source_lines, summary = _load_sample()
    verdicts = verify_claims(source_lines, summary)

    fabricated_claim = next(v for v in verdicts if "non-compete" in v.claim.text)
    assert fabricated_claim.status == STATUS_UNVERIFIED


def test_no_source_text_yields_unverified_claims():
    verdicts = verify_claims([], "Something happened on July 4, 1990.")
    assert all(v.status == STATUS_UNVERIFIED for v in verdicts)
    assert all(v.matched_page is None for v in verdicts)


def test_no_claims_yields_empty_list():
    source_lines, _ = _load_sample()
    assert verify_claims(source_lines, "") == []


def test_spelled_out_number_mismatch_is_flagged():
    source_lines, _ = _load_sample()
    # Source says "30 days"; claim paraphrases with a wrong, spelled-out number.
    verdicts = verify_claims(
        source_lines,
        "Either party may terminate this agreement with sixty days written notice.",
    )
    assert verdicts[0].status == STATUS_UNVERIFIED
    assert any(f.kind == "number" for f in verdicts[0].unsupported_facts)


def test_spelled_out_number_matching_source_is_not_flagged_as_unsupported():
    source_lines, _ = _load_sample()
    # Source says "30 days"; claim spells the same number out correctly.
    verdicts = verify_claims(
        source_lines,
        "Either party may terminate this agreement with thirty days written notice.",
    )
    assert verdicts[0].unsupported_facts == []


def test_negation_flip_is_flagged_even_with_high_word_overlap():
    source_lines, _ = _load_sample()
    verdicts = verify_claims(
        source_lines,
        "The prevailing party shall not be entitled to recover reasonable attorney's fees.",
    )
    assert verdicts[0].status == STATUS_UNVERIFIED
    assert any(f.kind == "polarity" for f in verdicts[0].unsupported_facts)
