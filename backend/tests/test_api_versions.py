"""API endpoint tests for prompt versions feature.

Tests cover all version-related endpoints with various scenarios.
"""

import pytest
from fastapi.testclient import TestClient
from app.api import app
from app.storage import storage


client = TestClient(app)


@pytest.fixture(autouse=True)
def cleanup():
    """Clear storage before and after each test."""
    storage.clear()
    yield
    storage.clear()


class TestListVersionsEndpoint:
    """Tests for GET /prompts/{id}/versions endpoint."""

    def test_list_versions_empty(self):
        """Test listing versions for prompt with no versions returns empty."""
        # Create a prompt
        resp = client.post("/prompts", json={"title": "Test", "content": "Content"})
        assert resp.status_code == 201
        prompt_id = resp.json()["id"]

        # List versions
        resp = client.get(f"/prompts/{prompt_id}/versions")
        assert resp.status_code == 200
        data = resp.json()
        assert data["versions"] == []
        assert data["total"] == 0
        assert data["limit"] == 50
        assert data["offset"] == 0

    def test_list_versions_returns_versions_newest_first(self):
        """Test listing versions returns them newest-first."""
        # Create prompt
        resp = client.post("/prompts", json={"title": "Test", "content": "C"})
        prompt_id = resp.json()["id"]

        # Create versions manually
        v1 = storage.create_version(prompt_id, "T", "C", created_by="user:alice")
        v2 = storage.create_version(prompt_id, "T2", "C2", created_by="user:bob")

        resp = client.get(f"/prompts/{prompt_id}/versions")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["versions"]) == 2
        assert data["versions"][0]["id"] == v2.id  # newest first
        assert data["versions"][1]["id"] == v1.id
        assert data["total"] == 2

    def test_list_versions_with_pagination(self):
        """Test pagination with limit and offset."""
        resp = client.post("/prompts", json={"title": "Test", "content": "C"})
        prompt_id = resp.json()["id"]

        # Create 5 versions
        for i in range(5):
            storage.create_version(prompt_id, f"T{i}", f"C{i}")

        # First page
        resp = client.get(f"/prompts/{prompt_id}/versions?limit=2&offset=0")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["versions"]) == 2
        assert data["total"] == 5
        assert data["limit"] == 2
        assert data["offset"] == 0

        # Second page
        resp = client.get(f"/prompts/{prompt_id}/versions?limit=2&offset=2")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["versions"]) == 2

    def test_list_versions_nonexistent_prompt_returns_404(self):
        """Test listing versions for non-existent prompt returns 404."""
        resp = client.get("/prompts/nonexistent/versions")
        assert resp.status_code == 404
        assert "not found" in resp.json()["detail"].lower()


