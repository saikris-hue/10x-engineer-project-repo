"""Tests for auto-versioning on PUT/PATCH operations."""

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


class TestAutoVersioning:
    """Tests for automatic version creation on updates."""

    def test_put_creates_version_of_previous_state(self):
        """Test that PUT creates a version of the pre-update state."""
        # Create prompt
        resp = client.post("/prompts", json={"title": "Original", "content": "C1"})
        prompt_id = resp.json()["id"]

        # Verify no versions yet
        versions = storage.get_versions_for_prompt(prompt_id)
        assert len(versions) == 0

        # Update with PUT
        resp = client.put(
            f"/prompts/{prompt_id}",
            json={"title": "Updated", "content": "C2"}
        )
        assert resp.status_code == 200

        # Verify a version was created
        versions = storage.get_versions_for_prompt(prompt_id)
        assert len(versions) == 1
        assert versions[0].title == "Original"  # Captures pre-update state
        assert versions[0].content == "C1"

    def test_patch_creates_version_of_previous_state(self):
        """Test that PATCH creates a version of the pre-patch state."""
        # Create prompt
        resp = client.post("/prompts", json={"title": "Original", "content": "Content"})
        prompt_id = resp.json()["id"]

        # Patch only title
        resp = client.patch(
            f"/prompts/{prompt_id}",
            json={"title": "Patched"}
        )
        assert resp.status_code == 200

        # Verify a version was created
        versions = storage.get_versions_for_prompt(prompt_id)
        assert len(versions) == 1
        assert versions[0].title == "Original"  # Captures pre-patch state
        assert versions[0].content == "Content"  # Other fields preserved

    def test_multiple_updates_create_multiple_versions(self):
        """Test that multiple updates create multiple versions."""
        resp = client.post("/prompts", json={"title": "T1", "content": "C1"})
        prompt_id = resp.json()["id"]

        # First update
        client.put(f"/prompts/{prompt_id}", json={"title": "T2", "content": "C2"})

        # Second update
        client.put(f"/prompts/{prompt_id}", json={"title": "T3", "content": "C3"})

        # Verify two versions exist
        versions = storage.get_versions_for_prompt(prompt_id)
        assert len(versions) == 2
        # Newest first
        assert versions[0].title == "T2"
        assert versions[1].title == "T1"

    def test_patch_multiple_times_creates_versions(self):
        """Test that multiple patches each create a version."""
        resp = client.post("/prompts", json={"title": "T1", "content": "C1"})
        prompt_id = resp.json()["id"]

        # First patch
        client.patch(f"/prompts/{prompt_id}", json={"title": "T2"})

        # Second patch
        client.patch(f"/prompts/{prompt_id}", json={"content": "C2"})

        # Verify two versions
        versions = storage.get_versions_for_prompt(prompt_id)
        assert len(versions) == 2

    def test_updated_at_changes_on_update(self):
        """Test that updated_at timestamp changes on update."""
        # Create prompt
        resp = client.post("/prompts", json={"title": "T", "content": "C"})
        original = resp.json()
        prompt_id = original["id"]
        original_updated_at = original["updated_at"]

        # Wait a tiny bit and update
        import time
        time.sleep(0.01)

        client.put(f"/prompts/{prompt_id}", json={"title": "Updated", "content": "C"})

        # Check updated_at changed
        resp = client.get(f"/prompts/{prompt_id}")
        updated = resp.json()
        assert updated["updated_at"] > original_updated_at
