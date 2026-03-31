/**
 * AI tutoring API – uses OpenAI to support students with real answers from the platform.
 * Requires OPENAI_API_KEY in env. Logs each chat to Firestore for admin monitoring.
 */
const express = require("express");
const OpenAI = require("openai");
const admin = require("firebase-admin");
const { verifyIdToken, getDb } = require("../config/firebase");

const router = express.Router();
const lastAiRequestByUid = new Map();

function getOpenAI() {
  const key = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim();
  return key ? new OpenAI({ apiKey: key }) : null;
}

const SYSTEM_PROMPT = `You are MenyAI Umufasha, a reliable tutor for the MenyAI literacy app (Kinyarwanda reading and writing).

Rules:
- Reply only in Kinyarwanda. Use simple, correct Kinyarwanda suitable for literacy learners.
- Give accurate, helpful solutions using real information: step-by-step when explaining, correct spellings and grammar, and concrete examples (e.g. letters, numbers, simple words from the lesson).
- When lesson context is provided, use it to give answers that match the app content. Reference the lesson title, module, and activities. Do not invent content that is not in the context.
- If you are not sure, say so briefly and suggest they try the lesson or ask again. Do not guess or make up facts.
- Keep replies short and clear (a few sentences). Encourage the learner.`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorStatus(err) {
  return err?.status || err?.response?.status || 0;
}

function getModelSequence() {
  const primary = (process.env.OPENAI_MODEL || "gpt-4o-mini").trim();
  const fallbacks = (process.env.OPENAI_MODEL_FALLBACKS || "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  return Array.from(new Set([primary, ...fallbacks]));
}

function getMinRequestIntervalMs() {
  return Math.max(0, Number(process.env.AI_MIN_REQUEST_INTERVAL_MS || 4000));
}

function checkUserCooldown(uid) {
  const now = Date.now();
  const minMs = getMinRequestIntervalMs();
  if (minMs <= 0) return { allowed: true, retryAfterMs: 0 };
  const prev = Number(lastAiRequestByUid.get(uid) || 0);
  const delta = now - prev;
  if (prev > 0 && delta < minMs) {
    return { allowed: false, retryAfterMs: minMs - delta };
  }
  lastAiRequestByUid.set(uid, now);
  return { allowed: true, retryAfterMs: 0 };
}

async function createChatCompletionWithResilience(openai, messages) {
  const models = getModelSequence();
  const maxRetries = Math.max(0, Number(process.env.OPENAI_MAX_RETRIES || 3));
  const baseDelayMs = Math.max(200, Number(process.env.OPENAI_RETRY_BASE_MS || 1000));
  const maxTokens = Math.max(120, Number(process.env.OPENAI_MAX_TOKENS || 500));

  let lastError = null;
  for (const model of models) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const completion = await openai.chat.completions.create({
          model,
          messages,
          max_tokens: maxTokens,
        });
        return { completion, modelUsed: model, attempts: attempt + 1 };
      } catch (err) {
        lastError = err;
        const status = getErrorStatus(err);
        const retryable = status === 429 || status >= 500 || status === 0;
        const hasMoreAttempts = attempt < maxRetries;
        if (!retryable || !hasMoreAttempts) break;
        const jitter = Math.floor(Math.random() * 250);
        const delayMs = Math.min(baseDelayMs * (2 ** attempt) + jitter, 8000);
        await sleep(delayMs);
      }
    }
  }
  throw lastError || new Error("OpenAI request failed");
}

/** GET /api/ai/health – whether AI is configured (OPENAI_API_KEY set). No auth required. */
router.get("/health", (req, res) => {
  const configured = !!getOpenAI();
  if (!configured) {
    return res.status(503).json({ configured: false, message: "AI not configured (OPENAI_API_KEY)" });
  }
  res.json({ configured: true, model: process.env.OPENAI_MODEL || "gpt-4o-mini" });
});

async function logAiChat(db, payload) {
  if (!db) return;
  try {
    const now = new Date();
    const createdAt = admin.firestore && admin.firestore.Timestamp
      ? admin.firestore.Timestamp.fromDate(now)
      : now.toISOString();
    await db.collection("aiChatLogs").add({
      ...payload,
      createdAt,
    });
  } catch (logErr) {
    console.error("AI log write failed:", logErr.message);
  }
}

router.post("/chat", async (req, res) => {
  let decoded;
  try {
    decoded = await verifyIdToken(req);
    if (!decoded?.uid) return res.status(401).json({ error: "Unauthorized" });

    const { message, lessonContext } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message required" });
    }

    const uid = decoded.uid;
    const db = getDb();
    const openai = getOpenAI();
    const cooldown = checkUserCooldown(uid);
    if (!cooldown.allowed) {
      const retryAfterSec = Math.max(1, Math.ceil(cooldown.retryAfterMs / 1000));
      return res.status(429).json({
        error: `Wategereza gato (amasegonda ${retryAfterSec}) mbere yo kongera kubaza.`,
        code: "TOO_MANY_REQUESTS_LOCAL",
        retryAfterSec,
      });
    }

    if (!openai) {
      await logAiChat(db, {
        uid,
        sessionId: `${uid}_${new Date().toISOString().slice(0, 10)}`,
        message: String(message).slice(0, 2000),
        reply: null,
        error: true,
        errorCode: "OPENAI_NOT_CONFIGURED",
      });
      return res.status(503).json({ error: "AI service not configured", code: "OPENAI_NOT_CONFIGURED" });
    }

    const contextStr = typeof lessonContext === "string" ? lessonContext.slice(0, 2000) : "";
    const userContent = contextStr
      ? `[Lesson context – use this to give accurate, curriculum-aligned help:\n${contextStr}]\n\nUser question: ${message}`
      : message;

    const { completion, modelUsed } = await createChatCompletionWithResilience(openai, [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ]);

    const reply = completion.choices[0]?.message?.content ?? "Ntabwo nashoboye gusubiza ubu.";

    await logAiChat(db, {
      uid,
      sessionId: `${uid}_${new Date().toISOString().slice(0, 10)}`,
      message: String(message).slice(0, 2000),
      reply: String(reply).slice(0, 2000),
      lessonContext: contextStr ? contextStr.slice(0, 1000) : null,
      modelUsed,
    });

    res.json({ reply, model: modelUsed });
  } catch (e) {
    const msg = e.message || String(e);
    console.error("AI chat error:", msg);
    const uid = decoded?.uid;
    const db = getDb();
    if (uid && db) {
      const body = req.body || {};
      await logAiChat(db, {
        uid,
        sessionId: `${uid}_${new Date().toISOString().slice(0, 10)}`,
        message: String(body.message || "").slice(0, 2000),
        reply: null,
        error: true,
        errorCode: getErrorStatus(e) === 429 ? "RATE_LIMIT" : "AI_ERROR",
        errorMessage: msg.slice(0, 500),
      });
    }
    if (getErrorStatus(e) === 401) {
      return res.status(500).json({ error: "OpenAI API key invalid or unauthorized", code: "AUTH_ERROR" });
    }
    if (getErrorStatus(e) === 429) {
      return res.status(503).json({ error: "AI busy. Gerageza nyuma.", code: "RATE_LIMIT" });
    }
    res.status(500).json({ error: "AI request failed", code: "AI_ERROR", details: msg.slice(0, 100) });
  }
});

module.exports = router;
