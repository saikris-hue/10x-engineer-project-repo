"""Pydantic models for PromptLab."""

from datetime import datetime
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field


def generate_id() -> str:
    """Generate a unique identifier string.

    Returns:
        str: A new UUID4 string suitable for use as an object ID.
    """
    return str(uuid4())


def get_current_time() -> datetime:
    """Return the current UTC time.

    Returns:
        datetime: Current time in UTC.
    """
    return datetime.utcnow()


# ============== Prompt Models ==============

class PromptBase(BaseModel):
    """Base model containing shared fields for prompts.

    Attributes:
        title (str): Prompt title, 1–200 characters.
        content (str): Body of the prompt, must be non‑empty.
        description (Optional[str]): Optional description, max 500 characters.
        collection_id (Optional[str]): ID of associated collection.
    """

    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    description: str | None = Field(None, max_length=500)
    collection_id: str | None = None


class PromptCreate(PromptBase):
    """Model used when creating a new prompt.

    Inherits all fields from :class:`PromptBase`.
    """


class PromptUpdate(PromptBase):
    """Model used when replacing an existing prompt.

    Same as :class:`PromptBase`; used for PUT operations.
    """


class PromptPatch(BaseModel):
    """Model for patching (partial update) prompts.

    All fields are optional; only provided values are applied.

    Attributes:
        title (Optional[str]): New title if updating.
        content (Optional[str]): New content if updating.
        description (Optional[str]): New description if updating.
        collection_id (Optional[str]): New collection association.
    """

    title: str | None = Field(None, min_length=1, max_length=200)
    content: str | None = Field(None, min_length=1)
    description: str | None = Field(None, max_length=500)
    collection_id: str | None = None


class Prompt(PromptBase):
    """Representation of a prompt stored in the system.

    Includes metadata generated at creation and update.

    Attributes:
        id (str): Unique identifier generated with :func:`generate_id`.
        created_at (datetime): Timestamp when prompt was created.
        updated_at (datetime): Timestamp when prompt was last updated.
    """

    id: str = Field(default_factory=generate_id)
    created_at: datetime = Field(default_factory=get_current_time)
    updated_at: datetime = Field(default_factory=get_current_time)

    model_config = ConfigDict(from_attributes=True)


# ============== Collection Models ==============

class CollectionBase(BaseModel):
    """Base model for collections.

    Attributes:
        name (str): Collection name, 1–100 characters.
        description (Optional[str]): Optional description, max 500 characters.
    """

    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = Field(None, max_length=500)


class CollectionCreate(CollectionBase):
    """Model used when creating a new collection.

    Same fields as :class:`CollectionBase`.
    """


class Collection(CollectionBase):
    """Representation of a collection stored in the system.

    Attributes:
        id (str): Unique identifier generated with :func:`generate_id`.
        created_at (datetime): Timestamp when collection was created.
    """

    id: str = Field(default_factory=generate_id)
    created_at: datetime = Field(default_factory=get_current_time)

    model_config = ConfigDict(from_attributes=True)


# ============== Response Models ==============

class PromptList(BaseModel):
    """API response model for a list of prompts.

    Attributes:
        prompts (List[Prompt]): List of prompt objects.
        total (int): Total number of prompts returned.
    """

    prompts: list[Prompt]
    total: int


class CollectionList(BaseModel):
    """API response model for a list of collections.

    Attributes:
        collections (List[Collection]): List of collection objects.
        total (int): Total number of collections returned.
    """

    collections: list[Collection]
    total: int


# ============== Version Models ==============

class PromptVersion(BaseModel):
    """Immutable snapshot of a prompt at a point in time.

    Represents a historical version capturing prompt fields and metadata.

    Attributes:
        id (str): Unique version identifier.
        prompt_id (str): ID of the prompt this version belongs to.
        title (str): Snapshot of prompt title.
        content (str): Snapshot of prompt content.
        description (Optional[str]): Snapshot of prompt description.
        collection_id (Optional[str]): Snapshot of collection association.
        created_at (datetime): When this version was created.
        created_by (Optional[str]): User ID or identifier of version creator.
        note (Optional[str]): Optional human-readable note attached to version.
    """

    id: str = Field(default_factory=generate_id)
    prompt_id: str
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    description: str | None = Field(None, max_length=500)
    collection_id: str | None = None
    created_at: datetime = Field(default_factory=get_current_time)
    created_by: str | None = None
    note: str | None = None

    model_config = ConfigDict(frozen=True)

    @classmethod
    def from_prompt(
        cls,
        prompt: "Prompt",
        created_by: str | None = None,
        note: str | None = None
    ) -> "PromptVersion":
        """Create a version snapshot from a Prompt.

        Args:
            prompt: The Prompt to snapshot.
            created_by: Optional user identifier.
            note: Optional descriptive note.

        Returns:
            PromptVersion: New immutable snapshot.
        """
        return cls(
            prompt_id=prompt.id,
            title=prompt.title,
            content=prompt.content,
            description=prompt.description,
            collection_id=prompt.collection_id,
            created_by=created_by,
            note=note
        )


class PromptVersionList(BaseModel):
    """API response model for a list of prompt versions.

    Attributes:
        versions (List[PromptVersion]): List of version objects.
        total (int): Total number of versions.
        limit (int): Pagination limit used in request.
        offset (int): Pagination offset used in request.
    """

    versions: list[PromptVersion]
    total: int
    limit: int = 50
    offset: int = 0


class HealthResponse(BaseModel):
    """Model for health check responses.

    Attributes:
        status (str): Health status string (e.g., 'healthy').
        version (str): API version.
    """

    status: str
    version: str
