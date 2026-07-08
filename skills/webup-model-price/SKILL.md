---
name: webup-model-price
description: Look up and normalize latest model pricing from models.dev, with provider-aware search, cached catalog data, and token cost estimation. Use when Codex needs model unit prices, to compare pricing across providers/platforms, to estimate model usage cost from token counts, or to support Claude Code/statusline cost calculations.
---

# Model Price Lookup

Query `models.dev` pricing data and return a normalized JSON shape that other skills can consume.

## Script Directory

All scripts are in this skill's `scripts/` directory.

| Script | Purpose |
|--------|---------|
| `scripts/price.mjs` | Fetch/cache `models.dev` catalog data, look up provider-specific model prices, and optionally estimate token cost |

## Usage

```bash
npx -y bun ${SKILL_DIR}/scripts/price.mjs --provider anthropic --model claude-opus-4-7
npx -y bun ${SKILL_DIR}/scripts/price.mjs --model claude-opus-4-7 --all
npx -y bun ${SKILL_DIR}/scripts/price.mjs --provider anthropic --model claude-opus-4-7 --input-tokens 100000 --output-tokens 10000
```

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `--model <id>` | required | Model ID to look up, such as `claude-opus-4-7` or a provider-prefixed ID |
| `--provider <id>` | none | Exact provider/platform key from `models.dev`, such as `anthropic`, `openrouter`, or `bedrock` |
| `--all` | off | Return every provider with an exact model match |
| `--no-default-provider` | off | Disable the default Anthropic lookup and require ambiguity resolution |
| `--catalog <path>` | none | Read a local `models.dev` catalog JSON file, mainly for tests/offline use |
| `--cache-dir <path>` | `$XDG_CACHE_HOME/webup-model-price` or `~/.cache/webup-model-price` | Cache directory for downloaded catalog data |
| `--refresh` | off | Force a fresh catalog download |
| `--ttl-seconds <n>` | `86400` | Cache freshness window |
| `--input-tokens <n>` | `0` | Fresh input tokens for cost estimation |
| `--output-tokens <n>` | `0` | Output tokens for cost estimation |
| `--cache-read-tokens <n>` | `0` | Cache read tokens for cost estimation |
| `--cache-write-tokens <n>` | `0` | Cache creation/write tokens for cost estimation |

## Provider Handling

Prefer exact provider lookup when the calling context knows the platform:

```bash
npx -y bun ${SKILL_DIR}/scripts/price.mjs --provider anthropic --model claude-opus-4-7
```

Use `--all` for comparison across platforms. Without `--provider`, the script first tries `anthropic` because Claude Code uses Anthropic-hosted model IDs. If that misses, it searches all providers. If several providers match, it exits with an ambiguity message and tells the caller to pass `--provider` or `--all`.

## Output Shape

Single-provider lookup returns:

```json
{
  "source": "models.dev",
  "provider": "anthropic",
  "providerName": "Anthropic",
  "model": "claude-opus-4-7",
  "displayName": "Claude Opus 4.7",
  "updatedAt": "2026-04-16",
  "costPerMillion": {
    "input": 5,
    "output": 25,
    "cacheRead": 0.5,
    "cacheWrite": 6.25
  }
}
```

When token counts are provided, the result also includes `usageTokens` and `estimatedCostUsd`.
