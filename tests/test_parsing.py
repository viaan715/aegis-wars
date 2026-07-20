from app.parsing.document import parse_text


def test_single_page_line_numbers():
    lines = parse_text("first line\nsecond line\n\nthird line")
    assert [(l.page, l.line, l.text) for l in lines] == [
        (1, 1, "first line"),
        (1, 2, "second line"),
        (1, 4, "third line"),
    ]


def test_form_feed_starts_new_page():
    lines = parse_text("page one line\n\fpage two line")
    pages = [l.page for l in lines]
    assert pages == [1, 2]
    assert lines[1].line == 1  # line numbering restarts on the new page


def test_blank_lines_are_skipped_not_counted_as_content():
    lines = parse_text("a\n\n\nb")
    assert [l.text for l in lines] == ["a", "b"]
