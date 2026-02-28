from google.adk.agents import Agent, ParallelAgent, SequentialAgent

from .config.constants import MODEL_NAME
from .config.prompts import ROOT_ORCHESTRATOR_INSTRUCTION

# TODO(workshop): Import all sub-agents from .sub_agents

# TODO(workshop): Create the validation layer (ParallelAgent).
# A ParallelAgent runs all its sub-agents concurrently.
# The validation layer should run: prohibited_goods_agent, sanctions_agent, credit_ceiling_agent


# TODO(workshop): Create the loan process (SequentialAgent).
# A SequentialAgent runs sub-agents one after another.
# The loan process should run: extraction_agent -> validation_layer -> decision_agent


# TODO(workshop): Create the root agent with sub_agents.
# For now, use sub_agents=[loan_process] to delegate via agent transfer.
# (In Step 4, we'll switch to AgentTool for more control.)
root_agent = Agent(
    name="loan_drawdown_agent",
    model=MODEL_NAME,
    instruction=ROOT_ORCHESTRATOR_INSTRUCTION,
    # TODO(workshop): Add sub_agents=[loan_process] here
)
