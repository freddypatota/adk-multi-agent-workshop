# Step 4: AgentTool & Callbacks

## Learning Objectives

- Understand the difference between `sub_agents` (agent transfer) and `AgentTool` (tool call)
- Use `before_agent_callback` to run logic before each agent invocation
- Read session events to detect file uploads
- Manage session state from callbacks

## ADK Concepts

> **Documentation:** [Multi-Agent Systems](https://google.github.io/adk-docs/agents/multi-agents/) | [Callbacks](https://google.github.io/adk-docs/callbacks/) | [Types of Callbacks](https://google.github.io/adk-docs/callbacks/types-of-callbacks/) | [Session & State](https://google.github.io/adk-docs/sessions/state/) | [Events](https://google.github.io/adk-docs/events/)

### AgentTool vs sub_agents

There are two ways to delegate work to other agents:

**`sub_agents`** — Agent transfer. The root agent automatically delegates to sub-agents. The LLM doesn't control when delegation happens.

**`AgentTool`** — Wraps an agent as a tool. The root agent's LLM decides when to call the tool based on its instruction. This gives the root agent more control.

```python
from google.adk.tools.agent_tool import AgentTool

# The LLM decides when to call loan_process based on the instruction
root_agent = Agent(
    name="root",
    tools=[AgentTool(agent=loan_process)],
)
```

### before_agent_callback

A function that runs before each agent invocation. Useful for:

- Detecting file uploads in user messages
- Updating session state
- Saving artifacts

```python
async def my_callback(callback_context: CallbackContext) -> None:
    # Access session events, state, artifacts
    callback_context.state["my_key"] = "my_value"

agent = Agent(
    before_agent_callback=my_callback,
    ...
)
```

### Session State

State is a key-value store shared across all agents in a session. Callbacks can read and write state, and agents can reference state in prompts using `{key?}`.

## Instructions

### 1. Implement the file upload callback

Open `callbacks/file_upload_callback.py` and implement the event scanning logic:

- Iterate `callback_context.session.events` in reverse
- Find the latest user event
- Check each part for `inline_data` or `file_data`
- Update state with `has_uploaded_file` and `uploaded_file_details`

### 2. Switch to AgentTool

Open `agent.py`:

- Import `AgentTool` from `google.adk.tools.agent_tool`
- Import `file_upload_callback`
- Change `sub_agents=[loan_process]` to `tools=[AgentTool(agent=loan_process)]`
- Add `before_agent_callback=file_upload_callback`

## Testing

```bash
make playground STEP=step-04-agent-tool
```

Try:

- "Hello" — agent greets you and asks for an invoice
- Upload a file — agent should detect it and offer to process
- "Process the loan" — agent calls loan_process tool

## Checkpoint

- Agent only processes loans after detecting a file upload
- State shows `has_uploaded_file: True` after upload
- The workflow runs via tool call, not automatic delegation

## Solution

See `solutions/step-04/` for the complete working code.
