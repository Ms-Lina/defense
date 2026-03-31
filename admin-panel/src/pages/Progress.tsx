import { useAdminData } from "../hooks/useAdminData";
import { fetchProgress } from "../lib/admin-api";

export default function Progress() {
  const { data: progressList, loading, error, reload: load } = useAdminData(
    async () => {
      const r = await fetchProgress();
      return r.progress;
    },
    []
  );
  const progress = progressList ?? [];

  if (loading && progress.length === 0) {
    return (
      <div>
        <h1 className="admin-page-title">Progress</h1>
        <div className="admin-loading">
          <div className="admin-spinner" />
          <span style={{ marginLeft: "0.75rem" }}>Loading…</span>
        </div>
      </div>
    );
  }
  if (error && progress.length === 0) {
    return (
      <div>
        <div className="admin-page-header">
          <h1 className="admin-page-title">Progress</h1>
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
          <h1 className="admin-page-title">Progress</h1>
          <p className="admin-page-subtitle">Learner progress by user.</p>
        </div>
        <button type="button" onClick={load} disabled={loading} className="admin-btn admin-btn-secondary">
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      {error && <div className="admin-alert admin-alert-error">{error}</div>}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Completed lessons</th>
              <th>Streak (days)</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {progress.map((p) => (
              <tr key={p.uid}>
                <td>{p.displayName ?? p.uid}</td>
                <td>{p.completedLessons ?? "—"}</td>
                <td>{p.streakDays ?? "—"}</td>
                <td>{p.updatedAt ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {progress.length === 0 && <div className="admin-empty">No progress records yet.</div>}
      </div>
    </div>
  );
}
