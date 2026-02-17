from google.adk.agents import Agent
from .prompt import FINANCIAL_INSTRUCTION
from app.tools.financial_tools import get_financial_context
from app.models.data_models import FinancialContext
from dotenv import load_dotenv
import os

load_dotenv()
MODEL_NAME = os.getenv("MODEL_NAME", "gemini-2.0-flash")

credit_ceiling_agent = Agent(
        name="credit_ceiling_agent",
        model=MODEL_NAME,
        instruction=FINANCIAL_INSTRUCTION,
        tools=[get_financial_context],
        output_key="financial_context",
        output_schema=FinancialContext
    )
