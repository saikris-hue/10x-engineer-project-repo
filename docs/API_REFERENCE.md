# API Reference

## Overview

Base URL: http://localhost:8000

Content type: application/json

Date/time format: ISO 8601 UTC timestamps (e.g. 2024-01-01T12:34:56.789Z) used in `created_at` and `updated_at` fields.

Pagination: None (endpoints return full lists with a `total` field).

This document describes the REST API for PromptLab. All endpoints accept and return JSON unless noted otherwise.

## Authentication

Authentication: None

This API does not require authentication. If authentication is added later, clients should follow the updated docs.

## Error Format

FastAPI default error responses are used for validation and HTTP exceptions raised by handlers. Typical error envelopes:

- HTTPException responses raised by the application use the form:

```json
{ "detail": "<message>" }
```

- Pydantic validation errors follow FastAPI's validation format, e.g. (400):

```json
{
  "detail": [
    {
      "loc": ["body", "title"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

Common status codes and when they are returned:

- 200 OK — successful GET/PUT/PATCH/list operations
- 201 Created — successful resource creation (POST)
- 204 No Content — successful deletion
- 400 Bad Request — invalid input or related resource missing (e.g., collection not found)
- 404 Not Found — requested resource does not exist
- 500 Internal Server Error — unexpected server-side error

## Endpoints

### GET /health

#### Description
Return service health status and API version.

#### Authentication
None

#### Parameters
None

#### Request Body
None

#### Responses

| Status | Schema | Description |
|---|---:|---|
| 200 | HealthResponse | Service status and version |

HealthResponse fields:
- `status` (str) — service status, e.g. "healthy"
- `version` (str) — API version string

#### Examples

curl

```bash
curl -s http://localhost:8000/health
```

Example response

```json
{
  "status": "healthy",
  "version": "0.1.0"
}
```

---

### GET /prompts

#### Description
List all prompts. Supports optional filtering by `collection_id` and text `search` across title and description. Results include `prompts` array and `total` count.

#### Authentication
None

#### Parameters

| Name | In | Type | Required | Description |
|---|---:|---:|---:|---|
| collection_id | query | string | no | If provided, only prompts with this collection_id are returned. |
| search | query | string | no | Case-insensitive substring search against title and description. |

#### Request Body
None

#### Responses

| Status | Schema | Description |
|---|---:|---|
| 200 | PromptList | List of matching prompts and total count |

Prompt model (each item in `prompts`):
- `id` (str)
- `title` (str)
- `content` (str)
- `description` (Optional[str])
- `collection_id` (Optional[str])
- `created_at` (datetime string)
- `updated_at` (datetime string)

PromptList fields:
- `prompts` (array of Prompt)
- `total` (int)

#### Examples

curl (list all)

```bash
curl -s "http://localhost:8000/prompts"
```

curl (filter by collection)

```bash
curl -s "http://localhost:8000/prompts?collection_id=abc-123"
```

curl (search)

```bash
curl -s "http://localhost:8000/prompts?search=review"
```

Example response (200)

```json
{
  "prompts": [
    {
      "id": "11111111-1111-1111-1111-111111111111",
      "title": "Code Review Prompt",
      "content": "Review the following code and provide feedback:\n\n{{code}}",
      "description": "A prompt for AI code review",
      "collection_id": null,
      "created_at": "2024-01-01T12:00:00.000000",
      "updated_at": "2024-01-01T12:00:00.000000"
    }
  ],
  "total": 1
}
```

---

### GET /prompts/{prompt_id}

#### Description
Retrieve a single prompt by its ID.

#### Authentication
None

#### Parameters

| Name | In | Type | Required | Description |
|---|---:|---:|---:|---|
| prompt_id | path | string | yes | The ID of the prompt to retrieve. |

#### Request Body
None

#### Responses

| Status | Schema | Description |
|---|---:|---|
| 200 | Prompt | Prompt object |
| 404 | {detail: str} | Prompt not found |

#### Examples

curl

```bash
curl -s http://localhost:8000/prompts/11111111-1111-1111-1111-111111111111
```

Success response (200)

```json
{
  "id": "11111111-1111-1111-1111-111111111111",
  "title": "Code Review Prompt",
  "content": "Review the following code and provide feedback:\n\n{{code}}",
  "description": "A prompt for AI code review",
  "collection_id": null,
  "created_at": "2024-01-01T12:00:00.000000",
  "updated_at": "2024-01-01T12:00:00.000000"
}
```

Error response (404)

```json
{ "detail": "Prompt not found" }
```

---

### POST /prompts

#### Description
Create a new prompt. Returns the created prompt with `id`, `created_at`, and `updated_at`.

#### Authentication
None

#### Parameters
None

#### Request Body
Content-Type: application/json

Schema (PromptCreate):

| Field | Type | Required | Description |
|---|---:|---:|---|
| title | string | yes | Prompt title (1–200 chars) |
| content | string | yes | Prompt content (non-empty) |
| description | string | no | Optional description (max 500 chars) |
| collection_id | string | no | Optional collection ID to attach prompt to |

Example request body

```json
{
  "title": "Code Review Prompt",
  "content": "Review the following code and provide feedback:\n\n{{code}}",
  "description": "A prompt for AI code review",
  "collection_id": null
}
```

#### Responses

| Status | Schema | Description |
|---|---:|---|
| 201 | Prompt | Newly created prompt |
| 400 | {detail: str} | Invalid input or provided collection not found |

#### Examples

curl

```bash
curl -s -X POST http://localhost:8000/prompts \
  -H "Content-Type: application/json" \
  -d '{"title":"Code Review Prompt","content":"Review the following code and provide feedback:\n\n{{code}}","description":"A prompt for AI code review"}'
