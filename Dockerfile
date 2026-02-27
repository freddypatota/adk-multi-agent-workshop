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

# Stage 1: Build the frontend
FROM node:current-alpine3.22 AS frontend-builder
WORKDIR /app/frontend
COPY frontend/ ./
RUN npm install
# Inject environment variables if available
RUN if [ -f env.production ]; then mv env.production .env; fi
RUN npm run build

# Stage 2: Build the backend
FROM python:3.13-slim AS backend-builder
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Create a non-root user before anything else
RUN adduser --disabled-password --gecos "" --uid 1001 appuser

# Set the working directory in the container
WORKDIR /app
RUN chown appuser:appuser /app

# Switch to non-root user so all files are created with correct ownership
USER appuser

# Copy dependency files
COPY --chown=appuser:appuser pyproject.toml uv.lock ./

# Install dependencies (as appuser, so the venv is owned by appuser)
RUN uv sync --frozen --no-dev

# Enable bytecode compilation
ENV UV_COMPILE_BYTECODE=1
# Allow statements and log messages to immediately appear in the Knative logs
ENV PYTHONUNBUFFERED=1

# Copy the app source code
COPY --chown=appuser:appuser app ./app

# Place executables in the environment at the front of the path
ENV PATH="/app/.venv/bin:$PATH"

# Copy built frontend from the previous stage
COPY --chown=appuser:appuser --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose the port
EXPOSE 8080

# Run the application
CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8080", "app.main:app"]