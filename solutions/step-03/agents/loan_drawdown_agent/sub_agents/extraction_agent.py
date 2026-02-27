from google.adk.agents import Agent
from ..config.constants import MODEL_NAME
from ..config.prompts import EXTRACTION_INSTRUCTION
from ..schemas.data_models import InvoiceData

extraction_agent = Agent(
    name="extraction_agent",
    model=MODEL_NAME,
    instruction=EXTRACTION_INSTRUCTION,
    output_key="extracted_invoice",
    output_schema=InvoiceData,
)
