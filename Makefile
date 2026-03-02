# ==============================================================================
# Variables
# ==============================================================================

# GCP Project Configuration — update these for your project
PROJECT_ID       := [Your GCP project ID, e.g. my-gcp-project]
PROJECT_NUMBER   := [Your GCP project number, e.g. 123456789012]
PROJECT_LOCATION := [Your GCP region, e.g. europe-west4]
DOMAIN           := [Your authorized domain for IAP, e.g. example.com]
MODEL_NAME       := gemini-2.5-flash
ARTIFACTS_BUCKET := [Your GCS bucket for artifacts, e.g. my-artifacts-bucket]
SERVICE_NAME     := loan-drawdown-adk
SERVICE_ACCOUNT  := $(SERVICE_NAME)-sa@$(PROJECT_ID).iam.gserviceaccount.com
SERVICE_ACCOUNT_DISPLAY_NAME := 'Loan Drawdown Agent Cloud Run Service Account'
SERVICE_URL      := https://$(SERVICE_NAME)-$(PROJECT_NUMBER).$(PROJECT_LOCATION).run.app

# Firebase Configuration — update these for your Firebase project
FIREBASE_API_KEY             := [Your Firebase API key, e.g. AIzaSy...]
FIREBASE_AUTH_DOMAIN         := $(PROJECT_ID).firebaseapp.com
FIREBASE_PROJECT_ID          := $(PROJECT_ID)
FIREBASE_STORAGE_BUCKET      := $(PROJECT_ID).firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID := $(PROJECT_NUMBER)
FIREBASE_APP_ID              := [Your Firebase app ID, e.g. 1:123456789012:web:abc123]

# ==============================================================================
# Installation & Setup
# ==============================================================================

