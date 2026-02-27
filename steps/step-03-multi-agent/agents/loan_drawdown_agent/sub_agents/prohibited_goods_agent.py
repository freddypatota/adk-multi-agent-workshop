from google.adk.agents import Agent

from ..config.constants import MODEL_NAME
from ..config.prompts import PROHIBITED_GOODS_INSTRUCTION
from ..schemas.data_models import ComplianceCheckResult
from ..tools.compliance_tools import prohibited_goods_rag

# TODO(workshop): Create the prohibited goods agent.
# Similar to sanctions_agent but uses prohibited_goods_rag tool.
#   - name: "prohibited_goods_agent"
#   - tools: [prohibited_goods_rag]
#   - output_key: "prohibited_goods_result"
#   - output_schema: ComplianceCheckResult
#   - include_contents: "none"

# prohibited_goods_agent = Agent(...)
