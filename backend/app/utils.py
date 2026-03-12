"""Utility functions for PromptLab."""

import re
from collections.abc import Iterable

from app.models import Prompt


def sort_prompts_by_date(
    prompts: Iterable[Prompt], descending: bool = True
) -> list[Prompt]:
    """Sort prompts by creation date.

    Args:
        prompts (Iterable[Prompt]): Prompts to sort.
        descending (bool): Whether to sort newest first. Defaults to ``True``.

    Returns:
        list[Prompt]: Sorted list of prompts.
    """
    return sorted(prompts, key=lambda p: p.created_at, reverse=descending)


def filter_prompts_by_collection(
    prompts: Iterable[Prompt], collection_id: str
) -> list[Prompt]:
    """Filter prompts belonging to a specific collection.

    Args:
        prompts (Iterable[Prompt]): Prompts to filter.
        collection_id (str): Collection ID to match.

    Returns:
        list[Prompt]: Subset of prompts whose ``collection_id`` equals
            the provided value.
    """
    return [p for p in prompts if p.collection_id == collection_id]


def search_prompts(prompts: Iterable[Prompt], query: str) -> list[Prompt]:
    """Search prompts by title or description.

    Args:
        prompts (Iterable[Prompt]): Prompts to search.
        query (str): Search string to look for (case-insensitive).

    Returns:
        list[Prompt]: Prompts where the query appears in the title or
            (if present) the description.
    """
    query_lower = query.lower()
    return [
        prompt
        for prompt in prompts
        if query_lower in prompt.title.lower()
        or (prompt.description and query_lower in prompt.description.lower())
    ]


def validate_prompt_content(content: str) -> bool:
    """Check if prompt content meets basic validity criteria.

    A valid prompt should:
    - Not be empty
    - Not be just whitespace
    - Be at least 10 characters

    Args:
        content (str): Prompt content to validate.

    Returns:
        bool: ``True`` if content is valid, otherwise ``False``.
    """
    if not content or not content.strip():
        return False
    return len(content.strip()) >= 10


def extract_variables(content: str) -> list[str]:
    """Extract template variables from prompt content.

    Variables are in the format ``{{variable_name}}``.

    Args:
        content (str): The prompt text containing template variables.

    Returns:
        list[str]: List of variable names found in the content.
    """
    pattern = r"\{\{(\w+)\}\}"
    return re.findall(pattern, content)
