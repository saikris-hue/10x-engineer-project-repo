# Prompt Versions

Version: 1.0
Author: Product/Engineering
Date: 2026-02-28

## Title + Summary

Prompt Versions — Add immutable version history for `Prompt` objects so users and systems can view, list, and restore prior prompt states. Each saved version captures the prompt fields and metadata (who and when). The system should store versions automatically on change (PUT/PATCH), allow manual snapshot creation, list versions, and restore a prior version as the current prompt.

## Overview

Currently PromptLab stores only the current state of a prompt. This feature introduces `PromptVersion` records that keep an immutable history of changes to prompts. Use cases:

- Audit and revert accidental edits.
- Allow users to compare versions and restore previous content.
- Provide immutable snapshots for workflows and approvals.

Scope:
- Backend data model additions and API endpoints.
- Simple UI flows (list, diff, restore) described for frontend implementation.
- Migration/backfill of existing prompts into an initial version per prompt.

Out of scope:
- Branching (forked edits) or collaborative live-edit conflict resolution.
- Fine-grained field-level diff UI (UI can render diffs using returned content).

## Goals / Non-Goals

Goals:
- Store a version record for every change that alters a prompt (PUT, PATCH) automatically.
- Provide endpoints to list versions, retrieve a version, create an explicit snapshot, and restore a version.
- Ensure versions are immutable once created.
- Support efficient backfill for existing prompts.

Non-Goals:
- Complex merge/conflict resolution workflows.
- Long-term archival/retention policies beyond basic delete/soft-delete guidance.

## Assumptions

- The backend will use a relational database (Postgres/MySQL) for production; the current in-memory `Storage` will be adapted or replaced by DB-backed storage in production.
- Current API authentication is `None` in the existing repo, but production systems will have auth; endpoints are designed to accept an auth layer later. Where needed, assume `Authorization: Bearer <token>` for protected actions in examples.
- `Prompt` model fields remain exactly as in `app.models.Prompt`.
- Each version will be referenced by `version_id` (UUID) and will contain `created_at` timestamp and `created_by` (optional string user id) when available.

If these assumptions must change, update the spec accordingly before implementation.

---

## User Stories & Acceptance Criteria

1) As a user, I want to see a list of historical versions for a prompt so I can review past states.

   Acceptance Criteria:
   - Given a prompt with multiple versions, When I call `GET /prompts/{prompt_id}/versions`, Then I receive a paginated list of versions sorted newest-first including `version_id`, `created_at`, `created_by`, and a short `summary` (e.g., truncated title or change note).
   - Response contains `total` and `versions` array.

2) As a user, I want to retrieve the full data of a specific version so I can inspect or diff it.

   Acceptance Criteria:
   - Given an existing `version_id`, When I call `GET /prompts/{prompt_id}/versions/{version_id}`, Then I get the full prompt snapshot (title, content, description, collection_id, created_at, created_by, and version_id).
   - If version does not exist, response is 404 with `{detail: "Version not found"}`.

3) As a user, I want versions to be created automatically when a prompt is updated, so I don't need to remember to snapshot manually.

   Acceptance Criteria:
   - On successful `PUT /prompts/{prompt_id}` or `PATCH /prompts/{prompt_id}`, a new `PromptVersion` is created with the pre-update state (i.e., a copy of the prompt before changes), and the returned updated prompt has an updated `updated_at` timestamp.
   - Server must create the version even if only one field changed.

4) As a user, I want to manually create a version snapshot (savepoint) without changing the current prompt so I can mark important states.

   Acceptance Criteria:
   - `POST /prompts/{prompt_id}/versions` with optional `note` creates a new version representing the current prompt state and returns 201 with the created version record.

5) As a user, I want to restore a previous version as the current prompt so I can revert accidental changes.

   Acceptance Criteria:
   - `POST /prompts/{prompt_id}/versions/{version_id}/restore` replaces the current prompt fields with the values from the version, creates a new version capturing the pre-restore state, and returns 200 with the updated prompt.
   - On restore, `updated_at` must be set to current time; a version for the previous state must exist after the operation.

6) As an admin or QA, I want to see metadata about versions (who created the version and when) to support auditing.

   Acceptance Criteria:
   - Version records include `created_at` and `created_by` (nullable) fields visible in version list and detail endpoints.

## Data Model Changes

