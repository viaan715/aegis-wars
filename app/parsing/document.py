"""Parse source documents into page/line-addressable text.

The verifier needs to cite the exact page and line a claim was drawn from, so
every source document -- plain text or PDF -- is normalized into a flat list
of `SourceLine` records before anything else happens.
"""
from __future__ import annotations

import tempfile
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class SourceLine:
    page: int
    line: int
    text: str


def parse_text(raw_text: str) -> list[SourceLine]:
    """Split raw text into addressable lines.

    A form-feed character (``\\f``) is treated as an explicit page break,
    which lets plain-text fixtures (and text extracted upstream from a
    paginated source) declare page boundaries. Text with no form feeds is
    treated as a single page.
    """
    lines: list[SourceLine] = []
    for page, page_text in enumerate(raw_text.split("\f"), start=1):
        for line_no, line_text in enumerate(page_text.splitlines(), start=1):
            stripped = line_text.strip()
            if stripped:
                lines.append(SourceLine(page=page, line=line_no, text=stripped))
    return lines


def parse_pdf(path: Path) -> list[SourceLine]:
    import pdfplumber

    lines: list[SourceLine] = []
    with pdfplumber.open(path) as pdf:
        for page_num, pdf_page in enumerate(pdf.pages, start=1):
            text = pdf_page.extract_text() or ""
            for line_no, line_text in enumerate(text.splitlines(), start=1):
                stripped = line_text.strip()
                if stripped:
                    lines.append(SourceLine(page=page_num, line=line_no, text=stripped))
    return lines


def parse_document(filename: str, content: bytes) -> list[SourceLine]:
    """Parse an uploaded document (PDF or plain text) into addressable lines."""
    if filename.lower().endswith(".pdf"):
        with tempfile.NamedTemporaryFile(suffix=".pdf") as tmp:
            tmp.write(content)
            tmp.flush()
            return parse_pdf(Path(tmp.name))
    return parse_text(content.decode("utf-8", errors="replace"))
