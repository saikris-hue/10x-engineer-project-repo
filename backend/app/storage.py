"""In-memory storage for PromptLab.

This module provides simple in-memory storage for prompts and collections.
In a production environment, this would be replaced with a database.
"""

from app.models import Collection, Prompt, PromptVersion, get_current_time


class Storage:
    """A rudimentary in-memory datastore for prompts and collections.

    Instances of this class hold prompts and collections in two internal
    dictionaries keyed by their IDs. It exposes CRUD operations for each
    entity type.  This storage is ephemeral and is mainly used for testing
    or development.
    """

    def __init__(self):
        """Initialize empty storage dictionaries."""
        self._prompts: dict[str, Prompt] = {}
        self._collections: dict[str, Collection] = {}
        self._versions: dict[str, dict[str, PromptVersion]] = {}

    def _get_version_store(self, prompt_id: str) -> dict[str, PromptVersion]:
        """Return the mutable version mapping for a prompt."""
        return self._versions.setdefault(prompt_id, {})

    def _restore_prompt_snapshot(self, prompt: Prompt, version: PromptVersion) -> Prompt:
        """Build a prompt object from a stored version snapshot."""
        return Prompt(
            id=prompt.id,
            title=version.title,
            content=version.content,
            description=version.description,
            collection_id=version.collection_id,
            created_at=prompt.created_at,
            updated_at=get_current_time(),
        )

    # ============== Prompt Operations ==============

    def create_prompt(
        self,
        title: str,
        content: str,
        description: str | None = None,
        collection_id: str | None = None,
    ) -> Prompt:
        """Create and store a new prompt.

        Args:
            title: Prompt title.
            content: Prompt content.
            description: Optional description.
            collection_id: Optional collection association.

        Returns:
            Prompt: The created prompt with assigned ID and timestamps.
        """
        prompt = Prompt(
            title=title,
            content=content,
            description=description,
            collection_id=collection_id,
        )
        self._prompts[prompt.id] = prompt
        return prompt

    def get_prompt(self, prompt_id: str) -> Prompt | None:
        """Retrieve a prompt by its ID.

        Args:
            prompt_id (str): The identifier of the prompt.

        Returns:
            Optional[Prompt]: The prompt if found, otherwise ``None``.
        """
        return self._prompts.get(prompt_id)

    def get_all_prompts(self) -> list[Prompt]:
        """Return all stored prompts.

        Returns:
            List[Prompt]: List of all prompt objects currently stored.
        """
        return list(self._prompts.values())

    def update_prompt(self, prompt_id: str, prompt: Prompt) -> Prompt | None:
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
            # Cascade delete versions
            if prompt_id in self._versions:
                del self._versions[prompt_id]
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

    def get_collection(self, collection_id: str) -> Collection | None:
        """Retrieve a collection by its ID.

        Args:
            collection_id (str): The identifier of the collection.

        Returns:
            Optional[Collection]: The collection if found, otherwise ``None``.
        """
        return self._collections.get(collection_id)

    def get_all_collections(self) -> list[Collection]:
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

    def get_prompts_by_collection(self, collection_id: str) -> list[Prompt]:
        """List all prompts associated with a particular collection.

        Args:
            collection_id (str): The collection's identifier.

        Returns:
            List[Prompt]: Prompts whose ``collection_id`` matches.
        """
        return [p for p in self._prompts.values() if p.collection_id == collection_id]

    # ============== Version Operations ==============

    def create_version(
        self,
        prompt_id: str,
        title: str,
        content: str,
        description: str | None = None,
        collection_id: str | None = None,
        created_by: str | None = None,
        note: str | None = None,
    ) -> PromptVersion:
        """Create and store an immutable version snapshot.

        Args:
            prompt_id: ID of the prompt this version belongs to.
            title: Snapshot of prompt title.
            content: Snapshot of prompt content.
            description: Optional snapshot of description.
            collection_id: Optional snapshot of collection association.
            created_by: Optional user identifier.
            note: Optional descriptive note.

        Returns:
            PromptVersion: The created version object.
        """
        version = PromptVersion(
            prompt_id=prompt_id,
            title=title,
            content=content,
            description=description,
            collection_id=collection_id,
            created_by=created_by,
            note=note,
        )
        self._get_version_store(prompt_id)[version.id] = version
        return version

    def get_version(self, prompt_id: str, version_id: str) -> PromptVersion | None:
        """Retrieve a specific version by ID.

        Args:
            prompt_id: ID of the prompt.
            version_id: ID of the version.

        Returns:
            Optional[PromptVersion]: The version if found, else None.
        """
        if prompt_id not in self._versions:
            return None
        return self._versions[prompt_id].get(version_id)

    def get_versions_for_prompt(
        self, prompt_id: str, limit: int = 50, offset: int = 0
    ) -> list[PromptVersion]:
        """List versions for a prompt, sorted newest-first.

        Args:
            prompt_id: ID of the prompt.
            limit: Max number of versions to return.
            offset: Number of versions to skip.

        Returns:
            List[PromptVersion]: Versions sorted by created_at descending.
        """
        if prompt_id not in self._versions:
            return []
        versions = sorted(
            self._versions[prompt_id].values(),
            key=lambda v: v.created_at,
            reverse=True
        )
        return versions[offset : offset + limit]

    def get_versions_count_for_prompt(self, prompt_id: str) -> int:
        """Get total count of versions for a prompt.

        Args:
            prompt_id: ID of the prompt.

        Returns:
            int: Total number of versions.
        """
        return len(self._versions.get(prompt_id, {}))

    def restore_from_version(
        self, prompt_id: str, version_id: str, created_by: str | None = None
    ) -> Prompt | None:
        """Restore a prompt from a version snapshot.

        Creates a version capturing the pre-restore state, then updates
        the prompt with values from the specified version.

        Args:
            prompt_id: ID of the prompt to restore.
            version_id: ID of the version to restore from.
            created_by: Optional user identifier for audit.

        Returns:
            Optional[Prompt]: The updated prompt if successful, else None.
        """
        # Get the current prompt
        prompt = self.get_prompt(prompt_id)
        if not prompt:
            return None

        # Get the version to restore
        version = self.get_version(prompt_id, version_id)
        if not version:
            return None

        # Create version capturing pre-restore state
        self.create_version(
            prompt_id=prompt_id,
            title=prompt.title,
            content=prompt.content,
            description=prompt.description,
            collection_id=prompt.collection_id,
            created_by=created_by,
            note="auto-version-before-restore",
        )

        # Restore prompt from version
        restored_prompt = self._restore_prompt_snapshot(prompt, version)
        return self.update_prompt(prompt_id, restored_prompt)

    def clear(self) -> None:
        """Remove all prompts, collections, and versions from storage."""
        self._prompts.clear()
        self._collections.clear()
        self._versions.clear()


# Global storage instance
storage = Storage()
