# Tagging System

Version: 1.0
Author: Product/Engineering
Date: 2026-02-28

## Title + Summary

Tagging System — Allow users to assign arbitrary text labels (tags) to prompts and collections. Provide CRUD operations for tags, attach/detach tags from prompts and collections, and support searching and filtering by tags.

## Overview

Currently, prompts and collections have free‑text fields but no structured labels. Tags will help users categorize and discover prompts (e.g., "bugfix", "performance", "backend"). Tags are simple keywords managed globally for the organization; they are not hierarchical.

Target users:
- Prompt authors managing large prompt libraries.
- Teams needing classification for search, filtering, and analytics.

Scope:
- Backend model for tags and many-to-many relationships with prompts and collections.
- API endpoints to create, read, update, delete tags, and to manage tag associations with prompts/collections.
- Search & filter support on existing list endpoints (`/prompts`, `/collections`) using tag criteria.
- Basic UI considerations for adding/removing tags, tag suggestions, and filtering.

Out of scope:
- Tag permissions (all users see same tag namespace).
- Nested/tag hierarchies, tag groups, or automated tag suggestions via NLP.

## Goals / Non-Goals

Goals:
- Enable users to create and manage tags.
- Associate tags with prompts and collections.
- Use tags in search and filters across the UI and API.
- Keep tag operations performant and scalable.

Non-Goals:
- Tag suggestion AI or automatic tagging.
- Personal/user-specific tags (tags are global).

## User Stories & Acceptance Criteria

1. As a user, I want to create a new tag so I can classify prompts.
   - Given the tag "urgent" does not exist,
     When I call `POST /tags` with `{ "name": "urgent" }`,
     Then the server returns 201 with the created tag object containing `id` and `name`.
   - If I try to create a tag with a name that already exists (case-insensitive),
     I receive 400 with `{ "detail": "Tag already exists" }`.

2. As a user, I want to see the list of available tags to know what labels I can apply.
   - Given multiple tags exist,
     When I call `GET /tags`,
     Then I receive 200 with array of tag objects (id, name) sorted alphabetically.

3. As a user, I want to rename a tag in case of typos.
   - Given a tag with name "perfromance" exists,
     When I call `PUT /tags/{tag_id}` with `{ "name": "performance" }`,
     Then the tag's name is updated and the response returns the updated tag.
   - Renaming to an existing name returns 400.

4. As a user, I want to delete a tag when it is no longer needed.
   - Given a tag exists and may be associated with prompts/collections,
     When I call `DELETE /tags/{tag_id}`,
     Then the tag is removed and all associations are deleted (cascade), returning 204.
   - If the tag_id does not exist, return 404.

5. As a user, I want to add tags to a prompt so I can organize it.
   - Given a prompt and a list of tag IDs,
     When I call `POST /prompts/{prompt_id}/tags` with `{ "tags": ["id1","id2"] }`,
     Then those tags become associated with the prompt. Response 200 with the updated prompt including `tags` field.
   - Adding an already-attached tag is idempotent (no error).
   - Attaching a non-existent tag returns 400.

6. As a user, I want to remove tags from a prompt.
   - Given a prompt has tags,
     When I call `DELETE /prompts/{prompt_id}/tags/{tag_id}`,
     Then the association is removed and response is 204.
   - Removing a tag that wasn't attached returns 404.

7. As a user, I want to add/remove tags from collections using similar endpoints as prompts.
   - Endpoints mirror prompt tag endpoints: `/collections/{collection_id}/tags` and `/collections/{collection_id}/tags/{tag_id}`.

8. As a user, I want to filter prompts by one or more tags.
   - Given prompts have tags,
     When I call `GET /prompts?tags=tagA,tagB`,
     Then the list is limited to prompts having **all** specified tags (AND semantics).
   - If a tag name does not exist, the filter behaves as if no matching prompts (empty list).
   - Filtering does not affect other query parameters (collection, search).

