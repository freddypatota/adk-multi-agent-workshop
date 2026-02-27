# Step 2: Tools & Structured Output

## Learning Objectives

- Create function tools that agents can call
- Understand how ADK auto-generates tool schemas from Python type hints
- Define Pydantic models for structured data

## ADK Concepts

> **Documentation:** [Function Tools](https://google.github.io/adk-docs/tools-custom/function-tools/) | [Tool Performance](https://google.github.io/adk-docs/tools-custom/performance/) | [Tool Limitations](https://google.github.io/adk-docs/tools/limitations/)

### Function Tools

Any Python function can become an agent tool. ADK inspects the function's signature, type hints, and docstring to auto-generate the tool schema for the LLM:

```python
def check_sanctions(vendor_name: str) -> dict:
    """Checks if the vendor is on a sanctions list."""
    # Your logic here
    return {"status": "PASS", "reason": "Not found"}

agent = Agent(
    name="my_agent",
    model=MODEL_NAME,
    instruction="...",
    tools=[check_sanctions],  # Pass the function directly
)
```

The LLM sees the tool's name, parameter types, and docstring. It decides when to call the tool based on the conversation.

### Pydantic Models

Pydantic `BaseModel` classes define structured data schemas. They're used later for `output_schema` but are good practice for consistent data shapes:

```python
from pydantic import BaseModel, Field

class MyResult(BaseModel):
    status: str = Field(..., description="The result status")
    score: float = Field(0.0, description="A numeric score")
```

## Instructions

### 1. Implement `check_sanctions` tool

Open `tools/compliance_tools.py` and implement the function body:

- Normalize the vendor name (`.strip().lower()`)
- Check against `SANCTIONS_LIST`
- Return a dict with `check_name`, `status`, `flags`, `reason`

### 2. Implement `get_financial_context` tool

Open `tools/financial_tools.py` and implement the function body:

- Call `george_service.get_client_exposure(client_id)` to get limits
- Call `ibh_service.get_rate(currency, target_currency)` for exchange rate
- Calculate remaining limit and whether the amount fits
- Return a dict with all financial context fields

### 3. Define Pydantic models

Open `schemas/data_models.py` and define:

- `ComplianceCheckResult` — with `check_name`, `status`, `flags`, `reason`
- `FinancialContext` — with `client_id`, `currency`, limits, and conversion info

### 4. Connect tools to the agent

Open `agent.py`:

- Import your tool functions
- Add `tools=[check_sanctions, get_financial_context]` to the Agent

## Testing

```bash
make playground STEP=step-02-tools
```

Try these prompts:

- "Check if 'Acme Corp' is sanctioned" — should call check_sanctions and return PASS
- "Check if 'BadActor Corp' is sanctioned" — should return FAIL
- "Check credit for client demo_client_001 with amount 50000 EUR" — should call get_financial_context

## Checkpoint

- Both tools are callable from the playground
- Sanctions check correctly identifies sanctioned vendors
- Financial context returns meaningful limit and conversion data

## Solution

See `solutions/step-02/` for the complete working code.
