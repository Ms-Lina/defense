/**
 * Auth helpers: reset PIN (forgot password), delete own account.
 * Phone is stored as email: 250XXXXXXXXX@menyai.local
 */
const express = require("express");
const { getAuth, getDb, verifyIdToken } = require("../config/firebase");

const router = express.Router();

function phoneToEmail(phone) {
  const digits = String(phone).replace(/\D/g, "").replace(/^0/, "");
  const normalized = digits.startsWith("250") ? digits : "250" + digits;
  return normalized + "@menyai.local";
}

/**
 * POST /api/auth/reset-pin
 * Body: { phone: string, newPin: string }
 * newPin must be at least 6 characters (Firebase requirement).
 */
router.post("/reset-pin", async (req, res) => {
  const { phone, newPin } = req.body || {};
  if (!phone || typeof newPin !== "string") {
    return res.status(400).json({
      ok: false,
      message: "Shyiramo nimero ya telefoni na PIN nshya.",
    });
  }
  const pin = newPin.trim();
  if (pin.length < 6) {
    return res.status(400).json({
      ok: false,
      message: "PIN nshya: imibare 6 (6 digits).",
    });
  }

  const auth = getAuth();
  if (!auth) {
    return res.status(503).json({
      ok: false,
      message: "Serivisi ntabwo ishoboye. Gerageza nyuma.",
    });
  }

  const email = phoneToEmail(phone);
  try {
    const userRecord = await auth.getUserByEmail(email);
    await auth.updateUser(userRecord.uid, { password: pin });
    return res.json({
      ok: true,
      message: "PIN nshya yashyizwe. Injira ubu.",
    });
  } catch (e) {
    if (e.code === "auth/user-not-found") {
      return res.status(404).json({
        ok: false,
        message: "Nimero ya telefoni ntabwo yanditse. Gerageza cyangwa kwiyandikisha.",
      });
    }
    return res.status(500).json({
      ok: false,
      message: "Byabuze. Gerageza nyuma.",
    });
  }
});

/**
 * POST /api/auth/delete-account
 * Requires Authorization: Bearer <idToken>. Deletes the authenticated user's account and all their data.
 */
router.post("/delete-account", async (req, res) => {
  try {
    const decoded = await verifyIdToken(req);
    const uid = decoded?.uid;
    if (!uid) return res.status(401).json({ ok: false, message: "Unauthorized" });

    const auth = getAuth();
    const db = getDb();
    if (!auth) return res.status(503).json({ ok: false, message: "Service unavailable" });

    if (db) {
      const batch = db.batch();
      batch.delete(db.collection("userProfiles").doc(uid));
      const lessonHistorySnap = await db.collection("users").doc(uid).collection("lessonHistory").get();
      lessonHistorySnap.docs.forEach((d) => batch.delete(d.ref));
      batch.delete(db.collection("users").doc(uid).collection("progress").doc("overall"));
      await batch.commit();
    }
    await auth.deleteUser(uid);
    return res.json({ ok: true, message: "Account deleted" });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message || "Failed to delete account" });
  }
});

module.exports = router;
