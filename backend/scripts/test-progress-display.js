/**
 * Verify what the backend sees for progress vs what the app displays.
 *
 * Mode 1 – Firestore (no token): node scripts/test-progress-display.js [UID]
 *   Or: PROGRESS_TEST_UID=your-uid node scripts/test-progress-display.js
 *
 * Mode 2 – Live API (needs token): PROGRESS_TEST_TOKEN=Bearer_xxx BASE_URL=http://localhost:4000 node scripts/test-progress-display.js
 *   Get token from app (e.g. add a temporary console.log(user.getIdToken()) on Home screen).
 *
 * If no UID and no token: prints totalLessons only.
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { initFirebase, getDb } = require("../config/firebase");

const BASE_URL = process.env.BASE_URL || process.env.DEPLOYED_BACKEND_URL || "http://localhost:4000";
const TOKEN = process.env.PROGRESS_TEST_TOKEN;

async function testViaApi() {
  if (!TOKEN) return false;
  const res = await fetch(`${BASE_URL}/api/progress`, {
    headers: { Authorization: TOKEN.startsWith("Bearer ") ? TOKEN : `Bearer ${TOKEN}` },
  });
  if (!res.ok) {
    console.log("API GET /api/progress status:", res.status, res.statusText);
    const text = await res.text();
    if (text) console.log("Body:", text.slice(0, 200));
    return true;
  }
  const data = await res.json();
  const total = data.totalLessons ?? 0;
  const completed = data.completedLessons ?? 0;
  const percent = total ? Math.round((completed / total) * 100) : 0;
  console.log("=== GET /api/progress (live) ===\n");
  console.log("completedLessons:", data.completedLessons);
  console.log("totalLessons:", data.totalLessons);
  console.log("remainingLessons:", data.remainingLessons);
  console.log("streakDays:", data.streakDays);
  console.log("percent:", percent + "%");
  console.log("lessonHistory length:", (data.lessonHistory || []).length);
  return true;
}

initFirebase();

async function run() {
  if (TOKEN) {
    const done = await testViaApi();
    if (done) process.exit(0);
  }

  const db = getDb();
  if (!db) {
    console.error("❌ Firebase not initialized. Check .env and service account.");
    process.exit(1);
  }

  const uid = process.env.PROGRESS_TEST_UID || process.argv[2];

  // 1. totalLessons (same as GET /api/progress and GET /api/lessons)
  const lessonsSnap = await db.collection("lessons").orderBy("order").get();
  const totalLessons = lessonsSnap.size;
  console.log("=== What GET /api/progress uses ===\n");
  console.log("totalLessons (from lessons collection, orderBy order):", totalLessons);

  if (!uid) {
    console.log("\nNo UID provided. To see user progress, run:");
    console.log("  node scripts/test-progress-display.js YOUR_FIREBASE_UID");
    console.log("  or set PROGRESS_TEST_UID=YOUR_UID");
    process.exit(0);
  }

  // 2. Primary: users/uid/lessonHistory
  const userHistorySnap = await db.collection("users").doc(uid).collection("lessonHistory").get();
  const userHistory = userHistorySnap.docs.map((d) => ({ lessonId: d.id, ...d.data() }));
  const completedFromUser = userHistory.filter((h) => h.passed === true).length;

  // 3. Legacy: progress/uid/history
  const legacyHistorySnap = await db.collection("progress").doc(uid).collection("history").get();
  const legacyHistory = legacyHistorySnap.docs.map((d) => ({ lessonId: d.id, ...d.data() }));
  const completedFromLegacy = legacyHistory.filter((h) => h.passed === true).length;

  // 4. Streak from users/uid/progress/overall
  const userProgressSnap = await db.collection("users").doc(uid).collection("progress").doc("overall").get();
  const userProgress = userProgressSnap.exists ? userProgressSnap.data() : {};
  const streakFromUser = userProgress.currentStreak ?? userProgress.streakDays ?? 0;

  // 5. Legacy streak from progress/uid
  const legacyProgressSnap = await db.collection("progress").doc(uid).get();
  const legacyProgress = legacyProgressSnap.exists ? legacyProgressSnap.data() : {};
  const streakFromLegacy = legacyProgress.streakDays ?? legacyProgress.currentStreak ?? 0;

  console.log("\n--- User:", uid, "---\n");
  console.log("users/" + uid + "/lessonHistory:");
  console.log("  docs count:", userHistory.length);
  console.log("  passed === true:", completedFromUser);
  if (userHistory.length > 0) {
    const scores = userHistory.map((h) => h.score).filter((s) => typeof s === "number");
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    console.log("  averageScore:", avg);
  }
  console.log("\nusers/" + uid + "/progress/overall:");
  console.log("  currentStreak:", userProgress.currentStreak);
  console.log("  streakDays (key):", userProgress.streakDays);

  console.log("\nprogress/" + uid + "/history (legacy):");
  console.log("  docs count:", legacyHistory.length);
  console.log("  passed === true:", completedFromLegacy);
  console.log("\nprogress/" + uid + " (legacy doc):");
  console.log("  streakDays:", legacyProgress.streakDays);

  // What GET /api/progress will return (primary path)
  const completedLessons = userHistory.length > 0 ? completedFromUser : completedFromLegacy;
  const streakDays = streakFromUser !== 0 ? streakFromUser : streakFromLegacy;
  const remainingLessons = totalLessons - completedLessons;
  const percent = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;

  console.log("\n=== GET /api/progress response (what app should show) ===");
  console.log("  completedLessons:", completedLessons);
  console.log("  totalLessons:", totalLessons);
  console.log("  remainingLessons:", remainingLessons);
  console.log("  streakDays:", streakDays);
  console.log("  percent:", percent + "%");
  console.log("\nIf the app shows different numbers, check:");
  console.log("  1. Same user (same UID) and token is valid.");
  console.log("  2. Backend is using the same Firebase project as this script.");
  console.log("  3. No caching in the app (pull-to-refresh or restart app).");

  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
