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

<walkthrough-project-setup></walkthrough-project-setup>

Select your GCP project above, then open the Makefile and update the project variables at the top:

<walkthrough-editor-select-line filePath="Makefile"
                              startLine="5" startCharacterOffset="0"
                              endLine="7" endCharacterOffset="0">Open the Makefile at the project variables</walkthrough-editor-select-line>

- Set `PROJECT_ID` to `<walkthrough-project-id/>`
- Set `PROJECT_LOCATION` to a region that supports Vertex AI (e.g., `europe-west4`)

## Install and configure

Install dependencies:

```bash
make install
```

Authenticate and set the active project:

```bash
gcloud auth application-default login
```

```bash
gcloud config set project <walkthrough-project-id/>
```

```bash
gcloud auth application-default set-quota-project <walkthrough-project-id/>
```

<walkthrough-enable-apis apis="aiplatform.googleapis.com,firestore.googleapis.com,run.googleapis.com,cloudtrace.googleapis.com,cloudbuild.googleapis.com,logging.googleapis.com,iam.googleapis.com"></walkthrough-enable-apis>

Generate the `.env` file for ADK agents:

```bash
make agent-env
```

Setup is complete. Time to build your first agent.

## Step 1: Your First Agent - Concepts

**Learning objectives:**
- Understand the basic structure of an ADK agent
- Create an `Agent` with a name, model, and instruction
- Use the ADK playground to test your agent

An `Agent` wraps an LLM (like Gemini) with an instruction that defines its behavior. The simplest agent needs three things: a **name**, a **model**, and an **instruction**.

```python
from google.adk.agents import Agent

agent = Agent(
    name="my_agent",
    model="gemini-2.5-flash",
    instruction="You are a helpful assistant.",
)
```

