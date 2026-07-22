from app.verification.entities import extract_facts, fact_supported


def test_extracts_date_number_and_proper_noun():
    facts = extract_facts(
        "Beta Consulting LLC must deliver the final report by December 1, 2021."
    )
    kinds = {f.kind for f in facts}
    assert "date" in kinds
    assert "proper_noun" in kinds
    values = {f.value for f in facts}
    assert any("December 1, 2021" in v for v in values)
    assert "Beta Consulting LLC" in values


def test_fact_supported_is_case_insensitive_substring_check():
    from app.verification.entities import ExtractedFact

    fact = ExtractedFact(kind="date", value="March 4, 2021")
    assert fact_supported(fact, "Signed on march 4, 2021 in Delaware.")
    assert not fact_supported(fact, "Signed on March 5, 2021 in Delaware.")


def test_sentence_leading_capitalized_word_not_treated_as_proper_noun():
    facts = extract_facts("The prevailing party shall recover fees.")
    proper_nouns = [f.value for f in facts if f.kind == "proper_noun"]
    assert "The" not in proper_nouns
