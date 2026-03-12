"""Unit tests for app.utils functions.

Cover sorting, filtering, searching, validation, and variable extraction.
"""

from datetime import datetime, timedelta
from app.utils import (
    sort_prompts_by_date,
    filter_prompts_by_collection,
    search_prompts,
    validate_prompt_content,
    extract_variables,
)
from app.models import Prompt


def make_prompt(title, content, description=None, collection_id=None, created_at=None):
    data = {
        "title": title,
        "content": content,
        "description": description,
        "collection_id": collection_id,
    }
    if created_at is not None:
        data["created_at"] = created_at
    return Prompt(**{k: v for k, v in data.items() if v is not None})


def test_sort_prompts_by_date_descending():
    now = datetime.utcnow()
    p1 = make_prompt("A", "c", created_at=now - timedelta(seconds=10))
    p2 = make_prompt("B", "c", created_at=now)
    p3 = make_prompt("C", "c", created_at=now - timedelta(seconds=5))

    sorted_prompts = sort_prompts_by_date([p1, p2, p3])
    assert [p.title for p in sorted_prompts] == ["B", "C", "A"]


def test_sort_prompts_by_date_ascending():
    now = datetime.utcnow()
    p1 = make_prompt("A", "c", created_at=now - timedelta(seconds=2))
    p2 = make_prompt("B", "c", created_at=now - timedelta(seconds=1))
    p3 = make_prompt("C", "c", created_at=now)

    sorted_prompts = sort_prompts_by_date([p1, p2, p3], descending=False)
    assert [p.title for p in sorted_prompts] == ["A", "B", "C"]


def test_filter_prompts_by_collection():
    p1 = make_prompt("A", "c", collection_id="col1")
    p2 = make_prompt("B", "c", collection_id="col2")
    p3 = make_prompt("C", "c", collection_id="col1")

    filtered = filter_prompts_by_collection([p1, p2, p3], "col1")
    assert {p.id for p in filtered} == {p1.id, p3.id}


def test_search_prompts_title_and_description_case_insensitive():
    p1 = make_prompt("Code Review", "content", description="Review this")
    p2 = make_prompt("Other", "content", description="misc")
    p3 = make_prompt("review helper", "content")

    results = search_prompts([p1, p2, p3], "review")
    ids = {p.id for p in results}
    assert p1.id in ids
    assert p3.id in ids
    assert p2.id not in ids


def test_search_prompts_handles_none_description():
    p1 = make_prompt("FindMe", "content", description=None)
    results = search_prompts([p1], "findme")
    assert p1 in results


def test_validate_prompt_content():
    assert not validate_prompt_content("")
    assert not validate_prompt_content("   ")
    assert not validate_prompt_content("short")
    assert validate_prompt_content("0123456789")  # exactly 10 chars
    assert validate_prompt_content("   padded content with length >10   ")


def test_extract_variables():
    content = "Hello {{name}}, your id is {{user_id}} and code {{code123}}. Not {{bad-char}}"
    vars = extract_variables(content)
    # pattern \w+ matches letters, digits, underscore. 'bad-char' should not match the hyphen part
    assert "name" in vars
    assert "user_id" in vars
    assert "code123" in vars
    assert "bad" in vars or "bad-char" not in vars


def test_extract_variables_no_matches():
    assert extract_variables("no templates here") == []
