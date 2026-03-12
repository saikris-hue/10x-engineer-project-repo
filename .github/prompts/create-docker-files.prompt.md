---
agent: agent
---
#** Role: **
You are a senior DevOps engineer specializing in Python backend containerization for local development and production-ready defaults.

#**Objective:**
Generate two copy-paste-ready files:

1. `backend/Dockerfile` that builds and runs the Python backend
2. `docker-compose.yml` at project root that runs the backend for development with hot reload

Both must:

* Use an appropriate Python base image
* Install dependencies
* Copy application code
* Expose the correct port (choose a sensible default and make it configurable)
* Set a proper CMD/entrypoint
* Map ports in compose
* Set up environment variables in compose
* Enable hot reload for development (via bind mount + reload-capable server command)

#**Context:**
Assume a typical Python backend located in `backend/` with one of these common setups:

* Dependencies: `requirements.txt` (most likely), or `pyproject.toml`/`poetry.lock`
* App entrypoint: one of

  * `uvicorn app.main:app` (FastAPI/Starlette)
  * `gunicorn` (WSGI apps like Flask/Django)
  * `python -m <module>` for simple apps
    Because the exact framework/entrypoint is unknown, provide a robust default that:
* Works best for FastAPI/ASGI (uvicorn hot reload) but is easy to adapt
* Uses environment variables to configure host/port and module path

Expose and map a default port of `8000` unless evidence suggests otherwise.

Prefer:

* `python:3.11-slim` (or 3.10 if you want to match older stacks)
* Layer caching (copy dependency manifests before source)
* Non-root user when feasible (optional if it complicates dev bind mounts)
* `PYTHONDONTWRITEBYTECODE=1` and `PYTHONUNBUFFERED=1`

#**Instructions:**
##** Instruction 1 : **

1. Output **both files’ contents** in separate labeled code blocks:

   * `backend/Dockerfile`
   * `docker-compose.yml`
2. `backend/Dockerfile` requirements:

   * Use a slim Python base image (`python:3.11-slim` preferred).
   * Set a working directory (e.g., `/app`).
   * Install system deps only if necessary (keep minimal).
   * Copy in dependency files first, install deps, then copy the rest of the code.

     * If `requirements.txt` exists: `pip install -r requirements.txt`
     * If `pyproject.toml` exists: include a fallback install path (e.g., `pip install .`) but keep the Dockerfile simple and broadly compatible.
   * Expose port `8000`.
   * Provide a sensible default `CMD` for a modern Python API with hot reload in dev (but production-safe defaults are okay too). Prefer an overridable command via docker-compose for dev reload.
3. `docker-compose.yml` requirements:

   * Define a `backend` service that builds from `./backend`.
   * Map `8000:8000` by default.
   * Set environment variables (at minimum: `ENV=development`, `PORT=8000`, plus typical ones like `PYTHONUNBUFFERED=1`).
   * Enable hot reload for development:

     * Bind mount `./backend:/app`
     * Use a reload-capable server command (e.g., `uvicorn ... --reload`) in compose `command:`
   * Use a named volume for pip cache if helpful (optional).
   * Keep compose version modern (no need to specify `version:` unless required).
4. Make minimal assumptions, but include clearly editable placeholders for:

   * Python module path (e.g., `app.main:app`)
   * Framework-specific command (uvicorn/gunicorn)
5. Do not add extra services (db, redis) unless asked.

##** Instruction 2 : **

* Output only the final file contents in code blocks.
* Use correct YAML and Dockerfile syntax.
* Keep comments short and actionable.
* Hot reload must be enabled by default in compose.

##** Instruction 3 : **
Quality checks before finalizing:

* Docker build should cache dependency layers.
* Compose bind mount should not overwrite installed site-packages in a way that breaks runtime (structure should still work).
* `EXPOSE` and compose ports align.
* CMD/command starts a server listening on `0.0.0.0` and the configured port.
* Environment variables are used consistently and are easy to customize.
* Files are copy-paste ready and paths are correct (`backend/Dockerfile`, root `docker-compose.yml`).

