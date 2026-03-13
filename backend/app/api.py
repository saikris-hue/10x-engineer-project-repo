"""FastAPI routes for PromptLab."""

import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.models import (
    Collection,
    CollectionCreate,
    CollectionList,
    HealthResponse,
    Prompt,
    PromptCreate,
    PromptList,
    PromptPatch,
    PromptUpdate,
    PromptVersion,
    PromptVersionList,
    get_current_time,
)
from app.storage import storage
from app.utils import sort_prompts_by_date, filter_prompts_by_collection, search_prompts
from app import __version__


app = FastAPI(
    title="PromptLab API",
    description="AI Prompt Engineering Platform",
    version=__version__
)


def _get_cors_origins() -> list[str]:
    """Return the configured CORS origins for browser clients."""
    raw_origins = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    )
    return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]


def _get_prompt_or_404(prompt_id: str) -> Prompt:
    """Return a prompt or raise a 404 error."""
    prompt = storage.get_prompt(prompt_id)
    if prompt is None:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return prompt


def _get_version_or_404(prompt_id: str, version_id: str) -> PromptVersion:
    """Return a prompt version or raise a 404 error."""
    version = storage.get_version(prompt_id, version_id)
    if version is None:
        raise HTTPException(status_code=404, detail="Version not found")
    return version


def _validate_collection_id(collection_id: str | None) -> None:
    """Ensure a referenced collection exists when an ID is provided."""
    if collection_id is not None and storage.get_collection(collection_id) is None:
        raise HTTPException(status_code=400, detail="Collection not found")


def _create_prompt_version(prompt: Prompt, note: str) -> PromptVersion:
    """Create a version snapshot from the current prompt state."""
    return storage.create_version(
        prompt_id=prompt.id,
        title=prompt.title,
        content=prompt.content,
        description=prompt.description,
        collection_id=prompt.collection_id,
        created_by=None,
        note=note,
    )


def _build_prompt_from_update(existing: Prompt, prompt_data: PromptUpdate) -> Prompt:
    """Build a replacement prompt for PUT operations."""
    return Prompt(
        id=existing.id,
        title=prompt_data.title,
        content=prompt_data.content,
        description=prompt_data.description,
        collection_id=prompt_data.collection_id,
        created_at=existing.created_at,
        updated_at=get_current_time(),
    )


def _build_prompt_from_patch(existing: Prompt, prompt_data: PromptPatch) -> Prompt:
    """Build a replacement prompt for PATCH operations."""
    return Prompt(
        id=existing.id,
        title=prompt_data.title if prompt_data.title is not None else existing.title,
        content=prompt_data.content if prompt_data.content is not None else existing.content,
        description=(
            prompt_data.description
            if prompt_data.description is not None
            else existing.description
        ),
        collection_id=(
            prompt_data.collection_id
            if prompt_data.collection_id is not None
            else existing.collection_id
        ),
        created_at=existing.created_at,
        updated_at=get_current_time(),
    )

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=_get_cors_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type"],
)


# ============== Health Check ==============

@app.get("/health", response_model=HealthResponse)
def health_check():
    """Return service health status.

    This endpoint is used by monitoring to verify that the API is alive.

    Returns:
        HealthResponse: Contains ``status`` (e.g. 'healthy') and the
            running API ``version``.
    """
    return HealthResponse(status="healthy", version=__version__)


# ============== Prompt Endpoints ==============

@app.get("/prompts", response_model=PromptList)
def list_prompts(
    collection_id: str | None = None, search: str | None = None
):
    """List prompts with optional filtering and search.

    Args:
        collection_id (Optional[str]): Filter prompts by this collection ID.
        search (Optional[str]): Case-insensitive substring to search
            within titles and descriptions.

    Returns:
        PromptList: Matching prompts and the total count.
    """
    prompts = storage.get_all_prompts()

    # Filter by collection if specified
    if collection_id:
        prompts = filter_prompts_by_collection(prompts, collection_id)

    # Search if query provided
    if search:
        prompts = search_prompts(prompts, search)

    prompts = sort_prompts_by_date(prompts, descending=True)
    return PromptList(prompts=prompts, total=len(prompts))


