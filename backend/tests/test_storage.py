"""Unit tests for in-memory Storage implementation.

These tests verify CRUD operations and expected behaviors for
prompts and collections stored in `app.storage.Storage`.
"""

from app.storage import storage
from app.models import Prompt, Collection


def setup_function():
    # Ensure storage is clean before each test when running this file alone
    storage.clear()


def teardown_function():
    storage.clear()


def test_create_and_get_prompt():
    p = storage.create_prompt(title="T1", content="C1")

    got = storage.get_prompt(p.id)
    assert got is not None
    assert got.id == p.id
    assert got.title == "T1"


def test_get_all_prompts():
    p1 = storage.create_prompt(title="A", content="a")
    p2 = storage.create_prompt(title="B", content="b")

    allp = storage.get_all_prompts()
    assert len(allp) == 2
    ids = {p.id for p in allp}
    assert p1.id in ids and p2.id in ids


def test_update_prompt_success():
    p = storage.create_prompt(title="Old", content="old")

    data = p.model_dump()
    data["title"] = "New"
    updated = Prompt(**data)

    result = storage.update_prompt(p.id, updated)
    assert result is not None
    assert result.title == "New"
    # storage should reflect the change
    assert storage.get_prompt(p.id).title == "New"


def test_update_prompt_not_found():
    p = storage.create_prompt(title="X", content="Y")
    # Use a fake id by creating then deleting to ensure non-existence
    storage.delete_prompt(p.id)

    data = p.model_dump()
    data["title"] = "Z"
    updated = Prompt(**data)

    res = storage.update_prompt(p.id, updated)
    assert res is None


def test_delete_prompt():
    p = storage.create_prompt(title="ToDelete", content="c")

    assert storage.delete_prompt(p.id) is True
    assert storage.get_prompt(p.id) is None
    # deleting again returns False
    assert storage.delete_prompt(p.id) is False


def test_create_prompt_overwrite():
    p = storage.create_prompt(title="First", content="1")

    # Create another Prompt instance with same id
    d = p.model_dump()
    d["title"] = "Second"
    p2 = Prompt(**d)
    storage.update_prompt(p.id, p2)

    got = storage.get_prompt(p.id)
    assert got.title == "Second"


def test_collections_crud():
    c = Collection(name="Dev", description="desc")
    storage.create_collection(c)

    got = storage.get_collection(c.id)
    assert got is not None
    assert got.name == "Dev"

    allc = storage.get_all_collections()
    assert len(allc) == 1

    assert storage.delete_collection(c.id) is True
    assert storage.get_collection(c.id) is None
    assert storage.delete_collection(c.id) is False


def test_get_prompts_by_collection():
    c = Collection(name="Team")
    storage.create_collection(c)

    p1 = storage.create_prompt(title="WithCol", content="x", collection_id=c.id)
    p2 = storage.create_prompt(title="NoCol", content="y")

    results = storage.get_prompts_by_collection(c.id)
    assert len(results) == 1
    assert results[0].id == p1.id


def test_clear_removes_everything():
    c = Collection(name="C1")
    p = storage.create_prompt(title="P1", content="x")
    storage.create_collection(c)

    storage.clear()
    assert storage.get_all_prompts() == []
    assert storage.get_all_collections() == []
