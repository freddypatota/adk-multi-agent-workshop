from google.adk.agents import Agent

from ..config.constants import MODEL_NAME
from ..config.prompts import PROHIBITED_GOODS_INSTRUCTION
from ..schemas.data_models import ComplianceBatchResult
from ..tools.compliance_tools import prohibited_goods_rag

prohibited_goods_agent = Agent(
    name="prohibited_goods_agent",
    model=MODEL_NAME,
    instruction=PROHIBITED_GOODS_INSTRUCTION,
    tools=[prohibited_goods_rag],
    output_key="prohibited_goods_result",
    output_schema=ComplianceBatchResult,
    include_contents="none",
)
