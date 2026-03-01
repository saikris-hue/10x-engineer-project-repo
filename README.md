# PromptLab

**Your AI Prompt Engineering Platform**

PromptLab is an internal tool for AI engineers to store, organize, manage, and test their prompts. Think of it as "Postman for Prompts" — a professional workspace where teams can collaborate on prompt engineering workflows.

---

## 🎯 Features

- **Store Prompts** — Save prompt templates with variable support (`{{input}}`, `{{context}}`)
- **Organize Collections** — Group related prompts into collections for easy discovery
- **Full CRUD Operations** — Create, read, update (full and partial), and delete prompts
- **Search & Filter** — Find prompts by title, description, or collection
- **Timestamps** — Track creation and modification times for version awareness
- **REST API** — Clean, intuitive endpoints with OpenAPI documentation
- **Type-Safe** — Pydantic validation for request/response data integrity

---

## 📋 Prerequisites

- **Python** 3.10 or higher
- **pip** (Python package manager) or **conda**
- **Git** (for version control)

Optional (for frontend, Week 4):
- **Node.js** 18+
- **npm** or **yarn**

---

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd 10x-engineer-project-repo
```

### 2. Create and activate virtual environment

```bash
# On macOS/Linux
python3 -m venv venv
source venv/bin/activate

# On Windows (PowerShell)
python -m venv venv
.\venv\Scripts\Activate.ps1

# On Windows (Command Prompt)
python -m venv venv
venv\Scripts\activate.bat
```

### 3. Install backend dependencies

```bash
cd backend
pip install -r requirements.txt
```

---

## 🚀 Quick Start

### Start the API server

```bash
cd backend
python main.py
```

The API will start at `http://localhost:8000`.

### Access API documentation

- **Interactive Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

### Run tests

```bash
cd backend
python -m pytest tests/ -v
```

---

## 📡 API Reference

### Base URL

```
http://localhost:8000
```

### Health Check

**GET** `/health`

Check if the API is running.

```bash
curl http://localhost:8000/health
```

**Response (200 OK):**
```json
{
  "status": "healthy",
  "version": "0.1.0"
}
```

---

### Prompts

#### List Prompts

**GET** `/prompts`

Retrieve all prompts with optional filtering and search.

**Query Parameters:**
- `collection_id` (optional): Filter by collection ID
- `search` (optional): Search by title or description

```bash
# Get all prompts
curl http://localhost:8000/prompts

# Filter by collection
curl "http://localhost:8000/prompts?collection_id=123"

# Search prompts
curl "http://localhost:8000/prompts?search=hello"

# Combine filters
curl "http://localhost:8000/prompts?collection_id=123&search=hello"
```

**Response (200 OK):**
```json
{
  "prompts": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Customer Service Bot",
      "content": "You are a helpful customer service representative...",
      "description": "A prompt for customer support automation",
      "collection_id": "collection-123",
      "created_at": "2026-02-28T10:00:00",
      "updated_at": "2026-02-28T10:00:00"
    }
  ],
  "total": 1
}
```

---

#### Get Single Prompt

**GET** `/prompts/{prompt_id}`

Retrieve a specific prompt by ID.

```bash
curl http://localhost:8000/prompts/550e8400-e29b-41d4-a716-446655440000
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Customer Service Bot",
  "content": "You are a helpful customer service representative...",
  "description": "A prompt for customer support automation",
  "collection_id": "collection-123",
  "created_at": "2026-02-28T10:00:00",
  "updated_at": "2026-02-28T10:00:00"
}
```

**Error (404 Not Found):**
```json
{
  "detail": "Prompt not found"
}
```

---

#### Create Prompt

**POST** `/prompts`

Create a new prompt.

**Request Body:**
```json
{
  "title": "Customer Service Bot",
  "content": "You are a helpful customer service representative. Answer user questions professionally.",
  "description": "A prompt for customer support automation",
  "collection_id": null
}
```

