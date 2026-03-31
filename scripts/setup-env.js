#!/usr/bin/env node
/**
 * Add all env vars into .env files (from .env.example; keep existing values).
 * Run from repo root: node scripts/setup-env.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

function getAllKeysAndValues(content) {
  const vars = {};
  const order = [];
  if (!content) return { vars, order };
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    const isComment = trimmed.startsWith("#");
    const contentLine = isComment ? trimmed.replace(/^#\s*/, "").trim() : trimmed;
    const eq = contentLine.indexOf("=");
    if (eq === -1) continue;
    const key = contentLine.slice(0, eq).trim();
    const val = contentLine.slice(eq + 1).trim();
    if (!vars.hasOwnProperty(key)) {
      order.push(key);
      vars[key] = isComment ? "" : val;
    }
  }
  return { vars, order };
}

function processDir(dirName) {
  const dir = path.join(ROOT, dirName);
  const examplePath = path.join(dir, ".env.example");
  const envPath = path.join(dir, ".env");

  if (!fs.existsSync(examplePath)) {
    console.log(`Skip ${dirName}: no .env.example`);
    return;
  }

  const exampleText = fs.readFileSync(examplePath, "utf8");
  const { vars: exampleVars, order } = getAllKeysAndValues(exampleText);
  let existing = {};
  if (fs.existsSync(envPath)) {
    const { vars } = getAllKeysAndValues(fs.readFileSync(envPath, "utf8"));
    existing = vars;
  }

  const lines = [];
  for (const key of order) {
    const existingVal = existing[key];
    const exampleVal = exampleVars[key];
    const value = existingVal !== undefined && String(existingVal).trim() !== "" ? existingVal : (exampleVal ?? "");
    lines.push(`${key}=${value}`);
  }

  const out = lines.join("\n").trimEnd() + "\n";
  fs.writeFileSync(envPath, out, "utf8");
  console.log(`Updated ${path.relative(ROOT, envPath)} (${order.length} vars)`);
}

processDir("backend");
processDir("mobile");
processDir("admin-panel");

const rootEnv = path.join(ROOT, ".env");
if (!fs.existsSync(rootEnv)) {
  fs.writeFileSync(
    rootEnv,
    "# Add env vars here if needed (e.g. for Firebase or other config).\n# Do not commit secrets; use .env.local and add it to .gitignore.\n",
    "utf8"
  );
  console.log("Created .env (root)");
}

console.log("Done. Review each .env and fill in secrets (API keys, Firebase JSON, etc.).");
