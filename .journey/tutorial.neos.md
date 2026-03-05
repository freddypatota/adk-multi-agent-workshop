<walkthrough-metadata>
  <meta name="title" content="Loan Drawdown Agent Workshop" />
  <meta name="description" content="Build a multi-agent loan drawdown processor with the Google Cloud Agent Development Kit (ADK)" />
  <meta name="keywords" content="adk, agents, gemini, vertex ai, cloud run" />
  <meta name="component_id" content="loan-drawdown-agent-workshop" />
</walkthrough-metadata>

# Loan Drawdown Agent Workshop

<walkthrough-tutorial-difficulty difficulty="3"></walkthrough-tutorial-difficulty>
<walkthrough-tutorial-duration duration="60"></walkthrough-tutorial-duration>

## Overview

In this workshop you will build a **multi-agent loan drawdown processor** using the [Google Cloud Agent Development Kit (ADK)](https://google.github.io/adk-docs/).

By the end, you will have:

- Created an LLM agent with instructions and a model
- Built function tools for sanctions checking and financial validation
- Orchestrated sub-agents with `SequentialAgent` and `ParallelAgent`
- Used `AgentTool` and callbacks for controlled delegation
- Injected multimodal file content into LLM requests

**Prerequisites**: a Google Cloud project with billing enabled.

Click **Start** to begin.

## Select your project

<walkthrough-project-setup></walkthrough-project-setup>

Select your GCP project above.

Choose a region that supports Vertex AI (e.g., `us-central1`, `europe-west4`):

```bash
export PROJECT_LOCATION=europe-west4
```

## Configure the Makefile

Set your project and write the values into the Makefile:

```bash
gcloud config set project <walkthrough-project-id/>
sed -i "s|^PROJECT_ID.*|PROJECT_ID       := <walkthrough-project-id/>|" Makefile
sed -i "s|^PROJECT_NUMBER.*|PROJECT_NUMBER   := <walkthrough-project-number/>|" Makefile
sed -i "s|^PROJECT_LOCATION.*|PROJECT_LOCATION := $PROJECT_LOCATION|" Makefile
```

<walkthrough-editor-open-file filePath="Makefile">Verify the Makefile</walkthrough-editor-open-file>

## Install dependencies

Install Python packages, frontend npm packages, and the Firebase CLI.

```bash
make install
```

## Authenticate with Google Cloud

Log in and set your project.

```bash
make auth
```

## Enable required APIs

The workshop uses Vertex AI, Firestore, Cloud Run, and other GCP services. Enable the required APIs for your project:

<walkthrough-enable-apis apis=
  "aiplatform.googleapis.com,
  firestore.googleapis.com,
  run.googleapis.com,
  cloudtrace.googleapis.com,
  cloudbuild.googleapis.com,
  logging.googleapis.com,
  iam.googleapis.com">
</walkthrough-enable-apis>

## Generate the backend environment file

Create the `.env` file that ADK agents use for configuration.

```bash
make agent-env
```

This creates a `.env` file at the project root with your GCP project settings.

---

Setup is complete. Now let's build your first agent.

## Step 1: Your First Agent - Concepts

**Learning objectives:**
- Understand the basic structure of an ADK agent
- Create an `Agent` with a name, model, and instruction
- Use the ADK playground to test your agent

### What is an Agent?

An `Agent` wraps an LLM (like Gemini) with an instruction that defines its behavior. The simplest agent needs three things:

- **name**: A unique identifier
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

## Step 1: Write the agent instruction

<walkthrough-editor-select-line filePath="steps/step-01-first-agent/agents/loan_drawdown_agent/agent.py"
                              startLine="4" startCharacterOffset="0"
                              endLine="22" endCharacterOffset="0">Open agent.py and find the TODO comments</walkthrough-editor-select-line>

Fill in the `INSTRUCTION` string. Your instruction should:

- Tell the agent it is a "Loan Drawdown Assistant"
- Explain it helps users process loan drawdown requests from invoices
- Ask users to upload an invoice to get started

<details>
<summary><strong>Hint: INSTRUCTION string</strong></summary>

```python
INSTRUCTION = """
You are the Loan Drawdown Assistant.
Your role is to greet the user and guide them through the loan drawdown process.

Capabilities:
- You can chat with the user to understand their intent.
- If the user wants to process a loan, tell them to upload an invoice file.

Rules:
- Be polite and professional.
- If the user says "Hi" or "Hello", greet them and ask how you can help with their loan drawdown.
- If they ask about loan drawdowns, explain that you can process invoices for approval.
"""
```

</details>

## Step 1: Create the Agent

In the same file, replace `root_agent = None` with an actual `Agent` instance.

The `root_agent` variable name is important &mdash; ADK looks for it to identify the entry point.

<details>
<summary><strong>Hint: root_agent definition</strong></summary>

```python
root_agent = Agent(
    name="loan_drawdown_agent",
    model=MODEL_NAME,
    instruction=INSTRUCTION,
)
```

</details>

## Step 1: Test your agent

Launch the ADK playground pointing at this step:

```bash
make playground STEP=step-01-first-agent
```

Click the <walkthrough-web-preview-icon></walkthrough-web-preview-icon> **Web Preview** button in the Cloud Shell toolbar, then select **Preview on port 8501** to open the playground.

Try these prompts:

- "Hello" &mdash; the agent should greet you
- "I want to process a loan drawdown" &mdash; the agent should ask for an invoice
- "What can you do?" &mdash; the agent should explain its capabilities

### Checkpoint

When done correctly:
- The playground loads without errors
- The agent responds conversationally about loan drawdowns
- The agent asks you to upload an invoice when appropriate

<walkthrough-info-message>If you get stuck, check `solutions/step-01/` for the complete working code.</walkthrough-info-message>

## Step 2: Tools & Structured Output - Concepts

**Learning objectives:**
- Create function tools that agents can call
- Understand how ADK auto-generates tool schemas from Python type hints
- Define Pydantic models for structured data

### Function Tools

Any Python function can become an agent tool. ADK inspects the function's signature, type hints, and docstring to auto-generate the tool schema:

```python
def check_sanctions(vendor_name: str) -> dict:
    """Checks if the vendor is on a sanctions list."""
    return {"status": "PASS", "reason": "Not found"}

agent = Agent(
    name="my_agent",
    model=MODEL_NAME,
    instruction="...",
    tools=[check_sanctions],
)
```

> **Docs:** [Function Tools](https://google.github.io/adk-docs/tools-custom/function-tools/)

## Step 2: Implement check_sanctions

<walkthrough-editor-select-line filePath="steps/step-02-tools/agents/loan_drawdown_agent/tools/compliance_tools.py"
                              startLine="14" startCharacterOffset="0"
                              endLine="24" endCharacterOffset="0">Open compliance_tools.py at the TODO</walkthrough-editor-select-line>

Implement the function body:

1. Normalize the vendor name (`.strip().lower()`)
2. Check against `SANCTIONS_LIST`
3. Return a dict with `check_name`, `status`, `flags`, `reason`

<details>
<summary><strong>Hint: check_sanctions body</strong></summary>

```python
    flags = []
    if vendor_name.strip().lower() in SANCTIONS_LIST:
        flags.append(f"Vendor '{vendor_name}' is on the Sanctions List.")

    status = "FAIL" if flags else "PASS"
    reason = "Sanctions match found." if flags else "Vendor not found in sanctions list."

    return {"check_name": "Sanctions", "status": status, "flags": flags, "reason": reason}
```

</details>

## Step 2: Implement get_financial_context

<walkthrough-editor-select-line filePath="steps/step-02-tools/agents/loan_drawdown_agent/tools/financial_tools.py"
                              startLine="19" startCharacterOffset="0"
                              endLine="31" endCharacterOffset="0">Open financial_tools.py at the TODO</walkthrough-editor-select-line>

Implement the function body:

1. Call `george_service.get_client_exposure(client_id)` to get limits
2. Call `ibh_service.get_rate(currency, target_currency)` for the exchange rate
3. Calculate remaining limit and whether the amount fits
4. Return a dict with all financial context fields

<details>
<summary><strong>Hint: get_financial_context body</strong></summary>

```python
    exposure_data = george_service.get_client_exposure(client_id)
    rate = ibh_service.get_rate(currency, exposure_data["currency"])
    converted_amount = invoice_amount * rate

    approved = exposure_data["approved_limit"]
    current = exposure_data["current_exposure"]
    remaining = approved - current
    is_within = remaining >= converted_amount

    return {
        "client_id": client_id,
        "currency": exposure_data["currency"],
        "approved_limit": approved,
        "current_exposure": current,
        "remaining_limit": remaining,
        "invoice_amount_converted": converted_amount,
        "conversion_rate": rate,
        "is_within_limit": is_within,
    }
```

</details>

## Step 2: Define Pydantic models

<walkthrough-editor-select-line filePath="steps/step-02-tools/agents/loan_drawdown_agent/schemas/data_models.py"
                              startLine="5" startCharacterOffset="0"
                              endLine="36" endCharacterOffset="0">Open data_models.py at the TODO</walkthrough-editor-select-line>

Define:

- `ComplianceCheckResult` &mdash; with `check_name`, `status`, `flags`, `reason`
- `FinancialContext` &mdash; with `client_id`, `currency`, limits, and conversion info

<details>
<summary><strong>Hint: Pydantic models</strong></summary>

```python
from typing import Literal

from pydantic import BaseModel, Field


class ComplianceCheckResult(BaseModel):
    check_name: Literal["Sanctions", "Prohibited Goods"] = Field(
        ..., description="Name of the check"
    )
    status: Literal["PASS", "FAIL", "FLAGGED"] = Field(
        ..., description="Whether the check passed, failed, or is inconclusive"
    )
    flags: list[str] = Field(
        default_factory=list, description="List of specific flags or findings"
    )
    reason: str = Field(..., description="Explanation for the status")


class FinancialContext(BaseModel):
    client_id: str
    currency: str = Field("RON", description="Currency of the credit limit")
    approved_limit: float
    current_exposure: float
    remaining_limit: float
    invoice_amount_converted: float
    conversion_rate: float
    is_within_limit: bool
```

</details>

## Step 2: Connect tools to the agent

<walkthrough-editor-select-line filePath="steps/step-02-tools/agents/loan_drawdown_agent/agent.py"
                              startLine="19" startCharacterOffset="0"
                              endLine="27" endCharacterOffset="0">Open agent.py at the TODO</walkthrough-editor-select-line>

- Import your tool functions
- Add `tools=[check_sanctions, get_financial_context]` to the Agent

<details>
<summary><strong>Hint: agent.py imports and tools</strong></summary>

```python
from .tools.compliance_tools import check_sanctions
from .tools.financial_tools import get_financial_context
```

Then add to the Agent constructor:

```python
    tools=[check_sanctions, get_financial_context],
```

</details>

## Step 2: Test your tools

```bash
make playground STEP=step-02-tools
```

Use <walkthrough-web-preview-icon></walkthrough-web-preview-icon> **Web Preview** on port 8501 and try these prompts:

- "Check if 'Acme Corp' is sanctioned" &mdash; should return PASS
- "Check if 'BadActor Corp' is sanctioned" &mdash; should return FAIL
- "Check credit for client demo_client_001 with amount 50000 EUR" &mdash; should call get_financial_context

### Checkpoint

- Both tools are callable from the playground
- Sanctions check correctly identifies sanctioned vendors
- Financial context returns meaningful limit and conversion data

<walkthrough-info-message>If you get stuck, check `solutions/step-02/` for the complete working code.</walkthrough-info-message>

## Step 3: Multi-Agent Workflow - Concepts

**Learning objectives:**
- Break a monolithic agent into specialized sub-agents
- Use `SequentialAgent` to run agents in order
- Use `ParallelAgent` to run agents concurrently
- Understand `output_key` for passing data between agents via session state

### SequentialAgent

Runs sub-agents one after another:

```python
from google.adk.agents import SequentialAgent

pipeline = SequentialAgent(
    name="my_pipeline",
    sub_agents=[step_1, step_2, step_3],
)
```

### ParallelAgent

Runs sub-agents concurrently:

```python
from google.adk.agents import ParallelAgent

parallel = ParallelAgent(
    name="validation",
    sub_agents=[check_a, check_b, check_c],
)
```

### output_key & State

When an agent has `output_key="my_result"`, its output is saved to `state["my_result"]`. Other agents reference it using `{my_result?}`.

> **Docs:** [Multi-Agent Systems](https://google.github.io/adk-docs/agents/multi-agents/) | [State](https://google.github.io/adk-docs/sessions/state/)

## Step 3: Create sub-agents

Open each file in `sub_agents/` and create the Agent. Follow the TODO comments for the correct parameters.

**Extraction Agent** &mdash; `output_key="extracted_invoice"`, `output_schema=InvoiceData`

<walkthrough-editor-select-line filePath="steps/step-03-multi-agent/agents/loan_drawdown_agent/sub_agents/extraction_agent.py"
                              startLine="6" startCharacterOffset="0"
                              endLine="22" endCharacterOffset="0">Open extraction_agent.py at the TODO</walkthrough-editor-select-line>

<details>
<summary><strong>Hint: extraction_agent</strong></summary>

```python
extraction_agent = Agent(
    name="extraction_agent",
    model=MODEL_NAME,
    instruction=EXTRACTION_INSTRUCTION,
    output_key="extracted_invoice",
    output_schema=InvoiceData,
)
```

</details>

**Sanctions Agent** &mdash; `tools=[check_sanctions]`, `output_key="sanctions_result"`

<walkthrough-editor-select-line filePath="steps/step-03-multi-agent/agents/loan_drawdown_agent/sub_agents/sanctions_agent.py"
                              startLine="7" startCharacterOffset="0"
                              endLine="20" endCharacterOffset="0">Open sanctions_agent.py at the TODO</walkthrough-editor-select-line>

<details>
<summary><strong>Hint: sanctions_agent</strong></summary>

```python
sanctions_agent = Agent(
    name="sanctions_agent",
    model=MODEL_NAME,
    instruction=SANCTIONS_INSTRUCTION,
    tools=[check_sanctions],
    output_key="sanctions_result",
    output_schema=ComplianceCheckResult,
    include_contents="none",
)
```

</details>

**Prohibited Goods Agent** &mdash; `tools=[prohibited_goods_rag]`, `output_key="prohibited_goods_result"`

<walkthrough-editor-select-line filePath="steps/step-03-multi-agent/agents/loan_drawdown_agent/sub_agents/prohibited_goods_agent.py"
                              startLine="7" startCharacterOffset="0"
                              endLine="16" endCharacterOffset="0">Open prohibited_goods_agent.py at the TODO</walkthrough-editor-select-line>

<details>
<summary><strong>Hint: prohibited_goods_agent</strong></summary>

```python
prohibited_goods_agent = Agent(
    name="prohibited_goods_agent",
    model=MODEL_NAME,
    instruction=PROHIBITED_GOODS_INSTRUCTION,
    tools=[prohibited_goods_rag],
    output_key="prohibited_goods_result",
    output_schema=ComplianceCheckResult,
    include_contents="none",
)
```

</details>

**Credit Ceiling Agent** &mdash; `tools=[get_financial_context]`, `output_key="financial_context"`

<walkthrough-editor-select-line filePath="steps/step-03-multi-agent/agents/loan_drawdown_agent/sub_agents/credit_ceiling_agent.py"
                              startLine="7" startCharacterOffset="0"
                              endLine="15" endCharacterOffset="0">Open credit_ceiling_agent.py at the TODO</walkthrough-editor-select-line>

<details>
<summary><strong>Hint: credit_ceiling_agent</strong></summary>

```python
credit_ceiling_agent = Agent(
    name="credit_ceiling_agent",
    model=MODEL_NAME,
    instruction=FINANCIAL_INSTRUCTION,
    tools=[get_financial_context],
    output_key="financial_context",
    output_schema=FinancialContext,
    include_contents="none",
)
```

</details>

**Decision Agent** &mdash; `output_key="validation_report"`, `output_schema=ValidationReport`

<walkthrough-editor-select-line filePath="steps/step-03-multi-agent/agents/loan_drawdown_agent/sub_agents/decision_agent.py"
                              startLine="6" startCharacterOffset="0"
                              endLine="14" endCharacterOffset="0">Open decision_agent.py at the TODO</walkthrough-editor-select-line>

<details>
<summary><strong>Hint: decision_agent</strong></summary>

```python
decision_agent = Agent(
    name="decision_agent",
    model=MODEL_NAME,
    instruction=DECISION_INSTRUCTION,
    output_key="validation_report",
    output_schema=ValidationReport,
    include_contents="none",
)
```

</details>

## Step 3: Wire the workflow

<walkthrough-editor-select-line filePath="steps/step-03-multi-agent/agents/loan_drawdown_agent/agent.py"
                              startLine="5" startCharacterOffset="0"
                              endLine="26" endCharacterOffset="0">Open agent.py at the TODO comments</walkthrough-editor-select-line>

1. Import the sub-agents
2. Create `validation_layer` (ParallelAgent) with the 3 validation agents
3. Create `loan_process` (SequentialAgent): extraction &rarr; validation_layer &rarr; decision
4. Set `root_agent`'s `sub_agents=[loan_process]`

Don't forget to export your sub-agents in `sub_agents/__init__.py`.

<details>
<summary><strong>Hint: sub_agents/__init__.py</strong></summary>

```python
from .credit_ceiling_agent import credit_ceiling_agent
from .decision_agent import decision_agent
from .extraction_agent import extraction_agent
from .prohibited_goods_agent import prohibited_goods_agent
from .sanctions_agent import sanctions_agent
```

</details>

<details>
<summary><strong>Hint: agent.py wiring</strong></summary>

```python
from google.adk.agents import Agent, ParallelAgent, SequentialAgent
from .sub_agents import (
    credit_ceiling_agent, decision_agent, extraction_agent,
    prohibited_goods_agent, sanctions_agent,
)
```

```python
validation_layer = ParallelAgent(
    name="validation_layer",
    sub_agents=[prohibited_goods_agent, sanctions_agent, credit_ceiling_agent],
)

loan_process = SequentialAgent(
    name="loan_process",
    sub_agents=[extraction_agent, validation_layer, decision_agent],
)

root_agent = Agent(
    name="loan_drawdown_agent",
    model=MODEL_NAME,
    instruction=ROOT_ORCHESTRATOR_INSTRUCTION,
    sub_agents=[loan_process],
)
```

</details>

## Step 3: Test multi-agent workflow

```bash
make playground STEP=step-03-multi-agent
```

Use <walkthrough-web-preview-icon></walkthrough-web-preview-icon> **Web Preview** on port 8501 and try: "Process a loan drawdown for vendor 'Acme Corp', invoice #123, amount 50000 EUR, items: Office Supplies x10 at 5000 each, client demo_client_001"

### Checkpoint

- The playground shows agent transitions (extraction &rarr; validation &rarr; decision)
- Each agent produces structured output stored in state
- The root agent summarizes the final decision

<walkthrough-info-message>If you get stuck, check `solutions/step-03/` for the complete working code.</walkthrough-info-message>

## Step 4: AgentTool & Callbacks - Concepts

**Learning objectives:**
- Understand the difference between `sub_agents` and `AgentTool`
- Use `before_agent_callback` to run logic before each agent invocation
- Detect file uploads from session events

### AgentTool vs sub_agents

**`sub_agents`** &mdash; Automatic delegation. The LLM doesn't control when it happens.

**`AgentTool`** &mdash; Wraps an agent as a tool. The root agent's LLM decides when to call it.

```python
from google.adk.tools.agent_tool import AgentTool

root_agent = Agent(
    name="root",
    tools=[AgentTool(agent=loan_process)],
)
```

### before_agent_callback

Runs before each agent invocation. Useful for detecting file uploads and updating session state.

> **Docs:** [Callbacks](https://google.github.io/adk-docs/callbacks/) | [Events](https://google.github.io/adk-docs/events/)

## Step 4: Implement the file upload callback

<walkthrough-editor-select-line filePath="steps/step-04-agent-tool/agents/loan_drawdown_agent/callbacks/file_upload_callback.py"
                              startLine="12" startCharacterOffset="0"
                              endLine="27" endCharacterOffset="0">Open file_upload_callback.py at the TODO</walkthrough-editor-select-line>

Implement the event scanning logic:

1. Iterate `callback_context.session.events` in reverse
2. Find the latest user event
3. Check each part for `inline_data` or `file_data`
4. Update state with `has_uploaded_file` and `uploaded_file_details`

<details>
<summary><strong>Hint: file_upload_callback body</strong></summary>

```python
async def file_upload_callback(callback_context: CallbackContext) -> None:
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
```

</details>

## Step 4: Switch to AgentTool

<walkthrough-editor-select-line filePath="steps/step-04-agent-tool/agents/loan_drawdown_agent/agent.py"
                              startLine="23" startCharacterOffset="0"
                              endLine="41" endCharacterOffset="0">Open agent.py at the TODO</walkthrough-editor-select-line>

1. Import `AgentTool` from `google.adk.tools.agent_tool`
2. Import `file_upload_callback`
3. Change `sub_agents=[loan_process]` to `tools=[AgentTool(agent=loan_process)]`
4. Add `before_agent_callback=file_upload_callback`

<details>
<summary><strong>Hint: agent.py with AgentTool</strong></summary>

```python
from google.adk.tools.agent_tool import AgentTool
from .callbacks.file_upload_callback import file_upload_callback
```

```python
root_agent = Agent(
    name="loan_drawdown_agent",
    model=MODEL_NAME,
    instruction=ROOT_ORCHESTRATOR_INSTRUCTION,
    before_agent_callback=file_upload_callback,
    tools=[AgentTool(agent=loan_process)],
)
```

</details>

## Step 4: Test AgentTool

```bash
make playground STEP=step-04-agent-tool
```

Use <walkthrough-web-preview-icon></walkthrough-web-preview-icon> **Web Preview** on port 8501 and try:

- "Hello" &mdash; agent greets you and asks for an invoice
- Upload a file &mdash; agent should detect it and offer to process
- "Process the loan" &mdash; agent calls loan_process tool

### Checkpoint

- Agent only processes loans after detecting a file upload
- State shows `has_uploaded_file: True` after upload
- The workflow runs via tool call, not automatic delegation

<walkthrough-info-message>Notice the extraction may return missing data! The sub-agents can't "see" the actual file bytes when called via AgentTool. We fix this in Step 5.</walkthrough-info-message>

<walkthrough-info-message>If you get stuck, check `solutions/step-04/` for the complete working code.</walkthrough-info-message>

## Step 5: File Handling - Concepts

**Learning objectives:**
- Use `before_model_callback` to modify the LLM request before it's sent
- Inject multimodal content (files) into an LLM context
- Add batch processing support with wrapper schemas

### Why file injection is needed

When the root agent delegates to `loan_process` via `AgentTool`, the sub-agents run in a scoped context and can't see the raw file bytes. The `inject_invoice_content` callback bridges this gap by injecting file content directly into the LLM request.

### before_model_callback

Runs before each LLM call. It receives the `LlmRequest` and can modify contents before they're sent to the model.

> **Docs:** [Callbacks](https://google.github.io/adk-docs/callbacks/) | [Artifacts](https://google.github.io/adk-docs/artifacts/)

## Step 5: Implement inject_invoice_content

<walkthrough-editor-select-line filePath="steps/step-05-file-handling/agents/loan_drawdown_agent/callbacks/inject_invoice_content.py"
                              startLine="47" startCharacterOffset="0"
                              endLine="95" endCharacterOffset="0">Open inject_invoice_content.py at the TODO</walkthrough-editor-select-line>

Implement:

1. Load artifacts by key (try/except for failures)
2. Fallback: reconstruct Parts from `_raw_invoice_files` in state
3. Append the file parts + a text label to `llm_request.contents`

<details>
<summary><strong>Hint: inject_invoice_content body</strong></summary>

```python
async def inject_invoice_content(
    callback_context: CallbackContext, llm_request: LlmRequest
) -> None:
    artifact_keys = callback_context.state.get("invoice_artifact_keys", [])
    raw_files = callback_context.state.get("_raw_invoice_files", [])

    parts: list[types.Part] = []

    for key in artifact_keys:
        try:
            part = await callback_context.load_artifact(key)
            if part is not None:
                parts.append(part)
        except Exception:
            logger.debug("Artifact load failed for %s", key)

    if not parts and raw_files:
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
    return None
```

</details>

## Step 5: Connect to extraction_agent

<walkthrough-editor-select-line filePath="steps/step-05-file-handling/agents/loan_drawdown_agent/sub_agents/extraction_agent.py"
                              startLine="4" startCharacterOffset="0"
                              endLine="19" endCharacterOffset="0">Open extraction_agent.py at the TODO</walkthrough-editor-select-line>

- Import `inject_invoice_content`
- Add `before_model_callback=inject_invoice_content` to the Agent

<details>
<summary><strong>Hint: extraction_agent with callback</strong></summary>

```python
from ..callbacks.inject_invoice_content import inject_invoice_content
from ..schemas.data_models import InvoiceBatch
```

```python
extraction_agent = Agent(
    name="extraction_agent",
    model=MODEL_NAME,
    instruction=EXTRACTION_INSTRUCTION,
    output_key="extracted_invoice",
    output_schema=InvoiceBatch,
    before_model_callback=inject_invoice_content,
)
```

</details>

## Step 5: Add batch processing schemas

<walkthrough-editor-select-line filePath="steps/step-05-file-handling/agents/loan_drawdown_agent/schemas/data_models.py"
                              startLine="58" startCharacterOffset="0"
                              endLine="80" endCharacterOffset="0">Open data_models.py at the TODO</walkthrough-editor-select-line>

Define 4 batch wrapper models:

| Wrapper | Wraps | Field name |
|---|---|---|
| `InvoiceBatch` | `list[InvoiceData]` | `invoices` |
| `ComplianceBatchResult` | `list[ComplianceCheckResult]` | `results` |
| `FinancialBatchContext` | `list[FinancialContext]` | `results` |
| `BatchValidationReport` | `list[ValidationReport]` | `reports` |

<details>
<summary><strong>Hint: batch wrapper models</strong></summary>

```python
class InvoiceBatch(BaseModel):
    invoices: list[InvoiceData] = Field(
        ..., description="List of extracted invoices, one per uploaded file"
    )


class ComplianceBatchResult(BaseModel):
    results: list[ComplianceCheckResult] = Field(
        ..., description="One compliance result per invoice, in the same order"
    )


class FinancialBatchContext(BaseModel):
    results: list[FinancialContext] = Field(
        ..., description="One financial context per invoice, in the same order"
    )


class BatchValidationReport(BaseModel):
    reports: list[ValidationReport] = Field(
        ..., description="One validation report per invoice, in the same order"
    )
```

</details>

## Step 5: Update sub-agents for batch processing

Update each sub-agent's `output_schema` to the batch wrapper. Look for `TODO(workshop)` comments in each file.

Then update the prompts to tell each agent to process **all** invoices, not just one.

<walkthrough-editor-select-line filePath="steps/step-05-file-handling/agents/loan_drawdown_agent/config/prompts.py"
                              startLine="0" startCharacterOffset="0"
                              endLine="5" endCharacterOffset="0">Open prompts.py</walkthrough-editor-select-line>

## Step 5: Test in the playground

```bash
make playground STEP=step-05-file-handling
```

Use <walkthrough-web-preview-icon></walkthrough-web-preview-icon> **Web Preview** on port 8501 to open the playground. Upload an invoice file and verify the extraction returns real data.

### Checkpoint

- Uploading an invoice extracts real data (not hallucinated)
- All workflow stages complete: extraction, sanctions, prohibited goods, credit ceiling, decision
- Uploading multiple invoices produces per-invoice results with batch schemas

<walkthrough-info-message>If you get stuck, check `solutions/step-05/` for the complete working code. The final application is in `app/`.</walkthrough-info-message>

## Congratulations

<walkthrough-conclusion-trophy></walkthrough-conclusion-trophy>

You've built a complete multi-agent loan drawdown processor!

### What you learned

- **Agent basics**: Creating agents with names, models, and instructions
- **Function tools**: Python functions as LLM-callable tools with auto-generated schemas
- **Multi-agent orchestration**: `SequentialAgent` and `ParallelAgent` for workflows
- **AgentTool & callbacks**: Controlled delegation with `before_agent_callback`
- **File injection**: `before_model_callback` for multimodal content handling
- **Batch processing**: Wrapper schemas for processing multiple invoices

### Next steps

- **Try the React frontend**: Run `make local-backend` and `cd frontend && npm run dev` to see the full app with real-time workflow visualization
- Deploy to Cloud Run: `make deploy`
- Explore the [ADK documentation](https://google.github.io/adk-docs/)
- Add more validation agents or custom tools
- Review the evaluation framework in `tests/eval/`