Note: below uses SQL-style types. Adapt to ORM (SQLAlchemy/Django/Pydantic ORM) as needed.

New table: `prompt_versions`

| Column | Type | Null | Default | Notes |
|---|---|---:|---|---|
| id | UUID (PK) | NOT NULL | generated | `version_id`, primary key (UUIDv4) |
| prompt_id | UUID (FK) | NOT NULL |  | Foreign key to `prompts.id` (on delete cascade or restrict — see migration notes) |
| title | TEXT | NOT NULL |  | Snapshot of `Prompt.title` |
| content | TEXT | NOT NULL |  | Snapshot of `Prompt.content` |
| description | TEXT | NULL |  | Snapshot of `Prompt.description` |
| collection_id | UUID | NULL |  | Snapshot of `Prompt.collection_id` (nullable) |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL | now() | When version was created |
| created_by | TEXT | NULL | NULL | Optional user id or identifier of actor who created the version |
| note | TEXT | NULL | NULL | Optional human note attached when snapshot created |

Indexes:
- Primary key on `id`.
- Index on `(prompt_id, created_at DESC)` to support listing versions quickly.
- Optional index on `prompt_id` for FK joins.

Constraints / Invariants:
- Versions are immutable; application will never `UPDATE` a version row after create. Only insert/delete allowed.
- On prompt deletion, either cascade delete versions or soft-delete; default recommendation: cascade delete versions with prompt deletion to avoid orphaned versions.

Migration Plan (stepwise):
1. Create `prompt_versions` table (empty) with columns and indexes above.
2. Backfill initial versions: for each existing `prompts` row, insert one `prompt_versions` record capturing its current state with `created_at = prompt.updated_at` (or `created_at` if preferred) and `created_by = NULL` and `note = 'backfill initial version'`.
3. Deploy application code to create versions on update operations.
4. After verification, optionally remove migration-only scripts or mark backfill complete in release notes.

Backward compatibility:
- If the system has a live API that returns `Prompt` objects only, those endpoints still work unchanged. The versions table is additive and does not change existing payloads.
- Ensure DB migrations are run before deploying code that writes to `prompt_versions` to avoid runtime errors.

Storage considerations:
- Prompt content may be large; consider `TEXT`/`LONGTEXT` or compressed storage if necessary.
- Retention/TTL policies can be applied later; include a `deleted_at` or retention metadata if needed in future.

## API Endpoint Specifications

Authentication: follow existing API pattern (currently none). For production, require `Authorization: Bearer <token>`. Auth/permissions notes included in Permissions section.

Base path: same API root as existing endpoints (e.g., `/prompts`).

### 1) List versions

- Method: GET
- Path: `/prompts/{prompt_id}/versions`
- Auth: None (or same as prompt read permission).
- Query params:
  - `limit` (int, optional) default 50, max 200
  - `offset` (int, optional) default 0
  - `sort` (string, optional) `created_at` or `created_at:asc`/`:desc` (default `created_at:desc`)

Request example:

```bash
GET /prompts/1111-2222-3333-4444/versions?limit=20&offset=0
```

Response (200):

```json
{
  "versions": [
    {
      "version_id": "a1b2c3d4-...",
      "created_at": "2026-02-27T12:00:00Z",
      "created_by": "user:alice",
      "note": "Saved before big rewrite",
      "summary": "Updated title and content"
    }
  ],
  "total": 3,
  "limit": 20,
  "offset": 0
}
```

Errors:
- 404 `{detail: "Prompt not found"}` if prompt_id not found.

### 2) Get version detail

- Method: GET
- Path: `/prompts/{prompt_id}/versions/{version_id}`
- Auth: None (or same as prompt read permission).

Response (200):

```json
{
  "version_id": "a1b2c3d4-...",
  "prompt_id": "1111-2222-3333-4444",
  "title": "Old Title",
  "content": "Old content...",
  "description": "Old description",
  "collection_id": null,
  "created_at": "2026-02-27T12:00:00Z",
  "created_by": "user:alice",
  "note": "pre-release snapshot"
}
```

Errors:
- 404 `{detail: "Version not found"}` if the version_id or prompt_id doesn't map.

### 3) Create manual snapshot (explicit savepoint)

- Method: POST
- Path: `/prompts/{prompt_id}/versions`
- Auth: same as prompt update permission (if enforced).
- Body (JSON):
  - `note` (string, optional)
  - `created_by` (string, optional) — server may override with authenticated user

