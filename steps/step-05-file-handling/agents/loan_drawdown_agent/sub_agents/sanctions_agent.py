from google.adk.agents import Agent
from ..config.constants import MODEL_NAME
from ..config.prompts import SANCTIONS_INSTRUCTION
from ..schemas.data_models import ComplianceCheckResult
from ..tools.compliance_tools import check_sanctions

sanctions_agent = Agent(
    name="sanctions_agent",
    model=MODEL_NAME,
    instruction=SANCTIONS_INSTRUCTION,
    tools=[check_sanctions],
    output_key="sanctions_result",
    output_schema=ComplianceCheckResult,
    include_contents="none",
)