@app.get("/prompts/{prompt_id}", response_model=Prompt)
def get_prompt(prompt_id: str):
    """Retrieve a single prompt by its ID.

    Args:
        prompt_id (str): Unique identifier of the prompt.

    Raises:
        HTTPException: 404 if the prompt does not exist.

    Returns:
        Prompt: The requested prompt object.
    """
    return _get_prompt_or_404(prompt_id)


@app.post("/prompts", response_model=Prompt, status_code=201)
def create_prompt(prompt_data: PromptCreate):
    """Create a new prompt.

    Args:
        prompt_data (PromptCreate): Data for the prompt to create.

    Raises:
        HTTPException: 400 if the specified collection_id does not exist.

    Returns:
        Prompt: Newly created prompt with assigned ID and timestamps.
    """
    _validate_collection_id(prompt_data.collection_id)

    prompt = storage.create_prompt(
        title=prompt_data.title,
        content=prompt_data.content,
        description=prompt_data.description,
        collection_id=prompt_data.collection_id,
    )
    return prompt


@app.put("/prompts/{prompt_id}", response_model=Prompt)
def update_prompt(prompt_id: str, prompt_data: PromptUpdate):
    """Overwrite an existing prompt.

    Creates a version capturing the pre-update state before applying changes.

    Args:
        prompt_id (str): ID of the prompt to update.
        prompt_data (PromptUpdate): New data for the prompt.

    Raises:
        HTTPException: 404 if prompt is not found.
        HTTPException: 400 if provided collection_id is invalid.

    Returns:
        Prompt: Updated prompt object.
    """
    existing_prompt = _get_prompt_or_404(prompt_id)
    _validate_collection_id(prompt_data.collection_id)
    _create_prompt_version(existing_prompt, note="auto-version-before-update")
    updated_prompt = _build_prompt_from_update(existing_prompt, prompt_data)
    return storage.update_prompt(prompt_id, updated_prompt)


@app.patch("/prompts/{prompt_id}", response_model=Prompt)
def patch_prompt(prompt_id: str, prompt_data: PromptPatch):
    """Partially update an existing prompt.

    Only fields present in ``prompt_data`` will be modified.
    Creates a version capturing the pre-patch state before applying changes.

    Args:
        prompt_id (str): ID of the prompt to patch.
        prompt_data (PromptPatch): Data with optional fields to update.

    Raises:
        HTTPException: 404 if prompt not found.
        HTTPException: 400 if provided collection_id is invalid.

    Returns:
        Prompt: The prompt after applying updates.
    """
    existing_prompt = _get_prompt_or_404(prompt_id)
    _validate_collection_id(prompt_data.collection_id)
    _create_prompt_version(existing_prompt, note="auto-version-before-patch")
    updated_prompt = _build_prompt_from_patch(existing_prompt, prompt_data)
    return storage.update_prompt(prompt_id, updated_prompt)


@app.delete("/prompts/{prompt_id}", status_code=204)
def delete_prompt(prompt_id: str):
    """Remove a prompt by ID.

    Args:
        prompt_id (str): ID of the prompt to delete.

    Raises:
        HTTPException: 404 if prompt not found.

    Returns:
        None: 204 status code indicates successful deletion.
    """
    if not storage.delete_prompt(prompt_id):
        raise HTTPException(status_code=404, detail="Prompt not found")
    return None


# ============== Collection Endpoints ==============

@app.get("/collections", response_model=CollectionList)
def list_collections():
    """List all collections.

    Returns:
        CollectionList: Available collections and their count.
    """
    collections = storage.get_all_collections()
    return CollectionList(collections=collections, total=len(collections))


@app.get("/collections/{collection_id}", response_model=Collection)
def get_collection(collection_id: str):
    """Retrieve a collection by its ID.

    Args:
        collection_id (str): Identifier of the collection.

    Raises:
        HTTPException: 404 if the collection is not found.

    Returns:
        Collection: The requested collection object.
    """
    collection = storage.get_collection(collection_id)
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    return collection


@app.post("/collections", response_model=Collection, status_code=201)
def create_collection(collection_data: CollectionCreate):
    """Create a new collection.

    Args:
        collection_data (CollectionCreate): Data for the new collection.

    Returns:
        Collection: Newly created collection with ID and timestamp.
    """
    collection = Collection(**collection_data.model_dump())
    return storage.create_collection(collection)


