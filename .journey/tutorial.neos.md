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

## Project setup

<walkthrough-project-setup billing="true"></walkthrough-project-setup>

First, set your project ID and region as environment variables.

```bash
export PROJECT_ID=<walkthrough-project-id/>
export PROJECT_LOCATION=europe-west4
```

Update the Makefile variables with your project details.

<walkthrough-editor-open-file filePath="Makefile">Open the Makefile</walkthrough-editor-open-file>

Replace the placeholder values at the top:

- `PROJECT_ID` with your GCP project ID
- `PROJECT_NUMBER` with your GCP project number
- `PROJECT_LOCATION` with your preferred region (e.g., `europe-west4`)

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

Enable Vertex AI, Firestore, Cloud Run, Cloud Trace, and other required services.

<walkthrough-enable-apis apis="aiplatform.googleapis.com,firestore.googleapis.com,run.googleapis.com,cloudtrace.googleapis.com,cloudbuild.googleapis.com,logging.googleapis.com,iam.googleapis.com"></walkthrough-enable-apis>

```bash
make setup-apis
```

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

<walkthrough-editor-open-file filePath="steps/step-01-first-agent/agents/loan_drawdown_agent/agent.py">Open agent.py</walkthrough-editor-open-file>

Fill in the `INSTRUCTION` string. Your instruction should:

- Tell the agent it is a "Loan Drawdown Assistant"
- Explain it helps users process loan drawdown requests from invoices
- Ask users to upload an invoice to get started

## Step 1: Create the Agent

In the same file, replace `root_agent = None` with an actual `Agent` instance:

```python
root_agent = Agent(
    name="loan_drawdown_agent",
    model=MODEL_NAME,
    instruction=INSTRUCTION,
)
```

The `root_agent` variable name is important &mdash; ADK looks for it to identify the entry point.

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

<walkthrough-editor-open-file filePath="steps/step-02-tools/agents/loan_drawdown_agent/tools/compliance_tools.py">Open compliance_tools.py</walkthrough-editor-open-file>

Implement the function body:

1. Normalize the vendor name (`.strip().lower()`)
2. Check against `SANCTIONS_LIST`
3. Return a dict with `check_name`, `status`, `flags`, `reason`

## Step 2: Implement get_financial_context

<walkthrough-editor-open-file filePath="steps/step-02-tools/agents/loan_drawdown_agent/tools/financial_tools.py">Open financial_tools.py</walkthrough-editor-open-file>

Implement the function body:

1. Call `george_service.get_client_exposure(client_id)` to get limits
2. Call `ibh_service.get_rate(currency, target_currency)` for the exchange rate
3. Calculate remaining limit and whether the amount fits
4. Return a dict with all financial context fields

## Step 2: Define Pydantic models

<walkthrough-editor-open-file filePath="steps/step-02-tools/agents/loan_drawdown_agent/schemas/data_models.py">Open data_models.py</walkthrough-editor-open-file>

Define:

- `ComplianceCheckResult` &mdash; with `check_name`, `status`, `flags`, `reason`
- `FinancialContext` &mdash; with `client_id`, `currency`, limits, and conversion info

## Step 2: Connect tools to the agent

<walkthrough-editor-open-file filePath="steps/step-02-tools/agents/loan_drawdown_agent/agent.py">Open agent.py</walkthrough-editor-open-file>

- Import your tool functions
- Add `tools=[check_sanctions, get_financial_context]` to the Agent

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

<walkthrough-editor-open-file filePath="steps/step-03-multi-agent/agents/loan_drawdown_agent/sub_agents/extraction_agent.py">Open extraction_agent.py</walkthrough-editor-open-file>

**Sanctions Agent** &mdash; `tools=[check_sanctions]`, `output_key="sanctions_result"`

<walkthrough-editor-open-file filePath="steps/step-03-multi-agent/agents/loan_drawdown_agent/sub_agents/sanctions_agent.py">Open sanctions_agent.py</walkthrough-editor-open-file>

**Prohibited Goods Agent** &mdash; `tools=[prohibited_goods_rag]`, `output_key="prohibited_goods_result"`

<walkthrough-editor-open-file filePath="steps/step-03-multi-agent/agents/loan_drawdown_agent/sub_agents/prohibited_goods_agent.py">Open prohibited_goods_agent.py</walkthrough-editor-open-file>

**Credit Ceiling Agent** &mdash; `tools=[get_financial_context]`, `output_key="financial_context"`

<walkthrough-editor-open-file filePath="steps/step-03-multi-agent/agents/loan_drawdown_agent/sub_agents/credit_ceiling_agent.py">Open credit_ceiling_agent.py</walkthrough-editor-open-file>

