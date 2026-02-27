from google.adk.agents import Agent
from ..config.constants import MODEL_NAME
from ..config.prompts import FINANCIAL_INSTRUCTION
from ..schemas.data_models import FinancialContext  # TODO(workshop): Change to FinancialBatchContext
from ..tools.financial_tools import get_financial_context

credit_ceiling_agent = Agent(
    name="credit_ceiling_agent",
    model=MODEL_NAME,
    instruction=FINANCIAL_INSTRUCTION,
    tools=[get_financial_context],
    output_key="financial_context",
    output_schema=FinancialContext,  # TODO(workshop): Change to FinancialBatchContext
    include_contents="none",
)
