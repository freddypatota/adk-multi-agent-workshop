import base64

from google.adk.agents.callback_context import CallbackContext
from google.adk.models.llm_request import LlmRequest
from google.genai import types


async def inject_invoice_content(
    callback_context: CallbackContext, llm_request: LlmRequest
) -> None:
    """Before-model callback that injects invoice file content into the LLM request.

    This callback runs before each LLM call on the extraction agent.
    It loads uploaded files and adds them as multimodal content so the
    LLM can actually "see" the file (not just know its name).

    Without this, files uploaded through AgentTool are not visible to
    sub-agents — they only see text from their scoped context.
    """
    artifact_keys = callback_context.state.get("invoice_artifact_keys", [])
    raw_files = callback_context.state.get("_raw_invoice_files", [])

    parts: list[types.Part] = []

    # TODO(workshop): Try loading files from artifacts first.
    # For each key in artifact_keys, call callback_context.load_artifact(key)
    # and append the result to parts if not None.
    #
    # Hint:
    #   for key in artifact_keys:
    #       try:
    #           part = await callback_context.load_artifact(key)
    #           if part is not None:
    #               parts.append(part)
    #       except Exception:
    #           pass

    # TODO(workshop): Fallback — if no artifacts loaded, reconstruct from state.
    # The file_upload_callback stores base64 data in state["_raw_invoice_files"].
    # Reconstruct types.Part objects from this data.
    #
    # Hint:
    #   if not parts and raw_files:
    #       for raw in raw_files:
    #           data = base64.b64decode(raw["data"]) if raw.get("data") else b""
    #           parts.append(types.Part(
    #               inline_data=types.Blob(
    #                   mime_type=raw.get("mime_type", "application/octet-stream"),
    #                   data=data,
    #               )
    #           ))

    if not parts:
        return None

    # TODO(workshop): Append the file parts to the LLM request.
    # Add a text label describing the files, then append as a user Content entry.
    #
    # Hint:
    #   label = "This is the invoice file to extract data from."
    #   parts.append(types.Part(text=label))
    #   llm_request.contents.append(types.Content(role="user", parts=parts))

    return None
