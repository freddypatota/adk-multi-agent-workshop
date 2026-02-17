from google.adk.agents import Agent
from .prompt import EXTRACTION_INSTRUCTION
from app.app_utils.logging_config import setup_logging, get_logger
from app.models.data_models import InvoiceData
from dotenv import load_dotenv
import os
import hashlib
from typing import List, Optional

load_dotenv()

MODEL_NAME = os.getenv("MODEL_NAME", "gemini-2.0-flash")
setup_logging()
logger = get_logger(__name__)
    

extraction_agent = Agent(
        name="extraction_agent",
        model=MODEL_NAME,
        instruction=EXTRACTION_INSTRUCTION,
        output_key="extracted_invoice",
        output_schema=InvoiceData
    )
