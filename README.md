# loan-drawdown-agent-demo

A multi-agent demonstration project built with the [Google Cloud Agent Development Kit (ADK)](https://google.github.io/adk-docs/) for processing automated loan drawdown requests from invoices. Includes a React frontend with real-time workflow visualization.

## Requirements

Before you begin, ensure you have:

- **uv**: Python package manager - [Install](https://docs.astral.sh/uv/getting-started/installation/)
- **Node.js** (v18+): For the frontend and Firebase CLI - [Install](https://nodejs.org/)
- **Google Cloud SDK**: For GCP services - [Install](https://cloud.google.com/sdk/docs/install)
- **make**: Build automation tool (pre-installed on most Unix-based systems)

## Setup

Follow these steps in order to get the project running.

### 1. Install dependencies

```bash
make install
```

This installs Python packages (via uv), frontend npm packages, and the Firebase CLI.

### 2. Configure Makefile variables

Open the [Makefile](Makefile) and update the variables at the top with your project details:

| Variable | Description |
| --- | --- |
| `PROJECT_ID` | Your GCP project ID (e.g. `my-gcp-project`) |
| `PROJECT_NUMBER` | Your GCP project number (e.g. `123456789012`) |
| `PROJECT_LOCATION` | Your GCP region (e.g. `europe-west4`) |
| `DOMAIN` | Authorized domain for IAP access (e.g. `example.com`) |
| `ARTIFACTS_BUCKET` | GCS bucket for artifacts (e.g. `my-artifacts-bucket`) |
| `FIREBASE_API_KEY`| Firebase API key (optional for the workshop, get it from Firebase Console — see step 6) |
| `FIREBASE_APP_ID` | Firebase web app ID (optional for the workshop, get it from Firebase Console — see step 6) |

The remaining variables (`SERVICE_ACCOUNT`, `SERVICE_URL`, `FIREBASE_AUTH_DOMAIN`, etc.) are derived automatically.

### 3. Authenticate with Google Cloud

```bash
make auth
```

### 4. Enable required GCP APIs

```bash
make setup-apis
```

This enables Vertex AI, Firestore, Cloud Run, Cloud Trace, and other required services on your project.

### 5. Generate the backend environment file

```bash
make agent-env
```

This creates a `.env` file at the project root from the Makefile variables. Alternatively, copy the template and fill it in manually:

```bash
cp ".env example" .env
```

| Variable | Description |
| --- | --- |
| `GOOGLE_GENAI_USE_VERTEXAI` | Set to `TRUE` to use Vertex AI |
| `GOOGLE_CLOUD_PROJECT` | Your GCP project ID |
| `GOOGLE_CLOUD_LOCATION` | GCP region (e.g. `europe-west4`) |
| `MODEL_NAME` | Gemini model to use (e.g. `gemini-2.5-flash`) |

### 6. Set up Firebase Authentication (for the frontend)

The frontend uses Firebase Authentication. This step is only needed if you want to run the full app with the frontend (not required for the ADK playground).

**a.** Enable Firebase for your GCP project:

```bash
make setup-firebase
```

**b.** In the [Firebase Console](https://console.firebase.google.com), enable Authentication providers:

- Go to **Authentication** > **Sign-in method**
- Enable **Email/Password** and **Google**

**c.** Add authorized domains:

- Go to **Authentication** > **Settings** > **Authorized domains**
- `localhost` is already listed (for local development)
- For Cloud Run deployment, add: `<service-name>-<project-number>.<region>.run.app`

**d.** Register a web app and get SDK config:

- Go to **Project Settings** > **General** > **Your apps** > **Add app** > **Web**
- Copy the `FIREBASE_API_KEY` and `FIREBASE_APP_ID` values back into the [Makefile variables](#2-configure-makefile-variables)

**e.** Generate the frontend environment file:

```bash
make frontend-env
```

## Quick Start

After completing the setup above:

```bash
make playground    # Launch ADK playground (agent only, no frontend)
```

To run the full app with the frontend:

```bash
make build-frontend
make run-agent
```

---

## Workshop

This branch contains a hands-on workshop that guides you through building the loan drawdown agent step by step. Each step introduces new ADK concepts and builds on the previous one.

### Steps

| Step | Folder | Concepts |
| --- | --- | --- |
| 1 | [step-01-first-agent](steps/step-01-first-agent/) | Agent, model, instruction, ADK playground |
| 2 | [step-02-tools](steps/step-02-tools/) | Function tools, Pydantic schemas, structured output |
| 3 | [step-03-multi-agent](steps/step-03-multi-agent/) | SequentialAgent, ParallelAgent, output_key, state flow |
| 4 | [step-04-agent-tool](steps/step-04-agent-tool/) | AgentTool, before_agent_callback, session state |
| 5 | [step-05-file-handling](steps/step-05-file-handling/) | before_model_callback, LlmRequest, multimodal files |

### How to Run a Step

```bash
make playground STEP=step-01-first-agent
```

### Workshop Flow

1. Read the step's README for concepts and instructions
2. Edit the code in `steps/step-XX/agents/loan_drawdown_agent/`
3. Test with `make playground STEP=step-XX-name`
4. If stuck, check `solutions/step-XX/` for the working code
5. Move to the next step (which includes your previous work already completed)

The final complete application is in `app/` with a full React frontend in `frontend/`.

---

## Architecture Guide

The application uses a coordinated multi-agent workflow to process loan drawdowns based on uploaded invoice files. It supports both single and batch invoice processing.

### Root Orchestrator

The root LLM Agent interacts with the user, ensuring one or more invoice files are uploaded before initiating the drawdown workflow. It uses `AgentTool` to delegate to the loan process.

### Loan Process Workflow

Once invoices are provided, the process delegates to a Sequential Workflow that handles all invoices in a single pass:

1. **Extraction**: Analyzes the uploaded invoices to extract structured data (via `before_model_callback` that injects file content from artifacts/state).
2. **Validation Layer** (Parallel):
   - **Prohibited Goods Agent**: Checks line items against prohibited goods lists.
   - **Sanctions Agent**: Verifies vendor names against sanction lists (case-insensitive matching).
   - **Credit Ceiling Agent**: Validates invoice amounts against the client's credit limits.
3. **Decision**: Synthesizes the extraction data and validation results to approve, reject, or flag each invoice for review.

### Frontend

A React + TypeScript SPA that provides:

- Firebase authentication (email/password and Google sign-in)
- Real-time SSE streaming of agent activity with an interactive timeline
- Workflow dashboard showing per-invoice extraction, compliance, financial, and decision results
- Multi-file upload support with preview
- Dark/light/system theme support
- Responsive layout with resizable panels

## Project Structure

```text
loan-drawdown-agent-demo/
├── app/
│   ├── main.py                                  # FastAPI backend server
│   └── agents/
│       └── loan_drawdown_agent/                 # Self-contained agent package
│           ├── agent.py                         # Root orchestrator (entry point)
│           ├── callbacks/
│           │   ├── file_upload_callback.py       # Detects uploads, saves artifacts & state
│           │   └── inject_invoice_content.py     # Injects file content into extraction LLM
│           ├── config/
│           │   ├── constants.py                  # Model name, agent name
│           │   └── prompts.py                    # All agent instructions
│           ├── schemas/
│           │   └── data_models.py                # Pydantic models (single + batch wrappers)
│           ├── services/
│           │   └── mock_banking.py               # Mock George Banking & IBH rates
│           ├── tools/
│           │   ├── compliance_tools.py           # Sanctions check, prohibited goods RAG
│           │   └── financial_tools.py            # Credit ceiling check
│           └── sub_agents/
│               ├── extraction_agent.py           # Invoice data extraction
│               ├── prohibited_goods_agent.py     # Prohibited goods compliance
│               ├── sanctions_agent.py            # Sanctions list validation
│               ├── credit_ceiling_agent.py       # Credit ceiling validation
│               └── decision_agent.py             # Final approval/rejection
├── frontend/                                     # React + TypeScript SPA
│   ├── src/
│   │   ├── App.tsx                               # Main app with SSE streaming
│   │   ├── components/
│   │   │   ├── WorkflowDashboard.tsx             # Per-invoice results display
│   │   │   ├── ChatMessagesView.tsx              # Chat interface
│   │   │   ├── ActivityTimeline.tsx              # Agent activity timeline
│   │   │   ├── InputForm.tsx                     # Multi-file upload form
│   │   │   ├── MainLayout.tsx                    # Responsive layout with panels
│   │   │   ├── LoginPage.tsx                     # Firebase auth login
│   │   │   └── ThemeProvider.tsx                 # Dark/light/system theme
│   │   ├── config/firebase.ts                    # Firebase configuration
│   │   ├── contexts/                             # Auth context + provider
│   │   ├── hooks/                                # useAuth, useMediaQuery
│   │   └── locales/en.json                       # i18n translations
│   ├── vite.config.ts                            # Vite config with chunking
│   └── package.json                              # Frontend dependencies
├── tests/
│   ├── unit/                                     # Unit tests for tools and services
│   ├── integration/                              # Integration tests (agent stream, server e2e)
│   └── eval/                                     # ADK evaluation sets
├── Dockerfile                                    # Container build
├── Makefile                                      # Development commands
├── pyproject.toml                                # Python dependencies
└── .env example                                  # Template for environment variables
```

## Commands

| Command               | Description                                          |
| --------------------- | ---------------------------------------------------- |
| `make install`        | Install all dependencies (Python, npm, Firebase CLI) |
| `make auth`           | Authenticate with Google Cloud and set project       |
| `make setup-apis`     | Enable required GCP APIs                             |
| `make setup-sa`       | Create Cloud Run service account with roles          |
| `make setup-firebase` | Initialize Firebase and print setup instructions     |
| `make agent-env`      | Generate root `.env` for ADK agents                  |
| `make frontend-env`   | Generate `frontend/.env` from Makefile variables     |
| `make playground`     | Launch local ADK playground                          |
| `make local-backend`  | Launch FastAPI server with hot-reload                |
| `make build-frontend` | Build the frontend for production                    |
| `make test`           | Run unit and integration tests                       |
| `make lint`           | Run code quality checks (codespell, ruff, ty)        |
| `make eval`           | Run agent evaluation using ADK eval                  |
| `make deploy`         | Build frontend and deploy to Cloud Run               |
| `make clean`          | Remove temporary files and caches                    |
| `make kill`           | Kill local development processes on common ports     |

**Windows users:** For commands that use shell-specific syntax (`install`, `agent-env`, `frontend-env`, `clean`, `kill`), use the `-win` suffix (e.g., `make install-win`). These use PowerShell instead of bash. Commands like `auth`, `playground`, `local-backend`, `test`, `eval`, and `lint` work on both platforms as-is.

For full command options, refer to the [Makefile](Makefile).
For evaluation set format and usage, see the [evalsets guide](tests/eval/evalsets/README.md).

## Deployment

```bash
make setup-apis      # Enable required GCP APIs (first time only)
make setup-sa        # Create service account (first time only)
make deploy          # Build frontend and deploy to Cloud Run
```

After deploying, remember to add your Cloud Run domain to Firebase's authorized domains (see [Setup step 6c](#6-set-up-firebase-authentication-for-the-frontend)).

## Observability

The application exports telemetry to [Cloud Trace](https://docs.cloud.google.com/trace/docs/overview) via OpenTelemetry. Traces for agent invocations, tool calls, and LLM requests are available in the Google Cloud Console.
