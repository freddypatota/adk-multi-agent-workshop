import os

import dotenv

# Load environment variables from .env file

dotenv.load_dotenv()

MODEL_NAME = os.getenv("MODEL_NAME", "gemini-2.5-flash")
AGENT_NAME = os.getenv("AGENT_NAME", "loan_drawdown_agent")
