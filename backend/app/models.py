"""Pydantic models for PromptLab"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from uuid import uuid4


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
    description: Optional[str] = Field(None, max_length=500)
    collection_id: Optional[str] = None


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

    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = Field(None, min_length=1)
    description: Optional[str] = Field(None, max_length=500)
    collection_id: Optional[str] = None


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

    class Config:
        from_attributes = True


# ============== Collection Models ==============

class CollectionBase(BaseModel):
    """Base model for collections.

    Attributes:
        name (str): Collection name, 1–100 characters.
        description (Optional[str]): Optional description, max 500 characters.
    """

    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)


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

    class Config:
        from_attributes = True


# ============== Response Models ==============

class PromptList(BaseModel):
    """API response model for a list of prompts.

    Attributes:
        prompts (List[Prompt]): List of prompt objects.
        total (int): Total number of prompts returned.
    """

    prompts: List[Prompt]
    total: int


class CollectionList(BaseModel):
    """API response model for a list of collections.

    Attributes:
        collections (List[Collection]): List of collection objects.
        total (int): Total number of collections returned.
    """

    collections: List[Collection]
    total: int


class HealthResponse(BaseModel):
    """Model for health check responses.

    Attributes:
        status (str): Health status string (e.g., 'healthy').
        version (str): API version.
    """

    status: str
    version: str
