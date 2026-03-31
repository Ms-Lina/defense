const express = require("express");
const { getDb, verifyIdToken } = require("../config/firebase");

const router = express.Router();

/**
 * GET /api/practice
 * Returns a list of matching/practice exercises.
 */
router.get("/", async (req, res) => {
    try {
        const db = getDb();
        if (!db) return res.status(503).json({ error: "Database not configured" });

        const snap = await db.collection("practice").get();
        const practiceItems = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        res.json({ practiceItems });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/**
 * GET /api/practice/:id
 * Returns a specific practice exercise by ID.
 */
router.get("/:id", async (req, res) => {
    try {
        const db = getDb();
        if (!db) return res.status(503).json({ error: "Database not configured" });

        const doc = await db.collection("practice").doc(req.params.id).get();
        if (doc.exists) {
            res.json({ id: doc.id, ...doc.data() });
        } else {
            res.status(404).json({ error: "Practice item not found" });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/**
 * POST /api/practice/:id/submit
 * Submit practice exercise answers and get score.
 */
router.post("/:id/submit", async (req, res) => {
    try {
        const decoded = await verifyIdToken(req);
        const uid = decoded?.uid;
        if (!uid) return res.status(401).json({ error: "Unauthorized" });

        const db = getDb();
        if (!db) return res.status(503).json({ error: "Database not configured" });

        const { answers } = req.body || {};
        if (!Array.isArray(answers)) {
            return res.status(400).json({ error: "answers array required" });
        }

        // Get practice item
        const practiceDoc = await db.collection("practice").doc(req.params.id).get();
        if (!practiceDoc.exists) return res.status(404).json({ error: "Practice item not found" });

        const practiceData = practiceDoc.data();
        const questions = practiceData.questions || [];

        // Enhanced scoring with adaptive algorithms
        let correctCount = 0;
        const results = answers.map((answer, index) => {
            const question = questions[index];
            if (!question) return { correct: false };

            let isCorrect = false;
            let partialCredit = 0;
            
            if (question.type === "typing" || question.type === "mc") {
                const userAnswer = String(answer).trim().toLowerCase();
                const correctAnswer = String(question.correctAnswer).trim().toLowerCase();
                
                // Exact match
                if (userAnswer === correctAnswer) {
                    isCorrect = true;
                    partialCredit = 100;
                } else {
                    // Partial credit for close matches
                    partialCredit = calculatePartialCredit(userAnswer, correctAnswer);
                }
            } else if (question.type === "audio") {
                // Enhanced audio evaluation
                isCorrect = evaluateAudioAnswer(answer, question);
                partialCredit = isCorrect ? 100 : 50; // Partial credit for attempt
            } else if (question.type === "match") {
                isCorrect = evaluateMatchAnswer(answer, question);
                partialCredit = calculateMatchPartialCredit(answer, question);
            }

            if (isCorrect) correctCount++;
            return { 
                questionId: question.id, 
                correct: isCorrect,
                partialCredit,
                timeSpent: req.body.questionTimes?.[index] || 0,
                hints: question.hints || 0
            };
        });

        const total = questions.length || 1;
        const averagePartialCredit = results.reduce((sum, r) => sum + (r.partialCredit || 0), 0) / total;
        const score = Math.round(averagePartialCredit);
        const passed = score >= getAdaptivePassingThreshold(practiceData.difficulty, req.body.attempts || 1);

        // Save to user's practice history
        const historyRef = db.collection("users").doc(uid).collection("practiceHistory").doc(req.params.id);
        await historyRef.set({
            score,
            passed,
            results,
            attempts: (await historyRef.get()).data()?.attempts + 1 || 1,
            completedAt: new Date().toISOString(),
        }, { merge: true });

        // Update overall practice progress
        const userRef = db.collection("users").doc(uid);
        await userRef.set({
            practiceCompleted: (await userRef.get()).data()?.practiceCompleted + 1 || 1,
            practicePassed: (await userRef.get()).data()?.practicePassed + (passed ? 1 : 0),
            lastPracticeAt: new Date().toISOString(),
        }, { merge: true });

        res.json({ score, passed, results });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/**
 * GET /api/practice/history
 * Get user's practice history.
 */
router.get("/history", async (req, res) => {
    try {
        const decoded = await verifyIdToken(req);
        const uid = decoded?.uid;
        const db = getDb();
        if (!db || !uid) return res.json({ history: [] });

        const snap = await db.collection("users").doc(uid).collection("practiceHistory").get();
        const history = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({ history });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Helper functions for enhanced assessment
function calculatePartialCredit(userAnswer, correctAnswer) {
    if (!userAnswer || !correctAnswer) return 0;
    
    // Levenshtein distance for partial credit
    const distance = levenshteinDistance(userAnswer, correctAnswer);
    const maxLength = Math.max(userAnswer.length, correctAnswer.length);
    const similarity = 1 - (distance / maxLength);
    
    return Math.round(similarity * 100);
}

function levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    
    return matrix[str2.length][str1.length];
}

function evaluateAudioAnswer(audioUri, question) {
    // Enhanced audio evaluation
    // In real implementation, this would use speech-to-text and comparison
    return audioUri && audioUri !== "recorded" ? true : false;
}

function evaluateMatchAnswer(userAnswer, question) {
    if (!Array.isArray(userAnswer) || !Array.isArray(question.correctAnswer)) {
        return false;
    }
    
    // Check if all correct answers are included
    return question.correctAnswer.every(correct => userAnswer.includes(correct)) &&
           userAnswer.every(answer => question.correctAnswer.includes(answer));
}

function calculateMatchPartialCredit(userAnswer, question) {
    if (!Array.isArray(userAnswer) || !Array.isArray(question.correctAnswer)) {
        return 0;
    }
    
    const correct = userAnswer.filter(answer => question.correctAnswer.includes(answer)).length;
    const total = Math.max(userAnswer.length, question.correctAnswer.length);
    
    return Math.round((correct / total) * 100);
}

function getAdaptivePassingThreshold(difficulty, attempts) {
    const baseThresholds = {
        easy: 70,
        medium: 75,
        hard: 80
    };
    
    const baseThreshold = baseThresholds[difficulty] || 75;
    
    // Adjust threshold based on attempts (make it slightly easier after multiple attempts)
    const attemptAdjustment = Math.min((attempts - 1) * 2, 10);
    
    return Math.max(60, baseThreshold - attemptAdjustment);
}

module.exports = router;
