#!/usr/bin/env node
/**
 * Get Firebase ID token from CLI using phone + PIN (same auth logic as mobile app).
 *
 * Usage:
 *   node scripts/firebase-token-cli.js --phone 07xxxxxxxx --pin 123456
 *   node scripts/firebase-token-cli.js --phone 2507xxxxxxxx --pin 123456 --json
 *
 * Env alternatives:
 *   FIREBASE_PHONE=07xxxxxxxx
 *   FIREBASE_PIN=123456
 *   FIREBASE_API_KEY=<optional override>
 *
 * Notes:
 * - This returns an ID token for the user (idToken), usable as Bearer token.
 * - API key is safe to be public in Firebase client apps.
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const DEFAULT_API_KEY = "AIzaSyCybgVvn-UjlYPItthJhbWlxZKU0znUpm4";
const API_KEY = process.env.FIREBASE_API_KEY || DEFAULT_API_KEY;
const REQUEST_TIMEOUT_MS = Number(process.env.TOKEN_CLI_TIMEOUT_MS || 15000);

function readArg(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function showUsage() {
  console.log(`
Firebase Token CLI

Usage:
  node scripts/firebase-token-cli.js --phone 07xxxxxxxx --pin 123456
  node scripts/firebase-token-cli.js --phone 2507xxxxxxxx --pin 123456 --json

Options:
  --phone <number>    Phone number used in app login
  --pin <pin>         6-digit PIN
  --json              Output JSON (idToken/refreshToken/expiresIn/localId)
  -h, --help          Show help
`);
}

function phoneToEmail(phone) {
  // Keep behavior aligned with mobile/lib/auth-context.tsx
  const normalized = String(phone || "").replace(/\s+/g, "").replace(/^0/, "250");
  const digits = normalized.replace(/\D/g, "");
  return `${digits}@menyai.local`;
}

async function main() {
  if (hasFlag("-h") || hasFlag("--help")) {
    showUsage();
    return;
  }

  const phone = readArg("--phone") || process.env.FIREBASE_PHONE || "";
  const pin = readArg("--pin") || process.env.FIREBASE_PIN || "";
  const outputJson = hasFlag("--json");

  if (!phone || !pin) {
    console.error("Missing --phone and/or --pin.");
    showUsage();
    process.exit(1);
  }

  const email = phoneToEmail(phone);
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(API_KEY)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: controller.signal,
    body: JSON.stringify({
      email,
      password: pin,
      returnSecureToken: true,
    }),
  });
  clearTimeout(timeout);

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const code = data?.error?.message || "AUTH_FAILED";
    console.error("Failed to get token:", code);
    process.exit(1);
  }

  const payload = {
    idToken: data.idToken,
    refreshToken: data.refreshToken,
    expiresIn: data.expiresIn,
    localId: data.localId,
    email: data.email,
  };

  if (outputJson) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  console.log("email:", payload.email);
  console.log("localId:", payload.localId);
  console.log("expiresIn:", payload.expiresIn);
  console.log("\nID_TOKEN:\n");
  console.log(payload.idToken || "");
}

main().catch((err) => {
  console.error("Token CLI failed:", err?.message || err);
  process.exit(1);
});

