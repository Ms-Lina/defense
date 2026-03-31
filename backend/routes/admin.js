/**
 * Admin API – lessons CRUD, list users, aggregate progress.
 * Protected by X-Admin-Key header (ADMIN_SECRET env).
 * Progress is stored under users/{uid}/progress/overall and users/{uid}/lessonHistory (app writes there).
 * We iterate Auth users and read those paths so we don't depend on collectionGroup indexes.
 */
const express = require("express");
const { getDb, getAuth } = require("../config/firebase");
const { adminAuth } = require("../middleware/adminAuth");

const router = express.Router();
router.use(adminAuth);

/** Fetch progress for all users by reading users/{uid}/progress/overall and users/{uid}/lessonHistory (no collectionGroup). */
async function getAllUserProgress(db, auth) {
  if (!db || !auth) return { progressRecords: [], lessonHistoryByUid: {} };
  const list = await auth.listUsers(1000);
  const progressRecords = [];
  const lessonHistoryByUid = {};
  for (const u of list.users) {
    const uid = u.uid;
    const displayName = u.displayName && String(u.displayName).trim() ? String(u.displayName).trim() : null;
    const [progressDoc, historySnap] = await Promise.all([
      db.collection("users").doc(uid).collection("progress").doc("overall").get(),
      db.collection("users").doc(uid).collection("lessonHistory").get(),
    ]);
    const history = historySnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    lessonHistoryByUid[uid] = history;
    if (progressDoc.exists) {
      let name = displayName;
      if (!name) {
        const profileDoc = await db.collection("userProfiles").doc(uid).get();
        name = profileDoc.exists && profileDoc.data().name ? String(profileDoc.data().name).trim() : null;
      }
      progressRecords.push({ uid, displayName: name, ...progressDoc.data() });
    } else if (history.length > 0) {
      let name = displayName;
      if (!name) {
        const profileDoc = await db.collection("userProfiles").doc(uid).get();
        name = profileDoc.exists && profileDoc.data().name ? String(profileDoc.data().name).trim() : null;
      }
      const completedLessons = history.filter((h) => h.passed === true).length;
      const scores = history.filter((h) => typeof h.score === "number").map((h) => h.score);
      progressRecords.push({
        uid,
        displayName: name,
        completedLessons,
        totalLessons: 0,
        currentStreak: 0,
        lastActivityAt: history[history.length - 1]?.completedAt || history[history.length - 1]?.updatedAt,
      });
    }
  }
  return { progressRecords, lessonHistoryByUid };
}

