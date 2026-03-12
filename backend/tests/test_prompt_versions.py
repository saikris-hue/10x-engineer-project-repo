"""TDD test suite for prompt versions feature.

Tests cover model validation, storage operations, and API endpoints.
"""

import pytest
from datetime import datetime
from app.models import Prompt, PromptVersion
from app.storage import Storage


class TestPromptVersionModel:
    """Tests for PromptVersion Pydantic model."""

    def test_create_version_minimal(self):
        """Test creating a version with required fields."""
        v = PromptVersion(
            prompt_id="p1",
            title="Title",
            content="Content"
        )
        assert v.prompt_id == "p1"
        assert v.title == "Title"
        assert v.content == "Content"
        assert v.description is None
        assert v.collection_id is None
        assert v.created_by is None
        assert v.note is None
        assert v.id is not None
        assert isinstance(v.created_at, datetime)

    def test_create_version_full(self):
        """Test creating a version with all fields."""
        v = PromptVersion(
            prompt_id="p1",
            title="Title",
            content="Content",
            description="Desc",
            collection_id="col1",
            created_by="user:alice",
            note="Manual snapshot"
        )
        assert v.description == "Desc"
        assert v.collection_id == "col1"
        assert v.created_by == "user:alice"
        assert v.note == "Manual snapshot"

    def test_version_from_prompt(self):
        """Test creating a version snapshot from a prompt."""
        p = Prompt(
            title="My Prompt",
            content="Content here",
            description="A prompt",
            collection_id="col1"
        )
        v = PromptVersion.from_prompt(p, created_by="user:bob", note="backup")
        assert v.prompt_id == p.id
        assert v.title == p.title
        assert v.content == p.content
        assert v.description == p.description
        assert v.collection_id == p.collection_id
        assert v.created_by == "user:bob"
        assert v.note == "backup"

    def test_version_immutable_after_creation(self):
        """Test that version field assignment is restricted after creation."""
        v = PromptVersion(
            prompt_id="p1",
            title="Title",
            content="Content"
        )
        # Pydantic frozen=True prevents assignment
        with pytest.raises(Exception):
            v.title = "New Title"


class TestStorageVersions:
    """Tests for Storage version operations."""

    def setup_method(self):
        """Create fresh storage for each test."""
        self.storage = Storage()

    def test_create_version(self):
        """Test creating a version in storage."""
        p = self.storage.create_prompt(
            title="Test",
            content="Content"
        )
        v = self.storage.create_version(
            prompt_id=p.id,
            title=p.title,
            content=p.content,
            created_by="user:alice"
        )
        assert v.id is not None
        assert v.prompt_id == p.id
        assert v.title == "Test"

    def test_get_version(self):
        """Test retrieving a version by ID."""
        p = self.storage.create_prompt(title="T", content="C")
        v = self.storage.create_version(
            prompt_id=p.id,
            title=p.title,
            content=p.content
        )
        retrieved = self.storage.get_version(p.id, v.id)
        assert retrieved.id == v.id
        assert retrieved.title == "T"

    def test_get_version_not_found(self):
        """Test retrieving non-existent version returns None."""
        p = self.storage.create_prompt(title="T", content="C")
        v = self.storage.get_version(p.id, "invalid-id")
        assert v is None

    def test_get_versions_for_prompt(self):
        """Test listing versions for a prompt."""
        p = self.storage.create_prompt(title="T", content="C")
        v1 = self.storage.create_version(prompt_id=p.id, title="T", content="C")
        v2 = self.storage.create_version(prompt_id=p.id, title="T2", content="C2")

        versions = self.storage.get_versions_for_prompt(p.id)
        assert len(versions) == 2
        assert versions[0].id == v2.id  # newest first
        assert versions[1].id == v1.id

    def test_get_versions_returns_empty_for_missing_prompt(self):
        """Test listing versions for non-existent prompt returns empty list."""
        versions = self.storage.get_versions_for_prompt("invalid-id")
        assert versions == []

    def test_versions_cascade_delete_with_prompt(self):
        """Test that deleting a prompt deletes associated versions."""
        p = self.storage.create_prompt(title="T", content="C")
        v = self.storage.create_version(prompt_id=p.id, title="T", content="C")

        self.storage.delete_prompt(p.id)
        retrieved_v = self.storage.get_version(p.id, v.id)
        assert retrieved_v is None

    def test_restore_prompt_from_version(self):
        """Test restoring a prompt from a version snapshot."""
        p = self.storage.create_prompt(title="Original", content="Content1")
        v = self.storage.create_version(
            prompt_id=p.id,
            title="Original",
            content="Content1"
        )

        # Modify the prompt
        modified = Prompt(
            id=p.id,
            title="Modified",
            content="Content2",
            created_at=p.created_at,
            updated_at=p.updated_at
        )
        self.storage.update_prompt(p.id, modified)
        updated = self.storage.get_prompt(p.id)
        assert updated.title == "Modified"

        # Restore from version
        restored = self.storage.restore_from_version(p.id, v.id)
        assert restored.title == "Original"
        assert restored.content == "Content1"

        # Check that a version was created for the pre-restore state
        versions = self.storage.get_versions_for_prompt(p.id)
        assert len(versions) >= 2  # original + pre-restore version
