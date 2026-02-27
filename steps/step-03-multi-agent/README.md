# Step 3: Multi-Agent Workflow

## Learning Objectives

- Break a monolithic agent into specialized sub-agents
- Use `SequentialAgent` to run agents in order
- Use `ParallelAgent` to run agents concurrently
- Understand `output_key` for passing data between agents via session state
- Use `include_contents="none"` for agents that only need state, not conversation history

## ADK Concepts

### SequentialAgent

Runs sub-agents one after another. Each agent can read the previous agent's output from session state:

```python
from google.adk.agents import SequentialAgent

pipeline = SequentialAgent(
    name="my_pipeline",
    sub_agents=[step_1_agent, step_2_agent, step_3_agent],
)
```

### ParallelAgent

Runs sub-agents concurrently. All agents start at the same time and their results are collected:

```python
from google.adk.agents import ParallelAgent

parallel = ParallelAgent(
    name="validation",
    sub_agents=[check_a, check_b, check_c],
)
```

### output_key & State Variables

When an agent has `output_key="my_result"`, its output is saved to `state["my_result"]`. Other agents can reference it in their prompts using `{my_result?}` (the `?` means "if available"):

```python
agent_a = Agent(
    name="producer",
    output_key="data",       # Saves output to state["data"]
    output_schema=MyModel,   # Enforces structured JSON output
)

agent_b = Agent(
    name="consumer",
    instruction="Process: {data?}",  # Reads state["data"]
    include_contents="none",          # Only needs state, not chat history
)
```

## Instructions

### 1. Create each sub-agent

Open each file in `sub_agents/` and create the Agent. Follow the TODO comments for the correct parameters. Each agent needs:

- **extraction_agent** — `output_key="extracted_invoice"`, `output_schema=InvoiceData`
- **sanctions_agent** — `tools=[check_sanctions]`, `output_key="sanctions_result"`
- **prohibited_goods_agent** — `tools=[prohibited_goods_rag]`, `output_key="prohibited_goods_result"`
- **credit_ceiling_agent** — `tools=[get_financial_context]`, `output_key="financial_context"`
- **decision_agent** — `output_key="validation_report"`, `output_schema=ValidationReport`

### 2. Export sub-agents

Open `sub_agents/__init__.py` and import all 5 agents.

### 3. Wire the workflow in agent.py

- Import the sub-agents
- Create `validation_layer` (ParallelAgent) with the 3 validation agents
- Create `loan_process` (SequentialAgent): extraction → validation_layer → decision
- Set `root_agent`'s `sub_agents=[loan_process]`

## Testing

```bash
make playground STEP=step-03-multi-agent
```

Try: "Process a loan drawdown for vendor 'Acme Corp', invoice #123, amount 50000 EUR, items: Office Supplies x10 at 5000 each, client demo_client_001"

You should see all agents execute in sequence, with the validation agents running in parallel.

## Checkpoint

- The playground shows agent transitions (extraction → sanctions/prohibited goods/credit ceiling → decision)
- Each agent produces structured output stored in state
- The root agent summarizes the final decision

## Solution

See `solutions/step-03/` for the complete working code.
