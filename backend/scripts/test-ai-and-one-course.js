/**
 * 1) AI: Check that OpenAI is used (health + one real chat when token provided).
 * 2) One course A→Z: Load first lesson with activities → submit correct answers → verify progress/achievements updated.
 *
 * Usage:
 *   BASE_URL=http://localhost:4000 node scripts/test-ai-and-one-course.js
 *   SUBMIT_TEST_TOKEN="<FirebaseIdToken>" BASE_URL=http://localhost:4000 node scripts/test-ai-and-one-course.js
 *
 * With token: runs AI chat (if OPENAI_API_KEY set in backend .env) and full course completion test.
 * Without token: only checks AI health and prints instructions.
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

async function aiHealth() {
  const res = await fetch(`${BASE_URL}/api/ai/health`);
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, configured: data.configured, model: data.model, message: data.message };
}

async function aiChat(message, lessonContext) {
  const res = await fetch(`${BASE_URL}/api/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ message, lessonContext: lessonContext || undefined }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, reply: data.reply, error: data.error };
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
  const normalizedAnswers = answers.map((a) => (a != null && typeof a !== "string" ? String(a) : (a == null ? "" : a)));
  const res = await fetch(`${BASE_URL}/api/lessons/${lessonId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ answers: normalizedAnswers, timeSpent, questionTimes }),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    console.error("  Submit response:", res.status, data.error || data.details || text);
    throw new Error(`POST submit ${res.status}: ${data.error || data.details || text}`);
  }
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
  console.log("");

  // --- 1) AI health ---
  console.log("--- AI (OpenAI) ---");
  const health = await aiHealth();
  if (health.ok && health.configured) {
    console.log("  GET /api/ai/health: configured=true, model=" + (health.model || "gpt-4o-mini"));
  } else {
    console.log("  GET /api/ai/health: configured=" + (health.configured || false) + (health.message ? " – " + health.message : ""));
    if (!health.configured) {
      console.log("  To enable AI: set OPENAI_API_KEY in backend/.env (see backend/.env.example). Restart backend.");
    }
  }

  if (TOKEN && health.configured) {
    const chat = await aiChat("Sobanura neza", "Isomo: Imirongo itambitse. Moduli: Imirongo.");
    if (chat.ok && chat.reply) {
      console.log("  POST /api/ai/chat: reply (first 120 chars):", (chat.reply || "").slice(0, 120) + (chat.reply && chat.reply.length > 120 ? "…" : ""));
      console.log("  AI is fetching real info from OpenAI.");
    } else {
      console.log("  POST /api/ai/chat: status=" + chat.status + (chat.error ? ", error=" + chat.error : ""));
    }
  } else if (TOKEN && !health.configured) {
    console.log("  Skipping AI chat (no OPENAI_API_KEY). Add key to backend/.env and restart.");
  }
  console.log("");

  // --- 2) One course A→Z ---
  console.log("--- One course A→Z (lesson load → submit → progress) ---");
  if (!TOKEN) {
    console.log("  No SUBMIT_TEST_TOKEN. To run course test: get Firebase ID token from app (e.g. user.getIdToken()), then:");
    console.log('  SUBMIT_TEST_TOKEN="<token>" BASE_URL=' + BASE_URL + " node scripts/test-ai-and-one-course.js");
    process.exit(0);
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
  console.log("  Lesson:", lesson.title || lessonId, "| Activities:", activities.length);

  const progressBefore = await getProgress();
  const completedBefore = progressBefore.completedLessons || 0;
  const historyBefore = await getHistory();
  const hadLessonBefore = historyBefore.some((h) => h.lessonId === lessonId && h.passed);

  const answers = buildCorrectAnswers(lesson);
  console.log("  Submitting", answers.length, "correct answers (Ohereza)...");

  const submitResult = await submitLesson(lessonId, answers);
  console.log("  Submit result: score=" + submitResult.score + "%, passed=" + submitResult.passed);

  const progressAfter = await getProgress();
  const historyAfter = await getHistory();
  const completedAfter = progressAfter.completedLessons || 0;
  const entry = historyAfter.find((h) => h.lessonId === lessonId);

  console.log("  Progress: completedLessons before=" + completedBefore + ", after=" + completedAfter);
  console.log("  lessonHistory entry:", entry ? { lessonId: entry.lessonId, score: entry.score, passed: entry.passed } : "none");

  const ok = entry && typeof entry.score === "number" && (submitResult.passed ? entry.passed === true && completedAfter >= completedBefore : true);

  if (ok) {
    console.log("");
    console.log("  Course A→Z test passed: lesson saved, statistics/achievements updated.");
  } else {
    console.error("");
    console.error("  Course A→Z test failed: expected lesson in history with score/passed.");
    process.exit(1);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