```

Success response (201)

```json
{
  "id": "22222222-2222-2222-2222-222222222222",
  "title": "Code Review Prompt",
  "content": "Review the following code and provide feedback:\n\n{{code}}",
  "description": "A prompt for AI code review",
  "collection_id": null,
  "created_at": "2024-01-01T12:01:00.000000",
  "updated_at": "2024-01-01T12:01:00.000000"
}
```

Error example (400) when collection not found

```json
{ "detail": "Collection not found" }
```

---

### PUT /prompts/{prompt_id}

#### Description
Replace an existing prompt with new data. This is a full update (PUT semantics): caller must provide all fields.

#### Authentication
None

#### Parameters

| Name | In | Type | Required | Description |
|---|---:|---:|---:|---|
| prompt_id | path | string | yes | ID of the prompt to replace. |

#### Request Body
Content-Type: application/json

Schema (PromptUpdate): same fields as PromptCreate (title, content, description, collection_id).

Example request body

```json
{
  "title": "Updated Title",
  "content": "Updated content for the prompt",
  "description": "Updated description",
  "collection_id": null
}
```

#### Responses

| Status | Schema | Description |
|---|---:|---|
| 200 | Prompt | Updated prompt object |
| 400 | {detail: str} | Invalid collection ID provided |
| 404 | {detail: str} | Prompt not found |

#### Examples

curl

```bash
curl -s -X PUT http://localhost:8000/prompts/22222222-2222-2222-2222-222222222222 \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Title","content":"Updated content for the prompt","description":"Updated description"}'
```

Success response (200)

```json
{
  "id": "22222222-2222-2222-2222-222222222222",
  "title": "Updated Title",
  "content": "Updated content for the prompt",
  "description": "Updated description",
  "collection_id": null,
  "created_at": "2024-01-01T12:01:00.000000",
  "updated_at": "2024-01-01T12:02:05.000000"
}
```

Error example (404)

```json
{ "detail": "Prompt not found" }
```

---

### PATCH /prompts/{prompt_id}

#### Description
Partially update a prompt. Only provided fields are changed; others remain unchanged.

#### Authentication
None

#### Parameters

| Name | In | Type | Required | Description |
|---|---:|---:|---:|---|
| prompt_id | path | string | yes | ID of the prompt to patch. |

#### Request Body
Content-Type: application/json

Schema (PromptPatch): all fields optional: `title`, `content`, `description`, `collection_id`.

Example request body (partial)

```json
{ "description": "Clarified instructions for reviewers" }
```

#### Responses

| Status | Schema | Description |
|---|---:|---|
| 200 | Prompt | Updated prompt object |
| 400 | {detail: str} | Invalid collection ID provided |
| 404 | {detail: str} | Prompt not found |

#### Examples

curl

```bash
curl -s -X PATCH http://localhost:8000/prompts/22222222-2222-2222-2222-222222222222 \
  -H "Content-Type: application/json" \
  -d '{"description":"Clarified instructions for reviewers"}'
