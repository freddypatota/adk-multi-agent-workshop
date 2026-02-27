from google.adk.agents import Agent
from ..config.constants import MODEL_NAME
from ..config.prompts import DECISION_INSTRUCTION
from ..schemas.data_models import ValidationReport  # TODO(workshop): Change to BatchValidationReport

decision_agent = Agent(
    name="decision_agent",
    model=MODEL_NAME,
    instruction=DECISION_INSTRUCTION,
    output_key="validation_report",
    output_schema=ValidationReport,  # TODO(workshop): Change to BatchValidationReport
    include_contents="none",
)
