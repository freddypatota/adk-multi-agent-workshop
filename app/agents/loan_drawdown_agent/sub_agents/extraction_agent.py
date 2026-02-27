from google.adk.agents import Agent

from ..callbacks.inject_invoice_content import inject_invoice_content
from ..config.constants import MODEL_NAME
from ..config.prompts import EXTRACTION_INSTRUCTION
from ..schemas.data_models import InvoiceBatch

extraction_agent = Agent(
    name="extraction_agent",
    model=MODEL_NAME,
    instruction=EXTRACTION_INSTRUCTION,
    output_key="extracted_invoice",
    output_schema=InvoiceBatch,
    before_model_callback=inject_invoice_content,
)