```

Success response (200)

```json
{
  "id": "22222222-2222-2222-2222-222222222222",
  "title": "Updated Title",
  "content": "Updated content for the prompt",
  "description": "Clarified instructions for reviewers",
  "collection_id": null,
  "created_at": "2024-01-01T12:01:00.000000",
  "updated_at": "2024-01-01T12:05:00.000000"
}
```

---

### DELETE /prompts/{prompt_id}

#### Description
Delete a prompt by ID. Returns 204 No Content on success.

#### Authentication
None

#### Parameters

| Name | In | Type | Required | Description |
|---|---:|---:|---:|---|
| prompt_id | path | string | yes | ID of the prompt to delete. |

#### Request Body
None

#### Responses

| Status | Description |
|---|---:|
| 204 | Deleted successfully (no content) |
| 404 | Prompt not found |

#### Examples

curl

```bash
curl -s -X DELETE http://localhost:8000/prompts/22222222-2222-2222-2222-222222222222
```

Error example (404)

```json
{ "detail": "Prompt not found" }
```

---

### GET /collections

#### Description
List all collections.

#### Authentication
None

#### Parameters
None

#### Request Body
None

#### Responses

| Status | Schema | Description |
|---|---:|---|
| 200 | CollectionList | Collections array and total count |

Collection model fields:
- `id` (str)
- `name` (str)
- `description` (Optional[str])
- `created_at` (datetime)

Example response (200)

```json
{
  "collections": [
    {
      "id": "33333333-3333-3333-3333-333333333333",
      "name": "Development",
      "description": "Prompts for development tasks",
      "created_at": "2024-01-01T12:10:00.000000"
    }
  ],
  "total": 1
}
```

---

### GET /collections/{collection_id}

#### Description
Retrieve a single collection by ID.

#### Authentication
None

#### Parameters

| Name | In | Type | Required | Description |
|---|---:|---:|---:|---|
| collection_id | path | string | yes | ID of the collection to retrieve. |

#### Request Body
None

#### Responses

| Status | Schema | Description |
|---|---:|---|
| 200 | Collection | Collection object |
| 404 | {detail: str} | Collection not found |

#### Examples

curl

```bash
curl -s http://localhost:8000/collections/33333333-3333-3333-3333-333333333333
```

Success (200)

```json
{
  "id": "33333333-3333-3333-3333-333333333333",
  "name": "Development",
  "description": "Prompts for development tasks",
  "created_at": "2024-01-01T12:10:00.000000"
}
```

---

### POST /collections

#### Description
Create a new collection.

#### Authentication
None

#### Parameters
None

#### Request Body
Content-Type: application/json

Schema (CollectionCreate):

| Field | Type | Required | Description |
|---|---:|---:|---|
| name | string | yes | Collection name (1–100 chars) |
| description | string | no | Optional description |

Example request

```json
{ "name": "Development", "description": "Prompts for development tasks" }
```

#### Responses

| Status | Schema | Description |
|---|---:|---|
| 201 | Collection | Newly created collection |

Example response (201)

```json
{
  "id": "33333333-3333-3333-3333-333333333333",
  "name": "Development",
  "description": "Prompts for development tasks",
  "created_at": "2024-01-01T12:10:00.000000"
}
```

---

### DELETE /collections/{collection_id}

#### Description
Delete a collection. The implementation currently removes the collection and then attempts to delete prompts belonging to it (cascade delete behavior). Note: tests mention potential orphaning behavior — verify expected behavior in your environment.

#### Authentication
None

#### Parameters

| Name | In | Type | Required | Description |
|---|---:|---:|---:|---|
| collection_id | path | string | yes | ID of the collection to delete. |

#### Request Body
None

#### Responses

| Status | Description |
|---|---:|
| 204 | Deleted successfully (no content) |
| 404 | Collection not found |

#### Examples

curl

```bash
curl -s -X DELETE http://localhost:8000/collections/33333333-3333-3333-3333-333333333333
```

Error (404)

```json
{ "detail": "Collection not found" }
```

---

## Notes / TODOs

- Base URL is assumed to be `http://localhost:8000` (from `backend/main.py`). If your deployment uses a different host/path, update examples accordingly.
- Authentication: None. If auth is introduced, update the `## Authentication` section and per-endpoint notes.
- Error envelopes use FastAPI defaults and `HTTPException` details. If a custom error format is added, replace the `## Error Format` section.

