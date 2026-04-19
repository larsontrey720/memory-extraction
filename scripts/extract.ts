#!/usr/bin/env bun
/**
 * Memory Extraction Script
 * 
 * Extracts and compresses conversation context into structured AGENTS.md memory blocks.
 * Works with any OpenAI-compatible chat completions endpoint.
 * 
 * Usage:
 *   bun extract.ts --memory ./AGENTS.md --conversation ./chat.txt
 *   bun extract.ts --memory ./AGENTS.md --text "conversation text"
 *   bun extract.ts --url https://example.com/chat
 * 
 * Environment variables (or pass via flags):
 *   OPENAI_API_KEY      - Your API key
 *   OPENAI_BASE_URL     - Base URL for API
 *   OPENAI_MODEL        - Model name
 */

import { parseArgs } from "node:util";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";

// Default configuration - can be overridden via env vars or CLI flags
const DEFAULT_API_KEY = process.env.OPENAI_API_KEY || "";
const DEFAULT_BASE_URL = process.env.OPENAI_BASE_URL || "https://integrate.api.nvidia.com/v1";
const DEFAULT_MODEL = process.env.OPENAI_MODEL || "nvidia/nemotron-3-super-120b-a12b";

// Parse CLI arguments
const { values } = parseArgs({
  options: {
    memory: { type: "string", short: "m", default: "./AGENTS.md" },
    conversation: { type: "string", short: "c", default: "" },
    text: { type: "string", short: "t", default: "" },
    url: { type: "string", short: "u", default: "" },
    output: { type: "string", short: "o", default: "" },
    "api-key": { type: "string", default: "" },
    "base-url": { type: "string", default: "" },
    model: { type: "string", default: "" },
    help: { type: "boolean", short: "h", default: false },
  },
  allowPositional: true,
});

if (values.help) {
  console.log(`
Memory Extraction - Extract structured memory from conversations

USAGE:
  bun extract.ts [OPTIONS]

OPTIONS:
  -m, --memory <file>       Path to AGENTS.md (default: ./AGENTS.md)
  -c, --conversation <file>  Path to conversation file
  -t, --text <text>         Raw conversation text
  -u, --url <url>           URL to fetch conversation from
  -o, --output <file>       Output file (default: update memory file)
  --api-key <key>           API key (or OPENAI_API_KEY env)
  --base-url <url>          API base URL (or OPENAI_BASE_URL env)
  --model <model>           Model name (or OPENAI_MODEL env)
  -h, --help                Show this help

EXAMPLES:
  # Extract from file
  bun extract.ts -m ./AGENTS.md -c ./chat.txt

  # Extract from URL
  bun extract.ts -m ./AGENTS.md -u https://zo.computer/chats/xxx

  # Use custom endpoint
  OPENAI_BASE_URL=https://api.groq.com/openai/v1 \\
    bun extract.ts -m ./AGENTS.md -c ./chat.txt
`);
  process.exit(0);
}

// Configuration
const API_KEY = values["api-key"] || process.env.OPENAI_API_KEY || DEFAULT_API_KEY;
const BASE_URL = values["base-url"] || process.env.OPENAI_BASE_URL || DEFAULT_BASE_URL;
const MODEL = values.model || process.env.OPENAI_MODEL || DEFAULT_MODEL;

interface MemoryBlock {
  workContext: string;
  personalContext: string;
  topOfMind: string[];
  briefHistory: string[];
  earlierContext: string[];
  longTermBackground: string[];
}

