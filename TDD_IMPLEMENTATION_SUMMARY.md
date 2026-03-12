# TDD Implementation: Prompt Versions Feature

**Status**: ✅ Complete
**Total Tests**: 112 passing
**New Tests Added**: 32 tests (models, storage, API endpoints, auto-versioning)

---

## Overview

This document describes the Test-Driven Development implementation of the **Prompt Versions** feature for PromptLab. The feature adds immutable version history to prompts, enabling users to view, restore, and manage historical states of their prompts.

---

## Implementation Summary

### **Iteration 1: PromptVersion Model & Storage (11 tests)**

#### Test-First Development
Created comprehensive tests for the PromptVersion model and Storage operations:

**Tests Added** (`tests/test_prompt_versions.py`):
- `TestPromptVersionModel` (4 tests)
  - Model creation with minimal and full fields
  - Immutability enforcement
  - Factory method `from_prompt()`
  
- `TestStorageVersions` (7 tests)
  - Version CRUD operations
  - Pagination and sorting (newest-first)
  - Cascade delete on prompt deletion
  - Restore operation

#### Implementation

**Models** (`app/models.py`):
```python
class PromptVersion(BaseModel):
    """Immutable snapshot with frozen=True config"""
    id: str = Field(default_factory=generate_id)
    prompt_id: str
    title: str
    content: str
    description: Optional[str]
    collection_id: Optional[str]
    created_at: datetime
    created_by: Optional[str]
    note: Optional[str]
    
    @classmethod
    def from_prompt(cls, prompt: Prompt, ...) -> PromptVersion:
        """Factory method to snapshot a prompt"""
```

**Storage** (`app/storage.py`):
- `_versions: Dict[str, Dict[str, PromptVersion]]` — nested storage by prompt_id
- `create_version()` — insert immutable version record
- `get_version()` — retrieve by version_id
- `get_versions_for_prompt()` — list with pagination (newest-first)
- `restore_from_version()` — restore prompt + create pre-restore version
- Cascade delete versions when prompt is deleted

**Signature Change**:
- Updated `Storage.create_prompt()` to accept keyword arguments instead of Prompt objects
- Updated all call sites in tests and API endpoints

---

### **Iteration 2: API Endpoints (14 tests)**

#### Test-First Development
Created comprehensive endpoint tests covering happy paths, error cases, and edge cases.

**Tests Added** (`tests/test_api_versions.py`):
- `TestListVersionsEndpoint` (4 tests) — pagination, sorting, 404 handling
- `TestGetVersionDetailEndpoint` (3 tests) — full snapshot retrieval, 404 cases
- `TestCreateVersionEndpoint` (3 tests) — manual snapshots, optional fields
- `TestRestoreVersionEndpoint` (4 tests) — restore with pre-restore versioning

#### Implementation

**Endpoints** (`app/api.py`):

1. **GET /prompts/{prompt_id}/versions** — List versions
   - Query params: `limit` (max 200), `offset`
   - Returns: `PromptVersionList` with pagination metadata
   - 404 if prompt not found

2. **GET /prompts/{prompt_id}/versions/{version_id}** — Get version detail
   - Returns: Full `PromptVersion` snapshot
   - 404 if version or prompt not found

3. **POST /prompts/{prompt_id}/versions** — Manual snapshot
   - Body: `{ "note": "optional note" }`
   - Returns: 201 with created `PromptVersion`
   - 404 if prompt not found

4. **POST /prompts/{prompt_id}/versions/{version_id}/restore** — Restore version
   - Body: `{ "note": "reason (optional)" }`
   - Creates pre-restore version automatically
   - Returns: 200 with updated `Prompt`
   - 404 if version/prompt not found

---

### **Iteration 3: Auto-Versioning on Updates (5 tests)**

#### Test-First Development
Verified that PUT and PATCH operations automatically create versions before modifying prompts.

**Tests Added** (`tests/test_api_auto_versioning.py`):
- `TestAutoVersioning` (5 tests)
  - PUT creates version of pre-update state
  - PATCH creates version of pre-patch state
  - Multiple updates create multiple versions
  - `updated_at` timestamp changes correctly

#### Implementation

**Hooks** in `PUT /prompts/{id}` and `PATCH /prompts/{id}`:
```python
# Before applying changes, create version of current state
storage.create_version(
    prompt_id=prompt_id,
    title=existing.title,
    content=existing.content,
    description=existing.description,
    collection_id=existing.collection_id,
    created_by=None,
    note="auto-version-before-update"  # or "auto-version-before-patch"
)
```

---

## Test Suite Organization

| Module | Tests | Coverage |
|--------|-------|----------|
| `test_prompt_versions.py` | 11 | Models + Storage CRUD |
| `test_api_versions.py` | 14 | API endpoints |
| `test_api_auto_versioning.py` | 5 | Auto-versioning on update |
| `test_api.py` | 22 | Existing prompt endpoints |
| `test_storage.py` | 9 | Existing storage ops |
| `test_models.py` | 43 | Model validation |
| `test_utils.py` | 8 | Utility functions |
| **Total** | **112** | **All passing** ✅ |

---

## Key Design Decisions