```bash
curl -X POST http://localhost:8000/prompts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Customer Service Bot",
    "content": "You are a helpful customer service representative...",
    "description": "A prompt for customer support automation",
    "collection_id": null
  }'
```

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Customer Service Bot",
  "content": "You are a helpful customer service representative...",
  "description": "A prompt for customer support automation",
  "collection_id": null,
  "created_at": "2026-02-28T10:00:00",
  "updated_at": "2026-02-28T10:00:00"
}
```

---

#### Update Prompt (Full)

**PUT** `/prompts/{prompt_id}`

Replace an entire prompt (requires all fields).

**Request Body:**
```json
{
  "title": "Customer Service Bot v2",
  "content": "You are an expert customer service representative...",
  "description": "Updated customer support prompt",
  "collection_id": null
}
```

```bash
curl -X PUT http://localhost:8000/prompts/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Customer Service Bot v2",
    "content": "You are an expert customer service representative...",
    "description": "Updated customer support prompt",
    "collection_id": null
  }'
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Customer Service Bot v2",
  "content": "You are an expert customer service representative...",
  "description": "Updated customer support prompt",
  "collection_id": null,
  "created_at": "2026-02-28T10:00:00",
  "updated_at": "2026-02-28T10:30:00"
}
```

---

#### Update Prompt (Partial)

**PATCH** `/prompts/{prompt_id}`

Update only the fields you provide (partial update). Omitted fields retain their current values.

**Request Body (only change title):**
```json
{
  "title": "Customer Service Bot v3"
}
```

```bash
curl -X PATCH http://localhost:8000/prompts/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Customer Service Bot v3"
  }'
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Customer Service Bot v3",
  "content": "You are an expert customer service representative...",
  "description": "Updated customer support prompt",
  "collection_id": null,
  "created_at": "2026-02-28T10:00:00",
  "updated_at": "2026-02-28T10:35:00"
}
```

---

#### Delete Prompt

**DELETE** `/prompts/{prompt_id}`

Delete a specific prompt.

```bash
curl -X DELETE http://localhost:8000/prompts/550e8400-e29b-41d4-a716-446655440000
```

**Response (204 No Content):**
```
(empty response body)
```

---

### Collections

#### List Collections

**GET** `/collections`

Retrieve all collections.

```bash
curl http://localhost:8000/collections
```

**Response (200 OK):**
```json
{
  "collections": [
    {
      "id": "collection-123",
      "name": "Customer Support",
      "description": "Prompts for customer service automation",
      "created_at": "2026-02-28T09:00:00"
    }
  ],
  "total": 1
}
```

---

#### Get Single Collection

**GET** `/collections/{collection_id}`

Retrieve a specific collection.

```bash
curl http://localhost:8000/collections/collection-123
```

**Response (200 OK):**
```json
{
  "id": "collection-123",
  "name": "Customer Support",
  "description": "Prompts for customer service automation",
  "created_at": "2026-02-28T09:00:00"
}
```

---

#### Create Collection

**POST** `/collections`

Create a new collection.

**Request Body:**
```json
{
  "name": "Customer Support",
  "description": "Prompts for customer service automation"
}
```

```bash
curl -X POST http://localhost:8000/collections \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Customer Support",
    "description": "Prompts for customer service automation"
  }'
```

**Response (201 Created):**
```json
{
  "id": "collection-123",
  "name": "Customer Support",
  "description": "Prompts for customer service automation",
  "created_at": "2026-02-28T09:00:00"
}
```

---

#### Delete Collection

**DELETE** `/collections/{collection_id}`

Delete a collection and **cascade-delete all prompts** that belong to it.

```bash
curl -X DELETE http://localhost:8000/collections/collection-123
```

**Response (204 No Content):**
```
(empty response body)
```

---

## 📁 Project Structure

```
.
├── README.md                          # This file
├── PROJECT_BRIEF.md                   # Assignment details (Week 1-4 tasks)
├── GRADING_RUBRIC.md                  # Grading criteria
│
├── backend/
│   ├── main.py                        # FastAPI server entry point
│   ├── requirements.txt                # Python dependencies
│   ├── app/
│   │   ├── __init__.py                # Package init (version)
│   │   ├── api.py                     # FastAPI route handlers
│   │   ├── models.py                  # Pydantic data models
│   │   ├── storage.py                 # In-memory data storage
│   │   └── utils.py                   # Utility functions
│   └── tests/
│       ├── conftest.py                # pytest fixtures
│       ├── test_api.py                # API endpoint tests
│       └── __init__.py
│
├── frontend/                          # React frontend (Week 4)
├── docs/                              # Documentation (Week 2)
├── specs/                             # Feature specifications (Week 2)
└── .github/
    └── prompts/                       # AI assistant instructions
