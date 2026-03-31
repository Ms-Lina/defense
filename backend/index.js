/**
 * MenyAI Backend
 * Node.js + Express – lesson delivery, progress tracking, optional AI tutoring.
 * Auth & data: Firebase (Authentication + Firestore).
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const { initFirebase, getDb, getAuth, verifyIdToken } = require("./config/firebase");
const lessonsRouter = require("./routes/lessons");
const progressRouter = require("./routes/progress");
const progressEnhancedRouter = require("./routes/progress-enhanced");
const practiceRouter = require("./routes/practice");
const aiRouter = require("./routes/ai");
const authRouter = require("./routes/auth");
const adminRouter = require("./routes/admin");
const assessmentsRouter = require("./routes/assessments");

const app = express();
const PORT = process.env.PORT || 4000;

initFirebase();

app.use(cors({ origin: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    service: "menyai-backend",
    message: "MenyAI API",
    health: "/health",
    docs: "See README for /api/lessons, /api/progress, /api/auth, etc.",
  });
});

app.get("/health", (req, res) => {
  const firebaseOk = !!(getDb() && getAuth());
  res.json({
    status: "ok",
    service: "menyai-backend",
    firebase: firebaseOk,
  });
});

/** Lightweight ping to update lastActivityAt for pilot "active in 90 days" metrics (optional call on app open) */
app.post("/api/ping", async (req, res) => {
  try {
    const decoded = await verifyIdToken(req);
    if (!decoded?.uid) return res.status(401).json({ error: "Unauthorized" });
    const db = getDb();
    if (!db) return res.json({ ok: true });
    const now = new Date().toISOString();
    const uid = decoded.uid;
    await db.collection("users").doc(uid).collection("progress").doc("overall").set({ lastActivityAt: now }, { merge: true });
    await db.collection("userProfiles").doc(uid).set({ lastActivityAt: now }, { merge: true });
    res.json({ ok: true });
  } catch (e) {
    res.status(401).json({ error: "Unauthorized" });
  }
});

app.use("/api/lessons", lessonsRouter);
app.use("/api/progress", progressRouter);
app.use("/api/progress/enhanced", progressEnhancedRouter);
app.use("/api/practice", practiceRouter);
app.use("/api/ai", aiRouter);
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/assessments", assessmentsRouter);

/* Serve admin panel build when present (optional integration) */
const adminDir = path.join(__dirname, "public", "admin");
if (fs.existsSync(adminDir)) {
  app.get("/admin", (req, res) => res.redirect(301, "/admin/"));
  app.use("/admin/", express.static(adminDir));
  app.get("/admin/*", (req, res) => {
    res.sendFile(path.join(adminDir, "index.html"));
  });
}

app.listen(PORT, () => {
  const firebaseOk = !!(getDb() && getAuth());
  console.log(`MenyAI backend running on http://localhost:${PORT}`);
  if (!firebaseOk) {
    console.warn("Firebase not ready – admin/mobile data endpoints will return 503. Check backend/.env (FIREBASE_SERVICE_ACCOUNT_JSON).");
  }
});
