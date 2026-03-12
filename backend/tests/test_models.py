"""Unit tests for app.models Pydantic schemas.

Covers model validation, constraints, defaults, and edge cases.
"""

import pytest
from datetime import datetime
from app.models import (
    Prompt, PromptCreate, PromptUpdate, PromptPatch,
    Collection, CollectionCreate,
    PromptList, CollectionList, HealthResponse,
    generate_id, get_current_time,
)


class TestPromptBase:
    """Tests for Prompt creation and validation."""

    def test_create_prompt_minimal(self):
        p = Prompt(title="T", content="C")
        assert p.title == "T"
        assert p.content == "C"
        assert p.description is None
        assert p.collection_id is None
        assert p.id is not None
        assert isinstance(p.created_at, datetime)
        assert isinstance(p.updated_at, datetime)

    def test_create_prompt_full(self):
        p = Prompt(
            title="Full Prompt",
            content="Full content",
            description="Desc",
            collection_id="col-123"
        )
        assert p.title == "Full Prompt"
        assert p.description == "Desc"
        assert p.collection_id == "col-123"

    def test_prompt_title_too_short(self):
        with pytest.raises(ValueError):
            Prompt(title="", content="content")

    def test_prompt_title_too_long(self):
        with pytest.raises(ValueError):
            Prompt(title="x" * 201, content="content")

    def test_prompt_title_max_length_boundary(self):
        p = Prompt(title="x" * 200, content="content")
        assert len(p.title) == 200

    def test_prompt_content_too_short(self):
        with pytest.raises(ValueError):
            Prompt(title="Title", content="")

    def test_prompt_description_too_long(self):
        with pytest.raises(ValueError):
            Prompt(title="T", content="C", description="x" * 501)

    def test_prompt_description_max_length_boundary(self):
        p = Prompt(title="T", content="C", description="x" * 500)
        assert len(p.description) == 500

    def test_prompt_unicode_and_special_chars(self):
        p = Prompt(
            title="Unicode ✅ Emoji 🚀",
            content="Content with !@#$%^&*() and quotes 'test'",
            description="测试 - test with diacritics: café"
        )
        assert "✅" in p.title
        assert "🚀" in p.title
        assert "!@#$%^&*()" in p.content
        assert "café" in p.description

    def test_prompt_whitespace_only_title_allowed(self):
        # Pydantic min_length only checks character count, not content
        p = Prompt(title="   ", content="content")
        assert p.title == "   "

    def test_prompt_whitespace_only_content_allowed(self):
        # Pydantic min_length only checks character count, not content
        p = Prompt(title="Title", content="   ")
        assert p.content == "   "

    def test_prompt_id_uniqueness(self):
        p1 = Prompt(title="A", content="a")
        p2 = Prompt(title="B", content="b")
        assert p1.id != p2.id

    def test_prompt_timestamps(self):
        before = datetime.utcnow()
        p = Prompt(title="T", content="C")
        after = datetime.utcnow()
        assert before <= p.created_at <= after
        assert before <= p.updated_at <= after


class TestPromptCreate:
    """Tests for PromptCreate schema."""

    def test_prompt_create_valid(self):
        pc = PromptCreate(title="T", content="C")
        assert pc.title == "T"
        assert pc.content == "C"

    def test_prompt_create_requires_title(self):
        with pytest.raises(ValueError):
            PromptCreate(content="C")

    def test_prompt_create_requires_content(self):
        with pytest.raises(ValueError):
            PromptCreate(title="T")


class TestPromptUpdate:
    """Tests for PromptUpdate schema (full replacement)."""

    def test_prompt_update_valid(self):
        pu = PromptUpdate(title="New", content="New Content")
        assert pu.title == "New"
        assert pu.content == "New Content"

    def test_prompt_update_requires_all_base_fields(self):
        with pytest.raises(ValueError):
            PromptUpdate(title="T")


