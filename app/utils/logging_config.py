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

import logging
import sys

# Try to import Google Cloud Logging, but don't fail if strictly local without deps
try:
    import google.cloud.logging
    from google.cloud.logging.handlers import CloudLoggingHandler

    HAS_GOOGLE_CLOUD_LOGGING = True
except ImportError:
    HAS_GOOGLE_CLOUD_LOGGING = False


def setup_logging(level: int = logging.INFO) -> None:
    """Configures logging for the application.

    Detects if running in Google Cloud (Cloud Run) or locally, and configures
    logging accordingly.

    - **Local**: Human-readable format on stderr.
    - **Cloud**: Structured JSON logging compatible with Cloud Logging.
    """
    root_logger = logging.getLogger()
    root_logger.setLevel(level)

    # Remove existing handlers to avoid duplication if setup_logging is called multiple times
    # or if some library added a default handler.
    if root_logger.handlers:
        for handler in root_logger.handlers:
            root_logger.removeHandler(handler)

    if HAS_GOOGLE_CLOUD_LOGGING:
        try:
            client = google.cloud.logging.Client()
            handler = CloudLoggingHandler(client)
            root_logger.addHandler(handler)
            # CloudLoggingHandler automatically handles structured logging
            logging.info("Logging configured for Google Cloud Logging.")
            return
        except Exception as e:
            # Fallback to local logging if Client instantiation fails (e.g. auth issues locally)
            sys.stderr.write(f"Failed to setup Cloud Logging: {e}\n")
            pass

    # Local development / Fallback
    handler = logging.StreamHandler(sys.stderr)
    formatter = logging.Formatter(
        "%(asctime)s [%(levelname)s] %(name)s: %(message)s", datefmt="%Y-%m-%d %H:%M:%S"
    )
    handler.setFormatter(formatter)
    root_logger.addHandler(handler)
    logging.info("Logging configured for local development.")


def get_logger(name: str) -> logging.Logger:
    """Returns a configured logger with the given name."""
    return logging.getLogger(name)
