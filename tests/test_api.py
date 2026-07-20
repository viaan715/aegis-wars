from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)
SAMPLE_DIR = Path(__file__).parent.parent / "sample_data"
ADMIN_HEADERS = {"X-Admin-Key": "test-admin-key"}


def _sample_texts():
    return (
        (SAMPLE_DIR / "original.txt").read_text(),
        (SAMPLE_DIR / "summary.txt").read_text(),
    )


def _register_customer(name: str, plan: str = "pay_as_you_go") -> str:
    response = client.post(
        "/v1/admin/customers", data={"name": name, "plan": plan}, headers=ADMIN_HEADERS
    )
    assert response.status_code == 200, response.text
    return response.json()["api_key"]


def test_admin_requires_valid_admin_key():
    response = client.post(
        "/v1/admin/customers",
        data={"name": "Acme Law"},
        headers={"X-Admin-Key": "wrong-key"},
    )
    assert response.status_code == 401


def test_admin_rejects_unknown_plan():
    response = client.post(
        "/v1/admin/customers", data={"name": "Acme Law", "plan": "bogus"}, headers=ADMIN_HEADERS
    )
    assert response.status_code == 400


def test_demo_key_works_without_admin_access():
    response = client.post("/v1/demo/api-key")
    assert response.status_code == 200
    body = response.json()
    assert body["api_key"].startswith("hiv_")
    assert body["plan"] == "pay_as_you_go"


def test_verify_requires_api_key():
    original, summary = _sample_texts()
    response = client.post(
        "/v1/verify",
        data={"source_text": original, "summary_text": summary},
    )
    assert response.status_code == 401


def test_verify_rejects_unregistered_api_key():
    original, summary = _sample_texts()
    response = client.post(
        "/v1/verify",
        data={"source_text": original, "summary_text": summary},
        headers={"X-API-Key": "not-a-real-key"},
    )
    assert response.status_code == 401


def test_verify_returns_claim_breakdown_and_charge():
    original, summary = _sample_texts()
    api_key = _register_customer("Acme Law - pay as you go")
    response = client.post(
        "/v1/verify",
        data={"source_text": original, "summary_text": summary},
        headers={"X-API-Key": api_key},
    )
    assert response.status_code == 200
    body = response.json()

    assert body["summary"]["total_claims"] == 5
    assert body["summary"]["unverified"] >= 2  # swapped date + fabricated clause
    assert body["source_pages_scanned"] == 2
    assert body["charge"] == {
        "plan": "pay_as_you_go",
        "pages_billed": 2,
        "amount_cents": 20,
    }


def test_flat_monthly_plan_has_no_marginal_charge():
    original, summary = _sample_texts()
    api_key = _register_customer("Big Firm - flat monthly", plan="flat_monthly")
    response = client.post(
        "/v1/verify",
        data={"source_text": original, "summary_text": summary},
        headers={"X-API-Key": api_key},
    )
    assert response.status_code == 200
    charge = response.json()["charge"]
    assert charge == {"plan": "flat_monthly", "pages_billed": 2, "amount_cents": 0}


def test_verify_report_highlights_unverified_claims_in_yellow():
    original, summary = _sample_texts()
    api_key = _register_customer("Acme Law - report")
    response = client.post(
        "/v1/verify/report",
        data={"source_text": original, "summary_text": summary},
        headers={"X-API-Key": api_key},
    )
    assert response.status_code == 200
    assert "#ffff00" in response.text
    assert "Hallucination Insurance Report" in response.text


def test_usage_accumulates_across_requests():
    original, summary = _sample_texts()
    api_key = _register_customer("Acme Law - usage")
    for _ in range(2):
        client.post(
            "/v1/verify",
            data={"source_text": original, "summary_text": summary},
            headers={"X-API-Key": api_key},
        )

    response = client.get("/v1/usage", headers={"X-API-Key": api_key})
    assert response.status_code == 200
    body = response.json()
    assert body["scans_this_period"] == 2
    assert body["pages_this_period"] == 4
    assert body["amount_cents_this_period"] == 40


def test_pricing_endpoint_reflects_monetization_model():
    response = client.get("/v1/pricing")
    assert response.status_code == 200
    body = response.json()
    assert body["pay_as_you_go"]["price_per_page_cents"] == 10
    assert body["flat_monthly"]["price_cents"] == 9900


def test_health():
    assert client.get("/health").json() == {"status": "ok"}


def test_index_page_served():
    response = client.get("/")
    assert response.status_code == 200
    assert "Hallucination Insurance Validator" in response.text
