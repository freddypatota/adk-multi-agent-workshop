# loan-drawdown-agent-demo

A multi-agent demonstration project built with the [Google Cloud Agent Development Kit (ADK)](https://google.github.io/adk-docs/llms.txt) for processing automated loan drawdown requests from invoices. 

Agent scaffold generated with [`googleCloudPlatform/agent-starter-pack`](https://github.com/GoogleCloudPlatform/agent-starter-pack) version `0.36.0`.

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
├── app/                       # Core agent code
│   ├── agent.py               # Main agent logic (Root Orchestrator)
│   ├── fast_api_app.py        # FastAPI Backend server
│   ├── sub_agents/            # Individual workflow agents (extraction, credit, decision, etc.)
│   └── app_utils/             # App utilities and helpers
├── tests/                     # Unit, integration, and load tests
├── GEMINI.md                  # AI-assisted development guide
├── Makefile                   # Development commands
└── pyproject.toml             # Project dependencies
```

> 💡 **Tip:** Use [Gemini CLI](https://github.com/google-gemini/gemini-cli) for AI-assisted development - project context is pre-configured in `GEMINI.md`.

## Requirements

Before you begin, ensure you have:
- **uv**: Python package manager (used for all dependency management in this project) - [Install](https://docs.astral.sh/uv/getting-started/installation/) ([add packages](https://docs.astral.sh/uv/concepts/dependencies/) with `uv add <package>`)
- **Google Cloud SDK**: For GCP services - [Install](https://cloud.google.com/sdk/docs/install)
- **make**: Build automation tool - [Install](https://www.gnu.org/software/make/) (pre-installed on most Unix-based systems)


## Quick Start

Install required packages and launch the local development environment:

```bash
make install && make playground
```

## Commands

| Command              | Description                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------- |
| `make install`       | Install dependencies using uv                                                               |
| `make playground`    | Launch local development environment                                                        |
| `make lint`          | Run code quality checks                                                                     |
| `make test`          | Run unit and integration tests                                                              |
| `make deploy`        | Deploy agent to Cloud Run                                                                   |
| `make local-backend` | Launch local development server with hot-reload                                             |

For full command options and usage, refer to the [Makefile](Makefile).

## 🛠️ Project Management

| Command | What It Does |
|---------|--------------|
| `uvx agent-starter-pack enhance` | Add CI/CD pipelines and Terraform infrastructure |
| `uvx agent-starter-pack setup-cicd` | One-command setup of entire CI/CD pipeline + infrastructure |
| `uvx agent-starter-pack upgrade` | Auto-upgrade to latest version while preserving customizations |
| `uvx agent-starter-pack extract` | Extract minimal, shareable version of your agent |

---

## Development

Edit your agent logic in `app/agent.py` and test with `make playground` - it auto-reloads on save.
See the [development guide](https://googlecloudplatform.github.io/agent-starter-pack/guide/development-guide) for the full workflow.

## Deployment

```bash
gcloud config set project <your-project-id>
make deploy
```

To add CI/CD and Terraform, run `uvx agent-starter-pack enhance`.
To set up your production infrastructure, run `uvx agent-starter-pack setup-cicd`.
See the [deployment guide](https://googlecloudplatform.github.io/agent-starter-pack/guide/deployment) for details.

## Observability

Built-in telemetry exports to Cloud Trace, BigQuery, and Cloud Logging.
See the [observability guide](https://googlecloudplatform.github.io/agent-starter-pack/guide/observability) for queries and dashboards.
