# Step 1: Your First Agent

## Learning Objectives

- Understand the basic structure of an ADK agent
- Create an `Agent` with a name, model, and instruction
- Use the ADK playground to test your agent interactively

## ADK Concepts

> **Documentation:** [LLM Agents](https://google.github.io/adk-docs/agents/llm-agents/) | [Models](https://google.github.io/adk-docs/agents/models/) | [Web Interface (Playground)](https://google.github.io/adk-docs/runtime/web-interface/)

### Agent

An `Agent` is the core building block in ADK. It wraps an LLM (like Gemini) with an instruction that defines its behavior. The simplest agent needs just three things:

- **name**: A unique identifier for the agent
- **model**: Which LLM to use (e.g., `gemini-2.5-flash`)
- **instruction**: A prompt that tells the agent how to behave

```python
from google.adk.agents import Agent

agent = Agent(
    name="my_agent",
    model="gemini-2.5-flash",
    instruction="You are a helpful assistant.",
)
```

### ADK Playground

The ADK playground is a local web UI that lets you chat with your agent. It automatically discovers agents from a directory and provides a chat interface.

## Prerequisites

Make sure you have completed the initial setup from the root README:

```bash
make install    # Install dependencies
make auth       # Authenticate with Google Cloud
```

Your `.env` file at the project root should contain your GCP configuration (`GOOGLE_GENAI_USE_VERTEXAI`, `GOOGLE_CLOUD_PROJECT`, etc.). All workshop steps share this single `.env` file — no per-step configuration is needed.

## Instructions

### 1. Write the agent instruction

Open `agents/loan_drawdown_agent/agent.py` and fill in the `INSTRUCTION` string. Your instruction should:

- Tell the agent it is a "Loan Drawdown Assistant"
- Explain it helps users process loan drawdown requests from invoices
- Ask users to upload an invoice to get started

### 2. Create the Agent

In the same file, replace `root_agent = None` with an actual `Agent` instance:

```python
root_agent = Agent(
    name="loan_drawdown_agent",
    model=MODEL_NAME,
    instruction=INSTRUCTION,
)
```

The `root_agent` variable name is important — ADK looks for it to identify the entry point.

## Testing

Run the playground pointing at this step:

```bash
make playground STEP=step-01-first-agent
```

Open http://localhost:8501 and try:

- "Hello" — the agent should greet you
- "I want to process a loan drawdown" — the agent should ask for an invoice
- "What can you do?" — the agent should explain its capabilities

## Checkpoint

When done correctly:

- The playground loads without errors
- The agent responds conversationally about loan drawdowns
- The agent asks you to upload an invoice when appropriate

## Solution

If you get stuck, see `solutions/step-01/` for the complete working code.
