---
name: memory-extraction
description: Extract and compress conversation context into structured AGENTS.md memory blocks. Run after conversations to update project/workspace memory. Works with any OpenAI-compatible API.
compatibility: Created for Zo Computer
metadata:
  author: georgeo.zo.computer
---

# Memory Extraction Skill

Extracts and compresses information from conversations into a structured memory block, following the Claude memory architecture.

## Structure

```
## Work context          ← Current project identity
## Personal context      ← Communication preferences
## Top of mind           ← Active concerns right now
## Brief history         ← Recent months (detailed, actionable)
## Earlier context       ← Past phases (compressed, thematic)
## Long-term background  ← Persistent traits, background interests
```

## Usage

```bash
# Set environment variables
export OPENAI_API_KEY=sk-xxx
export OPENAI_BASE_URL=https://api.openai.com/v1  # optional, defaults to OpenAI
export OPENAI_MODEL=gpt-4o-mini                    # optional, defaults to gpt-4o-mini

# Run extraction
bun extract.ts --memory ./AGENTS.md --conversation ./chat.txt
bun extract.ts -m ./AGENTS.md --text "conversation text"
```

## Supported Providers

Any OpenAI-compatible chat completions endpoint:

| Provider | BASE_URL | Example Model |
|----------|----------|---------------|
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` |
| Anthropic via proxy | `https://api.anthropic.com/v1` | `claude-3-haiku-20240307` |
| Ollama | `http://localhost:11434/v1` | `llama3`, `mistral` |
| Groq | `https://api.groq.com/openai/v1` | `llama3-8b-8192` |
| Together | `https://api.together.xyz/v1` | `meta-llama/Llama-3-8b-chat-hf` |
| OpenRouter | `https://openrouter.ai/api/v1` | `anthropic/claude-3-haiku` |
| Custom | Any `/v1/chat/completions` endpoint | Any model |

## Files

- `scripts/extract.ts` - Main extraction script
- `scripts/example-extraction.ts` - Demonstrates prompt/output format
