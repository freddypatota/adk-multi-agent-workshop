from google.adk.agents import Agent, ParallelAgent, SequentialAgent
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

root_agent = Agent(
    name="loan_drawdown_agent",
    model=MODEL_NAME,
    instruction=ROOT_ORCHESTRATOR_INSTRUCTION,
    sub_agents=[loan_process],
)
