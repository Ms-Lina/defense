/**
 * Reads Firebase service account JSON and prints it as one line
 * for pasting into Render as FIREBASE_SERVICE_ACCOUNT_JSON.
 * Run: node scripts/minify-firebase-json.js
 * Then copy the output and paste in Render → Environment.
 */
const path = require("path");
const fs = require("fs");

const jsonPath = process.argv[2] || path.join(__dirname, "..", ".env.firebase-key.json");

// Allow absolute path from user
const resolved = path.isAbsolute(jsonPath) ? jsonPath : path.resolve(process.cwd(), jsonPath);

if (!fs.existsSync(resolved)) {
  console.error("Usage: node scripts/minify-firebase-json.js [path-to-key.json]");
  console.error("Example: node scripts/minify-firebase-json.js \"C:\\Users\\uwabe\\Desktop\\MenyAI\\menyai-27cfc-firebase-adminsdk-fbsvc-f02c63039e.json\"");
  process.exit(1);
}

const json = JSON.parse(fs.readFileSync(resolved, "utf8"));
if (json.type !== "service_account") {
  console.error("File does not look like a Firebase service account key (missing type: service_account).");
  process.exit(1);
}

console.log(JSON.stringify(json));
