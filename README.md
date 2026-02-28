# loan-drawdown-agent-demo

A multi-agent demonstration project built with the [Google Cloud Agent Development Kit (ADK)](https://google.github.io/adk-docs/llms.txt) for processing automated loan drawdown requests from invoices. Includes a React frontend with real-time workflow visualization.

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
make install                                    # First time: install all dependencies
cp ".env example" .env                          # First time: create .env and fill in your project details
make auth                                       # First time: authenticate with Google Cloud
make playground STEP=step-01-first-agent        # Run any step in the playground
```

Each step folder has a `README.md` with detailed instructions. Solutions are in `solutions/step-XX/`.

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

```
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

## Requirements

Before you begin, ensure you have:

- **uv**: Python package manager - [Install](https://docs.astral.sh/uv/getting-started/installation/)
- **Node.js** (v18+): For the frontend and Firebase CLI - [Install](https://nodejs.org/)
- **Google Cloud SDK**: For GCP services - [Install](https://cloud.google.com/sdk/docs/install)
- **make**: Build automation tool (pre-installed on most Unix-based systems)

Run `make install` to install all dependencies (Python, frontend npm packages, and Firebase CLI).

## Configuration

### Environment Setup

All configuration is managed through a central `.env` file in the root directory. The `Makefile` and backend server will automatically read these values.

Copy the environment template to get started:

```bash
cp ".env example" .env
```

| Variable | Description |
| --- | --- |
| `GOOGLE_GENAI_USE_VERTEXAI` | Set to `TRUE` to use Vertex AI |
| `GOOGLE_CLOUD_PROJECT` | Your GCP project ID (e.g. `my-gcp-project`) |
| `GOOGLE_CLOUD_PROJECT_NUMBER` | Your GCP project number (e.g. `123456789012`) |
| `GOOGLE_CLOUD_LOCATION` | GCP region (e.g. `europe-west3`) |
| `ARTIFACTS_BUCKET` | GCS bucket for artifacts (e.g. `my-artifacts-bucket`) |
| `MODEL_NAME` | Gemini model to use (e.g. `gemini-2.5-flash`) |
| `FIREBASE_API_KEY` | Firebase API key (from Firebase Console) |
| `FIREBASE_APP_ID` | Firebase web app ID (from Firebase Console) |

*(Note: Additional derived variables like `SERVICE_ACCOUNT` or `FIREBASE_AUTH_DOMAIN` are handled automatically by the Makefile.)*

### Firebase Authentication Setup

The frontend uses Firebase Authentication for user sign-in. Follow these steps to configure it:

1. **Enable Firebase for your GCP project:**

   ```bash
   make setup-firebase
   ```

   This logs into Firebase and enables it for your project. It will then print the remaining manual steps.

2. **Enable Authentication providers** in the [Firebase Console](https://console.firebase.google.com):
   - Go to **Authentication** > **Sign-in method**
   - Enable **Email/Password**
   - Enable **Google**

3. **Add authorized domains:**
   - Go to **Authentication** > **Settings** > **Authorized domains**
   - `localhost` is already listed (for local development)
   - For Cloud Run deployment, add your service domain, e.g.:
     `<service-name>-<project-number>.<region>.run.app`

4. **Register a web app and get SDK config:**
   - Go to **Project Settings** > **General** > **Your apps**
   - Click **Add app** > **Web** (</> icon)
   - Register the app (no need to set up Firebase Hosting)
   - Copy the `FIREBASE_API_KEY` and `FIREBASE_APP_ID` values into your **`.env`** file.

5. **Generate the frontend environment file:**

   ```bash
   make frontend-env
   ```

   This creates `frontend/.env` from the Makefile Firebase variables. You can also copy the template manually with `cp "frontend/.env template" frontend/.env` and fill in the values.

## Quick Start

```bash
make install    # Install all dependencies (Python, npm, Firebase CLI)
make auth       # Authenticate with Google Cloud
make playground # Launch local ADK playground (no frontend)
```

To run the full app (backend + frontend):

```bash
make local-backend          # Start FastAPI backend (port 8000)
cd frontend && npm run dev  # Start Vite dev server (port 5173, proxies /api to backend)
```

## Commands

| Command               | Description                                          |
| --------------------- | ---------------------------------------------------- |
| `make install`        | Install all dependencies (Python, npm, Firebase CLI) |
| `make auth`           | Authenticate with Google Cloud and set project       |
| `make setup-apis`     | Enable required GCP APIs                             |
| `make setup-sa`       | Create Cloud Run service account with roles          |
| `make setup-firebase` | Initialize Firebase and print setup instructions     |
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

For full command options, refer to the [Makefile](Makefile).
For evaluation set format and usage, see the [evalsets guide](tests/eval/evalsets/README.md).

## Deployment

```bash
make setup-apis      # Enable required GCP APIs (first time only)
make setup-sa        # Create service account (first time only)
make deploy          # Build frontend and deploy to Cloud Run
```

After deploying, remember to add your Cloud Run domain to Firebase's authorized domains (see [Firebase Authentication Setup](#firebase-authentication-setup) step 3).

## Observability

The application exports telemetry to [Cloud Trace](https://docs.cloud.google.com/trace/docs/overview?_gl=1*qcsa2e*_up*MQ..&gclid=Cj0KCQiAwYrNBhDcARIsAGo3u323GIq0aq3flbPapFIJ2QkNhfLaSxFiQo9dd1ibvwC4mIjuvc42pXcaAt7yEALw_wcB&gclsrc=aw.ds) via OpenTelemetry. Traces for agent invocations, tool calls, and LLM requests are available in the Google Cloud Console.