Request example:

```json
{ "note": "Stable version before release" }
```

Response (201):

```json
{
  "version_id": "d4c3b2a1-...",
  "prompt_id": "1111-2222-3333-4444",
  "created_at": "2026-02-28T08:00:00Z",
  "created_by": "user:bob",
  "note": "Stable version before release"
}
```

Errors:
- 404 `{detail: "Prompt not found"}`

### 4) Restore a version

- Method: POST
- Path: `/prompts/{prompt_id}/versions/{version_id}/restore`
- Auth: requires write permission on the prompt.

Behavior:
- Atomically perform:
  1. Insert a new `prompt_versions` record capturing the current (pre-restore) prompt state with `note = 'auto-version-before-restore'`.
  2. Update the `prompts` table with the snapshot values from the requested version and set `updated_at = now()`.
  3. Insert a `prompt_versions` record for the restore action (optional; not required because step 1 captured pre-restore state). Recommended: create a version record for the restored state too, with `note = 'restored from version <version_id>'`.

Request body: none required, optional JSON: `{ "note": "Reason for restore" }`.

Response (200): returns the updated `Prompt` object (same schema as existing `GET /prompts/{id}`).

Example response:

```json
{
  "id": "1111-2222-3333-4444",
  "title": "Restored Title",
  "content": "Restored content...",
  "description": "Restored description",
  "collection_id": null,
  "created_at": "2026-01-01T09:00:00Z",
  "updated_at": "2026-02-28T09:15:00Z"
}
```

Errors:
- 404 `{detail: "Version not found"}`
- 404 `{detail: "Prompt not found"}`

### 5) (Optional) Delete version

- Method: DELETE
- Path: `/prompts/{prompt_id}/versions/{version_id}`
- Auth: admin-only

Behavior:
- Deletes a version row. Not recommended for normal users. Implement only if UI supports version deletion or if retention policy requires.

Responses:
- 204 on success
- 404 if version not found

## Edge Cases & Error Handling

1. Concurrency / Race Conditions
   - Problem: Two simultaneous updates or one update and one restore could interleave.
   - Mitigation:
     - Use DB transactions with `SELECT ... FOR UPDATE` on the `prompts` row when performing update/restore to serialize operations per prompt.
     - Ensure version insert and prompt update happen in a single transaction.

2. Large prompt content
   - Problem: Very large `content` may increase storage and slow responses.
   - Mitigation:
     - Store `content` as `TEXT`/`LONGTEXT`; consider compressing snapshots at insert if usage shows benefit.
     - Paginate version list and avoid returning full `content` in `GET /prompts/{id}/versions` (only return `summary`). The detail endpoint returns full content.

3. Prompt deletion
   - Behavior: Deleting a prompt should also delete associated versions (cascade) or mark them as orphaned depending on retention policy.
   - Recommendation: Cascade delete versions by default.

4. Missing prompt or version
   - Return 404 with consistent error payload: `{ "detail": "Prompt not found" }` or `{ "detail": "Version not found" }`.

5. Duplicate restores
   - If a restore sets the prompt to the same values as current state, server should still create a pre-restore version but may short-circuit and return 200 without creating extra restore-version entry. Documented behavior: still create pre-restore version for audit.

