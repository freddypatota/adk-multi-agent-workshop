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

    Key data structures (from google.genai.types):

        types.Content(role, parts)
        │   A message in the conversation. The LlmRequest.contents list is
        │   made of Content objects. Each has a role ("user" or "model")
        │   and a list of Parts.
        │
        └── types.Part(text=... | inline_data=... | ...)
            │   A single piece of content inside a Content message.
            │   Exactly one field should be set per Part.
            │   - Part(text="hello")           → text content
            │   - Part(inline_data=Blob(...))  → binary file content
            │
            └── types.Blob(mime_type, data)
                    Binary data (e.g., a PDF or image).
                    - mime_type: str, e.g. "application/pdf", "image/png"
                    - data: bytes, the raw file content

    Documentation:
    - Callbacks: https://google.github.io/adk-docs/callbacks/
    - Artifacts: https://google.github.io/adk-docs/artifacts/
    - Gemini Parts: https://ai.google.dev/gemini-api/docs/text-generation
    """
    artifact_keys = callback_context.state.get("invoice_artifact_keys", [])
    raw_files = callback_context.state.get("_raw_invoice_files", [])

    parts: list[types.Part] = []

    # TODO(workshop): Try loading files from artifacts first.
    # Artifacts are saved by file_upload_callback. load_artifact returns a
    # types.Part with inline_data already set (the file bytes + mime type).
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
    # The file_upload_callback stores base64 data in state["_raw_invoice_files"]
    # as a list of {"mime_type": str, "data": str (base64)}.
    # Reconstruct types.Part objects by decoding the base64 data back to bytes
    # and wrapping it in a Blob inside a Part:
    #
    #   types.Part(inline_data=types.Blob(mime_type="...", data=b"..."))
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
    # Create a types.Content with role="user" containing the file Parts
    # plus a text Part label. Then append it to llm_request.contents so
    # the LLM receives the files as multimodal input.
    #
    # Hint:
    #   label = "This is the invoice file to extract data from."
    #   parts.append(types.Part(text=label))
    #   llm_request.contents.append(types.Content(role="user", parts=parts))

    return None
