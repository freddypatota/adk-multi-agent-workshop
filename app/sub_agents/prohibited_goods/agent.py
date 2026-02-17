from google.adk.agents import Agent
from .prompt import PROHIBITED_GOODS_INSTRUCTION
from app.tools.compliance_tools import prohibited_goods_rag
from app.models.data_models import ComplianceCheckResult
from dotenv import load_dotenv
import os

load_dotenv()
MODEL_NAME = os.getenv("MODEL_NAME", "gemini-2.0-flash")

prohibited_goods_agent = Agent(
        name="prohibited_goods_agent",
        model=MODEL_NAME,
        instruction=PROHIBITED_GOODS_INSTRUCTION,
        tools=[prohibited_goods_rag],
        output_key="prohibited_goods_result",
        output_schema=ComplianceCheckResult
    )


