import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useAdminData } from "../hooks/useAdminData";
import { fetchUsers, deleteUser } from "../lib/admin-api";

const SECTOR_OPTIONS = ["", "Kacyiru", "Gikondo"];

export default function Users() {
  const [sectorFilter, setSectorFilter] = useState("");
  const [actionError, setActionError] = useState("");
  const { data: usersData, loading, error, reload: load } = useAdminData(
    () => fetchUsers(sectorFilter || undefined).then((r) => r.users),
    [sectorFilter]
  );
  const users = usersData ?? [];

  if (loading && users.length === 0) {
    return (
      <div>
        <h1 className="admin-page-title">Users</h1>
        <div className="admin-loading">
          <div className="admin-spinner" />
          <span style={{ marginLeft: "0.75rem" }}>Loading…</span>
        </div>
      </div>
    );
  }
  if (error && users.length === 0) {
    return (
      <div>
        <div className="admin-page-header">
          <h1 className="admin-page-title">Users</h1>
          <button type="button" onClick={load} className="admin-btn admin-btn-primary">Retry</button>
        </div>
        <div className="admin-alert admin-alert-error">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Users</h1>
          <p className="admin-page-subtitle">Registered app users.</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <label>
            Sector:{" "}
            <select
              className="admin-input"
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              style={{ width: "auto", minWidth: 120 }}
            >
              {SECTOR_OPTIONS.map((s) => (
                <option key={s || "all"} value={s}>{s || "All"}</option>
              ))}
            </select>
          </label>
          <button type="button" onClick={load} disabled={loading} className="admin-btn admin-btn-secondary">
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>
      {error && <div className="admin-alert admin-alert-error">{error}</div>}
      {actionError && <div className="admin-alert admin-alert-error">{actionError}</div>}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>UID</th>
              <th>Display name</th>
              <th>Sector</th>
              <th>Contact</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.uid}>
                <td className="admin-table-mono">{u.uid.slice(0, 8)}…</td>
                <td>{u.displayName ?? u.profile?.name ?? "—"}</td>
                <td>{u.profile?.sector ?? "—"}</td>
                <td>{u.profile?.contact ?? "—"}</td>
                <td>{u.disabled ? "Disabled" : "Active"}</td>
                <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}</td>
                <td>
                  <button
                    type="button"
                    className="admin-btn admin-btn-ghost admin-btn-sm admin-btn-danger"
                    title="Delete account"
                    onClick={() => {
                      if (!confirm(`Delete account for ${u.displayName ?? u.uid}? This removes the user and all their data permanently.`)) return;
                      deleteUser(u.uid)
                        .then(() => { setActionError(""); load(); })
                        .catch((e) => setActionError(e.message));
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <div className="admin-empty">No users yet.</div>}
      </div>
    </div>
  );
}
