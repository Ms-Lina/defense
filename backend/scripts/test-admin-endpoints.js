/**
 * Test all admin API endpoints (stats, lessons, users, progress, analytics, reports, AI).
 * Requires ADMIN_SECRET in backend/.env (or env) and backend running.
 *
 * Local:  node backend/scripts/test-admin-endpoints.js
 * Remote: BASE_URL=https://menyai-nslw.onrender.com ADMIN_SECRET=your-secret node backend/scripts/test-admin-endpoints.js
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const http = require("http");
const https = require("https");

const PORT = process.env.PORT || 4000;
const BASE = (process.env.BASE_URL || process.env.DEPLOYED_BACKEND_URL || "").replace(/\/$/, "") || `http://localhost:${PORT}`;
const ADMIN_SECRET = process.env.ADMIN_SECRET || "";
const isHttps = BASE.startsWith("https");
const client = isHttps ? https : http;

function request(method, urlPath, body = null) {
  const url = new URL(urlPath, BASE);
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method,
      timeout: 20000,
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
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: json });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("timeout"));
    });
    if (body) req.write(typeof body === "string" ? body : JSON.stringify(body));
    req.end();
  });
}

const endpoints = [
  { name: "Stats", path: "/api/admin/stats", check: (r) => r.status === 200 && typeof r.data.totalLessons === "number" },
  { name: "Lessons", path: "/api/admin/lessons", check: (r) => r.status === 200 && Array.isArray(r.data?.lessons) },
  { name: "Users", path: "/api/admin/users", check: (r) => r.status === 200 && Array.isArray(r.data?.users) },
  { name: "Progress", path: "/api/admin/progress", check: (r) => r.status === 200 && Array.isArray(r.data?.progress) },
  { name: "Analytics", path: "/api/admin/analytics", check: (r) => r.status === 200 && typeof r.data.totalUsers === "number" },
  { name: "Reports", path: "/api/admin/reports", check: (r) => r.status === 200 && r.data?.summary && Array.isArray(r.data?.learners) },
  { name: "AI Stats", path: "/api/admin/ai-stats", check: (r) => r.status === 200 && typeof r.data.learnersUsingAI === "number" },
  { name: "AI Logs", path: "/api/admin/ai-logs?limit=5", check: (r) => r.status === 200 && Array.isArray(r.data?.logs) },
];

async function main() {
  console.log("MenyAI Admin – fetch test");
  console.log("BASE:", BASE);
  console.log("X-Admin-Key:", ADMIN_SECRET ? "(set)" : "(missing – will get 401)");
  console.log("");

  if (!ADMIN_SECRET) {
    console.warn("Warning: ADMIN_SECRET not set. Admin endpoints will return 401.");
  }

  const results = { ok: [], fail: [] };

  for (const ep of endpoints) {
    try {
      const r = await request("GET", ep.path);
      const passed = ep.check(r);
      const summary = passed ? briefSummary(ep.name, r.data) : `${r.status} ${r.data?.error || JSON.stringify(r.data).slice(0, 80)}`;
      if (passed) {
        results.ok.push(`${ep.name}: ${summary}`);
      } else {
        results.fail.push(`${ep.name}: ${summary}`);
      }
    } catch (e) {
      results.fail.push(`${ep.name}: ${e.message}`);
    }
  }

  function briefSummary(name, data) {
    switch (name) {
      case "Stats":
        return `lessons=${data.totalLessons} users=${data.totalUsers} progressDocs=${data.totalProgressDocs}`;
      case "Lessons":
        return `${data.lessons?.length ?? 0} lessons`;
      case "Users":
        return `${data.users?.length ?? 0} users`;
      case "Progress":
        return `${data.progress?.length ?? 0} records`;
      case "Analytics":
        return `completed=${data.totalLessonsCompleted} today=${data.lessonsCompletedToday} week=${data.lessonsCompletedThisWeek} ai%=${data.aiUsagePercent}`;
      case "Reports":
        return `learners=${data.learners?.length ?? 0} completions=${data.summary?.totalCompletions ?? 0}`;
      case "AI Stats":
        return `usingAI=${data.learnersUsingAI} activations=${data.totalActivations}`;
      case "AI Logs":
        return `${data.logs?.length ?? 0} logs`;
      default:
        return "OK";
    }
  }

  console.log("Passed:", results.ok.length);
  results.ok.forEach((s) => console.log("  ", s));
  if (results.fail.length) {
    console.log("\nFailed:", results.fail.length);
    results.fail.forEach((s) => console.log("  ", s));
    process.exit(1);
  }
  console.log("\nAll admin fetches OK.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
