/**
 * Enhanced Progress API with Real-time Updates
 * Comprehensive progress tracking and analytics
 */
const express = require("express");
const { getDb, verifyIdToken } = require("../config/firebase");

const router = express.Router();

/**
 * Progress Event System
 */
class ProgressEventEmitter {
  static events = new Map();
  
  static emit(userId, event, data) {
    const userEvents = this.events.get(userId) || [];
    userEvents.push({ event, data, timestamp: new Date().toISOString() });
    this.events.set(userId, userEvents);
    
    // Keep only last 100 events per user
    if (userEvents.length > 100) {
      this.events.set(userId, userEvents.slice(-100));
    }
  }
  
  static getEvents(userId, limit = 50) {
    const userEvents = this.events.get(userId) || [];
    return userEvents.slice(-limit);
  }
  
  static clearEvents(userId) {
    this.events.delete(userId);
  }
}

/**
 * Achievement System
 */
class AchievementSystem {
  static achievements = {
    firstLesson: {
      id: 'first_lesson',
      name: 'First Steps',
      description: 'Complete your first lesson',
      icon: '🎯',
      condition: (progress) => progress.completedLessons >= 1
    },
    streakWarrior: {
      id: 'streak_warrior',
      name: 'Streak Warrior',
      description: 'Maintain a 7-day streak',
      icon: '🔥',
      condition: (progress) => progress.streakDays >= 7
    },
    dedicated: {
      id: 'dedicated',
      name: 'Dedicated Learner',
      description: 'Complete 10 lessons',
      icon: '⭐',
      condition: (progress) => progress.completedLessons >= 10
    },
    expert: {
      id: 'expert',
      name: 'Expert',
      description: 'Complete 25 lessons',
      icon: '🏆',
      condition: (progress) => progress.completedLessons >= 25
    },
    master: {
      id: 'master',
      name: 'Master',
      description: 'Complete all lessons',
      icon: '👑',
      condition: (progress) => progress.completedLessons >= progress.totalLessons
    },
    highScorer: {
      id: 'high_scorer',
      name: 'High Scorer',
      description: 'Score 90% or higher on 5 lessons',
      icon: '💯',
      condition: (progress, scores) => {
        const highScores = scores.filter(score => score >= 90).length;
        return highScores >= 5;
      }
    },
    perfectScore: {
      id: 'perfect_score',
      name: 'Perfect Score',
      description: 'Get 100% on any lesson',
      icon: '🌟',
      condition: (progress, scores) => scores.includes(100)
    },
    quickLearner: {
      id: 'quick_learner',
      name: 'Quick Learner',
      description: 'Complete 3 lessons in one day',
      icon: '⚡',
      condition: (progress, _, recentActivity) => {
        const today = new Date().toDateString();
        const todayLessons = recentActivity.filter(activity => 
          new Date(activity.timestamp).toDateString() === today &&
          activity.event === 'lesson.completed'
        ).length;
        return todayLessons >= 3;
      }
    }
  };
  
  static checkAchievements(userId, progress, scores = [], recentActivity = []) {
    const unlockedAchievements = [];
    
    Object.values(this.achievements).forEach(achievement => {
      if (achievement.condition(progress, scores, recentActivity)) {
        unlockedAchievements.push(achievement);
        ProgressEventEmitter.emit(userId, 'achievement.unlocked', achievement);
      }
    });
    
    return unlockedAchievements;
  }
}

/**
 * GET /api/progress/enhanced/{userId}
 * Get comprehensive progress data with real-time updates
 */
