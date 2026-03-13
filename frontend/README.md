# PromptLab Frontend

Vite + React frontend for the PromptLab FastAPI backend.

## Requirements

- Node.js 18+
- npm
- Backend API running locally

## Environment

Copy `.env.example` to `.env` when you need to override local defaults.

```env
VITE_API_URL=/api
VITE_PROXY_TARGET=http://localhost:8000
```

- `VITE_API_URL=/api` keeps frontend requests proxy-friendly during local development.
- `VITE_PROXY_TARGET` tells the Vite dev server where to forward `/api/*`.
- For production-like direct API access, set `VITE_API_URL=http://localhost:8000` or your deployed API origin and skip the proxy.

## Local Development

Start the backend in one terminal:

```bash
cd backend
python main.py
```

Start the frontend in another terminal:

```bash
cd frontend
npm install
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`

## Verification

Build the frontend:

```bash
cd frontend
npm run build
```

Run the backend smoke test against a real API server:

```bash
cd frontend
npm run smoke
```

Override the smoke target if needed:

```bash
cd frontend
$env:SMOKE_API_URL="http://localhost:8000"
npm run smoke
```
