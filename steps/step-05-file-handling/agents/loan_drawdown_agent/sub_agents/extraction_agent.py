from google.adk.agents import Agent

from ..config.constants import MODEL_NAME
from ..config.prompts import EXTRACTION_INSTRUCTION
from ..schemas.data_models import InvoiceData  # TODO(workshop): Change to InvoiceBatch

# TODO(workshop): Import inject_invoice_content from callbacks
# Hint: from ..callbacks.inject_invoice_content import inject_invoice_content

extraction_agent = Agent(
    name="extraction_agent",
    model=MODEL_NAME,
    instruction=EXTRACTION_INSTRUCTION,
    output_key="extracted_invoice",
    output_schema=InvoiceData,  # TODO(workshop): Change to InvoiceBatch for multi-invoice support
    # TODO(workshop): Add before_model_callback=inject_invoice_content
    # This injects the actual file content into the LLM request so it
    # can "see" the uploaded invoice, not just hallucinate from the filename.
)
