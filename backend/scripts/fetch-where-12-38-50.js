/**
 * Fetch database and trace where 12, 38, 50 come from (progress display).
 * Usage: node scripts/fetch-where-12-38-50.js
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { initFirebase, getDb } = require("../config/firebase");

initFirebase();

async function run() {
  const db = getDb();
  if (!db) {
    console.error("❌ Firebase not initialized.");
    process.exit(1);
  }

  console.log("=== 1. TOTAL LESSONS (where '50' or total could come from) ===\n");

  const lessonsSnap = await db.collection("lessons").orderBy("order").get();
  const totalLessons = lessonsSnap.size;

  console.log("Firestore collection 'lessons' (orderBy order):");
  console.log("  totalLessons = lessonsSnap.size =", totalLessons);
  console.log("");
  console.log("=> GET /api/progress returns totalLessons =", totalLessons);
  console.log("=> If the app shows 50, the DB here has", totalLessons, "- so 50 would mean 50 docs in DB or another source.\n");

  console.log("=== 2. COMPLETED & REMAINING (where 12 and 38 come from) ===\n");

  console.log("Per-user: completedLessons = count of users/{uid}/lessonHistory where passed === true");
  console.log("          remainingLessons = totalLessons - completedLessons");
  console.log("");

  // List some users and their lessonHistory
  const auth = require("../config/firebase").getAuth();
  if (!auth) {
    console.log("(Auth not available – skipping per-user stats.)");
    process.exit(0);
  }

  const list = await auth.listUsers(100);
  console.log("Sample of users and their progress (as GET /api/progress would compute):\n");

  for (const u of list.users.slice(0, 10)) {
    const uid = u.uid;
    const lessonHistorySnap = await db.collection("users").doc(uid).collection("lessonHistory").get();
    const lessonHistory = lessonHistorySnap.docs.map((d) => ({ ...d.data() }));
    const completedLessons = lessonHistory.filter((h) => h.passed === true).length;
    const remainingLessons = totalLessons - completedLessons;
    const displayName = u.displayName || u.email || uid.slice(0, 8);
    console.log(`  ${displayName} (${uid.slice(0, 8)}…): completed=${completedLessons}, remaining=${remainingLessons}, total=${totalLessons}`);
    if (completedLessons === 12 || remainingLessons === 38 || totalLessons === 50) {
      console.log("      ^^^ MATCHES 12, 38, or 50");
    }
  }

  console.log("\n=== 3. HARDCODED 50 IN CODEBASE ===\n");
  console.log("  - backend/routes/admin.js (analytics): avgProgressPercent uses (totalUsers * 50) as denominator – does NOT affect mobile progress.");
  console.log("  - No other place in progress.js or mobile sets totalLessons to 50.");
  console.log("  - So '50' on screen = either your DB has 50 lesson docs, or an old/cached API response.\n");

  console.log("=== Summary ===\n");
  console.log("  12  = completedLessons for that user (from users/{uid}/lessonHistory, passed=true count)");
  console.log("  38  = remainingLessons = totalLessons - 12 (so total was 50 when you saw 38)");
  console.log("  50  = totalLessons from DB at that time (lessons.size). Current DB total:", totalLessons);

  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
