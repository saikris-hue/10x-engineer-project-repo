---
agent: agent
---
#** Role: **
You are a senior DevOps / Python tooling engineer who writes clean, modern GitHub Actions workflows for Python projects.

#**Objective:**
Generate a complete `.github/workflows/ci.yml` that:

* Triggers on `push` and `pull_request`
* Sets up a Python environment
* Installs dependencies
* Runs linting (use **ruff** by default; fall back to flake8 if ruff isn’t available)
* Runs tests with coverage
* **Fails the job if total coverage is < 80%**
* Is copy-paste ready and valid YAML

#**Context:**
Project is a typical Python repo. Dependency/layout may vary:

* Dependencies might be in `requirements.txt`, `requirements-dev.txt`, `dev-requirements.txt`, `pyproject.toml` (PEP 621), `setup.cfg`, or extras like `.[dev]`.
* Tests are typically run with `pytest`.
* Coverage should be enforced at **80%** minimum.

Use modern actions versions:

* `actions/checkout@v4`
* `actions/setup-python@v5` (unless constraints require v4)

Prefer Python **3.10** (matching the example) unless you include a small version matrix that still works for most repos.

#**Instructions:**
##** Instruction 1 : **

1. Output a single GitHub Actions workflow file at path `.github/workflows/ci.yml`.
2. Use:

   * `name: CI`
   * `on: [push, pull_request]` (or equivalent YAML form)
3. Define one job (e.g., `test`) that runs on `ubuntu-latest`.
4. Steps must include:

   * Checkout repository.
   * Set up Python (default to `3.10`; optionally a matrix like `3.10` and `3.11`).
   * Enable pip caching via `actions/setup-python` cache options if possible.
   * Upgrade packaging tools (`pip`, `setuptools`, `wheel`).
   * Install dependencies with a robust strategy:

     * If `requirements.txt` exists, install it.
     * If dev requirements file exists, install it too.
     * Else if `pyproject.toml` exists, install via `pip install .` and (if reasonable) `pip install .[dev]`.
     * Ensure lint/test tools are installed (ruff or flake8; pytest; pytest-cov).
     * Implement this in shell with existence checks so the workflow works across layouts.
5. Linting:

   * Prefer `ruff`:

     * `ruff check .`
     * Optionally `ruff format --check .` if formatting is used.
   * If ruff isn’t installed/configured, fall back to `flake8 .`.
6. Tests + coverage:

   * Run `pytest` with coverage using `pytest-cov`.
   * Enforce minimum coverage with `--cov-fail-under=80` so the job fails if below 80%.
   * Use a reasonable `--cov=...` target:

     * Prefer a package/module name if it can be inferred (e.g., if `src/` exists, use `--cov=src` or infer package).
     * Otherwise use `--cov=.` as a safe fallback.
7. Keep the workflow minimal but production-grade, with clear step names.

##** Instruction 2 : **

* Output **only** the YAML contents for `.github/workflows/ci.yml` (no explanations, no markdown).
* Use consistent indentation and valid YAML.
* Use clear step names and keep commands readable.
* Use bash with `set -euo pipefail` where helpful.
* Do not include secrets, deployments, or publishing steps.

##** Instruction 3 : **
Before finalizing, validate:

* Workflow triggers on both push and pull_request.
* Uses correct action versions and valid keys (`runs-on`, `steps`, `uses`, `run`).
* Dependency installation won’t fail if some files are missing (uses existence checks).
* Lint step runs (ruff preferred; flake8 fallback).
* Coverage enforcement is strict: job fails when coverage < 80% (via `--cov-fail-under=80`).
* YAML is syntactically correct and copy-paste ready.
* If inferring coverage target is ambiguous, use a safe fallback (`--cov=.`) rather than guessing incorrectly.
