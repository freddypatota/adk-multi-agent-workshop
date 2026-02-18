from google.adk.agents import Agent, SequentialAgent, ParallelAgent
from app.sub_agents.extraction import extraction_agent
from app.sub_agents.sanctions import sanctions_agent
from app.sub_agents.prohibited_goods import prohibited_goods_agent
from app.sub_agents.credit import credit_ceiling_agent
from app.sub_agents.decision import decision_agent
from dotenv import load_dotenv
import os
from google.adk.agents.callback_context import CallbackContext
from app.app_utils.logging_config import setup_logging, get_logger

setup_logging()
logger = get_logger(__name__)

async def before_agent_callback(callback_context: CallbackContext) -> None:
    """Analyzes session events to check for uploaded files and stores this in state."""
    files = []
    
    for event in callback_context.session.events:
        # Check if author/role is user and it has content
        if getattr(event, "role", "") == "user" or getattr(event, "author", "") == "user":
            if getattr(event, "content", None):
                for part in getattr(event.content, "parts", []):
                    if getattr(part, "inline_data", None):
                        display_name = getattr(part.inline_data, "display_name", "uploaded_file")
                        mime_type = getattr(part.inline_data, "mime_type", "unknown_mime_type")
                        files.append(f"'{display_name}' type: {mime_type}")
                        await callback_context.save_artifact(f"invoice_file_{display_name}", part)
                    elif getattr(part, "file_data", None):
                        file_uri = getattr(part.file_data, "file_uri", "uploaded_file")
                        mime_type = getattr(part.file_data, "mime_type", "unknown_mime_type")
                        files.append(f"'{file_uri}' type: {mime_type}")
                        await callback_context.save_artifact(f"invoice_file", part)

    has_uploaded_file = len(files) > 0
    callback_context.state["has_uploaded_file"] = "YES" if has_uploaded_file else "NO"
    callback_context.state["uploaded_file_details"] = ", ".join(files) if has_uploaded_file else "None"

load_dotenv()

def create_loan_drawdown_agent() -> Agent:
    """
    Creates the main orchestrator agent (Root) for the Loan Drawdown flow.
    Structure:
    Root (LlmAgent) -> delegates to -> LoanProcess (SequentialAgent)
    
    LoanProcess:
    1. Ingestion (Sequential)
    2. Validation (Parallel: Compliance + Credit Ceiling)
    3. Decision (Sequential)
    """
    model_name = os.getenv("MODEL_NAME", "gemini-2.0-flash-001")

    # --- Defined Sub-Agents (The Workflow) ---
    
    # Parallel Validation
    validation_layer = ParallelAgent(
        name="validation_layer",
        sub_agents=[
            prohibited_goods_agent,
            sanctions_agent,
            credit_ceiling_agent
        ]
    )
    
    # The Core Process (Sequential Workflow)
    loan_process = SequentialAgent(
        name="loan_process",
        sub_agents=[
            extraction_agent,
            validation_layer,
            decision_agent
        ],
        description="The workflow for processing a loan drawdown request. Use this when the user wants to submit an invoice or process a loan."
    )
    
    # --- Root Orchestrator ---
    
    root_instruction = """
    You are the Loan Drawdown Assistant (Orchestrator).
    Your role is to greet the user and guide them through the loan drawdown process.
    
    Capabilities:
    - You can chat with the user to understand their intent.
    - If the user wants to process a loan, you MUST first tell the user to upload an invoice file.
    - If the user does not provide an invoice but asks for a loan drawdown, ask them to provide an invoice.
    
    Rules:
    - Be polite and professional.
    - If the user says "Hi" or "Hello", greet them and ask how you can help with their loan drawdown.
    - CRITICAL: You must NEVER delegate to the 'loan_process' agent if {{has_uploaded_file?}} is "NO". You must explicitly ask the user to upload a file first.
    - You may only transfer control to 'loan_process' if {{has_uploaded_file?}} is "YES".
    
    Current File Status Context:
    - Has uploaded file: {{has_uploaded_file?}}
    - Uploaded files details: {{uploaded_file_details?}}
    """
    
    root_agent = Agent(
        name="root_agent",
        model=model_name,
        instruction=root_instruction,
        before_agent_callback=before_agent_callback,
        sub_agents=[loan_process]
    )
    
    return root_agent

# Export the agent instance as 'root_agent' for ADK runner
root_agent = create_loan_drawdown_agent()
