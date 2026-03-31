/**
 * Progress tracking API – get/update learner progress.
 * Stored in Firestore per user when configured.
 */
const express = require("express");
const { getDb, verifyIdToken } = require("../config/firebase");

const router = express.Router();

/** Compute badge tier from completed lesson count */
function getBadge(completed) {
  if (completed >= 30) return { key: "champion", label: "Intsinzi 🏆", color: "#A855F7", minLessons: 30 };
  if (completed >= 21) return { key: "diamond", label: "Almasi 💎", color: "#06B6D4", minLessons: 21 };
  if (completed >= 11) return { key: "gold", label: "Zahabu 🥇", color: "#F59E0B", minLessons: 11 };
  if (completed >= 6) return { key: "silver", label: "Ifeza 🥈", color: "#94A3B8", minLessons: 6 };
  if (completed >= 1) return { key: "bronze", label: "Inzibacyuho 🥉", color: "#CD7F32", minLessons: 1 };
  return { key: "none", label: null, color: null, minLessons: 0 };
}

function nextBadge(completed) {
  if (completed >= 30) return null;
  if (completed >= 21) return { label: "Intsinzi 🏆", needsTotal: 30, remaining: 30 - completed };
  if (completed >= 11) return { label: "Almasi 💎", needsTotal: 21, remaining: 21 - completed };
  if (completed >= 6) return { label: "Zahabu 🥇", needsTotal: 11, remaining: 11 - completed };
  if (completed >= 1) return { label: "Ifeza 🥈", needsTotal: 6, remaining: 6 - completed };
  return { label: "Inzibacyuho 🥉", needsTotal: 1, remaining: 1 - completed };
}

/** Derive score from results/breakdown when top-level score is missing (e.g. legacy docs). */
function deriveScore(data) {
  if (typeof data.score === "number" && !Number.isNaN(data.score)) return Math.round(data.score);
  const results = data.results || data.breakdown || [];
  if (!Array.isArray(results) || results.length === 0) return 0;
  const sum = results.reduce((acc, r) => acc + (typeof r.score === "number" ? r.score : 0), 0);
  return Math.round(sum / results.length);
}

/** Normalize a lesson history item so the app always gets consistent types. Match Lessons page progress tiers: passed=100, videoWatched=50, descriptionRead=30. */
function normalizeHistoryItem(docId, data) {
  const updatedAt = data.updatedAt ?? data.completedAt;
  const updatedAtStr = updatedAt && typeof updatedAt.toDate === "function"
    ? updatedAt.toDate().toISOString()
    : (typeof updatedAt === "string" ? updatedAt : new Date().toISOString());
  let score = typeof data.score === "number" && !Number.isNaN(data.score) ? Math.round(data.score) : deriveScore(data);
  if (data.passed === true) {
    score = Math.max(score, 100);
  } else if (score === 0) {
    if (data.videoWatched) score = 50;
    else if (data.descriptionRead) score = 30;
  }
  return {
    lessonId: docId,
    score,
    passed: data.passed === true,
    attempts: typeof data.attempts === "number" ? data.attempts : 1,
    updatedAt: updatedAtStr,
    descriptionRead: !!data.descriptionRead,
    videoWatched: !!data.videoWatched,
  };
}

