from fastapi.testclient import TestClient

from app.main import app


def test_health_returns_ok_in_camel_case():
    response = TestClient(app).get("/api/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "little-explorers-api",
        "programNote": "illustrative, confirm with team",
    }
