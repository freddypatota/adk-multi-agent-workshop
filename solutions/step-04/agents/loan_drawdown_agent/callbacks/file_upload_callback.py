from google.adk.agents.callback_context import CallbackContext


async def file_upload_callback(callback_context: CallbackContext) -> None:
    """Analyzes the latest user event for uploaded files and stores this in state."""
    files = []

    for event in reversed(callback_context.session.events):
        if (
            getattr(event, "role", "") == "user"
            or getattr(event, "author", "") == "user"
        ):
            if getattr(event, "content", None):
                for part in getattr(event.content, "parts", []):
                    if getattr(part, "inline_data", None):
                        display_name = getattr(part.inline_data, "display_name", None) or "uploaded_file"
                        mime_type = getattr(part.inline_data, "mime_type", "unknown")
                        files.append(f"'{display_name}' type: {mime_type}")
                    elif getattr(part, "file_data", None):
                        file_uri = getattr(part.file_data, "file_uri", "uploaded_file")
                        mime_type = getattr(part.file_data, "mime_type", "unknown")
                        files.append(f"'{file_uri}' type: {mime_type}")
            break

    if len(files) > 0:
        callback_context.state["has_uploaded_file"] = True
        callback_context.state["uploaded_file_details"] = files
    if "client_id" not in callback_context.state:
        callback_context.state["client_id"] = "demo_client_001"
