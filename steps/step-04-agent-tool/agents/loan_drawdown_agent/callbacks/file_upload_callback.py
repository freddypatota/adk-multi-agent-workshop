from google.adk.agents.callback_context import CallbackContext


async def file_upload_callback(callback_context: CallbackContext) -> None:
    """Analyzes the latest user event for uploaded files and stores this in state.

    This callback runs before each invocation of the root agent. It scans
    the most recent user message for file attachments (inline_data or file_data)
    and updates session state so the agent knows about uploaded files.
    """
    files = []

    # TODO(workshop): Scan session events for the latest user message with files.
    #
    # Steps:
    # 1. Iterate over callback_context.session.events in reverse
    # 2. Find the latest event where author == "user"
    # 3. Check each part in event.content.parts for inline_data or file_data
    # 4. For inline_data: get display_name and mime_type, add to files list
    # 5. Break after processing the latest user event
    #
    # Hint:
    #   for event in reversed(callback_context.session.events):
    #       if getattr(event, "author", "") == "user":
    #           if getattr(event, "content", None):
    #               for part in getattr(event.content, "parts", []):
    #                   if getattr(part, "inline_data", None):
    #                       display_name = getattr(part.inline_data, "display_name", "file")
    #                       mime_type = getattr(part.inline_data, "mime_type", "unknown")
    #                       files.append(f"'{display_name}' type: {mime_type}")
    #           break

    # TODO(workshop): Update session state with file info.
    # Only update when files are found (to preserve state from earlier uploads).
    #
    # Hint:
    #   if len(files) > 0:
    #       callback_context.state["has_uploaded_file"] = True
    #       callback_context.state["uploaded_file_details"] = files

    # Set default client_id for the demo
    if "client_id" not in callback_context.state:
        callback_context.state["client_id"] = "demo_client_001"
