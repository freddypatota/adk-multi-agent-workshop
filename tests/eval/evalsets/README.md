# Evaluation

This directory contains evaluation sets and configuration for testing the loan drawdown agent.

## Components

The evaluation system has three parts:

| Component | Path | Purpose |
| --- | --- | --- |
| **Evalset** | `tests/eval/evalsets/basic_eval.evalset.json` | Test cases (user messages, expected tool calls, initial state) |
| **Config** | `tests/eval/eval_config.json` | Evaluation criteria and thresholds (used by CLI only) |
| **Symlink** | `app/agents/loan_drawdown_agent/basic_eval.evalset.json` | Points to the evalset above so the playground UI can discover it |

## CLI vs Playground UI

There are two ways to run evaluations, and they behave differently:

### `make eval` (CLI)

Runs via `adk eval` with the config file. Uses the criteria defined in `eval_config.json`.

```bash
make eval                                              # Run with default evalset + config
make eval EVALSET=tests/eval/evalsets/custom.evalset.json  # Run with custom evalset
```

The CLI reads `eval_config.json` via `--config_file_path` and applies all criteria defined there. Results are saved to `app/agents/loan_drawdown_agent/.adk/eval_history/`.

### Playground UI

The playground discovers evalsets from the agent directory (via the symlink). However, it does **not** read `eval_config.json`. Instead, you select metrics manually from the UI's metric picker before running an eval.

**Key differences:**

| | CLI (`make eval`) | Playground UI |
| --- | --- | --- |
| Config source | `eval_config.json` | UI metric picker |
| Custom rubrics | Loaded from config | Not supported (only default metrics) |
| Evalset location | Any path (passed as argument) | Must be in agent directory |
| Results viewer | Terminal output + JSON files | Built-in UI (has a [known bug](https://github.com/google/adk-python/issues/4657) with failed results) |

## Evalset Format

Each `.evalset.json` follows the [ADK evaluation format](https://google.github.io/adk-docs/evaluate/):

```json
{
  "eval_set_id": "unique_id",
  "name": "Human-readable name",
  "eval_cases": [
    {
      "eval_id": "case_id",
      "conversation": [
        {
          "user_content": {
            "parts": [{"text": "User message"}]
          },
          "intermediate_data": {
            "tool_uses": [
              {"name": "tool_name", "args": {"param": "value"}}
            ]
          }
        }
      ],
      "session_input": {
        "app_name": "loan_drawdown_agent",
        "user_id": "test_user",
        "state": {}
      }
    }
  ]
}
```

### Key Fields

- `eval_cases`: Array of test scenarios
- `conversation`: Sequence of user turns, each with optional expected tool calls and final response
- `intermediate_data.tool_uses`: Expected tool calls for trajectory matching (optional)
- `session_input.state`: Initial session state (e.g., `has_uploaded_file`, `client_id`)

## Available Evaluation Metrics

Configured in `tests/eval/eval_config.json`. See the [ADK Criteria documentation](https://google.github.io/adk-docs/evaluate/criteria/) for full details.

### Reference-based metrics (require expected data in evalset)

| Metric | Description | Requires |
| --- | --- | --- |
| `tool_trajectory_avg_score` | Exact/in-order/any-order match of tool call trajectory | `intermediate_data.tool_uses` in evalset |
| `response_match_score` | ROUGE-1 similarity to expected response | `final_response` in evalset |
| `final_response_match_v2` | LLM-judged semantic match to expected response | `final_response` in evalset |

### Rubric-based metrics (no expected data needed)

| Metric | Description | Requires |
| --- | --- | --- |
| `rubric_based_final_response_quality_v1` | LLM-as-judge evaluates response quality against custom rubrics | `rubrics` in config |
| `rubric_based_tool_use_quality_v1` | LLM-as-judge evaluates tool usage against custom rubrics | `rubrics` in config |

### Standalone metrics (no configuration needed)

| Metric | Description |
| --- | --- |
| `safety_v1` | Evaluates response safety/harmlessness |
| `hallucinations_v1` | Checks if the response is grounded (no false/unsupported claims) |

### Current config

The project uses rubric-based metrics plus trajectory matching and safety:

- **`tool_trajectory_avg_score`** (`IN_ORDER`, threshold 0.8): Verifies the agent calls the expected tools in order, allowing extra tool calls in between.
- **`rubric_based_final_response_quality_v1`** (threshold 0.8): Checks relevance, helpfulness, and decision clarity via LLM-as-judge.
- **`rubric_based_tool_use_quality_v1`** (threshold 0.8): Verifies the agent invokes `loan_process` when appropriate and doesn't call it prematurely.
- **`safety_v1`** (threshold 0.8): Ensures responses are safe and harmless.

## Creating Custom Evalsets

1. Copy `basic_eval.evalset.json` as a template
2. Add cases covering the loan drawdown workflow (greeting, extraction, validation, decision)
3. Include expected tool calls for trajectory matching if using `tool_trajectory_avg_score`
4. Run `make eval EVALSET=tests/eval/evalsets/your_evalset.json`

## Tips

- Start with 3-5 representative cases
- Include both happy path and edge cases (e.g. sanctioned vendor, exceeded credit limit)
- Add cases when you find bugs in production
- Use `session_input.state` to pre-seed state (e.g., `has_uploaded_file: true`) for workflow tests
- Rubric-based metrics are more reliable than trajectory matching for LLM-powered agents since they tolerate non-deterministic behavior

See the [ADK evaluation documentation](https://google.github.io/adk-docs/evaluate/) for advanced options.
