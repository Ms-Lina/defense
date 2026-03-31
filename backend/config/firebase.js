/**
 * Firebase Admin SDK – used for Firestore and Auth verification.
 * Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_JSON in .env.
 */
const path = require("path");
const fs = require("fs");
const admin = require("firebase-admin");

let db = null;
let auth = null;

function initFirebase() {
  if (admin.apps.length > 0) {
    db = admin.firestore();
    auth = admin.auth();
    return { db, auth };
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  let serviceAccount = undefined;
  if (raw && raw.trim()) {
    try {
      serviceAccount = JSON.parse(raw);
    } catch (e) {
      console.error("Invalid FIREBASE_SERVICE_ACCOUNT_JSON (JSON parse failed):", e.message);
      return { db: null, auth: null };
    }
    if (serviceAccount && serviceAccount.type !== "service_account") {
      console.error("FIREBASE_SERVICE_ACCOUNT_JSON is not a service account (missing type: service_account).");
      return { db: null, auth: null };
    }
  }
  if (!serviceAccount && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const keyPath = path.isAbsolute(process.env.GOOGLE_APPLICATION_CREDENTIALS)
      ? process.env.GOOGLE_APPLICATION_CREDENTIALS
      : path.join(__dirname, "..", process.env.GOOGLE_APPLICATION_CREDENTIALS);
    if (fs.existsSync(keyPath)) {
      try {
        serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));
      } catch (e) {
        console.error("Failed to read GOOGLE_APPLICATION_CREDENTIALS file:", e.message);
        return { db: null, auth: null };
      }
    } else {
      console.error("GOOGLE_APPLICATION_CREDENTIALS file not found:", keyPath);
      return { db: null, auth: null };
    }
  }
  if (!serviceAccount) {
    console.warn("Firebase not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS.");
    return { db: null, auth: null };
  }

  try {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    db = admin.firestore();
    auth = admin.auth();
    console.log("Firebase initialized (project_id: " + (serviceAccount?.project_id || "default") + ")");
    return { db, auth };
  } catch (e) {
    console.error("Firebase initializeApp failed:", e.message);
    return { db: null, auth: null };
  }
}

function getDb() {
  if (!db) initFirebase();
  return db;
}

function getAuth() {
  if (!auth) initFirebase();
  return auth;
}

/** Verify Firebase ID token from Authorization header; returns decoded token or null. */
async function verifyIdToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const idToken = authHeader.split("Bearer ")[1];
  if (!idToken) return null;
  try {
    const a = getAuth();
    if (!a) return null;
    return await a.verifyIdToken(idToken);
  } catch {
    return null;
  }
}

module.exports = { initFirebase, getDb, getAuth, verifyIdToken };
