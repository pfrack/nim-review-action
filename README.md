# NIM Code Review

AI-powered code review for GitHub PRs using NVIDIA NIM models with automatic fallback.

## Usage

Add this to your repo's `.github/workflows/nim-code-review.yml`:

```yaml
name: NIM Code Review
on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  contents: read
  pull-requests: write

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pfrack/nim-review-action@v1
        with:
          nim_api_key: ${{ secrets.NIM_API_KEY }}
```

## Inputs

| Input | Default | Description |
|-------|---------|-------------|
| `nim_api_key` | (required) | NVIDIA NIM API key |
| `nim_base_url` | `https://integrate.api.nvidia.com/v1` | NIM endpoint |
| `nim_models` | see below | Comma-separated fallback chain |
| `max_files` | `15` | Max files to review per PR |
| `exclude_patterns` | `*.lock,*.md,*.txt,*.svg,*.png,*.sum` | Glob patterns to skip |
| `nim_system_prompt` | (empty) | Custom system prompt to override or append |
| `nim_prompt_mode` | `append` | How to use custom prompt: `append` or `replace` |

## Default Fallback Chain

1. `meta/llama-3.3-70b-instruct` (Meta)
2. `deepseek-ai/deepseek-v4-pro` (DeepSeek)
3. `nvidia/llama-3.1-nemotron-70b-instruct` (NVIDIA)
4. `mistralai/mistral-large-3-675b-instruct-2512` (Mistral)
5. `qwen/qwen3.5-397b-a17b` (Alibaba)
6. `minimaxai/minimax-m3` (MiniMax)
7. `z-ai/glm-5.2` (Zhipu AI)

Models are tried in order. On error (rate limit, 500, timeout), the next model is tried.

## Setup

1. Get an API key from [build.nvidia.com](https://build.nvidia.com)
2. Add `NIM_API_KEY` as a repository secret (or org-level secret for multiple repos)
3. Add the workflow file above

## Local Development

```bash
npm install
npm run build
npm test
```

## Per-Language Prompts

The action automatically detects the language of each file and uses a specialized review prompt:

- **Go** — goroutine leaks, race conditions, error handling, resource management
- **Python** — mutable defaults, bare excepts, resource management, type hints
- **TypeScript/JavaScript** — async/await, type safety, memory leaks, promise handling
- **Java** — resource management, thread safety, null safety, stream API
- **Rust** — unsafe code, lifetime issues, unwrap calls, error handling
- **C/C++** — memory safety, undefined behavior, smart pointers, RAII

Unknown file extensions fall back to the base review prompt.

## Custom Prompts

Override the default system prompt via environment variables:

```yaml
- uses: pfrack/nim-review-action@v1
  with:
    nim_api_key: ${{ secrets.NIM_API_KEY }}
    nim_system_prompt: "Focus on security vulnerabilities and OWASP Top 10"
    nim_prompt_mode: append  # or replace
```

- **`append`** (default): Your prompt is prepended to the language-specific template
- **`replace`**: Your prompt completely replaces the default

## Benchmarking

Use the benchmark tool to compare NIM model speeds:

```bash
npm run build
export NIM_API_KEY=your-key
export NIM_BENCH_ITERATIONS=5        # default: 5
export NIM_BENCH_PROMPT="..."        # optional custom prompt
node dist/bench-entry.js
```

Output is a markdown table with TTFT, latency, and tokens/sec per model. When run in GitHub Actions, results are written to `$GITHUB_STEP_SUMMARY`.