/** GET /api/admin/stats – dashboard counts. */
router.get("/stats", async (req, res) => {
  try {
    const db = getDb();
    const auth = getAuth();
    let totalLessons = 0;
    let totalUsers = 0;
    let totalProgressDocs = 0;
    if (db) {
      const lessonsSnap = await db.collection("lessons").get();
      totalLessons = lessonsSnap.size;
    }
    if (auth) {
      const list = await auth.listUsers(1000);
      totalUsers = list.users.length;
      const { progressRecords } = await getAllUserProgress(db, auth);
      totalProgressDocs = progressRecords.length;
    }
    res.json({
      totalLessons,
      totalUsers,
      totalProgressDocs,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** GET /api/admin/lessons – list all lessons */
router.get("/lessons", async (req, res) => {
  try {
    const db = getDb();
    if (!db) return res.status(503).json({ error: "Database not configured" });
    const snap = await db.collection("lessons").orderBy("order").get();
    const lessons = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ lessons });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** POST /api/admin/lessons – create lesson */
router.post("/lessons", adminAuth, async (req, res) => {
  try {
    const { title, duration, level, order, description, difficulty, enabled, videoUrl, activities, type, module, moduleColor } = req.body || {};
    if (!title) return res.status(400).json({ error: "title required" });

    const db = getDb();
    if (!db) return res.status(503).json({ error: "Database not configured" });

    const lesson = {
      title,
      duration,
      level,
      order,
      description,
      difficulty,
      enabled,
      videoUrl,
      activities,
      type,
      ...(typeof order === "number" && { order }),
      ...(description != null && { description: String(description) }),
      ...(difficulty != null && { difficulty: String(difficulty) }),
      ...(typeof enabled === "boolean" && { enabled }),
      ...(type != null && { type: String(type) }),
      ...(videoUrl != null && { videoUrl: String(videoUrl) }),
      ...(Array.isArray(activities) && { activities }),
      ...(module != null && { module: String(module) }),
      ...(moduleColor != null && { moduleColor: String(moduleColor) }),
      createdAt: new Date().toISOString(),
    };
    const ref = await db.collection("lessons").add(lesson);
    res.status(201).json({ id: ref.id, ...lesson });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** PUT /api/admin/lessons/:id – update lesson */
router.put("/lessons/:id", async (req, res) => {
  try {
    const db = getDb();
    if (!db) return res.status(503).json({ error: "Database not configured" });
    const { id } = req.params;
    const { title, duration, level, order, description, difficulty, enabled, type, videoUrl, activities, module, moduleColor } = req.body || {};
    const update = {};
    if (title !== undefined) update.title = String(title).trim();
    if (duration !== undefined) update.duration = String(duration);
    if (level !== undefined) update.level = String(level);
    if (typeof order === "number") update.order = order;
    if (description !== undefined) update.description = String(description);
    if (difficulty !== undefined) update.difficulty = String(difficulty);
    if (typeof enabled === "boolean") update.enabled = enabled;
    if (type !== undefined) update.type = String(type);
    if (videoUrl !== undefined) update.videoUrl = String(videoUrl);
    if (Array.isArray(activities)) update.activities = activities;
    if (module !== undefined) update.module = String(module);
    if (moduleColor !== undefined) update.moduleColor = String(moduleColor);
    update.updatedAt = new Date().toISOString();
    await db.collection("lessons").doc(id).set(update, { merge: true });
    const doc = await db.collection("lessons").doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: "Not found" });
    res.json({ id: doc.id, ...doc.data() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** DELETE /api/admin/lessons/:id */
router.delete("/lessons/:id", async (req, res) => {
  try {
    const db = getDb();
    if (!db) return res.status(503).json({ error: "Database not configured" });
    await db.collection("lessons").doc(req.params.id).delete();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** POST /api/admin/practice – create practice exercise */
router.post("/practice", adminAuth, async (req, res) => {
  try {
    const { title, description, type, difficulty, order, enabled, questions } = req.body || {};
    if (!title) return res.status(400).json({ error: "title required" });

    const db = getDb();
    if (!db) return res.status(503).json({ error: "Database not configured" });

    const practice = {
      title,
      description,
      type,
      difficulty,
      order,
      enabled,
      questions,
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection("practice").add(practice);
    res.json({ id: docRef.id, ...practice });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** GET /api/admin/users – list Firebase users (paginated), optionally with profiles */
router.get("/users", async (req, res) => {
  try {
    const auth = getAuth();
    if (!auth) return res.status(503).json({ error: "Auth not configured" });
    const db = getDb();
    const nextPageToken = req.query.nextPageToken;
    const sector = req.query.sector;
    const list = await auth.listUsers(100, nextPageToken);
    let users = list.users.map((u) => ({
      uid: u.uid,
      email: u.email,
      displayName: u.displayName || null,
      createdAt: u.metadata.creationTime,
      disabled: !!u.disabled,
    }));
    if (db) {
      const profilesSnap = await db.collection("userProfiles").get();
      const profilesByUid = {};
      profilesSnap.docs.forEach((d) => {
        profilesByUid[d.id] = d.data();
      });
      users = users.map((u) => ({ ...u, profile: profilesByUid[u.uid] || null }));
      if (sector) {
        users = users.filter((u) => u.profile?.sector === sector);
      }
    }
    res.json({ users, nextPageToken: list.pageToken || null });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** GET /api/admin/users/:uid/profile */
router.get("/users/:uid/profile", async (req, res) => {
  try {
    const db = getDb();
    if (!db) return res.status(503).json({ error: "Database not configured" });
    const doc = await db.collection("userProfiles").doc(req.params.uid).get();
    if (!doc.exists) return res.json({ profile: null });
    res.json({ profile: doc.data() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** PUT /api/admin/users/:uid/profile */
router.put("/users/:uid/profile", async (req, res) => {
  try {
    const db = getDb();
    if (!db) return res.status(503).json({ error: "Database not configured" });
    const uid = req.params.uid;
    const { name, age, sector, contact, enrollmentDate, literacyScore, active } = req.body || {};
    const update = { updatedAt: new Date().toISOString() };
    if (name !== undefined) update.name = String(name);
    if (age !== undefined) update.age = age === "" ? null : Number(age);
    if (sector !== undefined) update.sector = sector === "" ? null : String(sector);
    if (contact !== undefined) update.contact = contact === "" ? null : String(contact);
    if (enrollmentDate !== undefined) update.enrollmentDate = enrollmentDate === "" ? null : String(enrollmentDate);
    if (literacyScore !== undefined) update.literacyScore = literacyScore === "" ? null : Number(literacyScore);
    if (typeof active === "boolean") update.active = active;
    await db.collection("userProfiles").doc(uid).set(update, { merge: true });
    const doc = await db.collection("userProfiles").doc(uid).get();
    res.json({ profile: doc.exists ? doc.data() : {} });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** PATCH /api/admin/users/:uid/disable – disable Firebase user */
router.patch("/users/:uid/disable", async (req, res) => {
  try {
    const auth = getAuth();
    if (!auth) return res.status(503).json({ error: "Auth not configured" });
    const { uid } = req.params;
    const { disabled } = req.body || {};
    await auth.updateUser(uid, { disabled: !!disabled });
    res.json({ ok: true, disabled: !!disabled });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** DELETE /api/admin/users/:uid – delete user account and all their data */
router.delete("/users/:uid", async (req, res) => {
  try {
    const auth = getAuth();
    const db = getDb();
    if (!auth) return res.status(503).json({ error: "Auth not configured" });
    const { uid } = req.params;
    if (!uid) return res.status(400).json({ error: "uid required" });

    if (db) {
      const batch = db.batch();
      const profileRef = db.collection("userProfiles").doc(uid);
      batch.delete(profileRef);
      const lessonHistorySnap = await db.collection("users").doc(uid).collection("lessonHistory").get();
      lessonHistorySnap.docs.forEach((d) => batch.delete(d.ref));
      const progressRef = db.collection("users").doc(uid).collection("progress").doc("overall");
      batch.delete(progressRef);
      await batch.commit();
    }
    await auth.deleteUser(uid);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

function getStreakDays(p) {
  return p.currentStreak ?? p.streakDays ?? 0;
}

/** GET /api/admin/progress – list progress from users/{uid}/progress/overall. */
router.get("/progress", async (req, res) => {
  try {
    const db = getDb();
    const auth = getAuth();
    if (!db) return res.status(503).json({ error: "Database not configured" });
    const { progressRecords } = await getAllUserProgress(db, auth);
    const progress = progressRecords.map((p) => ({
      uid: p.uid,
      ...p,
      streakDays: getStreakDays(p),
      updatedAt: p.lastActivityAt || p.lastCompletedAt || p.updatedAt,
    }));
    res.json({ progress });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** GET /api/admin/analytics – dashboard analytics from users/{uid}/progress and lessonHistory. */
router.get("/analytics", async (req, res) => {
  try {
    const db = getDb();
    const auth = getAuth();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    const weekStartStr = weekStart.toISOString();

    let totalUsers = 0;
    let activeUsers = 0;
    let totalLessonsCompleted = 0;
    let lessonsCompletedToday = 0;
    let lessonsCompletedThisWeek = 0;
    let totalAIConversations = 0;
    let uniqueAIVisitors = 0;
    let totalLessonsForPercent = 0;

    if (auth) {
      const list = await auth.listUsers(1000);
      totalUsers = list.users.length;
      activeUsers = list.users.filter((u) => !u.disabled).length;
    }

    if (db) {
      const lessonsSnap = await db.collection("lessons").get();
      totalLessonsForPercent = lessonsSnap.size;

      const { progressRecords, lessonHistoryByUid } = await getAllUserProgress(db, auth);
      for (const p of progressRecords) {
        totalLessonsCompleted += p.completedLessons ?? 0;
      }
      const streakDaysList = progressRecords.map((p) => getStreakDays(p));
      const avgStreakDays = streakDaysList.length
        ? Math.round((streakDaysList.reduce((a, b) => a + b, 0) / streakDaysList.length) * 10) / 10
        : 0;
      const maxStreakDays = streakDaysList.length ? Math.max(...streakDaysList, 0) : 0;
      for (const uid of Object.keys(lessonHistoryByUid)) {
        lessonHistoryByUid[uid].forEach((data) => {
          if (data.passed !== true) return;
          const completedAt = data.completedAt || data.updatedAt || "";
          const completedStr = typeof completedAt === "string" ? completedAt : (completedAt && completedAt.toDate ? completedAt.toDate().toISOString() : "");
          if (completedStr >= todayStart) lessonsCompletedToday += 1;
          if (completedStr >= weekStartStr) lessonsCompletedThisWeek += 1;
        });
      }

      const aiSnap = await db.collection("aiChatLogs").get();
      totalAIConversations = aiSnap.size;
      const uids = new Set(aiSnap.docs.map((d) => d.data().uid));
      uniqueAIVisitors = uids.size;
    }

    const aiUsagePercent = totalUsers > 0 ? Math.round((uniqueAIVisitors / totalUsers) * 100) : 0;
    const avgProgressPercent = totalUsers > 0 && totalLessonsForPercent > 0
      ? Math.min(100, Math.round((totalLessonsCompleted / (totalUsers * totalLessonsForPercent)) * 100))
      : 0;

    res.json({
      totalUsers,
      activeUsers,
      totalLessonsCompleted,
      lessonsCompletedToday,
      lessonsCompletedThisWeek,
      totalAIConversations,
      uniqueAIVisitors,
      aiUsagePercent,
      avgProgressPercent,
      avgStreakDays,
      maxStreakDays,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

function toIsoString(v) {
  if (!v) return null;
  if (typeof v === "string") return v;
  if (v && typeof v.toDate === "function") return v.toDate().toISOString();
  if (v && (v._seconds != null || v.seconds != null)) {
    const s = v._seconds ?? v.seconds ?? 0;
    return new Date(s * 1000).toISOString();
  }
  return null;
}

/** GET /api/admin/ai-logs – paginated AI conversation logs */
router.get("/ai-logs", async (req, res) => {
  try {
    const db = getDb();
    if (!db) return res.status(503).json({ error: "Database not configured" });
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const afterId = req.query.after;
    let snap;
    try {
      let q = db.collection("aiChatLogs").orderBy("createdAt", "desc").limit(limit);
      if (afterId) {
        const afterSnap = await db.collection("aiChatLogs").doc(afterId).get();
        if (afterSnap.exists) q = q.startAfter(afterSnap);
      }
      snap = await q.get();
    } catch (orderErr) {
      const all = await db.collection("aiChatLogs").limit(200).get();
      const sorted = all.docs.sort((a, b) => {
        const ta = a.data().createdAt;
        const tb = b.data().createdAt;
        const sa = typeof ta === "string" ? ta : (ta?.toDate?.()?.toISOString?.() ?? "");
        const sb = typeof tb === "string" ? tb : (tb?.toDate?.()?.toISOString?.() ?? "");
        return sb.localeCompare(sa);
      });
      snap = { docs: sorted.slice(0, limit) };
    }
    const logs = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: toIsoString(data.createdAt) || data.createdAt,
      };
    });
    res.json({ logs, nextAfter: snap.docs.length === limit ? snap.docs[snap.docs.length - 1].id : null });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** GET /api/admin/ai-stats – AI usage statistics */
router.get("/ai-stats", async (req, res) => {
  try {
    const db = getDb();
    const auth = getAuth();
    if (!db) return res.status(503).json({ error: "Database not configured" });
    const aiSnap = await db.collection("aiChatLogs").get();
    const logs = aiSnap.docs.map((d) => d.data());
    const totalUsers = auth ? (await auth.listUsers(1000)).users.length : 0;
    const uniqueAIVisitors = new Set(logs.map((l) => l.uid)).size;
    const learnersUsingAI = uniqueAIVisitors;
    const learnersIndependent = Math.max(0, totalUsers - uniqueAIVisitors);
    const totalActivations = logs.length;
    const avgLength = logs.length
      ? Math.round(
        logs.reduce((acc, l) => acc + (String(l.message).length + String(l.reply || "").length), 0) / logs.length
      )
      : 0;
    const byUid = {};
    logs.forEach((l) => {
      byUid[l.uid] = (byUid[l.uid] || 0) + 1;
    });
    const topUsers = Object.entries(byUid)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([uid, count]) => ({ uid, count }));

    res.json({
      learnersUsingAI,
      learnersIndependent,
      totalActivations,
      avgConversationLength: avgLength,
      topUsersByAIActivations: topUsers,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** GET /api/admin/reports – comprehensive learner & lesson reports */
router.get("/reports", async (req, res) => {
  try {
    const db = getDb();
    const auth = getAuth();
    if (!db) return res.status(503).json({ error: "Database not configured" });

    // Get language preference from query (default: kinyarwanda)
    const lang = req.query.lang || 'kinyarwanda';
    
    // Language translations
    const translations = {
      kinyarwanda: {
        badges: {
          none: "Ntanumwe",
          bronze: "Inzibacyuho 🥉",
          silver: "Ifeza 🥈",
          gold: "Zahabu 🥇",
          diamond: "Almasi 💎",
          champion: "Intsinzi 🏆"
        },
        summary: {
          totalLessons: "Ibigufi byose",
          totalLearners: "Abanyeshuri bose",
          totalCompletions: "Ibyakozwe byose",
          avgClassScore: "Ijanisha rya rusange",
          badgeCounts: "Imibare y'ibendera"
        }
      },
      english: {
        badges: {
          none: "None",
          bronze: "Bronze 🥉",
          silver: "Silver 🥈",
          gold: "Gold 🥇",
          diamond: "Diamond 💎",
          champion: "Champion 🏆"
        },
        summary: {
          totalLessons: "Total Lessons",
          totalLearners: "Total Learners",
          totalCompletions: "Total Completions",
          avgClassScore: "Average Class Score",
          badgeCounts: "Badge Distribution"
        }
      }
    };

    const t = translations[lang] || translations.kinyarwanda;

    // 1. All lessons
    const lessonsSnap = await db.collection("lessons").orderBy("order").get();
    const lessons = lessonsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const totalLessons = lessons.length;

    // 2. Learner progress from users/{uid}/progress/overall and users/{uid}/lessonHistory (by iterating users)
    const { progressRecords, lessonHistoryByUid } = await getAllUserProgress(db, getAuth());
    const learners = [];
    let totalCompletions = 0;
    let totalScoreSum = 0;
    let totalScoreCount = 0;

    const lessonPassCounts = {}; // lessonId → { pass, fail }

    for (const { uid, ...data } of progressRecords) {
      const completed = data.completedLessons ?? 0;
      totalCompletions += completed;

      // Badge tier
      let badge = t.badges.none;
      if (completed >= 30) badge = t.badges.champion;
      else if (completed >= 21) badge = t.badges.diamond;
      else if (completed >= 11) badge = t.badges.gold;
      else if (completed >= 6) badge = t.badges.silver;
      else if (completed >= 1) badge = t.badges.bronze;

      const history = (lessonHistoryByUid[uid] || []).map(h => ({ lessonId: h.id, ...h }));
      const avgScore = history.length
        ? Math.round(history.reduce((s, h) => s + (h.score ?? 0), 0) / history.length)
        : null;
      if (avgScore !== null) { totalScoreSum += avgScore; totalScoreCount++; }

      history.forEach(h => {
        if (!lessonPassCounts[h.lessonId]) lessonPassCounts[h.lessonId] = { pass: 0, fail: 0 };
        h.passed ? lessonPassCounts[h.lessonId].pass++ : lessonPassCounts[h.lessonId].fail++;
      });

      learners.push({
        uid,
        completedLessons: completed,
        streakDays: getStreakDays(data),
        badge,
        avgScore,
        lastActive: data.lastActivityAt ?? data.lastCompletedAt ?? data.updatedAt ?? null,
        historyCount: history.length,
      });
    }

    // 3. Per-lesson report
    const lessonReport = lessons.map(l => ({
      id: l.id,
      title: l.title,
      module: l.module,
      order: l.order,
      passCount: lessonPassCounts[l.id]?.pass ?? 0,
      failCount: lessonPassCounts[l.id]?.fail ?? 0,
      totalAttempts: (lessonPassCounts[l.id]?.pass ?? 0) + (lessonPassCounts[l.id]?.fail ?? 0),
      passRate: lessonPassCounts[l.id]
        ? Math.round((lessonPassCounts[l.id].pass / ((lessonPassCounts[l.id].pass + lessonPassCounts[l.id].fail) || 1)) * 100)
        : null,
    }));

    // 4. Summary
    const avgClassScore = totalScoreCount ? Math.round(totalScoreSum / totalScoreCount) : 0;
    const badgeCounts = learners.reduce((acc, l) => {
      acc[l.badge] = (acc[l.badge] || 0) + 1;
      return acc;
    }, {});

    res.json({
      summary: {
        totalLessons,
        totalLearners: learners.length,
        totalCompletions,
        avgClassScore,
        badgeCounts,
        // Add translation keys
        translations: {
          totalLessons: t.summary.totalLessons,
          totalLearners: t.summary.totalLearners,
          totalCompletions: t.summary.totalCompletions,
          avgClassScore: t.summary.avgClassScore,
          badgeCounts: t.summary.badgeCounts
        }
      },
      learners: learners.sort((a, b) => b.completedLessons - a.completedLessons),
      lessonReport,
      generatedAt: new Date().toISOString(),
      language: lang
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
