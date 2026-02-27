import base64
import logging

from google.adk.agents.callback_context import CallbackContext

logger = logging.getLogger(__name__)


async def file_upload_callback(callback_context: CallbackContext) -> None:
    """Analyzes the latest user event for uploaded files and stores this in state."""
    files = []
    artifact_keys = []
    raw_files = []
    file_index = 0

    # Only check the most recent user event (iterate in reverse)
    for event in reversed(callback_context.session.events):
        if (
            getattr(event, "role", "") == "user"
            or getattr(event, "author", "") == "user"
        ):
            if getattr(event, "content", None):
                for part in getattr(event.content, "parts", []):
                    if getattr(part, "inline_data", None):
                        display_name = (
                            getattr(part.inline_data, "display_name", None)
                            or f"file_{file_index}"
                        )
                        mime_type = getattr(
                            part.inline_data, "mime_type", "unknown_mime_type"
                        )
                        artifact_key = f"invoice_file_{file_index}_{display_name}"
                        files.append(f"'{display_name}' type: {mime_type}")

                        data = part.inline_data.data
                        if isinstance(data, bytes):
                            data_b64 = base64.b64encode(data).decode("utf-8")
                        else:
                            data_b64 = str(data) if data else ""
                        raw_files.append({"mime_type": mime_type, "data": data_b64})

                        try:
                            await callback_context.save_artifact(artifact_key, part)
                            artifact_keys.append(artifact_key)
                        except ValueError:
                            logger.debug(
                                "Artifact service not available for %s", artifact_key
                            )

                        file_index += 1

                    elif getattr(part, "file_data", None):
                        file_uri = getattr(part.file_data, "file_uri", "uploaded_file")
                        mime_type = getattr(
                            part.file_data, "mime_type", "unknown_mime_type"
                        )
                        uri_name = file_uri.rsplit("/", 1)[-1] or f"file_{file_index}"
                        artifact_key = f"invoice_file_{file_index}_{uri_name}"
                        files.append(f"'{file_uri}' type: {mime_type}")
                        try:
                            await callback_context.save_artifact(artifact_key, part)
                            artifact_keys.append(artifact_key)
                        except ValueError:
                            logger.debug(
                                "Artifact service not available for %s", artifact_key
                            )
                        file_index += 1
            break  # Only process the latest user event

    logger.info("Processed %d file(s): %s", file_index, files)

    if len(files) > 0:
        callback_context.state["has_uploaded_file"] = True
        callback_context.state["uploaded_file_details"] = files
        callback_context.state["invoice_artifact_keys"] = artifact_keys
        callback_context.state["invoice_file_count"] = file_index
        callback_context.state["_raw_invoice_files"] = raw_files
    if "client_id" not in callback_context.state:
        callback_context.state["client_id"] = "demo_client_001"
