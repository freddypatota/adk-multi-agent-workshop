# Step 5: File Handling & Final Integration

## Learning Objectives

- Use `before_model_callback` to modify the LLM request before it's sent
- Understand how to inject multimodal content (files) into an LLM context
- Learn the artifact storage and state fallback pattern
- Add batch processing support with wrapper schemas
- Test the complete application with the pre-built frontend

## ADK Concepts

> **Documentation:** [Callbacks](https://google.github.io/adk-docs/callbacks/) | [Types of Callbacks](https://google.github.io/adk-docs/callbacks/types-of-callbacks/) | [Callback Patterns](https://google.github.io/adk-docs/callbacks/design-patterns-and-best-practices/) | [Artifacts](https://google.github.io/adk-docs/artifacts/) | [Context](https://google.github.io/adk-docs/context/)

### before_model_callback

A function that runs before each LLM call (not just each agent invocation). It receives the `LlmRequest` and can modify the contents before they're sent to the model:

```python
async def my_callback(callback_context, llm_request):
    # Add content to the LLM request
    llm_request.contents.append(
        types.Content(role="user", parts=[...])
    )
    return None  # Return None to proceed normally

agent = Agent(
    before_model_callback=my_callback,
    ...
)
```

### Why File Injection is Needed

When the root agent delegates to `loan_process` via `AgentTool`, the sub-agents run in a scoped context. They can't directly see the file content from the original user message. The `inject_invoice_content` callback bridges this gap by loading the file and adding it to the extraction agent's LLM request.

### Artifact vs State Fallback

Files are saved as artifacts by `file_upload_callback`. But in local dev (without an artifact service), saves may fail silently. The fallback stores base64 file data directly in session state, which is always available.

## Instructions

### 1. Implement inject_invoice_content

Open `callbacks/inject_invoice_content.py` and implement:

- Load artifacts by key (try/except for failures)
- Fallback: reconstruct Parts from `_raw_invoice_files` in state
- Append the file parts + a text label to `llm_request.contents`

### 2. Connect to extraction_agent

Open `sub_agents/extraction_agent.py`:

- Import `inject_invoice_content`
- Add `before_model_callback=inject_invoice_content` to the Agent

### 3. Add batch processing schemas

To support multiple invoices in a single request, each agent needs to output a **list** of results instead of a single result.

Open `schemas/data_models.py` and define 4 batch wrapper models:

- `InvoiceBatch` — wraps `list[InvoiceData]` in an `invoices` field
- `ComplianceBatchResult` — wraps `list[ComplianceCheckResult]` in a `results` field
- `FinancialBatchContext` — wraps `list[FinancialContext]` in a `results` field
- `BatchValidationReport` — wraps `list[ValidationReport]` in a `reports` field

### 4. Update sub-agents to use batch schemas

Update each sub-agent's `output_schema` to the batch wrapper (look for the `TODO(workshop)` comments):

| Agent | Single schema | Batch schema |
| --- | --- | --- |
| `extraction_agent` | `InvoiceData` | `InvoiceBatch` |
| `sanctions_agent` | `ComplianceCheckResult` | `ComplianceBatchResult` |
| `prohibited_goods_agent` | `ComplianceCheckResult` | `ComplianceBatchResult` |
| `credit_ceiling_agent` | `FinancialContext` | `FinancialBatchContext` |
| `decision_agent` | `ValidationReport` | `BatchValidationReport` |

### 5. Update prompts for batch processing

The prompts need to tell each agent to process **all** invoices (not just one). Open `config/prompts.py` and follow the `TODO(workshop)` comment at the top of the file. Key changes:

- **EXTRACTION**: "For each uploaded file, extract the data. Output a list of invoices."
- **SANCTIONS/PROHIBITED_GOODS/FINANCIAL**: "For each invoice in the batch, run the check. Output one result per invoice."
- **DECISION**: "Match results by index. Produce one ValidationReport per invoice."

### 6. Test with the frontend

The frontend is pre-built. Run both backend and frontend:

```bash
# Terminal 1
make local-backend

# Terminal 2
cd frontend && npm run dev
```

Open http://localhost:5173 and:

- Log in
- Upload an invoice PDF or image
- Watch the workflow dashboard update in real-time

## Checkpoint

- Uploading an invoice extracts real data (not hallucinated)
- All workflow stages complete: extraction, sanctions, prohibited goods, credit ceiling, decision
- Uploading multiple invoices produces per-invoice results with batch schemas
- The workflow dashboard shows structured results for each stage

## Solution

See `solutions/step-05/` for the complete working code.
The final complete application is in `app/` — this is what the full demo runs.
