import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setAdminKey, clearAdminKey } from "../lib/api";
import { fetchStats } from "../lib/admin-api";

const MOCK_USERNAME = "Admin";
const MOCK_PASSWORD = "123";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password.trim()) {
      setError("Enter username and password.");
      return;
    }
    const isMock = username.trim() === MOCK_USERNAME && password === MOCK_PASSWORD;
    if (isMock) {
      setAdminKey(MOCK_PASSWORD);
      setLoading(true);
      try {
        await fetchStats();
        navigate("/", { replace: true });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        setError(msg.includes("401") || msg.includes("Unauthorized") ? "Wrong admin key. Set ADMIN_SECRET on the server to match (e.g. 123)." : "Backend not reachable. Check Settings for Backend URL.");
        clearAdminKey();
      } finally {
        setLoading(false);
      }
      return;
    }
    setLoading(true);
    try {
      setAdminKey(password.trim());
      await fetchStats();
      navigate("/", { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setError(msg.includes("401") || msg.includes("Unauthorized") ? "Wrong admin key. The password must match ADMIN_SECRET on the server." : "Invalid credentials.");
      clearAdminKey();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <form onSubmit={submit} className="admin-login-card">
        <h1 className="admin-login-title">MenyAI Admin</h1>
        <p className="admin-login-subtitle">
          Username and password (mock: Admin / 123).
        </p>
        <div className="admin-form-group">
          <input
            type="text"
            className="admin-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            autoComplete="username"
          />
        </div>
        <div className="admin-form-group">
          <input
            type="password"
            className="admin-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
          />
        </div>
        {error && <div className="admin-alert admin-alert-error">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="admin-btn admin-btn-primary"
          style={{ width: "100%" }}
        >
          {loading ? "Checking…" : "Log in"}
        </button>
      </form>
    </div>
  );
}