9. As a user, I want to search tags by prefix.
   - Provided a query `q=per`,
     `GET /tags?q=per` returns tags whose names start with the query (case-insensitive).

## Data Model Changes

### New Entities

1. `tags` table

| Column      | Type        | Null | Default      | Notes            |
|-------------|-------------|:----:|--------------|------------------|
| id          | UUID (PK)   | NOT NULL | generated | Primary key |
| name        | TEXT        | NOT NULL |  | Unique, case-insensitive stored lowercase |
| created_at  | TIMESTAMP WITH TIME ZONE | NOT NULL | now() | Creation time |
| updated_at  | TIMESTAMP WITH TIME ZONE | NOT NULL | now() | Last update |

Indexes:
- Unique index on lower(name) to enforce case-insensitive uniqueness.
- Optional index on name for prefix search (e.g., `name LIKE 'per%'`).

2. Join tables for associations
   - `prompt_tags`:

     | Column    | Type    | Null | Default | Notes |
     |-----------|---------|:----:|---------|-------|
     | prompt_id | UUID FK | NOT NULL |  | FK->prompts.id ON DELETE CASCADE |
     | tag_id    | UUID FK | NOT NULL |  | FK->tags.id ON DELETE CASCADE |
     | created_at| TIMESTAMP | NOT NULL | now() | when association created |
     
     Composite PK (prompt_id, tag_id) to prevent duplicates. Index on prompt_id and on tag_id for queries.

   - `collection_tags` (same structure with `collection_id` FK referencing collections).

### Existing Entities

- `Prompt` and `Collection` models should be updated to include `tags: List[Tag]` in API schemas and data layer, but storage model remains separate via join tables.

Migration notes:
1. Create `tags`, `prompt_tags`, and `collection_tags` tables.
2. No backfill is needed since old references did not exist.
3. Add `tags` field serialization to Prompt/Collection APIs.

Constraints:
- Tag names are normalized to lowercase on insert/update.
- Deleting a tag cascades to remove associations but does not delete prompts/collections.

## API Endpoint Specifications

Authentication: same as existing endpoints (none currently). Tag management requires write permissions.

### Tags CRUD

#### Create tag
- Method: POST
- Path: `/tags`
- Body: `{ "name": "example" }`
- Response 201:

```json
{ "id": "tag-uuid", "name": "example" }
```

- Errors:
  - 400 `{ "detail": "Tag already exists" }` if duplicate.
  - 400 `{ "detail": "Name is required" }` if missing.

#### List tags
- Method: GET
- Path: `/tags`
- Query parameters:
  - `q` optional prefix search string.
  - `limit`/`offset` for pagination (default 50/0).
- Response 200:

```json
{
  "tags": [ { "id": "...", "name": "performance" } ],
  "total": 42,
  "limit": 50,
  "offset": 0
}
```

#### Update tag
- Method: PUT
- Path: `/tags/{tag_id}`
- Body: `{ "name": "newname" }`
- Response 200 with updated object.
- Errors: 404 if not found; 400 if new name conflicts.

#### Delete tag
- Method: DELETE
- Path: `/tags/{tag_id}`
- Response 204 on success; 404 if not found.

### Managing Tags on Prompts

#### Add tags to prompt
- Method: POST
- Path: `/prompts/{prompt_id}/tags`
- Body: `{ "tags": ["tag-id1", "tag-id2"] }` or names? choose IDs for clarity; names require lookup.
- Response 200 returning updated `Prompt` including `tags` list (each with id & name).
- Errors:
  - 404 prompt not found
  - 400 if any tag ID does not exist

#### Remove tag from prompt
- Method: DELETE
- Path: `/prompts/{prompt_id}/tags/{tag_id}`
- Response 204; 404 if association or prompt/tag not found.

#### Get tags for prompt (optional existing prompt retrieval already includes tags)
- The `GET /prompts/{prompt_id}` endpoint should include `tags` in response after implementation.

