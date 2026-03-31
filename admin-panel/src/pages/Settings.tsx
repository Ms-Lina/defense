import { useState, useEffect } from "react";
import { getApiBase, setApiBase } from "../lib/api";

const DEFAULT_DEV = "http://localhost:4000";

export default function Settings() {
  const [apiUrl, setApiUrl] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setApiUrl(getApiBase() || DEFAULT_DEV);
  }, []);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setApiBase(apiUrl.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const clear = () => {
    setApiBase("");
    setApiUrl(DEFAULT_DEV);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <h1 className="admin-page-title">Backend configuration</h1>
      <p className="admin-page-subtitle">Set the API URL for this admin panel.</p>
      <div className="admin-card admin-card-body" style={{ maxWidth: 520 }}>
        <p style={{ margin: "0 0 1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Set the MenyAI backend URL. Leave empty to use the dev proxy (localhost:4000). For production or a remote backend, enter the full URL (e.g. https://menyai-nslw.onrender.com).
        </p>
        <form onSubmit={save}>
          <div className="admin-form-group">
            <label className="admin-form-label">Backend API URL</label>
            <input
              type="url"
              className="admin-input"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder={DEFAULT_DEV}
            />
          </div>
          <div className="admin-form-actions">
            <button type="button" className="admin-btn admin-btn-secondary" onClick={clear}>
              Use dev proxy
            </button>
            <button type="submit" className="admin-btn admin-btn-primary">
              Save
            </button>
          </div>
        </form>
        {saved && (
          <div className="admin-alert admin-alert-success" style={{ marginTop: "1rem" }}>
            Saved. API requests will use this URL.
          </div>
        )}
      </div>
    </div>
  );
}
