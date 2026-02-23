from google.adk.agents import Agent, ParallelAgent, SequentialAgent

from .callbacks.before_agent_callback import before_agent_callback
from .config.constants import MODEL_NAME
from .config.prompts import ROOT_ORCHESTRATOR_INSTRUCTION
from .sub_agents import (
    credit_ceiling_agent,
    decision_agent,
    extraction_agent,
    prohibited_goods_agent,
    sanctions_agent,
)


def create_loan_drawdown_agent() -> Agent:
    """
    Creates the main orchestrator agent (Root) for the Loan Drawdown flow.
    Structure:
    Root (LlmAgent) -> delegates to -> LoanProcess (SequentialAgent)

    LoanProcess:
    1. Ingestion (Sequential)
    2. Validation (Parallel: Compliance + Credit Ceiling)
    3. Decision (Sequential)
    """
    # --- Defined Sub-Agents (The Workflow) ---

    # Parallel Validation
    validation_layer = ParallelAgent(
        name="validation_layer",
        sub_agents=[prohibited_goods_agent, sanctions_agent, credit_ceiling_agent],
    )

    # The Core Process (Sequential Workflow)
    loan_process = SequentialAgent(
        name="loan_process",
        sub_agents=[extraction_agent, validation_layer, decision_agent],
        description="The workflow for processing a loan drawdown request. Use this when the user wants to submit an invoice or process a loan.",
    )

    # --- Root Orchestrator ---

    root_agent = Agent(
        name="root_agent",
        model=MODEL_NAME,
        instruction=ROOT_ORCHESTRATOR_INSTRUCTION,
        before_agent_callback=before_agent_callback,
        sub_agents=[loan_process],
    )

    return root_agent


# Export the agent instance as 'root_agent' for ADK runner
root_agent = create_loan_drawdown_agent()
