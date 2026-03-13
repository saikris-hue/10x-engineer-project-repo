# PromptLab

PromptLab is a FastAPI backend plus a Vite + React frontend for managing prompts and collections.

## Environment Summary

- Backend framework: FastAPI
- Backend entrypoint: `backend/main.py`
- Backend URL: `http://localhost:8000`
- Backend API prefix: none
- Auth mode: none
- Frontend framework: React + Vite + TypeScript
- Frontend dev URL: `http://localhost:5173`
- Frontend API strategy: `VITE_API_URL=/api` with a Vite dev proxy to the backend

## Backend Setup

```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python main.py
```

The backend listens on `http://localhost:8000`.

### Backend Environment

`backend/.env.example`

```env
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

- `CORS_ORIGINS` is a comma-separated allowlist for browser requests.
- In production-like environments, replace those localhost origins with the deployed frontend origins.
- Export `CORS_ORIGINS` in your shell or container environment before starting the backend when you need to override the default dev allowlist.

## Frontend Setup

```bash
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

The frontend listens on `http://localhost:5173`.

### Frontend Environment

`frontend/.env.example`

```env
VITE_API_URL=/api
VITE_PROXY_TARGET=http://localhost:8000
```

- `VITE_API_URL=/api` keeps API calls relative during local development.
- `VITE_PROXY_TARGET` controls where the Vite dev server forwards `/api/*`.
- For production-like direct API access, set `VITE_API_URL` to the deployed backend origin and skip the proxy.

## Connectivity Plan

- Local development uses the Vite proxy so the browser talks to the frontend origin and the dev server forwards `/api/*` to the FastAPI backend.
- The backend still keeps a CORS allowlist for direct browser-to-API calls outside the proxy path.
- The frontend API client uses one fetch wrapper with timeout handling, safe JSON parsing, and normalized errors.

## API Endpoints

### Health

- `GET /health`

### Prompts

- `GET /prompts`
- `GET /prompts/{prompt_id}`
- `POST /prompts`
- `PUT /prompts/{prompt_id}`
- `PATCH /prompts/{prompt_id}`
- `DELETE /prompts/{prompt_id}`

Supported prompt filters:

- `collection_id`
- `search`

### Collections

- `GET /collections`
- `GET /collections/{collection_id}`
- `POST /collections`
- `DELETE /collections/{collection_id}`

## How To Run Locally

1. Start the backend.
2. Start the frontend.
3. Open `http://localhost:5173`.
4. The frontend will call `/api/*`, and Vite will proxy those requests to `http://localhost:8000`.

## Verification

Build the frontend:

```bash
cd frontend
npm run build
```

Run the smoke test against a real backend:

```bash
cd frontend
npm run smoke
```

The smoke test verifies:

- health check
- collection create and delete
- prompt create, detail, update, delete
- prompt filtering by `collection_id`

Override the smoke target if needed:

```bash
cd frontend
$env:SMOKE_API_URL="http://localhost:8000"
npm run smoke
```
