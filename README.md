# loan-drawdown-agent-demo

A multi-agent demonstration project built with the [Google Cloud Agent Development Kit (ADK)](https://google.github.io/adk-docs/llms.txt) for processing automated loan drawdown requests from invoices.

## Architecture Guide

The application uses a coordinated multi-agent workflow to process loan drawdowns based on uploaded invoice files. 

### Root Orchestrator
The root LLM Agent interacts with the user, ensuring an invoice file is uploaded before initiating the drawdown workflow.

### Loan Process Workflow
Once an invoice is provided, the process delegates to a Sequential Workflow:
1. **Extraction**: Analyzes the uploaded invoice to extract relevant details.
2. **Validation Layer** (Parallel):
   - **Prohibited Goods Agent**: Checks for compliance and prohibited items.
   - **Sanctions Agent**: Verifies against sanction lists.
   - **Credit Ceiling Agent**: Validates current credit limits for the account.
3. **Decision**: Synthesizes the extraction data and validation results to approve or reject the drawdown request.

## Project Structure

```
loan-drawdown-agent-demo/
├── app/
│   ├── fast_api_app.py                        # FastAPI backend server
│   ├── utils/                                 # Logging, telemetry, and typing utilities
│   └── agents/
│       └── loan_drawdown_agent/               # Self-contained agent package
│           ├── agent.py                       # Root orchestrator (entry point)
│           ├── callbacks/                     # Lifecycle hooks (e.g. file upload detection)
│           ├── config/                        # Prompts and constants
│           ├── schemas/                       # Pydantic data models (invoice, compliance, financial)
│           ├── services/                      # Mock banking services (George, IBH rates)
│           ├── tools/                         # Agent tools (compliance checks, financial context)
│           └── sub_agents/                    # Individual workflow agents
│               ├── extraction_agent.py        # Invoice data extraction
│               ├── prohibited_goods_agent.py  # Prohibited goods compliance check
│               ├── sanctions_agent.py         # Sanctions list validation
│               ├── credit_ceiling_agent.py    # Credit ceiling validation
│               └── decision_agent.py          # Final approval/rejection decision
├── tests/
│   ├── unit/                                  # Unit tests for tools and services
│   ├── integration/                           # Integration tests (agent stream, server e2e)
│   └── eval/                                  # ADK evaluation sets
├── .env example                               # Template for environment variables
├── GEMINI.md                                  # AI-assisted development guide
├── Makefile                                   # Development commands
└── pyproject.toml                             # Project dependencies
```

> **Tip:** Use [Gemini CLI](https://github.com/google-gemini/gemini-cli) for AI-assisted development - project context is pre-configured in `GEMINI.md`.

## Requirements

Before you begin, ensure you have:
- **uv**: Python package manager (used for all dependency management in this project) - [Install](https://docs.astral.sh/uv/getting-started/installation/) ([add packages](https://docs.astral.sh/uv/concepts/dependencies/) with `uv add <package>`)
- **Google Cloud SDK**: For GCP services - [Install](https://cloud.google.com/sdk/docs/install)
- **make**: Build automation tool - [Install](https://www.gnu.org/software/make/) (pre-installed on most Unix-based systems)


## Configuration

Copy the environment template and fill in your GCP project details:

```bash
cp ".env example" .env
```

The `.env` file requires the following variables:

| Variable                     | Description                                    |
| ---------------------------- | ---------------------------------------------- |
| `GOOGLE_GENAI_USE_VERTEXAI`  | Set to `TRUE` to use Vertex AI                 |
| `GOOGLE_CLOUD_PROJECT`       | Your GCP project ID                            |
| `GOOGLE_CLOUD_LOCATION`      | GCP region (e.g. `europe-west4`)               |
| `MODEL_NAME`                 | Gemini model to use (e.g. `gemini-2.5-flash`)  |

## Quick Start

```bash
make install    # Install dependencies
make auth       # Authenticate with Google Cloud
make playground # Launch local ADK playground
```

## Commands

| Command              | Description                                      |
| -------------------- | ------------------------------------------------ |
| `make install`       | Install dependencies using uv                    |
| `make auth`          | Authenticate with Google Cloud and set project   |
| `make playground`    | Launch local ADK playground                      |
| `make local-backend` | Launch FastAPI server with hot-reload            |
| `make test`          | Run unit and integration tests                   |
| `make lint`          | Run code quality checks (codespell, ruff, ty)    |
| `make eval`          | Run agent evaluation using ADK eval              |
| `make deploy`        | Deploy agent to Cloud Run                        |
| `make clean`         | Remove temporary files and caches                |
| `make kill`          | Kill local development processes on common ports |

For full command options and usage, refer to the [Makefile](Makefile).
For evaluation set format and usage, see the [evalsets guide](tests/eval/evalsets/README.md).

## Deployment

```bash
gcloud config set project <your-project-id>
make deploy
```

## Observability

Built-in telemetry exports to Cloud Trace, BigQuery, and Cloud Logging.
