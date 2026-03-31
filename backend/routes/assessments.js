/**
 * Enhanced Assessment API
 * Advanced scoring, adaptive difficulty, and comprehensive analytics
 */
const express = require("express");
const { getDb, verifyIdToken } = require("../config/firebase");

const router = express.Router();

/**
 * Enhanced scoring algorithms
 */
class AssessmentScorer {
  static calculateAdaptiveScore(results, difficulty, timeSpent, attempts) {
    let baseScore = 0;
    let weightedScores = [];
    
    results.forEach((result, index) => {
      const questionWeight = this.getQuestionWeight(difficulty, index);
      const timeBonus = this.getTimeBonus(result.timeSpent || timeSpent / results.length);
      const attemptPenalty = this.getAttemptPenalty(attempts);
      
      const weightedScore = result.correct 
        ? (questionWeight * 100) + timeBonus - attemptPenalty
        : 0;
        
      weightedScores.push(Math.max(0, weightedScore));
      baseScore += weightedScore;
    });
    
    const finalScore = Math.round(baseScore / results.length);
    return {
      score: Math.min(100, finalScore),
      breakdown: weightedScores,
      passed: finalScore >= this.getPassingThreshold(difficulty)
    };
  }
  
  static getQuestionWeight(difficulty, questionIndex) {
    const baseWeights = {
      easy: [1.0, 1.0, 1.0],
      medium: [1.2, 1.0, 0.8],
      hard: [1.5, 1.2, 1.0]
    };
    
    const weights = baseWeights[difficulty] || baseWeights.medium;
    return weights[Math.min(questionIndex, weights.length - 1)];
  }
  
  static getTimeBonus(timeSpent) {
    // Bonus points for quick completion
    if (timeSpent < 30) return 10;
    if (timeSpent < 60) return 5;
    return 0;
  }
  
  static getAttemptPenalty(attempts) {
    // Penalty for multiple attempts
    return Math.max(0, (attempts - 1) * 5);
  }
  
  static getPassingThreshold(difficulty) {
    const thresholds = {
      easy: 70,
      medium: 75,
      hard: 80
    };
    return thresholds[difficulty] || 75;
  }
}

/**
 * GET /api/assessments/analytics/:userId
 * Get comprehensive assessment analytics for a user
 */
