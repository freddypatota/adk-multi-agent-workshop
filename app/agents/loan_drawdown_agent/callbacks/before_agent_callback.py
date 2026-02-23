from google.adk.agents.callback_context import CallbackContext


async def before_agent_callback(callback_context: CallbackContext) -> None:
    """Analyzes session events to check for uploaded files and stores this in state."""
    files = []

    for event in callback_context.session.events:
        # Check if author/role is user and it has content
        if (
            getattr(event, "role", "") == "user"
            or getattr(event, "author", "") == "user"
        ):
            if getattr(event, "content", None):
                for part in getattr(event.content, "parts", []):
                    if getattr(part, "inline_data", None):
                        display_name = getattr(
                            part.inline_data, "display_name", "uploaded_file"
                        )
                        mime_type = getattr(
                            part.inline_data, "mime_type", "unknown_mime_type"
                        )
                        files.append(f"'{display_name}' type: {mime_type}")
                        await callback_context.save_artifact(
                            f"invoice_file_{display_name}", part
                        )
                    elif getattr(part, "file_data", None):
                        file_uri = getattr(part.file_data, "file_uri", "uploaded_file")
                        mime_type = getattr(
                            part.file_data, "mime_type", "unknown_mime_type"
                        )
                        files.append(f"'{file_uri}' type: {mime_type}")
                        await callback_context.save_artifact("invoice_file", part)

    has_uploaded_file = len(files) > 0
    callback_context.state["has_uploaded_file"] = "YES" if has_uploaded_file else "NO"
    callback_context.state["uploaded_file_details"] = (
        ", ".join(files) if has_uploaded_file else "None"
    )
