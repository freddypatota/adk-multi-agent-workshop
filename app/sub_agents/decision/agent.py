from google.adk.agents import Agent
from dotenv import load_dotenv
import os
from .prompt import DECISION_INSTRUCTION

load_dotenv()
MODEL_NAME = os.getenv("MODEL_NAME", "gemini-2.0-flash")


decision_agent = Agent(
        name="decision_agent",
        model=MODEL_NAME,
        instruction=DECISION_INSTRUCTION,
        output_key="validation_report",
        include_contents='none'
    )
