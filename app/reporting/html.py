"""Render a side-by-side HTML report: AI summary claims on the left, matched
source passage on the right, with unverified claims highlighted in bright
yellow so a human reviewer's eye goes straight to what needs a second look.
"""
from __future__ import annotations

import html

from app.verification.matcher import (
    STATUS_REVIEW,
    STATUS_UNVERIFIED,
    STATUS_VERIFIED,
    ClaimVerdict,
)

_STATUS_STYLES = {
    STATUS_VERIFIED: "background-color:#d9f7d9;",
    STATUS_REVIEW: "background-color:#ffe8a3;",
    STATUS_UNVERIFIED: "background-color:#ffff00;",
}

_STATUS_LABELS = {
    STATUS_VERIFIED: "Verified",
    STATUS_REVIEW: "Needs review",
    STATUS_UNVERIFIED: "UNVERIFIED",
}


def _citation(verdict: ClaimVerdict) -> str:
    if verdict.matched_page is None:
        return "No match found in source"
    if verdict.matched_line_start == verdict.matched_line_end:
        return f"p.{verdict.matched_page}, line {verdict.matched_line_start}"
    return (
        f"p.{verdict.matched_page}, lines {verdict.matched_line_start}"
        f"-{verdict.matched_line_end}"
    )


def _row(verdict: ClaimVerdict) -> str:
    style = _STATUS_STYLES.get(verdict.status, _STATUS_STYLES[STATUS_UNVERIFIED])
    label = _STATUS_LABELS.get(verdict.status, verdict.status)
    claim_text = html.escape(verdict.claim.text)
    matched_text = html.escape(verdict.matched_text or "")

    facts_html = ""
    if verdict.unsupported_facts:
        fact_list = ", ".join(html.escape(f.value) for f in verdict.unsupported_facts)
        facts_html = f'<div class="facts">Unsupported detail(s): {fact_list}</div>'

    return f"""
    <tr>
      <td class="claim" style="{style}">
        <div class="claim-text">{claim_text}</div>
        <div class="meta">{label} &middot; similarity {verdict.similarity:.2f}</div>
        {facts_html}
      </td>
      <td class="source">
        <div class="citation">{_citation(verdict)}</div>
        <div class="source-text">{matched_text}</div>
      </td>
    </tr>
    """


def render_report(verdicts: list[ClaimVerdict], document_name: str = "Document") -> str:
    rows = "".join(_row(v) for v in verdicts)
    title = html.escape(document_name)

    return f"""<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Hallucination Insurance Report - {title}</title>
<style>
  body {{ font-family: -apple-system, Helvetica, Arial, sans-serif; margin: 2rem; color: #1a1a1a; }}
  table {{ width: 100%; border-collapse: collapse; }}
  td {{ vertical-align: top; padding: 0.75rem 1rem; border-bottom: 1px solid #e0e0e0; }}
  .claim {{ width: 50%; }}
  .source {{ width: 50%; background: #fafafa; }}
  .meta {{ font-size: 0.8rem; color: #555; margin-top: 0.35rem; }}
  .facts {{ font-size: 0.8rem; color: #a33; margin-top: 0.35rem; font-weight: 600; }}
  .citation {{ font-size: 0.8rem; font-weight: 600; color: #444; margin-bottom: 0.35rem; }}
  h1 {{ font-size: 1.25rem; }}
  .legend span {{ display: inline-block; padding: 0.15rem 0.5rem; border-radius: 3px; margin-right: 0.75rem; font-size: 0.8rem; }}
</style>
</head>
<body>
  <h1>Hallucination Insurance Report</h1>
  <div class="legend">
    <span style="{_STATUS_STYLES[STATUS_VERIFIED]}">Verified</span>
    <span style="{_STATUS_STYLES[STATUS_REVIEW]}">Needs review</span>
    <span style="{_STATUS_STYLES[STATUS_UNVERIFIED]}">Unverified</span>
  </div>
  <table>
    <thead><tr><td><strong>AI Summary Claim</strong></td><td><strong>Source Match</strong></td></tr></thead>
    <tbody>
      {rows}
    </tbody>
  </table>
</body>
</html>"""