### Managing Tags on Collections
Mirror the prompt endpoints but under `/collections/{collection_id}/tags`.

### Search & Filter
- Prompt filtering by tags is achieved by query parameter `tags` listing tag names (or IDs) comma-separated.
  - For simplicity in API, use tag names (since names are unique and user-friendly).
  - On server, translate names to tag_ids and filter prompts with `AND` semantics (exists for each tag).
  - Example: `GET /prompts?tags=urgent,backend`.
- Collections filtering similarly: `GET /collections?tags=foo`.
- Tag search via `GET /tags?q=pre` as above.

## Search / Filter Requirements

- When tags filter is present, the prompt/collection list query must join through the appropriate join table and apply an SQL `HAVING COUNT(DISTINCT tag_id) = <number of tags>` constraint to enforce AND semantics.
- Filtering must support pagination and still return `total` count ignoring pagination.
- Case-insensitive matching of tag names in filter.
- If invalid tag name is provided, treat as no matching results (empty list) rather than error.

## Edge Cases & Error Handling

1. Concurrent tag creation with same name:
   - Enforce uniqueness at DB level; handle duplicate-key violation gracefully returning 400.

2. Tag name normalization:
   - Trim whitespace and lowercase before storing; reject empty names or names exceeding length limit (e.g., 100 chars).

3. Attempting to attach nonexistent tag to prompt/collection should return 400 with detail listing missing tag IDs.

4. When deleting a tag, ensure prompt and collection queries continue to work (tags removed from their arrays). Deleting a tag while another process is filtering by that tag may lead to transient empty results.

5. Large numbers of tags per prompt (e.g., >100) should still perform acceptably; enforce reasonable maximum per prompt (e.g., 50) with validation 400 if exceeded.

6. Deleting a prompt or collection should cascade delete its tag associations (FK cascade). If association deletion fails, log error and continue.

7. Filtering with many tags should not degrade performance; limit max tags in filter (say, 10) with 400 if exceeded.

8. Renaming a tag while it's attached to many prompts/collections: since versioning not requested here, simply update the name; associations transparently reflect new name.

9. Tag deletion should not delete prompts/collections.

## Additional Sections

### UX / UI Notes

- Tag editor component (autocomplete/suggestions from `/tags?q=`).
- Display tags as chips/badges on prompt and collection pages with remove icon.
- Filtering UI: multi-select dropdown of tags for list pages.

### Permissions & Security

- Create, update, delete tags require write permission.
- Attaching/detaching tags to prompts/collections requires write permission on the respective resource.
- Tag list and search are read permissions.

### Observability & Metrics

- Metric `tags.created` count
- `prompt_tags.added/removed` counters
- `prompt_list.filtered_by_tags` gauge or counter

### Rollout / Migration Plan

1. Add migrations to create new tables.
2. Deploy code with new endpoints but keep existing prompt/collection endpoints backward compatible (tags field may be empty array by default).
3. UI rollout after backend support available.

### Testing Plan

- Unit tests for tag CRUD operations (duplicate name, case insensitivity, name normalization).
- Tests for attaching/detaching tags to prompts/collections, including idempotency and error cases.
- Filters: ensure correct prompts returned when filtering by one or multiple tags.
- Integration tests verifying tag name changes propagate to prompt/collection endpoints.
- Edge case tests: limit enforcement, non-existent tags, concurrent creation.

## Validation Checklist

- [x] Overview provided
- [x] User stories + AC
- [x] Data model changes detailed with fields, constraints, indexes, migration notes
- [x] API endpoints specified with methods, paths, auth, schemas, examples
- [x] Search/filter requirements section completed
- [x] Edge cases cover necessary scenarios
- [x] Additional sections added for UX, permissions, metrics, rollout, tests

---

All set! The tagging specification is now documented and implementation-ready. Let me know if you'd like assistance implementing or testing this feature.``