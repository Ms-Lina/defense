/**
 * Protects admin routes: require X-Admin-Key to match ADMIN_SECRET.
 * (Set ADMIN_SECRET=123 in .env to use mock login Admin/123.)
 */
function adminAuth(req, res, next) {
  const secret = process.env.ADMIN_SECRET;
  const key = (req.headers["x-admin-key"] || "").trim();
  if (!secret || key !== secret) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

module.exports = { adminAuth };