```

---

## 🔧 Development

### Local Development Workflow

1. **Activate virtual environment:**
   ```bash
   source venv/bin/activate  # macOS/Linux
   # or
   .\venv\Scripts\Activate.ps1  # Windows PowerShell
   ```

2. **Install dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Run the server:**
   ```bash
   python main.py
   ```
   Server runs at `http://localhost:8000`

4. **Run tests:**
   ```bash
   python -m pytest tests/ -v
   ```

5. **View test coverage:**
   ```bash
   python -m pytest tests/ --cov=app --cov-report=html
   ```

### Key Files to Understand

| File | Purpose |
|------|---------|
| [backend/app/api.py](backend/app/api.py) | All HTTP endpoints and route handlers |
| [backend/app/models.py](backend/app/models.py) | Pydantic data models and validation |
| [backend/app/storage.py](backend/app/storage.py) | In-memory data storage layer |
| [backend/app/utils.py](backend/app/utils.py) | Helper functions (sorting, searching, filtering) |

### Common Development Tasks

**Add a new endpoint:**
1. Define request/response models in `models.py`
2. Add route handler in `api.py`
3. Write tests in `tests/test_api.py`
4. Verify: `python -m pytest tests/ -v`

**Modify data models:**
1. Update model in `models.py`
2. Update storage logic in `storage.py`
3. Update API endpoints that use the model
4. Run tests to verify no breakage

**Debug an endpoint:**
```bash
# Use FastAPI interactive docs
curl http://localhost:8000/docs  # Open in browser

# Or test with curl
curl -X GET http://localhost:8000/prompts
```

---

## 📚 Dependencies

### Backend

| Package | Version | Purpose |
|---------|---------|---------|
| FastAPI | 0.109.0 | Web framework |
| Uvicorn | 0.27.0 | ASGI server |
| Pydantic | Latest | Data validation |
| pytest | 7.4.4 | Testing framework |
| pytest-cov | 4.1.0 | Test coverage reports |
| httpx | 0.26.0 | HTTP client for tests |

See [backend/requirements.txt](backend/requirements.txt) for exact versions.

---

## 🤝 Contributing

### Before You Start

1. **Read the brief:** [PROJECT_BRIEF.md](PROJECT_BRIEF.md) for current week tasks
2. **Review the rubric:** [GRADING_RUBRIC.md](GRADING_RUBRIC.md) for expectations
3. **Run tests locally:** `pytest tests/ -v`

### Development Workflow

1. **Create a branch for your work:**
   ```bash
   git checkout -b feature/bug-description
   ```

2. **Make your changes** and test locally

3. **Run all tests before committing:**
   ```bash
   python -m pytest tests/ -v
   ```

4. **Commit with clear messages:**
   ```bash
   git commit -m "Fix: return 404 instead of 500 for missing prompt (Fixes #1)"
   ```

5. **Push and open a PR (if applicable):**
   ```bash
   git push origin feature/bug-description
   ```

### Code Standards

- **Type hints:** All functions should have type hints
- **Docstrings:** Use Google-style docstrings on public functions
- **Testing:** Write tests for new endpoints and business logic
- **Naming:** Use `snake_case` for functions/variables, `PascalCase` for classes

### Reporting Issues

When reporting a bug, include:
- **Description:** What's broken and how to reproduce
- **Expected behavior:** What should happen
- **Actual behavior:** What actually happens
- **Environment:** Python version, OS, etc.

---

## 📖 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Pydantic Validation](https://docs.pydantic.dev/)
- [pytest Documentation](https://docs.pytest.org/)
- [Project Brief (Week 1-4 Tasks)](PROJECT_BRIEF.md)
- [Grading Rubric](GRADING_RUBRIC.md)

---

## 📝 License

TODO: Add license information

---