router.get("/", async (req, res) => {
  try {
    const decoded = await verifyIdToken(req);
    const uid = decoded?.uid;
    const db = getDb();

    // Use same query as GET /api/lessons so totalLessons matches what the app displays
    let totalLessons = 0;
    if (db) {
      try {
        const lessonsSnap = await db.collection("lessons").orderBy("order").get();
        totalLessons = lessonsSnap.size;
      } catch (err) {
        const lessonsSnap = await db.collection("lessons").get();
        totalLessons = lessonsSnap.size;
      }
    }

    let completedLessons = 0;
    let streakDays = 0;
    let averageScore = 0;

    let lessonHistory = [];
    if (db && uid) {
      // Primary: lesson history from users/uid/lessonHistory (written by POST /api/lessons/:id/submit)
      const lessonHistorySnap = await db.collection("users").doc(uid).collection("lessonHistory").get();
      lessonHistory = lessonHistorySnap.docs.map(doc => normalizeHistoryItem(doc.id, doc.data()));

      // Fallback: if empty, also read from progress/uid/history (written by POST /api/progress/submit) so UI matches either path
      if (lessonHistory.length === 0) {
        const legacyHistorySnap = await db.collection("progress").doc(uid).collection("history").get();
        lessonHistory = legacyHistorySnap.docs.map(doc => normalizeHistoryItem(doc.id, doc.data()));
      }

      completedLessons = lessonHistory.filter(h => h.passed === true).length;

      // Average score from lessons that have a numeric score (all history items are normalized to have score number)
      const scores = lessonHistory.map(h => h.score).filter(s => typeof s === "number" && s > 0);
      if (scores.length > 0) {
        averageScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
      }

      // Streak: primary from users/uid/progress/overall (written by lessons.js updateUserProgress)
      const userProgressRef = db.collection("users").doc(uid).collection("progress").doc("overall");
      const userProgressDoc = await userProgressRef.get();
      if (userProgressDoc.exists) {
        const progressData = userProgressDoc.data();
        streakDays = progressData.currentStreak ?? progressData.streakDays ?? 0;
      }
      // Fallback: legacy progress/uid doc (written by POST /api/progress or /api/progress/submit)
      if (streakDays === 0) {
        const legacyProgressDoc = await db.collection("progress").doc(uid).get();
        if (legacyProgressDoc.exists) {
          const legacyData = legacyProgressDoc.data();
          streakDays = legacyData.streakDays ?? legacyData.currentStreak ?? 0;
        }
      }
    }

    const remainingLessons = totalLessons - completedLessons;

    res.json({
      completedLessons,
      totalLessons,
      remainingLessons,
      streakDays,
      averageScore,
      lessonHistory,
      badge: getBadge(completedLessons),
      nextBadge: nextBadge(completedLessons),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** GET /api/progress/history – per-lesson history (same source as GET /: users/uid/lessonHistory, with legacy fallback) */
router.get("/history", async (req, res) => {
  try {
    const decoded = await verifyIdToken(req);
    const uid = decoded?.uid;
    const db = getDb();
    if (!db || !uid) return res.json({ history: [] });

    const snap = await db.collection("users").doc(uid).collection("lessonHistory").get();
    let history = snap.docs.map(doc => normalizeHistoryItem(doc.id, doc.data()));
    if (history.length === 0) {
      const legacySnap = await db.collection("progress").doc(uid).collection("history").get();
      history = legacySnap.docs.map(doc => normalizeHistoryItem(doc.id, doc.data()));
    }
    res.json({ history });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** POST /api/progress/ – update progress */
router.post("/", async (req, res) => {
  try {
    const decoded = await verifyIdToken(req);
    const uid = decoded?.uid;
    if (!uid) return res.status(401).json({ error: "Unauthorized" });
    const db = getDb();
    if (!db) return res.status(503).json({ error: "Database not configured" });
    const { completedLessons, streakDays } = req.body || {};
    const data = {
      updatedAt: new Date().toISOString(),
      ...(typeof completedLessons === "number" && { completedLessons }),
      ...(typeof streakDays === "number" && { streakDays }),
    };
    await db.collection("progress").doc(uid).set(data, { merge: true });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** POST /api/progress/submit – submit lesson/assignment answers and get score */
router.post("/submit", async (req, res) => {
  try {
    const decoded = await verifyIdToken(req);
    const uid = decoded?.uid;
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    const db = getDb();
    if (!db) return res.status(503).json({ error: "Database not configured" });

    const { lessonId, answers } = req.body || {};
    if (!lessonId || !Array.isArray(answers)) {
      return res.status(400).json({ error: "lessonId and answers required" });
    }

    // Fetch lesson to verify correct answers
    const lessonDoc = await db.collection("lessons").doc(lessonId).get();
    if (!lessonDoc.exists) return res.status(404).json({ error: "Lesson not found" });

    const lessonData = lessonDoc.data();
    const activities = lessonData.activities || [];

    let correctCount = 0;
    const results = answers.map((ans, idx) => {
      const activity = activities[idx];
      if (!activity) return { correct: false };

      let isCorrect = false;
      if (activity.type === "mc" || activity.type === "typing") {
        isCorrect = String(ans).trim().toLowerCase() === String(activity.correctAnswer).trim().toLowerCase();
      } else if (activity.type === "audio") {
        // For audio, we'll auto-grade for now or use a mock logic
        isCorrect = true;
      }

      if (isCorrect) correctCount++;
      return { id: activity.id, correct: isCorrect };
    });

    const total = activities.length || 1;
    const score = Math.round((correctCount / total) * 100);
    const passed = score >= 80;

    // Update user history
    const historyRef = db.collection("progress").doc(uid).collection("history").doc(lessonId);
    await historyRef.set({
      score,
      passed,
      attempts: (await historyRef.get()).data()?.attempts + 1 || 1,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    // Update overall progress if passed
    if (passed) {
      await db.collection("progress").doc(uid).update({
        completedLessons: (await db.collection("progress").doc(uid).get()).data()?.completedLessons + 1 || 1
      });
    }

    res.json({ score, passed, results });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
