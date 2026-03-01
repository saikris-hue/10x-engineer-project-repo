"""Utility functions for PromptLab"""

from typing import List
from app.models import Prompt


def sort_prompts_by_date(prompts: List[Prompt], descending: bool = True) -> List[Prompt]:
    """Sort prompts by creation date.

    Args:
        prompts (List[Prompt]): List of prompts to sort.
        descending (bool): Whether to sort newest first. Defaults to ``True``.

    Returns:
        List[Prompt]: Sorted list of prompts.

    Note:
        There might be a bug here. Check the sort order!
    """
    return sorted(prompts, key=lambda p: p.created_at, reverse=descending)


def filter_prompts_by_collection(prompts: List[Prompt], collection_id: str) -> List[Prompt]:
    """Filter prompts belonging to a specific collection.

    Args:
        prompts (List[Prompt]): List of prompts to filter.
        collection_id (str): Collection ID to match.

    Returns:
        List[Prompt]: Subset of prompts whose ``collection_id`` equals
            the provided value.
    """
    return [p for p in prompts if p.collection_id == collection_id]


def search_prompts(prompts: List[Prompt], query: str) -> List[Prompt]:
    """Search prompts by title or description.

    Args:
        prompts (List[Prompt]): List of prompts to search.
        query (str): Search string to look for (case-insensitive).

    Returns:
        List[Prompt]: Prompts where the query appears in the title or
            (if present) the description.
    """
    query_lower = query.lower()
    return [
        p for p in prompts 
        if query_lower in p.title.lower() or 
           (p.description and query_lower in p.description.lower())
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


def extract_variables(content: str) -> List[str]:
    """Extract template variables from prompt content.

    Variables are in the format ``{{variable_name}}``.

    Args:
        content (str): The prompt text containing template variables.

    Returns:
        List[str]: List of variable names found in the content.
    """
    import re
    pattern = r'\{\{(\w+)\}\}'
    return re.findall(pattern, content)