@app.delete("/collections/{collection_id}", status_code=204)
def delete_collection(collection_id: str):
    """Delete a collection and all its prompts.

    Args:
        collection_id (str): ID of the collection to remove.

    Raises:
        HTTPException: 404 if the collection does not exist.

    Returns:
        None: 204 indicates success.
    """
    if not storage.delete_collection(collection_id):
        raise HTTPException(status_code=404, detail="Collection not found")

    prompts = storage.get_prompts_by_collection(collection_id)
    for prompt in prompts:
        storage.delete_prompt(prompt.id)

    return None


# ============== Prompt Versions Endpoints ==============

@app.get("/prompts/{prompt_id}/versions", response_model=PromptVersionList)
def list_versions(prompt_id: str, limit: int = 50, offset: int = 0):
    """List all versions of a prompt, newest-first.

    Args:
        prompt_id (str): ID of the prompt.
        limit (int): Max number of versions to return (default 50, max 200).
        offset (int): Number of versions to skip (default 0).

    Raises:
        HTTPException: 404 if the prompt does not exist.

    Returns:
        PromptVersionList: List of versions with pagination metadata.
    """
    _get_prompt_or_404(prompt_id)

    limit = min(limit, 200)

    versions = storage.get_versions_for_prompt(prompt_id, limit=limit, offset=offset)
    total = storage.get_versions_count_for_prompt(prompt_id)

    return PromptVersionList(
        versions=versions,
        total=total,
        limit=limit,
        offset=offset
    )


@app.get("/prompts/{prompt_id}/versions/{version_id}", response_model=PromptVersion)
def get_version(prompt_id: str, version_id: str):
    """Retrieve a specific version snapshot.

    Args:
        prompt_id (str): ID of the prompt.
        version_id (str): ID of the version.

    Raises:
        HTTPException: 404 if version or prompt not found.

    Returns:
        PromptVersion: The full version snapshot.
    """
    _get_prompt_or_404(prompt_id)
    return _get_version_or_404(prompt_id, version_id)


@app.post("/prompts/{prompt_id}/versions", response_model=PromptVersion, status_code=201)
def create_version(prompt_id: str, request_body: dict | None = None):
    """Create a manual version snapshot of the current prompt state.

    Args:
        prompt_id (str): ID of the prompt.
        request_body (dict): Optional JSON with fields:
            - note (str, optional): Human-readable note for this snapshot.
            - created_by (str, optional): User identifier.

    Raises:
        HTTPException: 404 if prompt not found.

    Returns:
        PromptVersion: The created version snapshot (201).
    """
    prompt = _get_prompt_or_404(prompt_id)
    body = request_body or {}
    note = body.get("note")
    created_by = body.get("created_by")

    return storage.create_version(
        prompt_id=prompt_id,
        title=prompt.title,
        content=prompt.content,
        description=prompt.description,
        collection_id=prompt.collection_id,
        created_by=created_by,
        note=note,
    )


@app.post("/prompts/{prompt_id}/versions/{version_id}/restore", response_model=Prompt)
def restore_version(
    prompt_id: str, version_id: str, request_body: dict | None = None
):
    """Restore a prompt to a previous version.

    Creates a version capturing the pre-restore state, then updates
    the prompt with the version's values and sets updated_at to now.

    Args:
        prompt_id (str): ID of the prompt to restore.
        version_id (str): ID of the version to restore from.
        request_body (dict): Optional JSON with fields:
            - note (str, optional): Note for the restore operation.
            - created_by (str, optional): User identifier.

    Raises:
        HTTPException: 404 if version or prompt not found.

    Returns:
        Prompt: The updated prompt with restored values (200).
    """
    _get_prompt_or_404(prompt_id)
    _get_version_or_404(prompt_id, version_id)
    body = request_body or {}
    created_by = body.get("created_by")

    restored = storage.restore_from_version(prompt_id, version_id, created_by=created_by)
    if restored is None:
        raise HTTPException(status_code=500, detail="Failed to restore version")
    return restored
