# ADK Multi-Agent Workshop

A hands-on workshop for building a multi-agent loan drawdown processor with the [Google Cloud Agent Development Kit (ADK)](https://google.github.io/adk-docs/).

[![Open in Cloud Shell Editor](/.journey/journey.svg)](https://ide.cloud.google.com/?cloudshell_git_repo=https://github.com/freddypatota/adk-multi-agent-workshop.git&cloudshell_git_branch=main&cloudshell_workspace=.&cloudshell_ephemeral=true&cloudshell_tutorial=.journey/tutorial.neos.md)

## What you'll learn

| Step | Concepts |
| --- | --- |
| 1 | Agent, model, instruction, ADK playground |
| 2 | Function tools, Pydantic schemas, structured output |
| 3 | SequentialAgent, ParallelAgent, output_key, state flow |
| 4 | AgentTool, before_agent_callback, session state |
| 5 | before_model_callback, LlmRequest, multimodal files |

## Getting started

Click the button above to open the guided tutorial in Cloud Shell. The walkthrough will guide you through project setup, coding, and testing.

To run locally instead, you need **uv**, **Node.js** (v18+), **Google Cloud SDK**, and **make**.

## Project structure

```text
steps/           Workshop step folders (edit code here)
solutions/       Complete solutions for each step
app/             Final complete application
frontend/        React frontend (bonus)
tests/           Unit tests and ADK evaluation
.journey/        Cloud Shell walkthrough tutorial
```

## Commands

| Command | Description |
| --- | --- |
| `make install` | Install Python and frontend dependencies |
| `make agent-env` | Generate `.env` for ADK agents |
| `make playground STEP=step-01-first-agent` | Launch ADK playground for a step |
| `make local-backend` | Launch FastAPI server |
| `make test` | Run unit tests |
| `make eval` | Run ADK evaluation |
