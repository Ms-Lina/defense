/**
 * Enhanced Lesson delivery API with assessment features
 * Data from Firestore when configured, else stub for development.
 */
const express = require("express");
const { getDb, verifyIdToken } = require("../config/firebase");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const db = getDb();
    if (!db) return res.status(503).json({ error: "Database not configured" });

    const snap = await db.collection("lessons").orderBy("order").get();
    const lessons = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    
    // Add enhanced metadata
    const enhancedLessons = lessons.map(lesson => ({
      ...lesson,
      estimatedDuration: calculateEstimatedDuration(lesson),
      difficultyLevel: getDifficultyLevel(lesson),
      prerequisites: getPrerequisites(lesson, lessons),
      nextLesson: getNextLesson(lesson, lessons)
    }));
    
    res.json({ lessons: enhancedLessons });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const db = getDb();
    if (!db) return res.status(503).json({ error: "Database not configured" });

    const doc = await db.collection("lessons").doc(req.params.id).get();
    if (doc.exists) {
      const lesson = { id: doc.id, ...doc.data() };
      
      // Add enhanced lesson data
      const enhancedLesson = {
        ...lesson,
        estimatedDuration: calculateEstimatedDuration(lesson),
        difficultyLevel: getDifficultyLevel(lesson),
        adaptiveContent: generateAdaptiveContent(lesson),
        learningObjectives: getLearningObjectives(lesson),
        assessmentStrategy: getAssessmentStrategy(lesson)
      };
      
      return res.json(enhancedLesson);
    }

    res.status(404).json({ error: "Lesson not found" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/lessons/:id/progress
 * Return saved progress for this lesson so the user can resume (step, time, video position, answers).
 */
router.get("/:id/progress", async (req, res) => {
  try {
    const decoded = await verifyIdToken(req);
    const uid = decoded?.uid;
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    const db = getDb();
    if (!db) return res.status(503).json({ error: "Database not configured" });

    const lessonId = req.params.id;
    const historyRef = db.collection("users").doc(uid).collection("lessonHistory").doc(lessonId);
    const doc = await historyRef.get();
    if (!doc.exists) return res.json({ progress: null });

    const d = doc.data();
    if (d.passed) return res.json({ progress: null, completed: true, score: d.score });

    const progress = {
      currentStep: typeof d.currentStep === "number" ? d.currentStep : 0,
      totalTimeSpent: typeof d.totalTimeSpent === "number" ? d.totalTimeSpent : 0,
      videoProgressSeconds: typeof d.videoProgressSeconds === "number" ? d.videoProgressSeconds : 0,
      answers: Array.isArray(d.answers) ? d.answers : [],
      descriptionRead: !!d.descriptionRead,
      videoWatched: !!d.videoWatched,
    };
    return res.json({ progress, completed: false });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/lessons/:id/progress
 * Save progress: description read (30%), video watched (50%), current step, total time, video position, answers.
 */
router.post("/:id/progress", async (req, res) => {
  try {
    const decoded = await verifyIdToken(req);
    const uid = decoded?.uid;
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    const db = getDb();
    if (!db) return res.status(503).json({ error: "Database not configured" });

    const lessonId = req.params.id;
    const { descriptionRead, videoWatched, currentStep, totalTimeSpent, videoProgressSeconds, answers } = req.body || {};

    const historyRef = db.collection("users").doc(uid).collection("lessonHistory").doc(lessonId);
    const existing = (await historyRef.get()).data() || {};

    const updates = {
      updatedAt: new Date().toISOString(),
      ...(descriptionRead === true && { descriptionRead: true }),
      ...(videoWatched === true && { videoWatched: true }),
      ...(typeof currentStep === "number" && currentStep >= 0 && { currentStep }),
      ...(typeof totalTimeSpent === "number" && totalTimeSpent >= 0 && { totalTimeSpent }),
      ...(typeof videoProgressSeconds === "number" && videoProgressSeconds >= 0 && { videoProgressSeconds }),
      ...(Array.isArray(answers) && { answers }),
    };

    await historyRef.set(updates, { merge: true });
    const merged = { ...existing, ...updates };

    const progressPercent = merged.passed ? 100 : merged.videoWatched ? 50 : merged.descriptionRead ? 30 : 0;
    return res.json({
      ok: true,
      progressPercent,
      descriptionRead: !!merged.descriptionRead,
      videoWatched: !!merged.videoWatched,
      passed: !!merged.passed,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/lessons/:id/submit
 * Enhanced lesson submission with detailed analytics
 */
/** Remove undefined values so Firestore accepts the object. Keep array length; only strip undefined from object values. */
function stripUndefined(obj) {
  if (obj == null) return null;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(v => (v === undefined ? null : stripUndefined(v)));
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    try {
      const cleaned = stripUndefined(v);
      if (cleaned !== undefined) out[k] = cleaned;
    } catch (_) {
      out[k] = v;
    }
  }
  return out;
}

/** Ensure value is a number Firestore accepts (no NaN/Infinity) */
function safeNumber(n) {
  if (typeof n !== "number" || Number.isNaN(n) || !Number.isFinite(n)) return 0;
  return n;
}

router.post("/:id/submit", async (req, res) => {
  try {
    const decoded = await verifyIdToken(req);
    const uid = decoded?.uid;
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    const db = getDb();
    if (!db) return res.status(503).json({ error: "Database not configured" });

    const body = req.body || {};
    const answers = Array.isArray(body.answers) ? body.answers : [];
    const timeSpent = typeof body.timeSpent === "number" ? body.timeSpent : 0;
    const questionTimes = Array.isArray(body.questionTimes) ? body.questionTimes : [];
    const deviceInfo = body.deviceInfo;

    // Get lesson data
    const lessonDoc = await db.collection("lessons").doc(req.params.id).get();
    if (!lessonDoc.exists) return res.status(404).json({ error: "Lesson not found" });

    const lessonData = lessonDoc.data() || {};
    const activities = Array.isArray(lessonData.activities) ? lessonData.activities : [];

    if (activities.length === 0) {
      const historyRef = db.collection("users").doc(uid).collection("lessonHistory").doc(req.params.id);
      const passed = true;
      const scoring = { score: 100, passed, timeBonus: 0, breakdown: [], averageScore: 100 };
      const existing = (await historyRef.get()).data() || {};
      const nowIsoVideo = new Date().toISOString();
      const videoPayload = {
        ...scoring,
        results: [],
        timeSpent,
        completedAt: nowIsoVideo,
        updatedAt: nowIsoVideo,
        attempts: (existing.attempts || 0) + 1,
        descriptionRead: true,
        videoWatched: true,
      };
      try {
        await historyRef.set(stripUndefined(videoPayload), { merge: true });
      } catch (writeErr) {
        console.error("Lesson submit (video-only) Firestore write error:", writeErr.message, writeErr.code);
        return res.status(500).json({ error: "Failed to save result", details: String(writeErr.message) });
      }
      try {
        await updateUserProgress(uid, req.params.id, scoring);
      } catch (_) {}
      try {
        const achievementRef = db.collection("users").doc(uid).collection("achievements").doc(req.params.id);
        await achievementRef.set({
          type: "lesson_completed",
          lessonId: req.params.id,
          score: 100,
          completedAt: nowIsoVideo,
          attempts: (existing.attempts || 0) + 1,
        }, { merge: true });
      } catch (achErr) {
        console.warn("Lesson submit (video-only): achievements write failed", achErr.message);
      }
      return res.json({ success: true, score: 100, passed: true });
    }

    // Normalize answers: coerce to string for evaluation (backend checks real answer vs correctAnswer)
    const paddedAnswers = Array.from({ length: activities.length }, (_, i) => {
      const a = answers[i];
      if (a == null) return "";
      if (typeof a === "string") return a.trim();
      return String(a);
    });
    const results = paddedAnswers.map((answer, index) => {
      const activity = activities[index];
      if (!activity || typeof activity !== "object") return { activityId: "unknown", correct: false, score: 0, timeSpent: 0, hints: 0, feedback: "" };

      const evaluation = evaluateActivityAnswer(answer, activity);
      return {
        activityId: activity.id ?? `q${index}`,
        correct: !!evaluation.correct,
        score: safeNumber(evaluation.score),
        timeSpent: safeNumber(questionTimes[index] ?? 0),
        hints: safeNumber(activity.hints ?? 0),
        feedback: typeof evaluation.feedback === "string" ? evaluation.feedback : ""
      };
    });

    // Calculate comprehensive score
    const scoring = calculateLessonScore(results, lessonData, timeSpent);
    
    // Save enhanced results (strip undefined for Firestore)
    const historyRef = db.collection("users").doc(uid).collection("lessonHistory").doc(req.params.id);
    const existingHistory = (await historyRef.get()).data() || {};
    
    let learningMetrics;
    try {
      learningMetrics = {
        engagementScore: calculateEngagementScore(results, timeSpent),
        masteryLevel: calculateMasteryLevel(results, lessonData),
        improvementAreas: identifyImprovementAreas(results, activities),
        nextRecommendations: generateNextRecommendations(scoring, lessonData)
      };
    } catch (metricsErr) {
      console.warn("Lesson submit: learningMetrics error", metricsErr.message);
      learningMetrics = { engagementScore: 0, masteryLevel: "Beginning", improvementAreas: [], nextRecommendations: [] };
    }

    const nowIso = new Date().toISOString();
    const payload = {
      score: safeNumber(scoring.score),
      passed: !!scoring.passed,
      timeBonus: safeNumber(scoring.timeBonus),
      averageScore: safeNumber(scoring.averageScore),
      breakdown: (scoring.breakdown || []).map(r => ({
        activityId: String(r?.activityId ?? "unknown"),
        correct: !!r?.correct,
        score: safeNumber(r?.score),
        feedback: String(r?.feedback ?? ""),
      })),
      results: results.map(r => ({
        activityId: String(r.activityId ?? "unknown"),
        correct: !!r.correct,
        score: safeNumber(r.score),
        timeSpent: safeNumber(r.timeSpent),
        hints: safeNumber(r.hints),
        feedback: String(r.feedback ?? ""),
      })),
      timeSpent: safeNumber(timeSpent),
      questionTimes: questionTimes.length ? questionTimes.map(safeNumber) : [],
      ...(typeof deviceInfo === "string" && deviceInfo ? { deviceInfo } : {}),
      completedAt: nowIso,
      updatedAt: nowIso,
      attempts: Math.max(0, (existingHistory.attempts || 0) + 1),
      descriptionRead: true,
      videoWatched: true,
      ...(learningMetrics ? {
        learningMetrics: {
          engagementScore: safeNumber(learningMetrics.engagementScore),
          masteryLevel: String(learningMetrics.masteryLevel ?? "Beginning"),
          improvementAreas: Array.isArray(learningMetrics.improvementAreas) ? learningMetrics.improvementAreas : [],
          nextRecommendations: Array.isArray(learningMetrics.nextRecommendations) ? learningMetrics.nextRecommendations : [],
        },
      } : {}),
    };
    let enhancedData;
    try {
      enhancedData = stripUndefined(payload);
    } catch (stripErr) {
      console.error("Lesson submit stripUndefined error:", stripErr.message);
      enhancedData = payload;
    }

    try {
      await historyRef.set(enhancedData, { merge: true });
    } catch (writeErr) {
      console.error("Lesson submit Firestore write error:", writeErr.message, writeErr.code);
      return res.status(500).json({ error: "Failed to save result", details: String(writeErr.message) });
    }

    try {
      await updateUserProgress(uid, req.params.id, scoring);
    } catch (progressErr) {
      console.warn("Lesson submit: updateUserProgress failed, retrying once", progressErr.message);
      try {
        await updateUserProgress(uid, req.params.id, scoring);
      } catch (retryErr) {
        console.error("Lesson submit: updateUserProgress retry failed", retryErr.message);
      }
    }

    if (scoring.passed) {
      try {
        const achievementRef = db.collection("users").doc(uid).collection("achievements").doc(req.params.id);
        await achievementRef.set({
          type: "lesson_completed",
          lessonId: req.params.id,
          score: safeNumber(scoring.score),
          completedAt: nowIso,
          attempts: (existingHistory.attempts || 0) + 1,
        }, { merge: true });
      } catch (achErr) {
        console.warn("Lesson submit: achievements write failed", achErr.message);
      }
    }

    res.json({
      success: true,
      score: scoring.score,
      passed: scoring.passed,
    });
  } catch (e) {
    console.error("Lesson submit error:", e.message, e.stack);
    const msg = e && typeof e.message === "string" ? e.message : "Submission failed";
    res.status(500).json({ error: msg, details: process.env.NODE_ENV !== "production" ? (e && e.stack) : undefined });
  }
});

/**
 * GET /api/lessons/:id/next
 * Get next recommended lesson based on performance
 */
router.get("/:id/next", async (req, res) => {
  try {
    const decoded = await verifyIdToken(req);
    const uid = decoded?.uid;
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    const db = getDb();
    if (!db) return res.status(503).json({ error: "Database not configured" });

    // Get current lesson
    const currentLessonDoc = await db.collection("lessons").doc(req.params.id).get();
    if (!currentLessonDoc.exists) return res.status(404).json({ error: "Lesson not found" });

    const currentLesson = { id: currentLessonDoc.id, ...currentLessonDoc.data() };

    // Get user's performance in current lesson
    const performanceDoc = await db.collection("users").doc(uid)
      .collection("lessonHistory")
      .doc(req.params.id)
      .get();
    
    const performance = performanceDoc.exists ? performanceDoc.data() : null;

    // Get all lessons for progression
    const allLessonsSnap = await db.collection("lessons").orderBy("order").get();
    const allLessons = allLessonsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Calculate next lesson
    const nextLesson = calculateNextLesson(currentLesson, performance, allLessons);

    res.json({ nextLesson, recommendations: nextLesson.recommendations });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Helper functions for enhanced lesson features
function calculateEstimatedDuration(lesson) {
  const L = lesson && typeof lesson === "object" ? lesson : {};
  const baseTime = 10;
  const activityTime = (Array.isArray(L.activities) ? L.activities : []).length * 3;
  const difficultyMultiplier = { easy: 0.8, medium: 1.0, hard: 1.3 }[L.difficulty] || 1.0;
  return Math.round((baseTime + activityTime) * difficultyMultiplier);
}

function getDifficultyLevel(lesson) {
  const levelMap = {
    1: 'Beginner',
    2: 'Elementary', 
    3: 'Intermediate',
    4: 'Advanced',
    5: 'Expert'
  };
  
  return levelMap[lesson.level] || 'Beginner';
}

function getPrerequisites(lesson, allLessons) {
  // Simple prerequisite logic based on order and level
  const currentOrder = lesson.order || 0;
  const currentLevel = lesson.level || 1;
  
  return allLessons
    .filter(l => (l.order || 0) < currentOrder && (l.level || 1) <= currentLevel)
    .slice(-3) // Last 3 lessons as prerequisites
    .map(l => ({ id: l.id, title: l.title }));
}

function getNextLesson(lesson, allLessons) {
  const currentIndex = allLessons.findIndex(l => l.id === lesson.id);
  if (currentIndex >= 0 && currentIndex < allLessons.length - 1) {
    const next = allLessons[currentIndex + 1];
    return { id: next.id, title: next.title, order: next.order };
  }
  return null;
}

function generateAdaptiveContent(lesson) {
  return {
    personalizedInstructions: generateInstructions(lesson),
    adaptiveHints: generateHints(lesson),
    scaffolding: generateScaffolding(lesson)
  };
}

function generateInstructions(lesson) {
  const instructions = [];
  
  if (lesson.difficulty === 'easy') {
    instructions.push("Take your time and read each instruction carefully.");
  }
  
  if (lesson.module === 'Inyuguti') {
    instructions.push("Focus on the shape and sound of each letter.");
  } else if (lesson.module === 'Imibare') {
    instructions.push("Practice counting and recognizing number patterns.");
  }
  
  return instructions;
}

function generateHints(lesson) {
  return {
    available: 3,
    cost: 5, // Points deducted per hint
    adaptive: true // Hints adapt based on user performance
  };
}

function generateScaffolding(lesson) {
  return {
    showExamples: lesson.difficulty !== 'hard',
    provideTemplates: lesson.module === 'Imirongo',
    allowRetry: true,
    maxAttempts: 3
  };
}

function getLearningObjectives(lesson) {
  const objectives = [];
  
  if (lesson.module === 'Inyuguti') {
    objectives.push("Recognize and write Kinyarwanda letters");
    objectives.push("Understand letter-sound relationships");
  } else if (lesson.module === 'Imibare') {
    objectives.push("Count and recognize numbers");
    objectives.push("Perform basic mathematical operations");
  }
  
  return objectives;
}

function getAssessmentStrategy(lesson) {
  return {
    type: "mixed",
    weightDistribution: {
      accuracy: 0.6,
      speed: 0.2,
      completion: 0.2
    },
    passingScore: getPassingScore(lesson.difficulty),
    timeLimit: calculateEstimatedDuration(lesson) * 60 // Convert to seconds
  };
}

function getPassingScore(difficulty) {
  if (difficulty == null || difficulty === "") return 70;
  const scores = {
    easy: 70,
    medium: 75,
    hard: 80
  };
  return scores[difficulty] || 70;
}

function evaluateActivityAnswer(answer, activity) {
  let correct = false;
  let score = 0;
  let feedback = "";

  switch (activity.type) {
    case "typing":
      const userAnswer = String(answer).trim().toLowerCase();
      const correctAnswer = String(activity.correctAnswer).trim().toLowerCase();
      correct = userAnswer === correctAnswer;
      score = correct ? 100 : calculatePartialCredit(userAnswer, correctAnswer);
      feedback = correct ? "Wabikoze neza! Umeze ku wihangire!" : "Wongere ugerageze - Reba neza ihindura ry'ijambo";
      break;
      
    case "mc":
      correct = String(answer || "").trim() === String(activity.correctAnswer || "").trim();
      score = correct ? 100 : 0;
      feedback = correct ? "Wabikoze neza! Umeze ku wihangire!" : "Subira kureba ibyo umize none wongere ugerageze";
      break;
      
    case "audio":
      correct = !!(answer && String(answer).trim());
      score = correct ? 100 : 50;
      feedback = correct ? "Wabikoze neza ku njyuguti! Umeze ku wihangire!" : "Komeza kurwanira no guhindura ijwi ryawe";
      break;
      
    default:
      score = 0;
      feedback = "Ubwoko bw'ibibazo ntabwo bubizwi";
  }

  return { correct, score, feedback };
}

function calculatePartialCredit(userAnswer, correctAnswer) {
  if (!userAnswer || !correctAnswer) return 0;
  
  // Simple similarity calculation
  const similarity = userAnswer === correctAnswer ? 1 : 
    (userAnswer.includes(correctAnswer) || correctAnswer.includes(userAnswer)) ? 0.5 : 0;
  
  return Math.round(similarity * 100);
}

function calculateLessonScore(results, lessonData, timeSpent) {
  if (!results || results.length === 0) {
    return { score: 0, passed: false, timeBonus: 0, breakdown: [], averageScore: 0 };
  }
  const totalScore = results.reduce((sum, r) => sum + (r.score || 0), 0);
  const averageScore = Math.round(totalScore / results.length);
  const data = lessonData && typeof lessonData === "object" ? lessonData : {};
  const estimatedTime = (calculateEstimatedDuration(data) || 10) * 60;
  const timeBonus = (typeof timeSpent === "number" && timeSpent < estimatedTime) ? 5 : 0;
  const finalScore = Math.min(100, Math.max(0, averageScore + timeBonus));
  const passed = finalScore >= getPassingScore(data.difficulty);
  return {
    score: finalScore,
    passed,
    timeBonus,
    breakdown: results,
    averageScore
  };
}

function calculateEngagementScore(results, timeSpent) {
  if (!results || results.length === 0) return 0;
  const completionRate = results.filter(r => (r && (r.score || 0) > 0)).length / results.length;
  const timeEngagement = Math.min(1, (typeof timeSpent === "number" ? timeSpent : 0) / 600);
  return Math.round((completionRate * 0.7 + timeEngagement * 0.3) * 100);
}

function calculateMasteryLevel(results, lessonData) {
  if (!results || results.length === 0) return "Beginning";
  const total = results.reduce((sum, r) => sum + (r && r.score ? r.score : 0), 0);
  const averageScore = total / results.length;
  if (averageScore >= 90) return "Expert";
  if (averageScore >= 80) return "Advanced";
  if (averageScore >= 70) return "Proficient";
  if (averageScore >= 60) return "Developing";
  return "Beginning";
}

function identifyImprovementAreas(results, activities) {
  if (!Array.isArray(results) || !Array.isArray(activities)) return [];
  return results
    .filter(r => r && (r.score || 0) < 70)
    .map(r => {
      const activity = activities.find(a => a && a.id === r.activityId);
      return (activity && activity.category) || "general";
    })
    .filter((area, index, arr) => arr.indexOf(area) === index);
}

function generateNextRecommendations(scoring, lessonData) {
  const recommendations = [];
  
  if (scoring.score >= 90) {
    recommendations.push({
      type: 'advance',
      title: 'Ready for next level',
      description: 'Excellent work! You\'re ready for more challenging content.'
    });
  } else if (scoring.score >= 70) {
    recommendations.push({
      type: 'practice',
      title: 'Practice similar exercises',
      description: 'Good progress! Practice more to strengthen your skills.'
    });
  } else {
    recommendations.push({
      type: 'review',
      title: 'Review fundamentals',
      description: 'Let\'s review the basic concepts before moving forward.'
    });
  }
  
  return recommendations;
}

async function updateUserProgress(uid, lessonId, scoring) {
  const db = getDb();
  if (!db) return;
  const progressRef = db.collection("users").doc(uid).collection("progress").doc("overall");
  const now = new Date().toISOString();
  try {
    let totalLessons = 0;
    try {
      const lessonsSnap = await db.collection("lessons").orderBy("order").get();
      totalLessons = lessonsSnap.size;
    } catch (e) {
      console.warn("updateUserProgress: lessons count failed", e.message);
    }
    const historySnap = await db.collection("users").doc(uid).collection("lessonHistory").get();
    const lessonHistory = historySnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const completedLessons = lessonHistory.filter(h => h.passed === true).length;
    const scores = lessonHistory.filter(h => typeof h.score === "number").map(h => h.score);
    const averageScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const currentProgressDoc = await progressRef.get();
    const currentProgress = currentProgressDoc.data() || {};
    const currentStreak = typeof currentProgress.currentStreak === "number" ? currentProgress.currentStreak : 0;
    const updatedProgress = {
      completedLessons,
      totalLessons,
      averageScore,
      lastCompletedAt: now,
      lastActivityAt: now,
      currentStreak: scoring.passed ? currentStreak + 1 : 0,
    };
    await progressRef.set(updatedProgress, { merge: true });
    const profileRef = db.collection("userProfiles").doc(uid);
    await profileRef.set({ lastActivityAt: now }, { merge: true });
  } catch (e) {
    console.error("updateUserProgress error:", e.message);
  }
}

function calculateNextLesson(currentLesson, performance, allLessons) {
  const currentIndex = allLessons.findIndex(l => l.id === currentLesson.id);
  
  if (!performance || !performance.passed) {
    return {
      lesson: currentLesson,
      recommendations: [{
        type: 'retry',
        title: 'Try this lesson again',
        description: 'Master this concept before moving forward.'
      }]
    };
  }
  
  // Find next appropriate lesson
  let nextLesson = null;
  if (currentIndex < allLessons.length - 1) {
    nextLesson = allLessons[currentIndex + 1];
  }
  
  const recommendations = [];
  if (performance.score >= 90) {
    recommendations.push({
      type: 'skip-ahead',
      title: 'Ready for challenge',
      description: 'Consider skipping to more advanced content.'
    });
  }
  
  return {
    lesson: nextLesson,
    recommendations
  };
}

module.exports = router;