class TestPromptPatch:
    """Tests for PromptPatch schema (partial update)."""

    def test_patch_only_title(self):
        pp = PromptPatch(title="Only title")
        assert pp.title == "Only title"
        assert pp.content is None
        assert pp.description is None

    def test_patch_only_content(self):
        pp = PromptPatch(content="Only content")
        assert pp.title is None
        assert pp.content == "Only content"

    def test_patch_multiple_fields(self):
        pp = PromptPatch(title="T", description="D")
        assert pp.title == "T"
        assert pp.description == "D"
        assert pp.content is None

    def test_patch_all_none(self):
        pp = PromptPatch()
        assert pp.title is None
        assert pp.content is None
        assert pp.description is None

    def test_patch_title_validation(self):
        with pytest.raises(ValueError):
            PromptPatch(title="")

    def test_patch_content_validation(self):
        with pytest.raises(ValueError):
            PromptPatch(content="")


class TestCollectionBase:
    """Tests for Collection creation and validation."""

    def test_create_collection_minimal(self):
        c = Collection(name="Dev")
        assert c.name == "Dev"
        assert c.description is None
        assert c.id is not None
        assert isinstance(c.created_at, datetime)

    def test_create_collection_full(self):
        c = Collection(name="Production", description="Prod prompts")
        assert c.name == "Production"
        assert c.description == "Prod prompts"

    def test_collection_name_too_short(self):
        with pytest.raises(ValueError):
            Collection(name="")

    def test_collection_name_too_long(self):
        with pytest.raises(ValueError):
            Collection(name="x" * 101)

    def test_collection_name_max_length_boundary(self):
        c = Collection(name="x" * 100)
        assert len(c.name) == 100

    def test_collection_description_too_long(self):
        with pytest.raises(ValueError):
            Collection(name="N", description="x" * 501)

    def test_collection_unicode_in_name(self):
        c = Collection(name="中文 Collection 🎯")
        assert "中文" in c.name
        assert "🎯" in c.name

    def test_collection_whitespace_only_name_allowed(self):
        # Pydantic min_length only checks character count, not content
        c = Collection(name="   ")
        assert c.name == "   "


class TestCollectionCreate:
    """Tests for CollectionCreate schema."""

    def test_collection_create_valid(self):
        cc = CollectionCreate(name="Test")
        assert cc.name == "Test"

    def test_collection_create_requires_name(self):
        with pytest.raises(ValueError):
            CollectionCreate()


class TestResponseModels:
    """Tests for response models (PromptList, CollectionList, HealthResponse)."""

    def test_prompt_list(self):
        p1 = Prompt(title="A", content="a")
        p2 = Prompt(title="B", content="b")
        pl = PromptList(prompts=[p1, p2], total=2)
        assert len(pl.prompts) == 2
        assert pl.total == 2

    def test_prompt_list_empty(self):
        pl = PromptList(prompts=[], total=0)
        assert pl.prompts == []
        assert pl.total == 0

    def test_collection_list(self):
        c1 = Collection(name="C1")
        c2 = Collection(name="C2")
        cl = CollectionList(collections=[c1, c2], total=2)
        assert len(cl.collections) == 2
        assert cl.total == 2

    def test_health_response(self):
        hr = HealthResponse(status="healthy", version="1.0.0")
        assert hr.status == "healthy"
        assert hr.version == "1.0.0"


class TestUtilityFunctions:
    """Tests for generate_id() and get_current_time()."""

    def test_generate_id_returns_string(self):
        id1 = generate_id()
        assert isinstance(id1, str)

    def test_generate_id_uniqueness(self):
        ids = {generate_id() for _ in range(100)}
        assert len(ids) == 100  # all unique

    def test_generate_id_format_uuid(self):
        id1 = generate_id()
        # UUID4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
        parts = id1.split("-")
        assert len(parts) == 5

    def test_get_current_time_returns_datetime(self):
        t = get_current_time()
        assert isinstance(t, datetime)

    def test_get_current_time_is_recent(self):
        before = datetime.utcnow()
        t = get_current_time()
        after = datetime.utcnow()
        assert before <= t <= after
