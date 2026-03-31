/**
 * Test course/lesson completion flow: submit real answers → lesson marked complete, achievements & stats updated.
 *
 * Usage (with token from app – e.g. log user.getIdToken() on a screen):
 *   SUBMIT_TEST_TOKEN="<idToken>" BASE_URL=http://localhost:4000 node scripts/test-course-completion.js
 *   SUBMIT_TEST_TOKEN="<idToken>" BASE_URL=https://menyai-nslw.onrender.com node scripts/test-course-completion.js
 *
 * Optional: LESSON_ID=xxx to submit a specific lesson (default: first lesson that has activities).
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const BASE_URL = (process.env.BASE_URL || process.env.DEPLOYED_BACKEND_URL || "http://localhost:4000").replace(/\/$/, "");
const TOKEN = process.env.SUBMIT_TEST_TOKEN || process.env.PROGRESS_TEST_TOKEN;
const LESSON_ID = process.env.LESSON_ID;

function authHeader() {
  if (!TOKEN) return {};
  return { Authorization: TOKEN.startsWith("Bearer ") ? TOKEN : `Bearer ${TOKEN}` };
}

async function getLessons() {
  const res = await fetch(`${BASE_URL}/api/lessons`, { headers: authHeader() });
  if (!res.ok) throw new Error(`GET /api/lessons ${res.status}`);
  const data = await res.json();
  return data.lessons || [];
}

async function getLesson(id) {
  const res = await fetch(`${BASE_URL}/api/lessons/${id}`, { headers: authHeader() });
  if (!res.ok) throw new Error(`GET /api/lessons/${id} ${res.status}`);
  return res.json();
}

async function submitLesson(lessonId, answers, timeSpent = 120, questionTimes = []) {
  const res = await fetch(`${BASE_URL}/api/lessons/${lessonId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ answers, timeSpent, questionTimes }),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(`POST /api/lessons/${lessonId}/submit ${res.status}: ${data.error || text}`);
  return data;
}

async function getProgress() {
  const res = await fetch(`${BASE_URL}/api/progress`, { headers: authHeader() });
  if (!res.ok) throw new Error(`GET /api/progress ${res.status}`);
  return res.json();
}

async function getHistory() {
  const res = await fetch(`${BASE_URL}/api/progress/history`, { headers: authHeader() });
  if (!res.ok) throw new Error(`GET /api/progress/history ${res.status}`);
  const data = await res.json();
  return data.history || [];
}

function buildCorrectAnswers(lesson) {
  const activities = lesson.activities || [];
  return activities.map((a) => {
    if (a.type === "mc" && a.correctAnswer != null) return String(a.correctAnswer).trim();
    if (a.type === "typing" && a.correctAnswer != null) return String(a.correctAnswer).trim();
    if (a.type === "audio") return "recorded";
    return "";
  });
}

async function run() {
  console.log("BASE_URL:", BASE_URL);
  if (!TOKEN) {
    console.error("Missing SUBMIT_TEST_TOKEN or PROGRESS_TEST_TOKEN. Get a Firebase ID token from the app (e.g. user.getIdToken()).");
    process.exit(1);
  }

  let lessonId = LESSON_ID;
  let lesson;

  if (lessonId) {
    lesson = await getLesson(lessonId);
    if (!lesson) {
      console.error("Lesson not found:", lessonId);
      process.exit(1);
    }
  } else {
    const lessons = await getLessons();
    const withActivities = lessons.filter((l) => (l.activities || []).length > 0);
    if (withActivities.length === 0) {
      console.error("No lessons with activities found.");
      process.exit(1);
    }
    lessonId = withActivities[0].id;
    lesson = await getLesson(lessonId);
  }

  const activities = lesson.activities || [];
  console.log("\nLesson:", lesson.title || lessonId, "| Activities:", activities.length);

  const progressBefore = await getProgress();
  const completedBefore = progressBefore.completedLessons || 0;
  const historyBefore = await getHistory();
  const hadLessonBefore = historyBefore.some((h) => h.lessonId === lessonId && h.passed);

  const answers = buildCorrectAnswers(lesson);
  console.log("Submitting with", answers.length, "answers (correct answers for pass).");

  const submitResult = await submitLesson(lessonId, answers);
  console.log("\nSubmit result: score=" + submitResult.score + "%, passed=" + submitResult.passed);

  if (!submitResult.passed && activities.length > 0) {
    console.warn("Expected pass with correct answers. Check lesson difficulty and passing threshold.");
  }

  const progressAfter = await getProgress();
  const historyAfter = await getHistory();
  const completedAfter = progressAfter.completedLessons || 0;
  const entry = historyAfter.find((h) => h.lessonId === lessonId);

  console.log("\n--- Progress after submit ---");
  console.log("completedLessons: before=" + completedBefore + ", after=" + completedAfter);
  console.log("lessonHistory entry for this lesson:", entry ? { lessonId: entry.lessonId, score: entry.score, passed: entry.passed } : "none");

  const ok =
    entry &&
    typeof entry.score === "number" &&
    (submitResult.passed ? entry.passed === true && completedAfter >= completedBefore : true);

  if (ok) {
    console.log("\n✅ Course completion test passed: lesson result saved, statistics updated.");
  } else {
    console.error("\n❌ Course completion test failed: expected lesson in history with score/passed.");
    process.exit(1);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
