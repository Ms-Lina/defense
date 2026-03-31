/**
 * Updates existing Firestore lessons with Kinyarwanda content from seed-lessons.
 * Keeps document IDs so lesson history and progress stay valid.
 *
 * Usage: node scripts/update-lessons-in-db.js
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { initFirebase, getDb } = require("../config/firebase");
const { LESSONS } = require("./seed-lessons");

initFirebase();

async function updateLessons() {
  const db = getDb();
  if (!db) {
    console.error("❌ Firebase not initialized. Check backend/.env");
    process.exit(1);
  }

  const snap = await db.collection("lessons").orderBy("order").get();
  const byOrder = new Map(LESSONS.map((l) => [l.order, l]));

  console.log(`📚 Found ${snap.size} lessons in database. Updating with Kinyarwanda content...`);

  let updated = 0;
  let skipped = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const order = data.order;
    const canonical = byOrder.get(order);

    if (!canonical) {
      console.log(`  ⏭️  [${order}] ${data.title || doc.id} — no matching lesson in seed, skip`);
      skipped++;
      continue;
    }

    const ref = doc.ref;
    await ref.update({
      title: canonical.title,
      subtitle: canonical.subtitle,
      description: canonical.description,
      activities: canonical.activities,
      module: canonical.module,
      moduleColor: canonical.moduleColor,
      duration: canonical.duration,
      level: canonical.level,
      difficulty: canonical.difficulty,
      enabled: canonical.enabled,
      videoUrl: canonical.videoUrl || "",
      updatedAt: new Date().toISOString(),
    });

    console.log(`  ✅ [${order}] ${canonical.title}`);
    updated++;
  }

  console.log(`\n🎉 Done. Updated: ${updated}, skipped: ${skipped}.`);
  process.exit(0);
}

updateLessons().catch((err) => {
  console.error("❌ Update failed:", err);
  process.exit(1);
});