function parseMemory(content: string): MemoryBlock {
  const sections: MemoryBlock = {
    workContext: "",
    personalContext: "",
    topOfMind: [],
    briefHistory: [],
    earlierContext: [],
    longTermBackground: [],
  };

  const workMatch = content.match(/## Work context\n([\s\S]*?)(?=\n## |$)/);
  const personalMatch = content.match(/## Personal context\n([\s\S]*?)(?=\n## |$)/);
  const topMatch = content.match(/## Top of mind\n([\s\S]*?)(?=\n## |$)/);
  const briefMatch = content.match(/## Brief history\n([\s\S]*?)(?=\n## |$)/);
  const earlierMatch = content.match(/## Earlier context\n([\s\S]*?)(?=\n## |$)/);
  const longMatch = content.match(/## Long-term background\n([\s\S]*?)(?=\n## |$)/);

  if (workMatch) sections.workContext = workMatch[1].trim();
  if (personalMatch) sections.personalContext = personalMatch[1].trim();
  if (topMatch) sections.topOfMind = topMatch[1].split("\n").filter(l => l.trim()).map(l => l.replace(/^-\s*/, ""));
  if (briefMatch) sections.briefHistory = briefMatch[1].split("\n\n").filter(l => l.trim());
  if (earlierMatch) sections.earlierContext = earlierMatch[1].split("\n\n").filter(l => l.trim());
  if (longMatch) sections.longTermBackground = longMatch[1].split("\n").filter(l => l.trim()).map(l => l.replace(/^-\s*/, ""));

  return sections;
}

function formatMemory(block: MemoryBlock): string {
  let output = `## Work context\n${block.workContext}\n\n`;
  output += `## Personal context\n${block.personalContext}\n\n`;
  output += `## Top of mind\n${block.topOfMind.map(i => `- ${i}`).join("\n")}\n\n`;
  output += `## Brief history\n${block.briefHistory.join("\n\n")}\n\n`;
  output += `## Earlier context\n${block.earlierContext.join("\n\n")}\n\n`;
  output += `## Long-term background\n${block.longTermBackground.map(i => `- ${i}`).join("\n")}\n`;
  return output;
}

async function callLLM(prompt: string): Promise<string> {
  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error ${response.status}: ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
}

async function extractMemory(conversationText: string, existingMemory: MemoryBlock): Promise<MemoryBlock> {
  const existingStr = existingMemory.workContext ? formatMemory(existingMemory) : "No existing memory.";

  const prompt = `You are a memory extraction system. Extract and compress information from the conversation below into a structured memory block.

OUTPUT FORMAT (exact structure required):
## Work context
<1-2 sentences with dense nouns describing current project/work identity>

## Personal context
<2-3 sentences about communication style, preferences, no examples>

## Top of mind
- <bullet point for active decisions, open questions, blocking issues>
- <max 5 bullets, only what matters NOW>

## Brief history
<paragraphs describing recent work, grouped by theme, specific outcomes>

## Earlier context
<paragraphs describing past phases, compressed, thematic>

## Long-term background
- <one-liner per persistent trait or background interest>

RULES:
1. Dense noun phrases, no conversational filler
2. No "the user said" or "we discussed" - pure extracted facts
3. New info supersedes old, remove duplicates
4. Group by theme, not chronology
5. Be specific: names, URLs, decisions, outcomes
6. Compress: brief history stays detailed, earlier context compresses further

EXISTING MEMORY:
${existingStr}

CONVERSATION TO EXTRACT FROM:
${conversationText}

OUTPUT:`;

  const result = await callLLM(prompt);
  return parseMemory(result);
}

async function fetchUrl(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
  return await response.text();
}

async function main() {
  let conversationText = values.text;
  let memoryPath = values.memory;

  // Get conversation from file, URL, or direct text
  if (values.conversation) {
    conversationText = readFileSync(values.conversation, "utf-8");
  } else if (values.url) {
    console.error(`Fetching ${values.url}...`);
    conversationText = await fetchUrl(values.url);
  }

  if (!conversationText) {
    console.error("Error: No conversation provided. Use -c, -t, or -u.");
    process.exit(1);
  }

  // Read existing memory if it exists
  let existingMemory: MemoryBlock = {
    workContext: "",
    personalContext: "",
    topOfMind: [],
    briefHistory: [],
    earlierContext: [],
    longTermBackground: [],
  };

  if (existsSync(memoryPath)) {
    const existing = readFileSync(memoryPath, "utf-8");
    existingMemory = parseMemory(existing);
  }

  console.error(`Extracting memory using ${MODEL}...`);
  console.error(`Endpoint: ${BASE_URL}`);

  // Extract and compress
  const updatedMemory = await extractMemory(conversationText, existingMemory);

  // Format output
  const output = formatMemory(updatedMemory);

  // Write to file or stdout
  if (values.output) {
    writeFileSync(values.output, output);
    console.error(`Memory written to ${values.output}`);
  } else {
    writeFileSync(memoryPath, output);
    console.error(`Memory updated in ${memoryPath}`);
  }

  console.log(output);
}

main().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