1. **Immutable Versions**: `PromptVersion` uses `frozen=True` to prevent accidental mutations
2. **Nested Storage**: Versions stored per-prompt in `_versions[prompt_id]` dict for efficient lookups
3. **Cascade Delete**: Deleting a prompt deletes all associated versions
4. **Auto-Versioning**: Versions created automatically on PUT/PATCH; users can also create manual snapshots
5. **Pre-Restore Versioning**: When restoring, the pre-restore state is captured as a version for audit trail
6. **Pagination**: List endpoints support `limit` and `offset` with `limit` capped at 200
7. **Newest-First**: Versions sorted by `created_at DESC` in list responses

---

## Data Model

```python
class PromptVersion(BaseModel):
    id: str                           # UUID4, primary key
    prompt_id: str                    # Foreign key to Prompt
    title: str                        # Snapshot of prompt.title
    content: str                      # Snapshot of prompt.content
    description: Optional[str]        # Snapshot of prompt.description
    collection_id: Optional[str]      # Snapshot of prompt.collection_id
    created_at: datetime              # When version was created
    created_by: Optional[str]         # User ID (for audit)
    note: Optional[str]               # Human note on version
    
    Config:
        frozen = True                 # Immutable after creation
```

---

## Acceptance Criteria Met

From `specs/prompt-versions.md`:

✅ **Story 1**: List historical versions (GET /versions) with pagination  
✅ **Story 2**: Retrieve full version snapshot (GET /versions/{id})  
✅ **Story 3**: Auto-create versions on PUT/PATCH  
✅ **Story 4**: Manual savepoint creation (POST /versions)  
✅ **Story 5**: Restore with pre-restore versioning (POST /versions/{id}/restore)  
✅ **Story 6**: Audit metadata (created_at, created_by)  

---

## API Examples

### List Versions
```bash
GET /prompts/prompt-123/versions?limit=20&offset=0

{
  "versions": [
    {
      "id": "v-456",
      "prompt_id": "prompt-123",
      "title": "Updated Title",
      "content": "...",
      "created_at": "2026-02-28T12:00:00Z",
      "created_by": "user:alice",
      "note": "auto-version-before-update"
    }
  ],
  "total": 3,
  "limit": 20,
  "offset": 0
}
```

### Manual Snapshot
```bash
POST /prompts/prompt-123/versions
Content-Type: application/json

{ "note": "Stable version before release" }

201 Created
{
  "id": "v-789",
  "prompt_id": "prompt-123",
  "title": "Current Title",
  "content": "...",
  "created_at": "2026-02-28T13:00:00Z",
  "note": "Stable version before release"
}
```

### Restore Version
```bash
POST /prompts/prompt-123/versions/v-456/restore
Content-Type: application/json

{}

200 OK
{
  "id": "prompt-123",
  "title": "Updated Title",
  "content": "...",
  "updated_at": "2026-02-28T14:00:00Z"
}
```

---

## Running Tests

### All tests
```bash
cd backend
pytest tests/ -v
```

### Specific test suite
```bash
pytest tests/test_prompt_versions.py -v     # Models + Storage
pytest tests/test_api_versions.py -v        # Endpoints
pytest tests/test_api_auto_versioning.py -v # Auto-versioning
```

### With coverage
```bash
pytest tests/ --cov=app --cov-report=term-missing
```

---

## Implementation Notes

### Storage Refactoring
The `Storage.create_prompt()` method signature was updated from:
```python
def create_prompt(self, prompt: Prompt) -> Prompt
```
To:
```python
def create_prompt(self, title: str, content: str, description=None, collection_id=None) -> Prompt
```

This change:
- Makes intent clearer (creating new prompts with fields, not storing pre-constructed objects)
- Aligns with how API endpoints construct prompts
- All existing tests updated to use new signature

### Immutability via Frozen Models
`PromptVersion` uses Pydantic's `frozen=True` config to prevent accidental mutations:
```python
v = storage.create_version(...)
v.title = "new value"  # ❌ Raises ValidationError
```

This ensures version integrity across the application.

### Cascade Delete Behavior
When a prompt is deleted, all associated versions are automatically deleted:
```python
storage.delete_prompt(prompt_id)
# All versions for this prompt are also deleted
assert storage.get_versions_for_prompt(prompt_id) == []
```

---

## Future Enhancements (Out of Scope)

Based on the spec, these items are candidates for future work:

1. **Soft Delete**: Mark versions as deleted instead of hard delete for compliance/audit
2. **Retention Policies**: TTL-based or manual purge of old versions
3. **Diff API**: Endpoint to compute diffs between two versions
4. **Compression**: Store only diffs instead of full snapshots for large content
5. **Branching**: Allow creating forks from historical versions
6. **Database Migrations**: Migrate from in-memory to production DB (Postgres/MySQL)
7. **Audit Logging**: Emit events for versions created/restored/deleted

---

## Conclusion

The **Prompt Versions** feature is fully implemented and tested using TDD methodology. All 112 tests pass, covering:

- ✅ Model validation and immutability
- ✅ Storage CRUD operations and cascade delete
- ✅ All 4 API endpoints with error handling
- ✅ Auto-versioning on prompt updates
- ✅ Restore with audit trail

The implementation is production-ready for the in-memory storage backend and provides a clear path to database persistence via standard ORM patterns.