> **Docs:** [LLM Agents](https://google.github.io/adk-docs/agents/llm-agents/) | [Models](https://google.github.io/adk-docs/agents/models/) | [Playground](https://google.github.io/adk-docs/runtime/web-interface/)

## Step 1: Files to modify

In this step, edit one file:

- `agent.py` &mdash; define the instruction and create the root agent

## Step 1: agent.py

<walkthrough-editor-select-line filePath="steps/step-01-first-agent/agents/loan_drawdown_agent/agent.py"
                              startLine="4" startCharacterOffset="0"
                              endLine="22" endCharacterOffset="0">Open agent.py</walkthrough-editor-select-line>

1. Fill in the `INSTRUCTION` string: tell the agent it is a "Loan Drawdown Assistant", it helps process loan drawdown requests, and it should ask users to upload an invoice.

2. Replace `root_agent = None` with an `Agent` instance using `name="loan_drawdown_agent"`, `model=MODEL_NAME`, and `instruction=INSTRUCTION`.

<walkthrough-editor-open-file filePath="solutions/step-01/agents/loan_drawdown_agent/agent.py">View solution</walkthrough-editor-open-file>

## Step 1: Test

```bash
make playground STEP=step-01-first-agent
```

Click the <walkthrough-web-preview-icon></walkthrough-web-preview-icon> **Web Preview** button, then select **Preview on port 8501**.

```
Hello
```

```
I want to process a loan drawdown
```

```
What can you do?
```

### Checkpoint

- The playground loads without errors
- The agent responds conversationally about loan drawdowns
- The agent asks you to upload an invoice when appropriate

Press **Ctrl+C** in the terminal to stop the playground before moving on.

## Step 2: Tools & Structured Output - Concepts

**Learning objectives:**
- Create function tools that agents can call
- Understand how ADK auto-generates tool schemas from Python type hints
- Define Pydantic models for structured data

Any Python function can become an agent tool. ADK inspects the function's signature, type hints, and docstring to auto-generate the tool schema for the LLM.

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

> **Docs:** [Function Tools](https://google.github.io/adk-docs/tools-custom/function-tools/) | [Tool Performance](https://google.github.io/adk-docs/tools-custom/performance/)

## Step 2: Files to modify

In this step, edit four files in order:

1. `compliance_tools.py` &mdash; implement the sanctions check tool
2. `financial_tools.py` &mdash; implement the financial context tool
3. `data_models.py` &mdash; define Pydantic models for structured output
4. `agent.py` &mdash; connect the tools to the agent

## Step 2: compliance_tools.py

<walkthrough-editor-select-line filePath="steps/step-02-tools/agents/loan_drawdown_agent/tools/compliance_tools.py"
                              startLine="14" startCharacterOffset="0"
                              endLine="24" endCharacterOffset="0">Open compliance_tools.py</walkthrough-editor-select-line>

Implement the `check_sanctions` function body:

1. Normalize the vendor name (`.strip().lower()`)
2. Check against `SANCTIONS_LIST`
3. Return a dict with `check_name`, `status`, `flags`, `reason`

<walkthrough-editor-open-file filePath="solutions/step-02/agents/loan_drawdown_agent/tools/compliance_tools.py">View solution</walkthrough-editor-open-file>

## Step 2: financial_tools.py

<walkthrough-editor-select-line filePath="steps/step-02-tools/agents/loan_drawdown_agent/tools/financial_tools.py"
                              startLine="19" startCharacterOffset="0"
                              endLine="31" endCharacterOffset="0">Open financial_tools.py</walkthrough-editor-select-line>

Implement the `get_financial_context` function body:

1. Call `george_service.get_client_exposure(client_id)` to get limits
2. Call `ibh_service.get_rate(currency, target_currency)` for the exchange rate
3. Calculate remaining limit and whether the amount fits
4. Return a dict with all financial context fields

<walkthrough-editor-open-file filePath="solutions/step-02/agents/loan_drawdown_agent/tools/financial_tools.py">View solution</walkthrough-editor-open-file>

## Step 2: data_models.py

<walkthrough-editor-select-line filePath="steps/step-02-tools/agents/loan_drawdown_agent/schemas/data_models.py"
                              startLine="5" startCharacterOffset="0"
                              endLine="36" endCharacterOffset="0">Open data_models.py</walkthrough-editor-select-line>

Define two Pydantic models:

- `ComplianceCheckResult` &mdash; with `check_name`, `status`, `flags`, `reason`
- `FinancialContext` &mdash; with `client_id`, `currency`, limits, and conversion info

<walkthrough-editor-open-file filePath="solutions/step-02/agents/loan_drawdown_agent/schemas/data_models.py">View solution</walkthrough-editor-open-file>

## Step 2: agent.py

<walkthrough-editor-select-line filePath="steps/step-02-tools/agents/loan_drawdown_agent/agent.py"
                              startLine="19" startCharacterOffset="0"
                              endLine="27" endCharacterOffset="0">Open agent.py</walkthrough-editor-select-line>

- Import your tool functions
- Add `tools=[check_sanctions, get_financial_context]` to the Agent

<walkthrough-editor-open-file filePath="solutions/step-02/agents/loan_drawdown_agent/agent.py">View solution</walkthrough-editor-open-file>

## Step 2: Test

```bash
make playground STEP=step-02-tools
```

Use <walkthrough-web-preview-icon></walkthrough-web-preview-icon> **Web Preview** on port 8501 and try:

```
Check if 'Acme Corp' is sanctioned
```

Expected: PASS

```
Check if 'BadActor Corp' is sanctioned
```

Expected: FAIL

```
Check credit for client demo_client_001 with amount 50000 EUR
```

### Checkpoint

- Both tools are callable from the playground
- Sanctions check correctly identifies sanctioned vendors
- Financial context returns meaningful limit and conversion data

Press **Ctrl+C** in the terminal to stop the playground before moving on.

## Step 3: Multi-Agent Workflow - Concepts

**Learning objectives:**
- Break a monolithic agent into specialized sub-agents
- Use `SequentialAgent` to run agents in order
- Use `ParallelAgent` to run agents concurrently
- Understand `output_key` for passing data between agents via session state

`SequentialAgent` runs sub-agents one after another. `ParallelAgent` runs them concurrently. When an agent has `output_key="my_result"`, its output is saved to `state["my_result"]`. Other agents reference it using `{my_result?}`.

> **Docs:** [Multi-Agent Systems](https://google.github.io/adk-docs/agents/multi-agents/) | [Sequential Agents](https://google.github.io/adk-docs/agents/workflow-agents/sequential-agents/) | [Parallel Agents](https://google.github.io/adk-docs/agents/workflow-agents/parallel-agents/) | [State](https://google.github.io/adk-docs/sessions/state/)

## Step 3: Files to modify

In this step, edit seven files in order:

1. `extraction_agent.py` &mdash; create the extraction agent
2. `sanctions_agent.py` &mdash; create the sanctions agent
3. `prohibited_goods_agent.py` &mdash; create the prohibited goods agent
4. `credit_ceiling_agent.py` &mdash; create the credit ceiling agent
5. `decision_agent.py` &mdash; create the decision agent
6. `sub_agents/__init__.py` &mdash; export all sub-agents
7. `agent.py` &mdash; wire the workflow with ParallelAgent and SequentialAgent

## Step 3: extraction_agent.py

<walkthrough-editor-select-line filePath="steps/step-03-multi-agent/agents/loan_drawdown_agent/sub_agents/extraction_agent.py"
                              startLine="6" startCharacterOffset="0"
                              endLine="22" endCharacterOffset="0">Open extraction_agent.py</walkthrough-editor-select-line>

Create the Agent with `output_key="extracted_invoice"` and `output_schema=InvoiceData`.

<walkthrough-editor-open-file filePath="solutions/step-03/agents/loan_drawdown_agent/sub_agents/extraction_agent.py">View solution</walkthrough-editor-open-file>

## Step 3: sanctions_agent.py

<walkthrough-editor-select-line filePath="steps/step-03-multi-agent/agents/loan_drawdown_agent/sub_agents/sanctions_agent.py"
                              startLine="7" startCharacterOffset="0"
                              endLine="20" endCharacterOffset="0">Open sanctions_agent.py</walkthrough-editor-select-line>

Create the Agent with `tools=[check_sanctions]`, `output_key="sanctions_result"`, `output_schema=ComplianceCheckResult`, and `include_contents="none"`.

<walkthrough-editor-open-file filePath="solutions/step-03/agents/loan_drawdown_agent/sub_agents/sanctions_agent.py">View solution</walkthrough-editor-open-file>

## Step 3: prohibited_goods_agent.py

<walkthrough-editor-select-line filePath="steps/step-03-multi-agent/agents/loan_drawdown_agent/sub_agents/prohibited_goods_agent.py"
                              startLine="7" startCharacterOffset="0"
                              endLine="16" endCharacterOffset="0">Open prohibited_goods_agent.py</walkthrough-editor-select-line>

Create the Agent with `tools=[prohibited_goods_rag]`, `output_key="prohibited_goods_result"`, and `include_contents="none"`.

<walkthrough-editor-open-file filePath="solutions/step-03/agents/loan_drawdown_agent/sub_agents/prohibited_goods_agent.py">View solution</walkthrough-editor-open-file>

## Step 3: credit_ceiling_agent.py

<walkthrough-editor-select-line filePath="steps/step-03-multi-agent/agents/loan_drawdown_agent/sub_agents/credit_ceiling_agent.py"
                              startLine="7" startCharacterOffset="0"
                              endLine="15" endCharacterOffset="0">Open credit_ceiling_agent.py</walkthrough-editor-select-line>

Create the Agent with `tools=[get_financial_context]`, `output_key="financial_context"`, and `include_contents="none"`.

<walkthrough-editor-open-file filePath="solutions/step-03/agents/loan_drawdown_agent/sub_agents/credit_ceiling_agent.py">View solution</walkthrough-editor-open-file>

## Step 3: decision_agent.py

<walkthrough-editor-select-line filePath="steps/step-03-multi-agent/agents/loan_drawdown_agent/sub_agents/decision_agent.py"
                              startLine="6" startCharacterOffset="0"
                              endLine="14" endCharacterOffset="0">Open decision_agent.py</walkthrough-editor-select-line>

Create the Agent with `output_key="validation_report"`, `output_schema=ValidationReport`, and `include_contents="none"`.

<walkthrough-editor-open-file filePath="solutions/step-03/agents/loan_drawdown_agent/sub_agents/decision_agent.py">View solution</walkthrough-editor-open-file>

## Step 3: __init__.py and agent.py

<walkthrough-editor-select-line filePath="steps/step-03-multi-agent/agents/loan_drawdown_agent/sub_agents/__init__.py"
                              startLine="0" startCharacterOffset="0"
                              endLine="1" endCharacterOffset="0">Open sub_agents/__init__.py</walkthrough-editor-select-line>

Import all 5 sub-agents.

<walkthrough-editor-select-line filePath="steps/step-03-multi-agent/agents/loan_drawdown_agent/agent.py"
                              startLine="5" startCharacterOffset="0"
                              endLine="26" endCharacterOffset="0">Open agent.py</walkthrough-editor-select-line>

1. Import the sub-agents
2. Create `validation_layer` (ParallelAgent) with the 3 validation agents
3. Create `loan_process` (SequentialAgent): extraction &rarr; validation_layer &rarr; decision
4. Set `root_agent`'s `sub_agents=[loan_process]`

<walkthrough-editor-open-file filePath="solutions/step-03/agents/loan_drawdown_agent/agent.py">View solution</walkthrough-editor-open-file>

## Step 3: Test

```bash
make playground STEP=step-03-multi-agent
```

Use <walkthrough-web-preview-icon></walkthrough-web-preview-icon> **Web Preview** on port 8501 and try:

```
Process a loan drawdown for vendor 'Acme Corp', invoice #123, amount 50000 EUR, items: Office Supplies x10 at 5000 each, client demo_client_001
```

### Checkpoint

- The playground shows agent transitions (extraction &rarr; validation &rarr; decision)
- Each agent produces structured output stored in state
- The root agent summarizes the final decision

Press **Ctrl+C** in the terminal to stop the playground before moving on.

## Step 4: AgentTool & Callbacks - Concepts

**Learning objectives:**
- Understand the difference between `sub_agents` and `AgentTool`
- Use `before_agent_callback` to run logic before each agent invocation
- Detect file uploads from session events

**`sub_agents`** &mdash; automatic delegation. **`AgentTool`** &mdash; wraps an agent as a tool so the LLM decides when to call it.

```python
from google.adk.tools.agent_tool import AgentTool

root_agent = Agent(
    name="root",
    tools=[AgentTool(agent=loan_process)],
)
```

> **Docs:** [Multi-Agent Systems](https://google.github.io/adk-docs/agents/multi-agents/) | [Callbacks](https://google.github.io/adk-docs/callbacks/) | [Events](https://google.github.io/adk-docs/events/)

## Step 4: Files to modify

In this step, edit two files:

1. `file_upload_callback.py` &mdash; implement the file upload detection callback
2. `agent.py` &mdash; switch from sub_agents to AgentTool and add the callback

## Step 4: file_upload_callback.py

<walkthrough-editor-select-line filePath="steps/step-04-agent-tool/agents/loan_drawdown_agent/callbacks/file_upload_callback.py"
                              startLine="12" startCharacterOffset="0"
                              endLine="27" endCharacterOffset="0">Open file_upload_callback.py</walkthrough-editor-select-line>

Implement the event scanning logic:

1. Iterate `callback_context.session.events` in reverse
2. Find the latest user event
3. Check each part for `inline_data` or `file_data`
4. Update state with `has_uploaded_file` and `uploaded_file_details`

<walkthrough-editor-open-file filePath="solutions/step-04/agents/loan_drawdown_agent/callbacks/file_upload_callback.py">View solution</walkthrough-editor-open-file>

## Step 4: agent.py

<walkthrough-editor-select-line filePath="steps/step-04-agent-tool/agents/loan_drawdown_agent/agent.py"
                              startLine="23" startCharacterOffset="0"
                              endLine="41" endCharacterOffset="0">Open agent.py</walkthrough-editor-select-line>

1. Change `sub_agents=[loan_process]` to `tools=[AgentTool(agent=loan_process)]`
2. Add `before_agent_callback=file_upload_callback`

<walkthrough-editor-open-file filePath="solutions/step-04/agents/loan_drawdown_agent/agent.py">View solution</walkthrough-editor-open-file>

## Step 4: Test

```bash
make playground STEP=step-04-agent-tool
```

Use <walkthrough-web-preview-icon></walkthrough-web-preview-icon> **Web Preview** on port 8501 and try:

```
Hello
```

Then upload a file, and send:

```
Process the loan
```

### Checkpoint

- Agent only processes loans after detecting a file upload
- State shows `has_uploaded_file: True` after upload
- The workflow runs via tool call, not automatic delegation

<walkthrough-info-message>Notice the extraction may return missing data! The sub-agents can't "see" the actual file bytes when called via AgentTool. You fix this in Step 5.</walkthrough-info-message>

Press **Ctrl+C** in the terminal to stop the playground before moving on.

## Step 5: File Handling & Batch Processing - Concepts

**Learning objectives:**
- Use `before_model_callback` to modify the LLM request before it's sent
- Inject multimodal content (files) into an LLM context
- Add batch processing support with wrapper schemas

When the root agent delegates via `AgentTool`, sub-agents can't see the raw file bytes. The `inject_invoice_content` callback bridges this gap by injecting file content directly into the LLM request before it's sent.

> **Docs:** [Callbacks](https://google.github.io/adk-docs/callbacks/) | [Artifacts](https://google.github.io/adk-docs/artifacts/)

## Step 5: Files to modify

In this step, edit four files in order:

1. `inject_invoice_content.py` &mdash; implement the file injection callback
2. `extraction_agent.py` &mdash; connect the callback and switch to batch schema
3. `data_models.py` &mdash; define batch wrapper models
4. `prompts.py` &mdash; update prompts for batch processing

## Step 5: inject_invoice_content.py

<walkthrough-editor-select-line filePath="steps/step-05-file-handling/agents/loan_drawdown_agent/callbacks/inject_invoice_content.py"
                              startLine="47" startCharacterOffset="0"
                              endLine="95" endCharacterOffset="0">Open inject_invoice_content.py</walkthrough-editor-select-line>

Implement the three TODO sections:

1. Load artifacts by key (try/except for failures)
2. Fallback: reconstruct Parts from `_raw_invoice_files` in state
3. Append the file parts + a text label to `llm_request.contents`

<walkthrough-editor-open-file filePath="solutions/step-05/agents/loan_drawdown_agent/callbacks/inject_invoice_content.py">View solution</walkthrough-editor-open-file>

## Step 5: extraction_agent.py

<walkthrough-editor-select-line filePath="steps/step-05-file-handling/agents/loan_drawdown_agent/sub_agents/extraction_agent.py"
                              startLine="4" startCharacterOffset="0"
                              endLine="19" endCharacterOffset="0">Open extraction_agent.py</walkthrough-editor-select-line>

- Import `inject_invoice_content` from callbacks
- Change `output_schema` from `InvoiceData` to `InvoiceBatch`
- Add `before_model_callback=inject_invoice_content`

<walkthrough-editor-open-file filePath="solutions/step-05/agents/loan_drawdown_agent/sub_agents/extraction_agent.py">View solution</walkthrough-editor-open-file>

## Step 5: data_models.py

<walkthrough-editor-select-line filePath="steps/step-05-file-handling/agents/loan_drawdown_agent/schemas/data_models.py"
                              startLine="58" startCharacterOffset="0"
                              endLine="80" endCharacterOffset="0">Open data_models.py</walkthrough-editor-select-line>

Define 4 batch wrapper models:

- `InvoiceBatch` &mdash; wraps `list[InvoiceData]` in an `invoices` field
- `ComplianceBatchResult` &mdash; wraps `list[ComplianceCheckResult]` in a `results` field
- `FinancialBatchContext` &mdash; wraps `list[FinancialContext]` in a `results` field
- `BatchValidationReport` &mdash; wraps `list[ValidationReport]` in a `reports` field

<walkthrough-editor-open-file filePath="solutions/step-05/agents/loan_drawdown_agent/schemas/data_models.py">View solution</walkthrough-editor-open-file>

## Step 5: prompts.py

<walkthrough-editor-select-line filePath="steps/step-05-file-handling/agents/loan_drawdown_agent/config/prompts.py"
                              startLine="0" startCharacterOffset="0"
                              endLine="5" endCharacterOffset="0">Open prompts.py</walkthrough-editor-select-line>

Update the prompts to tell each agent to process **all** invoices, not just one. Follow the `TODO(workshop)` comment at the top.

<walkthrough-editor-open-file filePath="solutions/step-05/agents/loan_drawdown_agent/config/prompts.py">View solution</walkthrough-editor-open-file>

## Step 5: Test

```bash
make playground STEP=step-05-file-handling
```

Use <walkthrough-web-preview-icon></walkthrough-web-preview-icon> **Web Preview** on port 8501 to open the playground. Upload an invoice file and verify the extraction returns real data.

### Checkpoint

- Uploading an invoice extracts real data (not hallucinated)
- All workflow stages complete: extraction, sanctions, prohibited goods, credit ceiling, decision
- Uploading multiple invoices produces per-invoice results with batch schemas

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

Explore the [ADK documentation](https://google.github.io/adk-docs/) or try the bonus challenges below.

## Bonus: Testing & Evaluation

Run unit tests to verify your tool implementations:

```bash
make test
```

ADK includes a built-in evaluation framework. Run the evaluation suite against the complete agent in `app/`:

```bash
make eval
```

This uses the eval configuration in `tests/eval/eval_config.json` which scores the agent on relevance, helpfulness, decision clarity, correct tool use, and safety.

> **Docs:** [ADK Evaluation](https://google.github.io/adk-docs/evaluate/)

## Bonus: Deploy to Cloud Run

To deploy your agent as a Cloud Run service, create a service account and deploy:

```bash
gcloud iam service-accounts create loan-drawdown-sa --display-name "Loan Drawdown Agent SA" --project <walkthrough-project-id/>
```

```bash
gcloud projects add-iam-policy-binding <walkthrough-project-id/> --member="serviceAccount:loan-drawdown-sa@<walkthrough-project-id/>.iam.gserviceaccount.com" --role="roles/aiplatform.user" --condition=None --quiet
```

```bash
gcloud run deploy loan-drawdown-adk --source . --port 8080 --region $PROJECT_LOCATION --service-account loan-drawdown-sa@<walkthrough-project-id/>.iam.gserviceaccount.com --set-env-vars GOOGLE_GENAI_USE_VERTEXAI=TRUE,GOOGLE_CLOUD_PROJECT=<walkthrough-project-id/>,GOOGLE_CLOUD_LOCATION=$PROJECT_LOCATION,MODEL_NAME=gemini-2.5-flash --memory 4Gi --no-cpu-throttling --allow-unauthenticated
```

> **Docs:** [Cloud Run deployment](https://cloud.google.com/run/docs/deploying-source-code)

## Bonus: Deploy to Agent Engine

Agent Engine is a managed runtime for ADK agents on Vertex AI. First, enable the Cloud Resource Manager API:

```bash
gcloud services enable cloudresourcemanager.googleapis.com --project <walkthrough-project-id/>
```

Deploy your agent with the ADK CLI:

```bash
uv run adk deploy agent_engine --project <walkthrough-project-id/> --region $PROJECT_LOCATION --display_name "Loan Drawdown Agent" app/agents/loan_drawdown_agent
```

The deploy process packages your code, builds a container, and deploys it to the managed Agent Engine service. This can take several minutes.

> **Docs:** [Agent Engine deployment](https://google.github.io/adk-docs/deploy/agent-engine/deploy/) | [ADK CLI Reference](https://google.github.io/adk-docs/reference/cli/)
