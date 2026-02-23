# ==============================================================================
# Variables
# ==============================================================================

# GCP Project Configuration
PROJECT_ID       := [YOUR_PROJECT_ID]
PROJECT_NUMBER   := [YOUR_PROJECT_NUMBER]
PROJECT_LOCATION := europe-west4
SERVICE_ACCOUNT  := loan-drawdawn-adk-sa@$(PROJECT_ID).iam.gserviceaccount.com
DOMAIN           := [YOUR_DOMAIN_FOR_IAP]

# Service Configuration
SERVICE_NAME       := loan-drawdown-agent-demo
LOGS_BUCKET_NAME   := [YOUR_LOGS_BUCKET_NAME]
MODEL_NAME         := gemini-2.5-flash

# Service URLs
SERVICE_URL  := https://$(SERVICE_NAME)-$(PROJECT_NUMBER).$(PROJECT_LOCATION).run.app


# ==============================================================================
# Installation & Setup
# ==============================================================================

# Install dependencies using uv package manager
install:
	@command -v uv >/dev/null 2>&1 || { echo "uv is not installed. Installing uv..."; curl -LsSf https://astral.sh/uv/0.8.13/install.sh | sh; source $HOME/.local/bin/env; }
	uv sync

auth: # Authenticate with Google Cloud using gcloud CLI
	gcloud auth application-default login
	gcloud config set project $(PROJECT_ID)
	gcloud auth application-default set-quota-project $(PROJECT_ID)

setup-apis:
	gcloud services enable aiplatform.googleapis.com firestore.googleapis.com run.googleapis.com cloudbuild.googleapis.com logging.googleapis.com iam.googleapis.com iap.googleapis.com --project $(PROJECT_ID)

setup-sa: ## Create or Update Service Account and grant necessary roles
	@echo "Checking service account $(SERVICE_ACCOUNT)..."
	@if gcloud iam service-accounts describe $(SERVICE_ACCOUNT) --project $(PROJECT_ID) >/dev/null 2>&1; then \
		echo "Service account exists. Updating..."; \
		gcloud iam service-accounts update $(SERVICE_ACCOUNT) --display-name "Volvo Vän Service Account" --project $(PROJECT_ID) --quiet >/dev/null; \
	else \
		echo "Creating service account..."; \
		gcloud iam service-accounts create $(shell echo $(SERVICE_ACCOUNT) | cut -d@ -f1) \
			--display-name "Volvo Vän Service Account" \
			--project $(PROJECT_ID) --quiet >/dev/null; \
	fi
	@echo "Granting roles..."
	@gcloud projects add-iam-policy-binding $(PROJECT_ID) --member="serviceAccount:$(SERVICE_ACCOUNT)" --role="roles/aiplatform.user" --condition=None --quiet >/dev/null
	@gcloud projects add-iam-policy-binding $(PROJECT_ID) --member="serviceAccount:$(SERVICE_ACCOUNT)" --role="roles/datastore.user" --condition=None --quiet >/dev/null
	@gcloud projects add-iam-policy-binding $(PROJECT_ID) --member="serviceAccount:$(SERVICE_ACCOUNT)" --role="roles/iam.serviceAccountTokenCreator" --condition=None --quiet >/dev/null
	@gcloud projects add-iam-policy-binding $(PROJECT_ID) --member="serviceAccount:$(SERVICE_ACCOUNT)" --role="roles/logging.logWriter" --condition=None --quiet >/dev/null
	@gcloud projects add-iam-policy-binding $(PROJECT_ID) --member="serviceAccount:$(SERVICE_ACCOUNT)" --role="roles/run.invoker" --condition=None --quiet >/dev/null
	@gcloud projects add-iam-policy-binding $(PROJECT_ID) --member="serviceAccount:$(SERVICE_ACCOUNT)" --role="roles/run.serviceAgent" --condition=None --quiet >/dev/null
	@gcloud projects add-iam-policy-binding $(PROJECT_ID) --member="serviceAccount:$(SERVICE_ACCOUNT)" --role="roles/secretmanager.secretAccessor" --condition=None --quiet >/dev/null
	@gcloud storage buckets add-iam-policy-binding gs://$(LOGS_BUCKET_NAME) --member="serviceAccount:$(SERVICE_ACCOUNT)" --role="roles/storage.objectAdmin" --quiet >/dev/null
	@echo "Done."

clean: ## Clean up temporary files
	rm -rf .mypy_cache .ruff_cache .pytest_cache
	find . -type d -name "__pycache__" -exec rm -rf {} +

kill: ## Kill local development processes (ports 8000-8004)
	lsof -ti :8000,8001,8002,8003,8004,8080,8501 | xargs -r kill

# ==============================================================================
# Playground Targets
# ==============================================================================

# Launch local dev playground
playground:
	@echo "==============================================================================="
	@echo "| 🚀 Starting your agent playground...                                        |"
	@echo "==============================================================================="
	uv run adk web app/agents/ --port 8501 --reload_agents --no_use_local_storage

# ==============================================================================
# Local Development Commands
# ==============================================================================

# Launch local development server with hot-reload
local-backend:
	uv run uvicorn app.fast_api_app:app --host localhost --port $(or $(PORT),8000) --reload

# ==============================================================================
# Backend Deployment Targets
# ==============================================================================

# Deploy the agent remotely
deploy:
	gcloud beta run deploy $(SERVICE_NAME) \
		--source . \
		--port 8080 \
		--iap \
		--no-allow-unauthenticated \
		--region $(PROJECT_LOCATION) \
		--ingress all \
		--service-account $(SERVICE_ACCOUNT) \
		--set-env-vars GOOGLE_GENAI_USE_VERTEXAI=TRUE \
		--set-env-vars GOOGLE_CLOUD_PROJECT=$(PROJECT_ID) \
		--set-env-vars GOOGLE_CLOUD_LOCATION=$(PROJECT_LOCATION) \
		--set-env-vars SERVICE_ACCOUNT=$(SERVICE_ACCOUNT) \
		--set-env-vars HOST_URL=${SERVICE_URL} \
		--set-env-vars MODEL_NAME=$(MODEL_NAME) \
		--set-env-vars LOGS_BUCKET_NAME=$(LOGS_BUCKET_NAME) \
		--set-env-vars OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=true \
		--memory "4Gi" \
		--no-cpu-throttling \
		--min 1
		@echo "Adding IAP binding..."
		gcloud beta iap web add-iam-policy-binding \
			--member domain:$(DOMAIN) \
			--role roles/iap.httpsResourceAccessor \
			--region $(PROJECT_LOCATION) \
			--resource-type cloud-run \
			--service $(SERVICE_NAME) \
			--condition None

set-iap:
	gcloud beta iap web add-iam-policy-binding \
		--member domain:$(DOMAIN) \
		--role roles/iap.httpsResourceAccessor \
		--region $(PROJECT_LOCATION) \
		--resource-type cloud-run \
		--service $(SERVICE_NAME) \
		--condition None

# Alias for 'make deploy' for backward compatibility
backend: deploy

# ==============================================================================
# Testing & Code Quality
# ==============================================================================

# Run unit and integration tests
test:
	uv sync --dev
	uv run pytest tests/unit && uv run pytest tests/integration

# ==============================================================================
# Agent Evaluation
# ==============================================================================

# Run agent evaluation using ADK eval
# Usage: make eval [EVALSET=tests/eval/evalsets/basic.evalset.json] [EVAL_CONFIG=tests/eval/eval_config.json]
eval:
	@echo "==============================================================================="
	@echo "| Running Agent Evaluation                                                    |"
	@echo "==============================================================================="
	uv sync --dev --extra eval
	uv run adk eval ./app/agents/loan_drawdown_agent $${EVALSET:-tests/eval/evalsets/basic.evalset.json} \
		$(if $(EVAL_CONFIG),--config_file_path=$(EVAL_CONFIG),$(if $(wildcard tests/eval/eval_config.json),--config_file_path=tests/eval/eval_config.json,))

# Run evaluation with all evalsets
eval-all:
	@echo "==============================================================================="
	@echo "| Running All Evalsets                                                        |"
	@echo "==============================================================================="
	@for evalset in tests/eval/evalsets/*.evalset.json; do \
		echo ""; \
		echo "▶ Running: $$evalset"; \
		$(MAKE) eval EVALSET=$$evalset || exit 1; \
	done
	@echo ""
	@echo "✅ All evalsets completed"

# Run code quality checks (codespell, ruff, ty)
lint:
	uv sync --dev --extra lint
	uv run codespell
	uv run ruff check . --diff
	uv run ruff format . --check --diff
	uv run ty check .