from google.adk.agents import Agent

from .config.constants import MODEL_NAME

# TODO(workshop): Define the agent's instruction as a string.
# The instruction should tell the agent:
# - It is a Loan Drawdown Assistant
# - It should greet users and explain it can help with loan drawdown requests
# - It should ask users to upload an invoice to get started
#
# Hint: The instruction is a multi-line string that describes the agent's role and behavior.
INSTRUCTION = """
"""

# TODO(workshop): Create the root agent.
# Use the Agent class with the following parameters:
# - name: "loan_drawdown_agent"
# - model: MODEL_NAME (imported above)
# - instruction: INSTRUCTION (defined above)
#
# Hint: root_agent = Agent(name=..., model=..., instruction=...)
root_agent = None  # Replace with your Agent
