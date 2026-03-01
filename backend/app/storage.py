"""In-memory storage for PromptLab

This module provides simple in-memory storage for prompts and collections.
In a production environment, this would be replaced with a database.
"""

from typing import Dict, List, Optional
from app.models import Prompt, Collection


class Storage:
    """A rudimentary in-memory datastore for prompts and collections.

    Instances of this class hold prompts and collections in two internal
    dictionaries keyed by their IDs. It exposes CRUD operations for each
    entity type.  This storage is ephemeral and is mainly used for testing
    or development.
    """

    def __init__(self):
        """Initialize empty storage dictionaries."""
        self._prompts: Dict[str, Prompt] = {}
        self._collections: Dict[str, Collection] = {}

    # ============== Prompt Operations ==============

    def create_prompt(self, prompt: Prompt) -> Prompt:
        """Add a new prompt to storage.

        Args:
            prompt (Prompt): Prompt object to store.

        Returns:
            Prompt: The same prompt object that was stored.
        """
        self._prompts[prompt.id] = prompt
        return prompt

    def get_prompt(self, prompt_id: str) -> Optional[Prompt]:
        """Retrieve a prompt by its ID.

        Args:
            prompt_id (str): The identifier of the prompt.

        Returns:
            Optional[Prompt]: The prompt if found, otherwise ``None``.
        """
        return self._prompts.get(prompt_id)

    def get_all_prompts(self) -> List[Prompt]:
        """Return all stored prompts.

        Returns:
            List[Prompt]: List of all prompt objects currently stored.
        """
        return list(self._prompts.values())

    def update_prompt(self, prompt_id: str, prompt: Prompt) -> Optional[Prompt]:
        """Replace an existing prompt with a new object.

        Args:
            prompt_id (str): ID of the prompt to update.
            prompt (Prompt): Updated prompt object.

        Returns:
            Optional[Prompt]: The updated prompt if the ID existed,
            otherwise ``None``.
        """
        if prompt_id not in self._prompts:
            return None
        self._prompts[prompt_id] = prompt
        return prompt

    def delete_prompt(self, prompt_id: str) -> bool:
        """Remove a prompt from storage.

        Args:
            prompt_id (str): ID of the prompt to delete.

        Returns:
            bool: ``True`` if the prompt was deleted, ``False`` if it
            did not exist.
        """
        if prompt_id in self._prompts:
            del self._prompts[prompt_id]
            return True
        return False

    # ============== Collection Operations ==============

    def create_collection(self, collection: Collection) -> Collection:
        """Add a new collection to storage.

        Args:
            collection (Collection): Collection object to store.

        Returns:
            Collection: The collection object that was stored.
        """
        self._collections[collection.id] = collection
        return collection

    def get_collection(self, collection_id: str) -> Optional[Collection]:
        """Retrieve a collection by its ID.

        Args:
            collection_id (str): The identifier of the collection.

        Returns:
            Optional[Collection]: The collection if found, otherwise ``None``.
        """
        return self._collections.get(collection_id)

    def get_all_collections(self) -> List[Collection]:
        """Return all stored collections.

        Returns:
            List[Collection]: List of all collection objects currently stored.
        """
        return list(self._collections.values())

    def delete_collection(self, collection_id: str) -> bool:
        """Remove a collection from storage.

        Args:
            collection_id (str): ID of the collection to delete.

        Returns:
            bool: ``True`` if deletion succeeded, ``False`` if not found.
        """
        if collection_id in self._collections:
            del self._collections[collection_id]
            return True
        return False

    def get_prompts_by_collection(self, collection_id: str) -> List[Prompt]:
        """List all prompts associated with a particular collection.

        Args:
            collection_id (str): The collection's identifier.

        Returns:
            List[Prompt]: Prompts whose ``collection_id`` matches.
        """
        return [p for p in self._prompts.values() if p.collection_id == collection_id]

    # ============== Utility ==============

    def clear(self):
        """Remove all prompts and collections from storage."""
        self._prompts.clear()
        self._collections.clear()


# Global storage instance
storage = Storage()
