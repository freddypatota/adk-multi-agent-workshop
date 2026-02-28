from google.adk.agents import Agent, ParallelAgent, SequentialAgent

from google.adk.tools.agent_tool import AgentTool

from .callbacks.file_upload_callback import file_upload_callback

from .config.constants import MODEL_NAME
from .config.prompts import ROOT_ORCHESTRATOR_INSTRUCTION
from .sub_agents import (
    credit_ceiling_agent, decision_agent, extraction_agent,
    prohibited_goods_agent, sanctions_agent,
)

validation_layer = ParallelAgent(
    name="validation_layer",
    sub_agents=[prohibited_goods_agent, sanctions_agent, credit_ceiling_agent],
)

loan_process = SequentialAgent(
    name="loan_process",
    sub_agents=[extraction_agent, validation_layer, decision_agent],
)

# TODO(workshop): Switch from sub_agents to AgentTool and add the callback.
#
# Currently the root agent uses sub_agents=[loan_process] (agent transfer).
# Change it to tools=[AgentTool(agent=loan_process)] so the root agent
# controls when to invoke the workflow (only after a file is uploaded).
#
# Also add: the appropriate callback to the root agent.
#
# Key difference:
#   sub_agents = agent transfer (automatic delegation)
#   AgentTool   = tool call (LLM decides when to call, based on instruction)
root_agent = Agent(
    name="loan_drawdown_agent",
    model=MODEL_NAME,
    instruction=ROOT_ORCHESTRATOR_INSTRUCTION,
    sub_agents=[loan_process],  # TODO(workshop): Change to tools=[AgentTool(agent=loan_process)]
    # TODO(workshop): Add before_agent_callback=file_upload_callback
)