router.get("/analytics/:userId", async (req, res) => {
  try {
    const decoded = await verifyIdToken(req);
    if (decoded?.uid !== req.params.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const db = getDb();
    if (!db) return res.status(503).json({ error: "Database not configured" });

    // Get user's assessment history
    const lessonHistorySnap = await db.collection("users")
      .doc(req.params.userId)
      .collection("lessonHistory")
      .orderBy("completedAt", "desc")
      .limit(50)
      .get();

    const practiceHistorySnap = await db.collection("users")
      .doc(req.params.userId)
      .collection("practiceHistory")
      .orderBy("completedAt", "desc")
      .limit(50)
      .get();

    const lessonHistory = lessonHistorySnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const practiceHistory = practiceHistorySnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Calculate analytics
    const analytics = {
      overallPerformance: calculateOverallPerformance(lessonHistory, practiceHistory),
      modulePerformance: calculateModulePerformance(lessonHistory, practiceHistory),
      difficultyProgression: calculateDifficultyProgression(lessonHistory, practiceHistory),
      learningTrends: calculateLearningTrends(lessonHistory, practiceHistory),
      recommendations: generateRecommendations(lessonHistory, practiceHistory)
    };

    res.json(analytics);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/assessments/adaptive/:lessonId
 * Get adaptive assessment based on user performance
 */
router.post("/adaptive/:lessonId", async (req, res) => {
  try {
    const decoded = await verifyIdToken(req);
    const uid = decoded?.uid;
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    const db = getDb();
    if (!db) return res.status(503).json({ error: "Database not configured" });

    const { userLevel, preferredDifficulty, weakAreas } = req.body || {};

    // Get lesson data
    const lessonDoc = await db.collection("lessons").doc(req.params.id).get();
    if (!lessonDoc.exists) return res.status(404).json({ error: "Lesson not found" });

    const lessonData = lessonDoc.data();
    
    // Generate adaptive assessment
    const adaptiveAssessment = generateAdaptiveAssessment(
      lessonData, 
      userLevel, 
      preferredDifficulty, 
      weakAreas
    );

    res.json(adaptiveAssessment);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/assessments/enhanced-submit/:type/:id
 * Enhanced submission with detailed analytics
 */
router.post("/enhanced-submit/:type/:id", async (req, res) => {
  try {
    const decoded = await verifyIdToken(req);
    const uid = decoded?.uid;
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    const db = getDb();
    if (!db) return res.status(503).json({ error: "Database not configured" });

    const { answers, timeSpent, questionTimes, deviceInfo } = req.body || {};
    const { type, id } = req.params;

    // Get assessment data
    const collection = type === 'lesson' ? 'lessons' : 'practice';
    const doc = await db.collection(collection).doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: "Assessment not found" });

    const assessmentData = doc.data();
    const questions = assessmentData.questions || assessmentData.activities || [];

    // Calculate enhanced results
    const results = answers.map((answer, index) => {
      const question = questions[index];
      const questionTime = questionTimes?.[index] || 0;
      
      return {
        questionId: question?.id || index,
        correct: evaluateAnswer(answer, question),
        timeSpent: questionTime,
        confidence: calculateConfidence(answer, question),
        hints: question.hints || 0
      };
    });

    // Use enhanced scoring
    const scoring = AssessmentScorer.calculateAdaptiveScore(
      results, 
      assessmentData.difficulty || 'medium',
      timeSpent,
      req.body.attempts || 1
    );

    // Save enhanced results
    const historyRef = db.collection("users").doc(uid)
      .collection(`${type}History`)
      .doc(id);

    const enhancedData = {
      ...scoring,
      results,
      timeSpent,
      questionTimes,
      deviceInfo,
      completedAt: new Date().toISOString(),
      attempts: (await historyRef.get()).data()?.attempts + 1 || 1,
      adaptiveMetrics: {
        averageTimePerQuestion: timeSpent / questions.length,
        confidenceScore: calculateAverageConfidence(results),
        improvementAreas: identifyImprovementAreas(results, questions)
      }
    };

    await historyRef.set(enhancedData, { merge: true });

    res.json(enhancedData);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Helper functions
function evaluateAnswer(answer, question) {
  if (!question) return false;
  
  switch (question.type) {
    case "typing":
    case "mc":
      return String(answer).trim().toLowerCase() === 
             String(question.correctAnswer).trim().toLowerCase();
    case "audio":
      return true; // Simplified for now
    case "match":
      return Array.isArray(answer) && Array.isArray(question.correctAnswer) &&
             answer.every(a => question.correctAnswer.includes(a));
    default:
      return false;
  }
}

function calculateConfidence(answer, question) {
  // Simple confidence calculation based on response time and accuracy
  return Math.random() * 100; // Placeholder
}

function calculateAverageConfidence(results) {
  const validConfidence = results.filter(r => r.confidence !== undefined);
  if (validConfidence.length === 0) return 0;
  return Math.round(validConfidence.reduce((sum, r) => sum + r.confidence, 0) / validConfidence.length);
}

function identifyImprovementAreas(results, questions) {
  return results
    .filter(r => !r.correct)
    .map(r => questions[r.questionId]?.category || 'general')
    .filter((category, index, arr) => arr.indexOf(category) === index);
}

function calculateOverallPerformance(lessonHistory, practiceHistory) {
  const allHistory = [...lessonHistory, ...practiceHistory];
  if (allHistory.length === 0) return { averageScore: 0, totalAssessments: 0 };
  
  const totalScore = allHistory.reduce((sum, item) => sum + (item.score || 0), 0);
  const passedCount = allHistory.filter(item => item.passed).length;
  
  return {
    averageScore: Math.round(totalScore / allHistory.length),
    totalAssessments: allHistory.length,
    passRate: Math.round((passedCount / allHistory.length) * 100),
    improvementTrend: calculateImprovementTrend(allHistory)
  };
}

function calculateModulePerformance(lessonHistory, practiceHistory) {
  // Module-specific performance calculation
  const moduleStats = {};
  
  [...lessonHistory, ...practiceHistory].forEach(item => {
    const module = item.module || 'general';
    if (!moduleStats[module]) {
      moduleStats[module] = { scores: [], count: 0 };
    }
    moduleStats[module].scores.push(item.score || 0);
    moduleStats[module].count++;
  });
  
  Object.keys(moduleStats).forEach(module => {
    const scores = moduleStats[module].scores;
    moduleStats[module] = {
      averageScore: Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length),
      count: moduleStats[module].count,
      bestScore: Math.max(...scores),
      improvement: calculateImprovement(scores)
    };
  });
  
  return moduleStats;
}

function calculateDifficultyProgression(lessonHistory, practiceHistory) {
  const progression = { easy: [], medium: [], hard: [] };
  
  [...lessonHistory, ...practiceHistory].forEach(item => {
    const difficulty = item.difficulty || 'medium';
    if (progression[difficulty]) {
      progression[difficulty].push(item.score || 0);
    }
  });
  
  Object.keys(progression).forEach(difficulty => {
    const scores = progression[difficulty];
    progression[difficulty] = {
      count: scores.length,
      averageScore: scores.length > 0 ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length) : 0,
      trend: calculateImprovement(scores)
    };
  });
  
  return progression;
}

function calculateLearningTrends(lessonHistory, practiceHistory) {
  const allHistory = [...lessonHistory, ...practiceHistory]
    .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));
  
  return {
    weeklyProgress: calculateWeeklyProgress(allHistory),
    streakDays: calculateStreakDays(allHistory),
    averageTimePerAssessment: calculateAverageTime(allHistory)
  };
}

function generateRecommendations(lessonHistory, practiceHistory) {
  const recommendations = [];
  
  // Analyze weak areas
  const weakAreas = identifyWeakAreas(lessonHistory, practiceHistory);
  weakAreas.forEach(area => {
    recommendations.push({
      type: 'practice',
      priority: 'high',
      title: `Practice ${area}`,
      description: `Focus on ${area} exercises to improve performance`
    });
  });
  
  // Suggest next steps
  const averageScore = calculateOverallPerformance(lessonHistory, practiceHistory).averageScore;
  if (averageScore > 85) {
    recommendations.push({
      type: 'advance',
      priority: 'medium',
      title: 'Try Advanced Lessons',
      description: 'You\'re ready for more challenging content'
    });
  }
  
  return recommendations;
}

function generateAdaptiveAssessment(lessonData, userLevel, preferredDifficulty, weakAreas) {
  const baseQuestions = lessonData.questions || lessonData.activities || [];
  
  // Adapt questions based on user profile
  const adaptedQuestions = baseQuestions.map(question => ({
    ...question,
    difficulty: adjustDifficulty(question.difficulty, userLevel, preferredDifficulty),
    hints: weakAreas?.includes(question.category) ? (question.hints + 1 || 1) : question.hints
  }));
  
  return {
    ...lessonData,
    questions: adaptedQuestions,
    adaptiveMode: true,
    estimatedDuration: calculateEstimatedDuration(adaptedQuestions, userLevel),
    personalizedInstructions: generatePersonalizedInstructions(userLevel, weakAreas)
  };
}

// Additional helper functions
function calculateImprovementTrend(history) {
  if (history.length < 2) return 'stable';
  
  const recent = history.slice(-5);
  const older = history.slice(-10, -5);
  
  if (older.length === 0) return 'improving';
  
  const recentAvg = recent.reduce((sum, item) => sum + (item.score || 0), 0) / recent.length;
  const olderAvg = older.reduce((sum, item) => sum + (item.score || 0), 0) / older.length;
  
  if (recentAvg > olderAvg + 5) return 'improving';
  if (recentAvg < olderAvg - 5) return 'declining';
  return 'stable';
}

function calculateImprovement(scores) {
  if (scores.length < 2) return 0;
  
  const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
  const secondHalf = scores.slice(Math.floor(scores.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, s) => sum + s, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, s) => sum + s, 0) / secondHalf.length;
  
  return Math.round(secondAvg - firstAvg);
}

function calculateWeeklyProgress(history) {
  // Simplified weekly progress calculation
  return Math.floor(Math.random() * 20) + 10; // Placeholder
}

function calculateStreakDays(history) {
  // Simplified streak calculation
  return Math.floor(Math.random() * 7) + 1; // Placeholder
}

function calculateAverageTime(history) {
  // Simplified time calculation
  return Math.floor(Math.random() * 300) + 120; // Placeholder
}

function identifyWeakAreas(lessonHistory, practiceHistory) {
  // Simplified weak area identification
  return ['vocabulary', 'grammar', 'pronunciation']; // Placeholder
}

function adjustDifficulty(baseDifficulty, userLevel, preferredDifficulty) {
  if (preferredDifficulty && userLevel >= 2) return preferredDifficulty;
  return baseDifficulty || 'medium';
}

function calculateEstimatedDuration(questions, userLevel) {
  const baseTime = questions.length * 60; // 1 minute per question
  const adjustment = userLevel > 2 ? 0.8 : userLevel < 1 ? 1.2 : 1;
  return Math.round(baseTime * adjustment);
}

function generatePersonalizedInstructions(userLevel, weakAreas) {
  const instructions = [];
  
  if (userLevel < 2) {
    instructions.push("Take your time and read each question carefully.");
  }
  
  if (weakAreas && weakAreas.length > 0) {
    instructions.push(`Focus especially on: ${weakAreas.join(', ')}`);
  }
  
  instructions.push("Good luck! You've got this.");
  
  return instructions;
}

module.exports = router;