**Decision Agent** &mdash; `output_key="validation_report"`, `output_schema=ValidationReport`

<walkthrough-editor-open-file filePath="steps/step-03-multi-agent/agents/loan_drawdown_agent/sub_agents/decision_agent.py">Open decision_agent.py</walkthrough-editor-open-file>

## Step 3: Wire the workflow

<walkthrough-editor-open-file filePath="steps/step-03-multi-agent/agents/loan_drawdown_agent/agent.py">Open agent.py</walkthrough-editor-open-file>

1. Import the sub-agents
2. Create `validation_layer` (ParallelAgent) with the 3 validation agents
3. Create `loan_process` (SequentialAgent): extraction &rarr; validation_layer &rarr; decision
4. Set `root_agent`'s `sub_agents=[loan_process]`

Don't forget to export your sub-agents in `sub_agents/__init__.py`.

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

<walkthrough-editor-open-file filePath="steps/step-04-agent-tool/agents/loan_drawdown_agent/callbacks/file_upload_callback.py">Open file_upload_callback.py</walkthrough-editor-open-file>

Implement the event scanning logic:

1. Iterate `callback_context.session.events` in reverse
2. Find the latest user event
3. Check each part for `inline_data` or `file_data`
4. Update state with `has_uploaded_file` and `uploaded_file_details`

## Step 4: Switch to AgentTool

<walkthrough-editor-open-file filePath="steps/step-04-agent-tool/agents/loan_drawdown_agent/agent.py">Open agent.py</walkthrough-editor-open-file>

1. Import `AgentTool` from `google.adk.tools.agent_tool`
2. Import `file_upload_callback`
3. Change `sub_agents=[loan_process]` to `tools=[AgentTool(agent=loan_process)]`
4. Add `before_agent_callback=file_upload_callback`

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

<walkthrough-editor-open-file filePath="steps/step-05-file-handling/agents/loan_drawdown_agent/callbacks/inject_invoice_content.py">Open inject_invoice_content.py</walkthrough-editor-open-file>

Implement:

1. Load artifacts by key (try/except for failures)
2. Fallback: reconstruct Parts from `_raw_invoice_files` in state
3. Append the file parts + a text label to `llm_request.contents`

## Step 5: Connect to extraction_agent

<walkthrough-editor-open-file filePath="steps/step-05-file-handling/agents/loan_drawdown_agent/sub_agents/extraction_agent.py">Open extraction_agent.py</walkthrough-editor-open-file>

- Import `inject_invoice_content`
- Add `before_model_callback=inject_invoice_content` to the Agent

## Step 5: Add batch processing schemas

<walkthrough-editor-open-file filePath="steps/step-05-file-handling/agents/loan_drawdown_agent/schemas/data_models.py">Open data_models.py</walkthrough-editor-open-file>

Define 4 batch wrapper models:

| Wrapper | Wraps | Field name |
|---|---|---|
| `InvoiceBatch` | `list[InvoiceData]` | `invoices` |
| `ComplianceBatchResult` | `list[ComplianceCheckResult]` | `results` |
| `FinancialBatchContext` | `list[FinancialContext]` | `results` |
| `BatchValidationReport` | `list[ValidationReport]` | `reports` |

## Step 5: Update sub-agents for batch processing

Update each sub-agent's `output_schema` to the batch wrapper. Look for `TODO(workshop)` comments in each file.

Then update the prompts to tell each agent to process **all** invoices, not just one.

<walkthrough-editor-open-file filePath="steps/step-05-file-handling/agents/loan_drawdown_agent/config/prompts.py">Open prompts.py</walkthrough-editor-open-file>

## Step 5: Test with the frontend

You've finished the agentic part of the workshop! Now test the complete application.

First, set up Firebase authentication (see the root README for details):

```bash
make setup-firebase
make frontend-env
```

Then run both backend and frontend:

```bash
make local-backend
```

In a second terminal:

```bash
cd frontend && npm run dev
```

Use <walkthrough-web-preview-icon></walkthrough-web-preview-icon> **Web Preview** on port 5173 to open the frontend. Log in, upload an invoice, and watch the workflow dashboard update in real-time.

### Checkpoint

- Uploading an invoice extracts real data (not hallucinated)
- All workflow stages complete successfully
- Multiple invoices produce per-invoice results with batch schemas

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

- Deploy to Cloud Run: `make deploy`
- Explore the [ADK documentation](https://google.github.io/adk-docs/)
- Add more validation agents or custom tools
- Review the evaluation framework in `tests/eval/`
