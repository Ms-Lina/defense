/**
 * Check how many lessons are in the database and what the APIs would return.
 * Usage: node scripts/check-lessons-count.js
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { initFirebase, getDb } = require("../config/firebase");

initFirebase();

async function check() {
  const db = getDb();
  if (!db) {
    console.error("❌ Firebase not initialized.");
    process.exit(1);
  }

  // Raw count (what progress API currently uses)
  const allSnap = await db.collection("lessons").get();
  const rawTotal = allSnap.size;

  // Same query as GET /api/lessons (what the app displays on Lessons tab)
  const orderedSnap = await db.collection("lessons").orderBy("order").get();
  const lessonsList = orderedSnap.docs.map((d) => ({ id: d.id, order: d.data().order, title: d.data().title, enabled: d.data().enabled }));

  console.log("=== Lessons in database ===\n");
  console.log("Raw collection size (progress API uses this):", rawTotal);
  console.log("Ordered list size (GET /api/lessons, what screen shows):", lessonsList.length);
  console.log("");

  // Orders to spot duplicates
  const orders = lessonsList.map((l) => l.order).sort((a, b) => (a ?? 0) - (b ?? 0));
  const orderCounts = {};
  orders.forEach((o) => { orderCounts[o] = (orderCounts[o] || 0) + 1; });
  const duplicates = Object.entries(orderCounts).filter(([, c]) => c > 1);

  if (duplicates.length > 0) {
    console.log("Duplicate order values:", duplicates.map(([o, c]) => `order ${o}: ${c} lessons`).join(", "));
    console.log("");
  }

  console.log("First 10 lessons (id, order, title):");
  lessonsList.slice(0, 10).forEach((l) => {
    console.log(`  ${l.id}  order=${l.order}  ${l.title || "(no title)"}`);
  });
  if (lessonsList.length > 10) {
    console.log("  ...");
    console.log("Last 5:", lessonsList.slice(-5).map((l) => `order=${l.order} ${l.title}`).join(" | "));
  }

  const enabledCount = lessonsList.filter((l) => l.enabled !== false).length;
  console.log("\nLessons with enabled !== false:", enabledCount);

  const uniqueOrders = [...new Set(orders)];
  console.log("Unique order values:", uniqueOrders.length, "(max order:", Math.max(...orders.filter(Boolean), 0) + ")");
  console.log("\n=> Progress API and GET /api/lessons both use this collection.");
  console.log("=> Total shown on screen (Home, Progress, Lessons) =", orderedSnap.size);

  process.exit(0);
}

check().catch((e) => {
  console.error(e);
  process.exit(1);
});
