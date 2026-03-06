# ==============================================================================
# Variables
# ==============================================================================

# GCP Project Configuration — update these for your project
PROJECT_ID       := [Your GCP project ID, e.g. my-gcp-project]
PROJECT_LOCATION := [Your GCP region, e.g. europe-west4]
MODEL_NAME       := gemini-2.5-flash

# ==============================================================================
# Setup
# ==============================================================================

install:
	@command -v uv >/dev/null 2>&1 || { echo "uv is not installed. Installing uv..."; curl -LsSf https://astral.sh/uv/0.8.13/install.sh | sh; source $$HOME/.local/bin/env; }
	uv sync
	npm --prefix frontend install

agent-env:
	@echo 'GOOGLE_GENAI_USE_VERTEXAI="TRUE"' > .env
	@echo 'GOOGLE_CLOUD_PROJECT="$(PROJECT_ID)"' >> .env
	@echo 'GOOGLE_CLOUD_LOCATION="$(PROJECT_LOCATION)"' >> .env
	@echo 'MODEL_NAME="$(MODEL_NAME)"' >> .env
	@echo "Generated .env"

# ==============================================================================
# Workshop
# ==============================================================================

# Usage: make playground STEP=step-01-first-agent
playground:
ifdef STEP
	uv run adk web steps/$(STEP)/agents/ --port 8501 --reload_agents
else
	uv run adk web app/agents/ --port 8501 --reload_agents
endif

local-backend:
	uv run uvicorn app.main:app --host localhost --port $(or $(PORT),8000) --reload

# ==============================================================================
# Utilities
# ==============================================================================

clean:
	rm -rf .mypy_cache .ruff_cache .pytest_cache
	find . -type d -name "__pycache__" -exec rm -rf {} +

kill:
	lsof -ti :8000,8001,8002,8003,8004,8080,8501 | xargs -r kill