6. Partial failures
   - Use DB transactions to ensure either the pre-version + update succeed together or are rolled back. If version insert succeeds but update fails (shouldn't happen in a transaction), detect and roll back.

7. Permissions
   - Reads: follow same rules as `GET /prompts`.
   - Write/restore/delete versions: require the same permission as updating/deleting the underlying prompt. Admin-only endpoints (e.g., delete version) must check admin role.

8. Backfill and migration window
   - If backfill occurs on a live database, do it in an offline or controlled migration window or with a throttled job to avoid spikes.

9. Storage growth
   - Monitor total size of `prompt_versions`. Provide metrics and alerts, and plan retention/policy features for later.

## UX / UI Notes

- Versions List Screen
  - Shows list sorted by newest-first, each row contains `version_id`, `created_at`, `created_by`, `note`, and a truncated summary of changes.
  - Support click-through to version detail with full content and a side-by-side diff view (frontend responsibility to compute diff).
  - Provide `Restore` button on detail view with confirmation modal and optional restore note input.

- Restore Flow
  - Confirm modal: "Restore version from {created_at} by {created_by}? This will replace current prompt and create a version for the current state."
  - On success: show toast "Prompt restored" and refresh prompt view.

- Manual Savepoint
  - Provide a "Save version" action in edit view optionally with a short note.

## Permissions & Security

- If auth exists, enforce:
  - `GET /prompts/{id}/versions*`: requires `read` on prompt.
  - `POST /prompts/{id}/versions` and `POST /prompts/{id}/versions/{version_id}/restore`: requires `write` on prompt.
  - `DELETE /prompts/{id}/versions/{version_id}`: admin-only role.
- Audit logging: record user, action, and timestamps for snapshot creation and restore events.

## Observability

- Metrics to emit:
  - `prompt_versions.created` (count) with labels `prompt_id`, `created_by`.
  - `prompt_versions.restored` (count) with labels `prompt_id`, `version_id`, `initiated_by`.
  - `prompt_versions.storage_bytes` gauge or periodic estimate.
- Log events for: snapshot creation, restore start/end, migration/backfill progress, errors.

## Performance & Scalability

- Ensure index on `(prompt_id, created_at DESC)` for listing performance.
- Paginate lists with `limit`/`offset` or cursor-based pagination if necessary.
- Consider storing only diffs for extremely large prompts (advanced optimization; out of scope for MVP).

## Rollout / Migration Plan

1. Create migration to add `prompt_versions` table and indexes.
2. Backfill initial versions for existing prompts (bulk job); include progress logging and batching (e.g., 1000 prompts/batch).
3. Deploy code that creates versions on update but behind a feature flag `prompt_versions_enabled` toggled on after migration.
4. Monitor errors and storage growth for 24–72 hours.
5. Turn off feature flag when stable and remove toggle if desired.

Backfill strategy:
- For small datasets (<100k prompts): single-run backfill script during maintenance window.
- For large datasets: incremental job that backfills in batches and writes progress to a checkpoint table.

## Testing Plan

Unit tests:
- Model serialization/insertion for `PromptVersion`.
- API tests for each endpoint:
  - List versions returns correct pagination and sorting.
  - Get version returns full snapshot or 404.
  - Manual snapshot creates a version and persists fields.
  - Restore creates a pre-restore version and updates prompt fields.
  - Concurrent restore/update serialized by DB locking.

Integration tests:
- Full flow: create prompt -> update -> verify a version was created -> restore -> verify prompt matches version and version records exist for pre-restore state.
- Migration/backfill: run backfill on test DB and assert every prompt has at least one version after backfill.

E2E tests (optional):
- UI flow for listing versions and restoring.

Key test cases (examples):
- Given prompt exists, When updating title, Then a version is created capturing previous title.
- Given prompt exists, When restoring a version, Then the prompt's `updated_at` changes and pre-restore version exists.
- Given concurrent updates, ensure no data loss and versions are created for each pre-update state.

## Implementation Notes (developer guidance)

- Hook into existing update code paths:
  - `PUT /prompts/{id}` and `PATCH /prompts/{id}` should call version creation helper before applying changes. Helper should accept `created_by` and optional `note`.
- Helper signature (concept):

```py
def create_prompt_version(prompt: Prompt, created_by: Optional[str]=None, note: Optional[str]=None) -> PromptVersion:
    """Insert version row copying prompt fields and return version id."""
```

- For in-memory `Storage` used in tests: create an in-memory `prompt_versions` store to maintain parity with DB-backed behavior. Update tests to include versioning tests and adjust fixtures as necessary.

- Transactions: ensure transactional behavior when creating versions and updating prompts.

## Open Questions / TODOs

- Should `created_by` be enforced from authentication context, or accept client-supplied `created_by`? (Recommended: derive server-side from auth context when available.)
- Retention policy for old versions (TTL or manual purge) — not implemented in MVP.
- Approve whether `DELETE prompt` cascades versions or marks them as orphaned — spec recommends cascade by default.

---

## Checklist (validation)

- [x] Overview included
- [x] User stories + measurable acceptance criteria included
- [x] Data model changes (fields, types, indexes, migration notes) included
- [x] API endpoints specified with auth, schemas, status codes, and examples
- [x] Edge cases cover permissions, invalid input, duplicates, concurrency
- [x] Assumptions are listed at top