router.get("/enhanced/:userId", async (req, res) => {
  try {
    const decoded = await verifyIdToken(req);
    if (decoded?.uid !== req.params.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const db = getDb();
    if (!db) return res.status(503).json({ error: "Database not configured" });

    const uid = req.params.userId;
    
    // Get real lesson count
    const lessonsSnap = await db.collection("lessons").get();
    const totalLessons = lessonsSnap.size;
    
    // Calculate real completed lessons
    const lessonHistorySnap = await db.collection("users").doc(uid).collection("lessonHistory").get();
    const completedLessons = lessonHistorySnap.docs.filter(doc => {
      const data = doc.data();
      return data.passed === true;
    }).length;
    
    // Get scores for achievements
    const scores = lessonHistorySnap.docs.map(doc => doc.data().score || 0);
    
    // Get practice history
    const practiceHistorySnap = await db.collection("users").doc(uid).collection("practiceHistory").get();
    const practiceSessions = practiceHistorySnap.size;
    
    // Get overall progress
    const progressDoc = await db.collection("users").doc(uid).collection("progress").doc("overall").get();
    const overallProgress = progressDoc.exists ? progressDoc.data() : {};
    
    // Calculate streak
    let streakDays = 0;
    const recentActivity = ProgressEventEmitter.getEvents(uid, 30);
    
    if (overallProgress.currentStreak) {
      streakDays = overallProgress.currentStreak;
    }
    
    // Get recent events
    const recentEvents = ProgressEventEmitter.getEvents(uid, 10);
    
    // Check achievements
    const progressData = {
      completedLessons,
      totalLessons,
      remainingLessons: totalLessons - completedLessons,
      streakDays,
      practiceSessions,
      averageScore: scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0,
      lastActivity: overallProgress.lastCompletedAt || null,
      level: calculateUserLevel(completedLessons, scores),
      xp: calculateUserXP(completedLessons, scores),
      nextLevelXP: calculateNextLevelXP(completedLessons),
      recentEvents,
      recentActivity
    };
    
    // Check for new achievements
    const achievements = AchievementSystem.checkAchievements(uid, progressData, scores, recentActivity);
    
    // Get user's existing achievements
    const achievementsDoc = await db.collection("users").doc(uid).collection("achievements").doc("unlocked").get();
    const existingAchievements = achievementsDoc.exists ? achievementsDoc.data().unlocked || [] : [];
    
    // Save new achievements
    if (achievements.length > 0) {
      const newAchievements = achievements.filter(a => !existingAchievements.find(ea => ea.id === a.id));
      if (newAchievements.length > 0) {
        await db.collection("users").doc(uid).collection("achievements").doc("unlocked").set({
          unlocked: [...existingAchievements, ...newAchievements],
          lastUpdated: new Date().toISOString()
        }, { merge: true });
      }
    }
    
    res.json({
      ...progressData,
      badge: getBadge(completedLessons),
      nextBadge: nextBadge(completedLessons),
      achievements: [...existingAchievements, ...achievements],
      progressPercentage: Math.round((completedLessons / totalLessons) * 100),
      moduleProgress: await calculateModuleProgress(uid, db),
      learningStreak: await calculateLearningStreak(uid, db),
      weeklyProgress: await calculateWeeklyProgress(uid, db)
    });
    
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/progress/update
 * Real-time progress update
 */
router.post("/update", async (req, res) => {
  try {
    const decoded = await verifyIdToken(req);
    const uid = decoded?.uid;
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    const db = getDb();
    if (!db) return res.status(503).json({ error: "Database not configured" });

    const { type, data } = req.body || {};
    
    // Emit progress event
    ProgressEventEmitter.emit(uid, type, data);
    
    // Update progress based on type
    switch (type) {
      case 'lesson.completed':
        await handleLessonCompletion(uid, data, db);
        break;
      case 'practice.submitted':
        await handlePracticeSubmission(uid, data, db);
        break;
      case 'streak.updated':
        await handleStreakUpdate(uid, data, db);
        break;
      case 'achievement.unlocked':
        await handleAchievementUnlock(uid, data, db);
        break;
      default:
        console.log(`Unknown progress event type: ${type}`);
    }
    
    // Get updated progress
    const updatedProgress = await getEnhancedProgress(uid, db);
    
    res.json({
      success: true,
      progress: updatedProgress,
      event: { type, data, timestamp: new Date().toISOString() }
    });
    
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/progress/batch-update
 * Batch progress updates for efficiency
 */
router.post("/batch-update", async (req, res) => {
  try {
    const decoded = await verifyIdToken(req);
    const uid = decoded?.uid;
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    const db = getDb();
    if (!db) return res.status(503).json({ error: "Database not configured" });

    const { updates } = req.body || {};
    
    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: "updates array required" });
    }
    
    // Process all updates
    const results = [];
    for (const update of updates) {
      try {
        ProgressEventEmitter.emit(uid, update.type, update.data);
        
        switch (update.type) {
          case 'lesson.completed':
            await handleLessonCompletion(uid, update.data, db);
            break;
          case 'practice.submitted':
            await handlePracticeSubmission(uid, update.data, db);
            break;
          case 'streak.updated':
            await handleStreakUpdate(uid, update.data, db);
            break;
        }
        
        results.push({ type: update.type, success: true });
      } catch (error) {
        results.push({ type: update.type, success: false, error: error.message });
      }
    }
    
    // Get final progress
    const finalProgress = await getEnhancedProgress(uid, db);
    
    res.json({
      success: true,
      results,
      progress: finalProgress,
      processedAt: new Date().toISOString()
    });
    
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/progress/events/{userId}
 * Get recent progress events
 */
router.get("/events/:userId", async (req, res) => {
  try {
    const decoded = await verifyIdToken(req);
    if (decoded?.uid !== req.params.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { limit = 50 } = req.query;
    const events = ProgressEventEmitter.getEvents(req.params.userId, parseInt(limit));
    
    res.json({
      events,
      count: events.length,
      userId: req.params.userId
    });
    
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Helper functions
function calculateUserLevel(completedLessons, scores) {
  const xp = calculateUserXP(completedLessons, scores);
  
  if (xp >= 1000) return 5;
  if (xp >= 500) return 4;
  if (xp >= 200) return 3;
  if (xp >= 50) return 2;
  return 1;
}

function calculateUserXP(completedLessons, scores) {
  const lessonXP = completedLessons * 10;
  const scoreXP = scores.reduce((sum, score) => sum + Math.floor(score / 10), 0);
  return lessonXP + scoreXP;
}

function calculateNextLevelXP(completedLessons) {
  const currentLevel = calculateUserLevel(completedLessons, []);
  const thresholds = [50, 200, 500, 1000, Infinity];
  return thresholds[currentLevel] || 1000;
}

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

async function calculateModuleProgress(uid, db) {
  const lessonHistorySnap = await db.collection("users").doc(uid).collection("lessonHistory").get();
  const lessonsSnap = await db.collection("lessons").get();
  
  const moduleProgress = {};
  const lessons = lessonsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  // Group lessons by module
  const modules = {};
  lessons.forEach(lesson => {
    const module = lesson.module || 'Unknown';
    if (!modules[module]) modules[module] = { total: 0, completed: 0 };
    modules[module].total++;
  });
  
  // Count completed lessons per module
  lessonHistorySnap.forEach(doc => {
    const data = doc.data();
    if (data.passed) {
      const lesson = lessons.find(l => l.id === doc.id);
      if (lesson) {
        const module = lesson.module || 'Unknown';
        if (modules[module]) {
          modules[module].completed++;
        }
      }
    }
  });
  
  // Calculate percentages
  Object.keys(modules).forEach(module => {
    const { total, completed } = modules[module];
    moduleProgress[module] = {
      total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  });
  
  return moduleProgress;
}

async function calculateLearningStreak(uid, db) {
  const progressDoc = await db.collection("users").doc(uid).collection("progress").doc("overall").get();
  const progress = progressDoc.exists ? progressDoc.data() : {};
  
  return {
    currentStreak: progress.currentStreak || 0,
    longestStreak: progress.longestStreak || 0,
    lastActiveDate: progress.lastActiveDate || null
  };
}

async function calculateWeeklyProgress(uid, db) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  
  const lessonHistorySnap = await db.collection("users").doc(uid).collection("lessonHistory").get();
  const practiceHistorySnap = await db.collection("users").doc(uid).collection("practiceHistory").get();
  
  const weeklyLessons = lessonHistorySnap.docs.filter(doc => {
    const completedAt = new Date(doc.data().completedAt);
    return completedAt >= weekStart && doc.data().passed;
  }).length;
  
  const weeklyPractice = practiceHistorySnap.docs.filter(doc => {
    const completedAt = new Date(doc.data().completedAt);
    return completedAt >= weekStart;
  }).length;
  
  return {
    weekOf: weekStart.toISOString(),
    lessonsCompleted: weeklyLessons,
    practiceSessions: weeklyPractice,
    totalActivity: weeklyLessons + weeklyPractice
  };
}

async function getEnhancedProgress(uid, db) {
  const lessonsSnap = await db.collection("lessons").get();
  const totalLessons = lessonsSnap.size;
  
  const lessonHistorySnap = await db.collection("users").doc(uid).collection("lessonHistory").get();
  const completedLessons = lessonHistorySnap.docs.filter(doc => doc.data().passed).length;
  
  const scores = lessonHistorySnap.docs.map(doc => doc.data().score || 0);
  const averageScore = scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
  
  const progressDoc = await db.collection("users").doc(uid).collection("progress").doc("overall").get();
  const overallProgress = progressDoc.exists ? progressDoc.data() : {};
  
  return {
    completedLessons,
    totalLessons,
    remainingLessons: totalLessons - completedLessons,
    streakDays: overallProgress.currentStreak || 0,
    averageScore,
    level: calculateUserLevel(completedLessons, scores),
    xp: calculateUserXP(completedLessons, scores),
    progressPercentage: Math.round((completedLessons / totalLessons) * 100)
  };
}

async function handleLessonCompletion(uid, data, db) {
  // Update overall progress
  const progressRef = db.collection("users").doc(uid).collection("progress").doc("overall");
  const currentProgress = (await progressRef.get()).data() || {};
  
  await progressRef.set({
    ...currentProgress,
    completedLessons: (currentProgress.completedLessons || 0) + 1,
    lastCompletedAt: new Date().toISOString(),
    currentStreak: (currentProgress.currentStreak || 0) + 1,
    lastActiveDate: new Date().toISOString()
  }, { merge: true });
}

async function handlePracticeSubmission(uid, data, db) {
  // Update practice statistics
  const progressRef = db.collection("users").doc(uid).collection("progress").doc("overall");
  const currentProgress = (await progressRef.get()).data() || {};
  
  await progressRef.set({
    ...currentProgress,
    practiceSessions: (currentProgress.practiceSessions || 0) + 1,
    lastActiveDate: new Date().toISOString()
  }, { merge: true });
}

async function handleStreakUpdate(uid, data, db) {
  // Update streak information
  const progressRef = db.collection("users").doc(uid).collection("progress").doc("overall");
  
  await progressRef.set({
    currentStreak: data.streakDays,
    longestStreak: data.longestStreak,
    lastActiveDate: new Date().toISOString()
  }, { merge: true });
}

async function handleAchievementUnlock(uid, data, db) {
  // Save achievement to user's achievements
  const achievementsRef = db.collection("users").doc(uid).collection("achievements").doc("unlocked");
  const currentAchievements = (await achievementsRef.get()).data() || { unlocked: [] };
  
  if (!currentAchievements.unlocked.find(a => a.id === data.id)) {
    await achievementsRef.set({
      unlocked: [...currentAchievements.unlocked, data],
      lastUpdated: new Date().toISOString()
    }, { merge: true });
  }
}

module.exports = router;
