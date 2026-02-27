from google.adk.agents import Agent, ParallelAgent, SequentialAgent

from .config.constants import MODEL_NAME
from .config.prompts import ROOT_ORCHESTRATOR_INSTRUCTION

# TODO(workshop): Import all sub-agents from .sub_agents
# Hint: from .sub_agents import (
#     extraction_agent, sanctions_agent, prohibited_goods_agent,
#     credit_ceiling_agent, decision_agent,
# )


# TODO(workshop): Create the validation layer (ParallelAgent).
# A ParallelAgent runs all its sub-agents concurrently.
# The validation layer should run: prohibited_goods_agent, sanctions_agent, credit_ceiling_agent
#
# Hint: validation_layer = ParallelAgent(
#     name="validation_layer",
#     sub_agents=[prohibited_goods_agent, sanctions_agent, credit_ceiling_agent],
# )


# TODO(workshop): Create the loan process (SequentialAgent).
# A SequentialAgent runs sub-agents one after another.
# The loan process should run: extraction_agent -> validation_layer -> decision_agent
#
# Hint: loan_process = SequentialAgent(
#     name="loan_process",
#     sub_agents=[extraction_agent, validation_layer, decision_agent],
# )


# TODO(workshop): Create the root agent with sub_agents.
# For now, use sub_agents=[loan_process] to delegate via agent transfer.
# (In Step 4, we'll switch to AgentTool for more control.)
#
# Hint: root_agent = Agent(
#     name="loan_drawdown_agent",
#     model=MODEL_NAME,
#     instruction=ROOT_ORCHESTRATOR_INSTRUCTION,
#     sub_agents=[loan_process],
# )
root_agent = Agent(
    name="loan_drawdown_agent",
    model=MODEL_NAME,
    instruction=ROOT_ORCHESTRATOR_INSTRUCTION,
    # TODO(workshop): Add sub_agents=[loan_process] here
)
