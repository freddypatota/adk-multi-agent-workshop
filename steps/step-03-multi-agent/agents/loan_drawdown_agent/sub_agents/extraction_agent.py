from google.adk.agents import Agent

from ..config.constants import MODEL_NAME
from ..config.prompts import EXTRACTION_INSTRUCTION
from ..schemas.data_models import InvoiceData

# TODO(workshop): Create the extraction agent.
#
# This agent extracts structured invoice data from the conversation.
# It should use:
#   - name: "extraction_agent"
#   - model: MODEL_NAME
#   - instruction: EXTRACTION_INSTRUCTION
#   - output_key: "extracted_invoice"  (stores result in session state)
#   - output_schema: InvoiceData       (forces structured JSON output)
#
# Key concepts:
#   - output_key: saves the agent's output to session state under this key
#   - output_schema: constrains the LLM to produce JSON matching this Pydantic model
#   - Other agents can read this via {extracted_invoice?} in their prompts

# extraction_agent = Agent(...)
