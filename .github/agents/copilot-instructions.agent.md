---
description: 'Custom AI Coding Agent'
tools: []
---
# Copilot Instructions — Custom AI Coding Agent (PromptLab / FastAPI)

You are an AI coding agent working in this repository via GitHub Copilot (VS Code / Copilot Chat).
This is a FastAPI project with a single `app = FastAPI(...)` defined in `backend/app/api.py` and in-memory storage in `backend/app/storage.py`.
Make minimal, correct changes that match existing patterns and keep tests passing.

---

## ✅ 1) Project coding standards

### Python + FastAPI
- Use Python **3.10+** style unless repo files indicate otherwise.
- Keep code simple, readable, and consistent with the current codebase.
- Add **type hints** where helpful (route params, return types for non-trivial functions).
- Prefer small functions and explicit logic.

### Where code goes (strict)
- `backend/main.py`: server entry point only (keep thin).
- `backend/app/api.py`: **FastAPI routes** and request handling (this repo uses direct decorators on `app`).
- `backend/app/models.py`: **Pydantic models** + helpers like `get_current_time()`.
- `backend/app/storage.py`: **in-memory CRUD** and data access rules.
- `backend/app/utils.py`: utility helpers only (sorting/filter/search); avoid business logic here.
- `backend/tests/*`: pytest tests (keep updated with any behavior change).

### Documentation updates
- Update `README.md` if you change how to run the backend or API behavior.
- Update `docs/` or `specs/` if a feature contract changes.

---

## ✅ 2) Preferred patterns and conventions

### Route handler conventions (current repo style)
- This repo defines routes directly on `app` (not APIRouter). Continue using:
  - `@app.get(...)`, `@app.post(...)`, etc.
- Always specify:
  - `response_model=...` on GET/POST/PUT/PATCH when returning objects/lists
  - appropriate `status_code=...` (e.g., 201 for create, 204 for delete)
- Keep handlers thin:
  1) fetch/validate from `storage`
  2) call `utils` for sorting/filter/search when applicable
  3) create/return Pydantic models

### Models
- Continue using Pydantic request models like `PromptCreate`, `PromptUpdate`, `PromptPatch`.
- Always use `model_dump()` when converting request objects to dicts (matches existing pattern).
- Maintain timestamps consistently:
  - `created_at` should never change after creation
  - `updated_at` should be set using `get_current_time()` (call it correctly)

### Utilities
- Reuse existing utilities:
  - `filter_prompts_by_collection`
  - `search_prompts`
  - `sort_prompts_by_date`
- If you change sorting/filter/search behavior, update tests accordingly.

---

## ✅ 3) File naming conventions

- Keep Python files in `snake_case.py`.
- Prefer adding logic to existing modules instead of creating new files unless clearly justified.
- Tests:
  - prefer extending `backend/tests/test_api.py`
  - only create new `test_*.py` if the file becomes too large or feature boundaries are clear

---

## ✅ 4) Error handling approach

### HTTP errors (repo standard)
- Use `fastapi.HTTPException` with:
  - `404` when a resource is not found (`"Prompt not found"`, `"Collection not found"`)
  - `400` for invalid references (e.g., `collection_id` does not exist when creating/updating prompt)
- Keep `detail` messages consistent with existing endpoints.

### Storage behavior
- `storage.get_*` may return `None` → translate to HTTP 404/400 as per existing patterns.
- Do not leak internal exceptions in API responses; convert to `HTTPException` with clear messages.

### Logging (if added)
- Use `logging.getLogger(__name__)`.
- Never log secrets/PII.

---

## ✅ 5) Testing requirements

### Test framework + style
- Use **pytest** with fixtures in `backend/tests/conftest.py`.
- Tests must be deterministic; in-memory storage must be reset between tests (use existing fixtures).
- For every endpoint/behavior change, add/update tests covering:
  - happy path
  - 404 not found path
  - validation errors (FastAPI returns 422 automatically)
  - any new edge case introduced

### Default commands
- Run backend tests:
  - `pytest -q backend/tests`

---

## 🔎 Known repo-specific correctness rules (must follow)
- `get_current_time()` must be **called** as a function when setting timestamps:
  - ✅ `updated_at = get_current_time()`
  - ❌ `updated_at = get_current_time` (bug)
- Sorting behavior must be stable and tested; if utilities mention “might be an issue”, verify with tests.

---

## 📌 Response format (strict)

When asked to implement something, respond with:

1) **Plan** (max 8 bullets) — list files you will touch  
2) **Changes** — provide a **unified diff** (preferred)  
3) **Test plan** — exact commands  
4) **Notes** — assumptions + edge cases + follow-ups

---

## 🚫 Boundaries
- Do not refactor unrelated code.
- Do not add dependencies unless necessary; explain why.
- Do not modify `PROJECT_BRIEF.md` or `GRADING_RUBRIC.md` unless explicitly asked.
- Keep diffs small and easy to review.