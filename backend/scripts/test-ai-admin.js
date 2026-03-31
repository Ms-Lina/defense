/**
 * Test AI health and admin AI endpoints (ai-stats, ai-logs).
 * Run: node backend/scripts/test-ai-admin.js
 * Or:  BASE_URL=https://menyai-nslw.onrender.com ADMIN_SECRET=xxx node backend/scripts/test-ai-admin.js
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const http = require("http");
const https = require("https");

const BASE = (process.env.BASE_URL || process.env.DEPLOYED_BACKEND_URL || "http://localhost:4000").replace(/\/$/, "");
const ADMIN_SECRET = process.env.ADMIN_SECRET || "";
const isHttps = BASE.startsWith("https");
const client = isHttps ? https : http;

function request(method, urlPath) {
  const url = new URL(urlPath, BASE);
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method,
      timeout: 15000,
      headers: {
        "Content-Type": "application/json",
        ...(ADMIN_SECRET ? { "X-Admin-Key": ADMIN_SECRET } : {}),
      },
    };
    const req = client.request(opts, (res) => {
      let data = "";
      res.on("data", (ch) => (data += ch));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: data ? JSON.parse(data) : {} });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

async function main() {
  console.log("MenyAI – AI functionality test\nBASE:", BASE);
  console.log("");

  const results = { ok: [], fail: [] };

  // 1. AI health (no auth)
  try {
    const r = await request("GET", "/api/ai/health");
    if (r.status === 200 && r.data.configured) {
      results.ok.push(`GET /api/ai/health → configured=true, model=${r.data.model || "n/a"}`);
    } else if (r.status === 503 && r.data.configured === false) {
      results.ok.push(`GET /api/ai/health → 503 (AI not configured; set OPENAI_API_KEY to enable)`);
    } else {
      results.fail.push(`GET /api/ai/health → ${r.status} ${JSON.stringify(r.data).slice(0, 120)}`);
    }
  } catch (e) {
    results.fail.push(`GET /api/ai/health → ${e.message}`);
  }

  // 2. Admin AI stats
  try {
    const r = await request("GET", "/api/admin/ai-stats");
    if (r.status === 200 && typeof r.data.learnersUsingAI === "number") {
      results.ok.push(
        `GET /api/admin/ai-stats → learnersUsingAI=${r.data.learnersUsingAI} totalActivations=${r.data.totalActivations}`
      );
    } else if (r.status === 401) {
      results.fail.push("GET /api/admin/ai-stats → 401 (set ADMIN_SECRET)");
    } else if (r.status === 503) {
      results.fail.push("GET /api/admin/ai-stats → 503 (DB not configured)");
    } else {
      results.fail.push(`GET /api/admin/ai-stats → ${r.status} ${r.data?.error || JSON.stringify(r.data).slice(0, 80)}`);
    }
  } catch (e) {
    results.fail.push(`GET /api/admin/ai-stats → ${e.message}`);
  }

  // 3. Admin AI logs
  try {
    const r = await request("GET", "/api/admin/ai-logs?limit=5");
    if (r.status === 200 && Array.isArray(r.data.logs)) {
      results.ok.push(`GET /api/admin/ai-logs → ${r.data.logs.length} logs (limit 5)`);
      if (r.data.logs.length > 0) {
        const first = r.data.logs[0];
        console.log("  Sample log: uid=" + (first.uid || "").slice(0, 8) + "… createdAt=" + (first.createdAt || first.id));
      }
    } else if (r.status === 401) {
      results.fail.push("GET /api/admin/ai-logs → 401 (set ADMIN_SECRET)");
    } else {
      results.fail.push(`GET /api/admin/ai-logs → ${r.status} ${r.data?.error || ""}`);
    }
  } catch (e) {
    results.fail.push(`GET /api/admin/ai-logs → ${e.message}`);
  }

  console.log("Passed:", results.ok.length);
  results.ok.forEach((s) => console.log("  ", s));
  if (results.fail.length) {
    console.log("\nFailed:", results.fail.length);
    results.fail.forEach((s) => console.log("  ", s));
    process.exit(1);
  }
  console.log("\nAI admin endpoints OK.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
