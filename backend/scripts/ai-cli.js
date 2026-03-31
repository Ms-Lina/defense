#!/usr/bin/env node
/**
 * MenyAI AI CLI
 *
 * Usage:
 *   node scripts/ai-cli.js health
 *   node scripts/ai-cli.js chat --message "Sobanura inyuguti A" --token "<FIREBASE_ID_TOKEN>"
 *
 * Environment:
 *   BASE_URL=http://localhost:4000
 *   AI_TOKEN=<FIREBASE_ID_TOKEN>   (optional alternative to --token)
 *   AI_MESSAGE="..."               (optional alternative to --message)
 *   AI_CONTEXT="..."               (optional alternative to --context)
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const BASE_URL = (process.env.BASE_URL || process.env.DEPLOYED_BACKEND_URL || "http://localhost:4000").replace(/\/$/, "");
const REQUEST_TIMEOUT_MS = Number(process.env.AI_CLI_TIMEOUT_MS || 15000);

function readArg(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

function showUsage() {
  console.log(`
MenyAI AI CLI

Commands:
  health
    Check AI backend readiness (GET /api/ai/health)

  chat --message "<text>" [--context "<lesson context>"] [--token "<firebase id token>"]
    Send one chat request (POST /api/ai/chat)

Examples:
  node scripts/ai-cli.js health
  node scripts/ai-cli.js chat --message "Sobanura inyuguti A" --token "<TOKEN>"
  BASE_URL=https://menyai-nslw.onrender.com node scripts/ai-cli.js health
`);
}

async function health() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const res = await fetch(`${BASE_URL}/api/ai/health`, { signal: controller.signal });
  clearTimeout(timeout);
  const data = await res.json().catch(() => ({}));
  console.log("BASE_URL:", BASE_URL);
  console.log("status:", res.status);
  console.log("configured:", !!data.configured);
  if (data.model) console.log("model:", data.model);
  if (data.message) console.log("message:", data.message);
  if (!res.ok) process.exitCode = 1;
}

async function chat() {
  const message = readArg("--message") || process.env.AI_MESSAGE;
  const lessonContext = readArg("--context") || process.env.AI_CONTEXT;
  const tokenRaw = readArg("--token") || process.env.AI_TOKEN || process.env.SUBMIT_TEST_TOKEN || "";
  const token = tokenRaw.startsWith("Bearer ") ? tokenRaw : (tokenRaw ? `Bearer ${tokenRaw}` : "");

  if (!message) {
    console.error("Missing --message (or AI_MESSAGE env).");
    process.exit(1);
  }
  if (!token) {
    console.error("Missing --token (or AI_TOKEN env). /api/ai/chat requires Firebase Bearer token.");
    process.exit(1);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const res = await fetch(`${BASE_URL}/api/ai/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    signal: controller.signal,
    body: JSON.stringify({
      message,
      ...(lessonContext ? { lessonContext } : {}),
    }),
  });
  clearTimeout(timeout);
  const data = await res.json().catch(() => ({}));

  console.log("BASE_URL:", BASE_URL);
  console.log("status:", res.status);
  if (res.ok) {
    console.log("reply:\n");
    console.log(data.reply || "(empty)");
    return;
  }
  console.error("error:", data.error || "AI request failed");
  if (data.code) console.error("code:", data.code);
  if (data.details) console.error("details:", data.details);
  process.exitCode = 1;
}

async function main() {
  const command = process.argv[2];
  if (!command || command === "--help" || command === "-h") {
    showUsage();
    return;
  }
  if (command === "health") {
    await health();
    return;
  }
  if (command === "chat") {
    await chat();
    return;
  }
  console.error(`Unknown command: ${command}`);
  showUsage();
  process.exit(1);
}

main().catch((err) => {
  console.error("CLI failed:", err?.message || err);
  process.exit(1);
});

