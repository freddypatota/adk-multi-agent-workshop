from google.adk.agents import Agent
from .prompt import SANCTIONS_INSTRUCTION
from app.tools.compliance_tools import check_sanctions
from app.models.data_models import ComplianceCheckResult
from dotenv import load_dotenv
import os

load_dotenv()
MODEL_NAME = os.getenv("MODEL_NAME", "gemini-2.0-flash")


sanctions_agent = Agent(
        name="sanctions_agent",
        model=MODEL_NAME,
        instruction=SANCTIONS_INSTRUCTION,
        tools=[check_sanctions],
        output_key="sanctions_result",
        output_schema=ComplianceCheckResult,
        include_contents='none'
    )