# Install all dependencies (Python, frontend, Firebase CLI)
install:
	@command -v uv >/dev/null 2>&1 || { echo "uv is not installed. Installing uv..."; curl -LsSf https://astral.sh/uv/0.8.13/install.sh | sh; source $$HOME/.local/bin/env; }
	uv sync
	npm --prefix frontend install
	@command -v firebase >/dev/null 2>&1 || { echo "Installing Firebase CLI..."; npm install -g firebase-tools; }

auth: # Authenticate with Google Cloud using gcloud CLI
	gcloud auth application-default login
	gcloud config set project $(PROJECT_ID)
	gcloud auth application-default set-quota-project $(PROJECT_ID)

setup-apis:
	gcloud services enable aiplatform.googleapis.com firestore.googleapis.com run.googleapis.com cloudtrace.googleapis.com cloudbuild.googleapis.com logging.googleapis.com iam.googleapis.com iap.googleapis.com --project $(PROJECT_ID)

# Setup Firebase for frontend authentication
setup-firebase:
	firebase login
	firebase projects:addfirebase $(PROJECT_ID) 2>/dev/null || echo "Firebase already enabled for $(PROJECT_ID)"
	@echo ""
	@echo "Next steps (manual in Firebase Console):"
	@echo "  1. Go to https://console.firebase.google.com/project/$(PROJECT_ID)/authentication"
	@echo "  2. Click 'Get started' to enable Authentication"
	@echo "  3. Enable 'Email/Password' and 'Google' sign-in providers"
	@echo "  4. Go to Settings > Authorized domains and add your Cloud Run domain:"
	@echo "     $(SERVICE_NAME)-$(PROJECT_NUMBER).$(PROJECT_LOCATION).run.app"
	@echo "  5. Run 'make frontend-env' to generate frontend/.env from Makefile variables"

# Generate root .env for ADK agents from Makefile variables
agent-env:
	@echo 'GOOGLE_GENAI_USE_VERTEXAI="TRUE"' > .env
	@echo 'GOOGLE_CLOUD_PROJECT="$(PROJECT_ID)"' >> .env
	@echo 'GOOGLE_CLOUD_LOCATION="$(PROJECT_LOCATION)"' >> .env
	@echo 'MODEL_NAME="$(MODEL_NAME)"' >> .env
	@echo "Generated .env"

# Generate frontend/.env from Makefile Firebase variables
frontend-env:
	@echo "VITE_FIREBASE_API_KEY=$(FIREBASE_API_KEY)" > frontend/.env
	@echo "VITE_FIREBASE_AUTH_DOMAIN=$(FIREBASE_AUTH_DOMAIN)" >> frontend/.env
	@echo "VITE_FIREBASE_PROJECT_ID=$(FIREBASE_PROJECT_ID)" >> frontend/.env
	@echo "VITE_FIREBASE_STORAGE_BUCKET=$(FIREBASE_STORAGE_BUCKET)" >> frontend/.env
	@echo "VITE_FIREBASE_MESSAGING_SENDER_ID=$(FIREBASE_MESSAGING_SENDER_ID)" >> frontend/.env
	@echo "VITE_FIREBASE_APP_ID=$(FIREBASE_APP_ID)" >> frontend/.env
	@echo "Generated frontend/.env"

setup-sa: ## Create or Update Service Account and grant necessary roles
	@echo "Checking service account $(SERVICE_ACCOUNT)..."
	@if gcloud iam service-accounts describe $(SERVICE_ACCOUNT) --project $(PROJECT_ID) >/dev/null 2>&1; then \
		echo "Service account exists. Updating..."; \
		gcloud iam service-accounts update $(SERVICE_ACCOUNT) --display-name "$(SERVICE_ACCOUNT_DISPLAY_NAME)" --project $(PROJECT_ID) --quiet >/dev/null; \
	else \
		echo "Creating service account..."; \
		gcloud iam service-accounts create $(shell echo $(SERVICE_ACCOUNT) | cut -d@ -f1) \
			--display-name "$(SERVICE_ACCOUNT_DISPLAY_NAME)" \
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
	@gcloud storage buckets add-iam-policy-binding gs://$(ARTIFACTS_BUCKET) --member="serviceAccount:$(SERVICE_ACCOUNT)" --role="roles/storage.objectAdmin" --quiet >/dev/null
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
# Usage: make playground                           (runs final app)
#        make playground STEP=step-01-first-agent   (runs a workshop step)
#        make playground STEP=step-02-tools          etc.
playground:
	@echo "==============================================================================="
	@echo "| 🚀 Starting your agent playground...                                        |"
	@echo "==============================================================================="
ifdef STEP
	@echo "| Workshop step: $(STEP)"
	@echo "==============================================================================="
	uv run adk web steps/$(STEP)/agents/ --port 8501 --reload_agents
else
	uv run adk web app/agents/ --port 8501 --reload_agents --no_use_local_storage
endif

# ==============================================================================
# Local Development Commands
# ==============================================================================

# Launch local development server with hot-reload
local-backend:
	@echo "Agent is running locally at http://localhost:$(or $(PORT),8000)"
	uv run uvicorn app.main:app --host localhost --port $(or $(PORT),8000) --reload

run-agent: local-backend
	
# Build frontend
build-frontend:
	npm --prefix frontend run build

# ==============================================================================
# Backend Deployment Targets
# ==============================================================================

# Deploy the agent remotely
deploy:
	@echo "Generating frontend/env.production..."
	@echo "VITE_FIREBASE_API_KEY=$(FIREBASE_API_KEY)" > frontend/env.production
	@echo "VITE_FIREBASE_AUTH_DOMAIN=$(FIREBASE_AUTH_DOMAIN)" >> frontend/env.production
	@echo "VITE_FIREBASE_PROJECT_ID=$(FIREBASE_PROJECT_ID)" >> frontend/env.production
	@echo "VITE_FIREBASE_STORAGE_BUCKET=$(FIREBASE_STORAGE_BUCKET)" >> frontend/env.production
	@echo "VITE_FIREBASE_MESSAGING_SENDER_ID=$(FIREBASE_MESSAGING_SENDER_ID)" >> frontend/env.production
	@echo "VITE_FIREBASE_APP_ID=$(FIREBASE_APP_ID)" >> frontend/env.production
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
		--set-env-vars HOST_URL=$(SERVICE_URL) \
		--set-env-vars MODEL_NAME=$(MODEL_NAME) \
		--set-env-vars ARTIFACTS_BUCKET=$(ARTIFACTS_BUCKET) \
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
			@rm frontend/env.production
	@echo "Cleaned up frontend/env.production"

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
deploy-agent: deploy

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
# Usage: make eval [EVALSET=tests/eval/evalsets/basic_eval.evalset.json] [EVAL_CONFIG=tests/eval/eval_config.json]
eval:
	@echo "==============================================================================="
	@echo "| Running Agent Evaluation                                                    |"
	@echo "==============================================================================="
	uv sync --dev --extra eval
	uv run adk eval ./app/agents/loan_drawdown_agent $${EVALSET:-tests/eval/evalsets/basic_eval.evalset.json} \
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

# ==============================================================================
# Windows Targets (PowerShell)
# ==============================================================================
# These targets use PowerShell and are intended for Windows users.
# Usage: make install-win, make agent-env-win, etc.
# Prerequisites: PowerShell 5+, uv, Node.js, gcloud CLI installed.

install-win:
	@powershell -Command "if (-not (Get-Command uv -ErrorAction SilentlyContinue)) { Write-Host 'Installing uv...'; irm https://astral.sh/uv/install.ps1 | iex }"
	uv sync
	npm --prefix frontend install
	@powershell -Command "if (-not (Get-Command firebase -ErrorAction SilentlyContinue)) { npm install -g firebase-tools }"

agent-env-win:
	@powershell -Command "Set-Content -Path .env -Value @('GOOGLE_GENAI_USE_VERTEXAI=\"TRUE\"','GOOGLE_CLOUD_PROJECT=\"$(PROJECT_ID)\"','GOOGLE_CLOUD_LOCATION=\"$(PROJECT_LOCATION)\"','MODEL_NAME=\"$(MODEL_NAME)\"'); Write-Host 'Generated .env'"

frontend-env-win:
	@powershell -Command "Set-Content -Path frontend/.env -Value @('VITE_FIREBASE_API_KEY=$(FIREBASE_API_KEY)','VITE_FIREBASE_AUTH_DOMAIN=$(FIREBASE_AUTH_DOMAIN)','VITE_FIREBASE_PROJECT_ID=$(FIREBASE_PROJECT_ID)','VITE_FIREBASE_STORAGE_BUCKET=$(FIREBASE_STORAGE_BUCKET)','VITE_FIREBASE_MESSAGING_SENDER_ID=$(FIREBASE_MESSAGING_SENDER_ID)','VITE_FIREBASE_APP_ID=$(FIREBASE_APP_ID)'); Write-Host 'Generated frontend/.env'"

clean-win:
	@powershell -Command "Remove-Item -Recurse -Force -ErrorAction SilentlyContinue .mypy_cache, .ruff_cache, .pytest_cache; Get-ChildItem -Recurse -Directory -Filter '__pycache__' | Remove-Item -Recurse -Force"

kill-win:
	@powershell -Command "8000,8001,8002,8003,8004,8080,8501 | ForEach-Object { Get-NetTCPConnection -LocalPort $$_ -ErrorAction SilentlyContinue } | ForEach-Object { Stop-Process -Id $$_.OwningProcess -Force -ErrorAction SilentlyContinue }"