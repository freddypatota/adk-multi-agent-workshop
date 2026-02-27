import base64
import logging

from google.adk.agents.callback_context import CallbackContext
from google.adk.models.llm_request import LlmRequest
from google.genai import types

logger = logging.getLogger(__name__)


async def inject_invoice_content(
    callback_context: CallbackContext, llm_request: LlmRequest
) -> None:
    """Before-model callback that injects invoice file content into the LLM request.

    Retrieval priority:
    1. Artifacts (if artifact service is available)
    2. Raw file data stored in state by file_upload_callback (always available)
    """
    artifact_keys = callback_context.state.get("invoice_artifact_keys", [])
    raw_files = callback_context.state.get("_raw_invoice_files", [])

    parts: list[types.Part] = []

    # Try loading from artifacts first
    for key in artifact_keys:
        try:
            part = await callback_context.load_artifact(key)
            if part is not None:
                parts.append(part)
        except Exception:
            logger.debug("Artifact load failed for %s", key)

    # Fallback: reconstruct Parts from raw file data stored in state
    if not parts and raw_files:
        logger.info("Using state fallback for %d file(s)", len(raw_files))
        for raw in raw_files:
            data = base64.b64decode(raw["data"]) if raw.get("data") else b""
            parts.append(
                types.Part(
                    inline_data=types.Blob(
                        mime_type=raw.get("mime_type", "application/octet-stream"),
                        data=data,
                    )
                )
            )

    if not parts:
        return None

    label = (
        "This is the invoice file to extract data from."
        if len(parts) == 1
        else f"These are {len(parts)} uploaded invoice files. Extract data from ALL of them."
    )
    parts.append(types.Part(text=label))

    llm_request.contents.append(types.Content(role="user", parts=parts))
    logger.info("Injected %d file(s) into extraction LLM request", len(parts) - 1)
    return None
