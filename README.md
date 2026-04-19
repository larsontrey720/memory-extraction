# Memory Extraction System

Extract and compress conversation context into structured AGENTS.md memory blocks. Works with any OpenAI-compatible API.

## Structure

```
## Work context
<1-2 sentences> ← Current project identity, dense nouns

## Personal context
<2-3 sentences> ← Communication style, preferences, no examples

## Top of mind
- <bullet> ← Active decisions, open questions, blocking issues
- <bullet> ← Max 5 items, what matters NOW

## Brief history
<paragraphs> ← Recent months, detailed, grouped by theme

## Earlier context  
<paragraphs> ← Past phases, compressed, thematic

## Long-term background
- <one-liner> ← Persistent traits, background interests
```

## Quick Start

```bash
# Install Bun if needed
curl -fsSL https://bun.sh/install | bash

# Set API key
export OPENAI_API_KEY=sk-xxx

# Run extraction
bun extract.ts -m ./AGENTS.md -c ./conversation.txt
```

## Configuration

Environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | API key (required) | - |
| `OPENAI_BASE_URL` | API endpoint base URL | `https://api.openai.com/v1` |
| `OPENAI_MODEL` | Model to use for extraction | `gpt-4o-mini` |

## Supported Providers

Any OpenAI-compatible `/v1/chat/completions` endpoint:

### OpenAI
```bash
export OPENAI_API_KEY=sk-xxx
bun extract.ts -m ./AGENTS.md -c ./chat.txt
```

### Anthropic (via OpenAI-compatible proxy)
```bash
export OPENAI_API_KEY=sk-ant-xxx
export OPENAI_BASE_URL=https://api.anthropic.com/v1
export OPENAI_MODEL=claude-3-haiku-20240307
bun extract.ts -m ./AGENTS.md -c ./chat.txt
```

### Ollama (local)
```bash
export OPENAI_API_KEY=local
export OPENAI_BASE_URL=http://localhost:11434/v1
export OPENAI_MODEL=llama3
bun extract.ts -m ./AGENTS.md -c ./chat.txt
```

### Groq
```bash
export OPENAI_API_KEY=gsk_xxx
export OPENAI_BASE_URL=https://api.groq.com/openai/v1
export OPENAI_MODEL=llama3-8b-8192
bun extract.ts -m ./AGENTS.md -c ./chat.txt
```

### OpenRouter
```bash
export OPENAI_API_KEY=sk-or-xxx
export OPENAI_BASE_URL=https://openrouter.ai/api/v1
export OPENAI_MODEL=anthropic/claude-3-haiku
bun extract.ts -m ./AGENTS.md -c ./chat.txt
```

## Extraction Process

```
Conversation ends
       ↓
Call extract.ts with conversation + existing AGENTS.md
       ↓
Model extracts: entities, facts, decisions, open questions
       ↓
Merge: new info supersedes old, duplicates removed
       ↓
Compress: brief history stays detailed, earlier context compressed
       ↓
Write: updated memory block saved to AGENTS.md
```

## Compression Rules

| Section | Style | Max Size |
|---------|-------|----------|
| Work context | Dense nouns | 2 sentences |
| Personal context | Brief attributes | 3 sentences |
| Top of mind | Active bullets | 5 items |
| Brief history | Detailed paragraphs | 3-5 paragraphs |
| Earlier context | Compressed themes | 2-3 paragraphs |
| Long-term background | One-liners | 5-8 items |

## Example Output

```markdown
## Work context
Building Auxlo (auxlo.xyz), an AI agent orchestration platform targeting developers and SMBs. Model routing across OpenAI, Anthropic, Google, and smaller providers.

## Personal context
Direct communication style, no fluff. Prefers technical details over pleasantries. Gets frustrated with slow progress on infrastructure tasks.

## Top of mind
- Voice agent architecture using Gemini 2.5 Flash Native Audio
- Provider subscription management (currently evaluating MiniMax)
- Infrastructure latency issues blocking deployment

## Brief history
Built and tested white-labeled AI agent (Rico) for client, iteratively hardening system prompts. Designed voice agent architecture with WebSocket-to-telephony bridging, navigating geographic restrictions. Ran systematic benchmarks comparing MiniMax M2.7 against GPT-4 and Claude for cost/performance optimization.

## Earlier context
Explored multiple AI providers for model routing. Freelance development work building AI-powered products. Background in writing combined with AI agent-building as service offering.

## Long-term background
- Long-standing interest in AI model evaluation and infrastructure
- Freelance development including data bundle reseller platform for Ghanaian market
- Creative direction for GoDark crypto trading platform
- Vibe coding as development approach
```

## License

MIT
