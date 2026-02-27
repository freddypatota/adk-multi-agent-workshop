from google.adk.agents import Agent

from ..config.constants import MODEL_NAME
from ..config.prompts import DECISION_INSTRUCTION
from ..schemas.data_models import ValidationReport

# TODO(workshop): Create the decision agent.
# This agent has NO tools - it reads from state and synthesizes a decision.
#   - name: "decision_agent"
#   - output_key: "validation_report"
#   - output_schema: ValidationReport
#   - include_contents: "none"

# decision_agent = Agent(...)