class TestGetVersionDetailEndpoint:
    """Tests for GET /prompts/{id}/versions/{version_id} endpoint."""

    def test_get_version_detail(self):
        """Test retrieving full version details."""
        # Create prompt and version
        resp = client.post(
            "/prompts",
            json={
                "title": "Test",
                "content": "Content",
                "description": "Desc",
                "collection_id": None
            }
        )
        prompt_id = resp.json()["id"]

        v = storage.create_version(
            prompt_id,
            "Test",
            "Content",
            description="Desc",
            created_by="user:alice",
            note="snapshot"
        )

        resp = client.get(f"/prompts/{prompt_id}/versions/{v.id}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == v.id
        assert data["prompt_id"] == prompt_id
        assert data["title"] == "Test"
        assert data["content"] == "Content"
        assert data["description"] == "Desc"
        assert data["created_by"] == "user:alice"
        assert data["note"] == "snapshot"

    def test_get_version_not_found(self):
        """Test getting non-existent version returns 404."""
        resp = client.post("/prompts", json={"title": "T", "content": "C"})
        prompt_id = resp.json()["id"]

        resp = client.get(f"/prompts/{prompt_id}/versions/nonexistent")
        assert resp.status_code == 404

    def test_get_version_wrong_prompt_returns_404(self):
        """Test getting version with wrong prompt_id returns 404."""
        # Create two prompts
        resp1 = client.post("/prompts", json={"title": "P1", "content": "C1"})
        prompt_id1 = resp1.json()["id"]

        resp2 = client.post("/prompts", json={"title": "P2", "content": "C2"})
        prompt_id2 = resp2.json()["id"]

        # Create version for prompt 1
        v = storage.create_version(prompt_id1, "P1", "C1")

        # Try to get version from prompt 2
        resp = client.get(f"/prompts/{prompt_id2}/versions/{v.id}")
        assert resp.status_code == 404


class TestCreateVersionEndpoint:
    """Tests for POST /prompts/{id}/versions endpoint (manual snapshot)."""

    def test_create_manual_snapshot(self):
        """Test creating a manual version snapshot."""
        resp = client.post(
            "/prompts",
            json={"title": "Original", "content": "Content"}
        )
        prompt_id = resp.json()["id"]

        resp = client.post(
            f"/prompts/{prompt_id}/versions",
            json={"note": "Before important change"}
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["prompt_id"] == prompt_id
        assert data["title"] == "Original"
        assert data["content"] == "Content"
        assert data["note"] == "Before important change"
        assert "created_at" in data
        assert data["id"] is not None

    def test_create_snapshot_without_note(self):
        """Test creating snapshot without optional note."""
        resp = client.post("/prompts", json={"title": "T", "content": "C"})
        prompt_id = resp.json()["id"]

        resp = client.post(f"/prompts/{prompt_id}/versions", json={})
        assert resp.status_code == 201
        data = resp.json()
        assert data["note"] is None

    def test_create_snapshot_nonexistent_prompt_returns_404(self):
        """Test creating snapshot for non-existent prompt returns 404."""
        resp = client.post(
            "/prompts/nonexistent/versions",
            json={"note": "test"}
        )
        assert resp.status_code == 404


class TestRestoreVersionEndpoint:
    """Tests for POST /prompts/{id}/versions/{version_id}/restore endpoint."""

    def test_restore_version(self):
        """Test restoring a prompt from a version."""
        # Create and modify prompt
        resp = client.post(
            "/prompts",
            json={"title": "Original", "content": "Content"}
        )
        prompt_id = resp.json()["id"]

        # Create a version
        v = storage.create_version(prompt_id, "Original", "Content")

        # Modify the prompt
        client.put(
            f"/prompts/{prompt_id}",
            json={"title": "Modified", "content": "NewContent"}
        )

        # Restore
        resp = client.post(f"/prompts/{prompt_id}/versions/{v.id}/restore", json={})
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "Original"
        assert data["content"] == "Content"
        assert data["id"] == prompt_id

    def test_restore_creates_pre_restore_version(self):
        """Test that restore creates a version of pre-restore state."""
        resp = client.post("/prompts", json={"title": "T1", "content": "C1"})
        prompt_id = resp.json()["id"]

        v1 = storage.create_version(prompt_id, "T1", "C1")

        # Update prompt
        client.put(f"/prompts/{prompt_id}", json={"title": "T2", "content": "C2"})

        # Restore from v1
        resp = client.post(f"/prompts/{prompt_id}/versions/{v1.id}/restore", json={})
        assert resp.status_code == 200

        # Check versions list - should have pre-restore version
        versions = storage.get_versions_for_prompt(prompt_id)
        assert len(versions) >= 2

    def test_restore_nonexistent_version_returns_404(self):
        """Test restoring non-existent version returns 404."""
        resp = client.post("/prompts", json={"title": "T", "content": "C"})
        prompt_id = resp.json()["id"]

        resp = client.post(
            f"/prompts/{prompt_id}/versions/nonexistent/restore",
            json={}
        )
        assert resp.status_code == 404

    def test_restore_nonexistent_prompt_returns_404(self):
        """Test restoring on non-existent prompt returns 404."""
        resp = client.post(
            "/prompts/nonexistent/versions/nonexistent/restore",
            json={}
        )
        assert resp.status_code == 404
