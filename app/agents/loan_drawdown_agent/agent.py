from google.adk.agents import Agent, ParallelAgent, SequentialAgent
from google.adk.tools.agent_tool import AgentTool

from .callbacks.file_upload_callback import file_upload_callback
from .config.constants import AGENT_NAME, MODEL_NAME
from .config.prompts import ROOT_ORCHESTRATOR_INSTRUCTION
from .sub_agents import (
    credit_ceiling_agent,
    decision_agent,
    extraction_agent,
    prohibited_goods_agent,
    sanctions_agent,
)

# --- Defined Sub-Agents (The Workflow) ---

# Parallel Validation
validation_layer = ParallelAgent(
    name="validation_layer",
    sub_agents=[prohibited_goods_agent, sanctions_agent, credit_ceiling_agent],
)

# The Core Process (Sequential Workflow) - Extraction -> Validation -> Decision
loan_process = SequentialAgent(
    name="loan_process",
    sub_agents=[extraction_agent, validation_layer, decision_agent],
)

# --- Root Orchestrator --- The main agent that will be invoked, orchestrating the entire workflow.
root_agent = Agent(
    name=AGENT_NAME,
    model=MODEL_NAME,
    instruction=ROOT_ORCHESTRATOR_INSTRUCTION,
    before_agent_callback=file_upload_callback,
    tools=[AgentTool(agent=loan_process)],
)
