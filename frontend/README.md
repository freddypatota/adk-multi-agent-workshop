# Loan Drawdown Agent — Frontend

This directory contains the frontend application for the Loan Drawdown Agent, built with **React**, **Vite**, **Tailwind CSS**, and **Shadcn UI**.

## Overview

The frontend provides an interactive interface for processing loan drawdown requests. It allows users to:

1. Authenticate via Firebase (email/password or Google sign-in).
2. Upload one or more invoice files (PDF, images) with preview.
3. Chat with the Loan Drawdown Agent via real-time SSE streaming.
4. View the agent's workflow progress in a live dashboard (extraction, compliance checks, credit ceiling, decision).
5. See per-invoice results when multiple files are uploaded.

## Tech Stack

- **Framework:** React 19 + Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI Components:** Shadcn UI (based on Radix UI)
- **Icons:** Lucide React
- **Auth:** Firebase Authentication
- **i18n:** react-i18next

## Project Structure

- **`src/App.tsx`** — Main application. Manages SSE streaming, session state, workflow data mapping, and file upload handling.
- **`src/components/`** — React components:
  - `WorkflowDashboard.tsx` — Per-invoice results display (extraction, sanctions, prohibited goods, credit ceiling, decision).
  - `ChatMessagesView.tsx` — Chat interface with message rendering and auto-scroll.
  - `ActivityTimeline.tsx` — Agent activity timeline showing tool calls and stage completions.
  - `InputForm.tsx` — Multi-file upload form with drag-and-drop and file previews.
  - `MainLayout.tsx` — Responsive layout with resizable panels (chat + dashboard).
  - `LoginPage.tsx` — Firebase authentication login page.
  - `ThemeProvider.tsx` — Dark/light/system theme support.
  - `ui/` — Shadcn UI primitives (badge, button, card, input, label, scroll-area, textarea).
- **`src/config/firebase.ts`** — Firebase app initialization from environment variables.
- **`src/contexts/`** — Auth context and provider for Firebase user state.
- **`src/hooks/`** — Custom hooks (`useAuth`, `useMediaQuery`).
- **`src/locales/en.json`** — English translations for all UI strings.

## Key Architecture

### SSE Streaming

`App.tsx` sends messages to `POST /api/run_sse` and reads the SSE stream. Events are parsed and mapped to:

- **Chat messages** — text parts displayed in the chat view.
- **Activity timeline** — tool calls and agent transitions shown as timeline events.
- **Workflow dashboard** — `stateDelta` and `functionResponse` events populate the per-invoice result cards.

After the stream completes, a session state fetch (`GET /api/apps/.../sessions/...`) captures any `output_key` results that may not have surfaced via SSE (e.g., the decision agent's final report).

### Multi-File Upload

The `InputForm` supports multiple file attachments. Files are converted to base64 `inline_data` parts and sent alongside the user's text message. The `WorkflowDashboard` renders one `InvoiceResultCard` per invoice, each showing its own extraction, compliance, financial, and decision results.

### Workflow Data Flow

SSE events are mapped to workflow stages via two mechanisms:

- **`TOOL_STAGE_MAP`** — maps function responses (e.g., `check_sanctions` → sanctions) for real-time updates during streaming. Results are accumulated into batch format.
- **`STATE_KEY_STAGE_MAP`** — maps state delta keys (e.g., `extracted_invoice` → extraction) from the session state fetch after streaming completes.

## Development

### Prerequisites

- Node.js 18+
- A configured `frontend/.env` file (see `frontend/.env template` or run `make frontend-env`)

### Setup

```bash
npm install
```

### Run Locally

```bash
npm run dev
```

The dev server starts on `http://localhost:5173` and proxies `/api` requests to the backend at `http://localhost:8000`.

### Build

```bash
npm run build
```

The build output is generated in `dist/`, which is served by the FastAPI backend in production via static file mounting at `/app`.

### Lint

```bash
npm run lint
```
