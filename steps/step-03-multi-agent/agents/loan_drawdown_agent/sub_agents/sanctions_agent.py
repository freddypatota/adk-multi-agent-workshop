from google.adk.agents import Agent

from ..config.constants import MODEL_NAME
from ..config.prompts import SANCTIONS_INSTRUCTION
from ..schemas.data_models import ComplianceCheckResult
from ..tools.compliance_tools import check_sanctions

# TODO(workshop): Create the sanctions agent.
#
# This agent checks vendor names against sanctions lists.
# It should use:
#   - name: "sanctions_agent"
#   - model: MODEL_NAME
#   - instruction: SANCTIONS_INSTRUCTION
#   - tools: [check_sanctions]
#   - output_key: "sanctions_result"
#   - output_schema: ComplianceCheckResult
#   - include_contents: "none"  (doesn't need conversation history, reads from state)

# sanctions_agent = Agent(...)
