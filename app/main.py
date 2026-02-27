# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os
from logging import getLogger

# Suppress gRPC C-library info messages (fork warnings, etc.)
os.environ.setdefault("GRPC_VERBOSITY", "ERROR")

import uvicorn
from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from google.adk.cli.fast_api import get_fast_api_app

logger = getLogger(__name__)
logger.setLevel(os.getenv("LOG_LEVEL", "INFO"))


# --- Main FastAPI Application ---
app = FastAPI()

# --- ADK App Integration ---
# The `get_fast_api_app` function from the ADK library creates the FastAPI app
# with all the necessary endpoints for agent interaction (/run_sse, /sessions, etc.).
# We need to tell it where our agent code lives.
agent_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "agents")

# Artifact bucket for ADK
artifacts_bucket = os.environ.get("ARTIFACTS_BUCKET")
allow_origins = os.environ.get("ALLOW_ORIGINS", "*").split(",")
artifact_service_uri = f"gs://{artifacts_bucket}" if artifacts_bucket else None

# Create the ADK app. We disable the built-in web UI (`web=False`)
# because we are serving our own frontend.
adk_app: FastAPI = get_fast_api_app(
    agents_dir=agent_dir,
    web=False,
    artifact_service_uri=artifact_service_uri,
    use_local_storage=False,
    allow_origins=allow_origins,
    trace_to_cloud=True,
)

# Mount the ADK app at the /api prefix.
# The frontend makes requests to /api/..., so this routes them to the ADK server.
app.mount("/api", adk_app)

# --- Static File Serving for the Frontend ---
frontend_dist_path = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
)
if not os.path.exists(frontend_dist_path):
    logger.error(f"ERROR: Frontend build directory not found at {frontend_dist_path}.")
    logger.error("Please run 'make build-frontend' to build the frontend.")
else:
    logger.info(f"Serving frontend static files from {frontend_dist_path}")
    # Mount the static files at /app, because the `base` path in vite.config.ts is /app/
    app.mount(
        "/app",
        StaticFiles(directory=frontend_dist_path, html=True),
        name="static-app",
    )


@app.get("/")
async def root_redirect() -> RedirectResponse:
    """
    Redirect the root URL to the frontend application.
    """
    return RedirectResponse(url="/app")


# Main execution
if __name__ == "__main__":
    # To run this file directly for testing:
    # `uvicorn app.main:app --reload --port 8080`
    uvicorn.run(app, host="0.0.0.0", port=8080)
