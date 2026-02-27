from google.adk.agents import Agent

from ..config.constants import MODEL_NAME
from ..config.prompts import FINANCIAL_INSTRUCTION
from ..schemas.data_models import FinancialContext
from ..tools.financial_tools import get_financial_context

# TODO(workshop): Create the credit ceiling agent.
#   - name: "credit_ceiling_agent"
#   - tools: [get_financial_context]
#   - output_key: "financial_context"
#   - output_schema: FinancialContext
#   - include_contents: "none"

# credit_ceiling_agent = Agent(...)
