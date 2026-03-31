import { useEffect, useState } from "react";
import { MessageCircle, Users, Activity, RefreshCw } from "lucide-react";
import { fetchAIStats, fetchAILogs, type AILog, type AIStats } from "../lib/admin-api";

export default function AIMonitoring() {
  const [stats, setStats] = useState<AIStats | null>(null);
  const [logs, setLogs] = useState<AILog[]>([]);
  const [nextAfter, setNextAfter] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"stats" | "logs">("stats");

  const loadStats = () => {
    setLoading(true);
    setError("");
    fetchAIStats()
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  const loadLogs = (after?: string) => {
    if (!after) setLogsLoading(true);
    fetchAILogs({ limit: 30, after })
      .then((r) => {
        if (after) setLogs((prev) => [...prev, ...r.logs]);
        else setLogs(r.logs);
        setNextAfter(r.nextAfter);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLogsLoading(false));
  };

  useEffect(() => {
    loadStats();
  }, []);
  useEffect(() => {
    if (activeTab === "logs") loadLogs();
  }, [activeTab]);

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">AI interaction monitoring</h1>
          <p className="admin-page-subtitle">Usage statistics and conversation logs (Kinyarwanda).</p>
        </div>
        <button
          type="button"
          onClick={() => (activeTab === "stats" ? loadStats() : loadLogs())}
          disabled={activeTab === "stats" ? loading : logsLoading}
          className="admin-btn admin-btn-secondary"
        >
          <RefreshCw size={18} className={loading || logsLoading ? "admin-spinner-icon" : ""} />
          Refresh
        </button>
      </div>
      {error && <div className="admin-alert admin-alert-error">{error}</div>}
      <div className="admin-tabs" style={{ marginBottom: "1rem" }}>
        <button
          type="button"
          className={"admin-btn admin-btn-secondary " + (activeTab === "stats" ? "active" : "")}
          onClick={() => setActiveTab("stats")}
        >
          Usage statistics
        </button>
        <button
          type="button"
          className={"admin-btn admin-btn-secondary " + (activeTab === "logs" ? "active" : "")}
          onClick={() => setActiveTab("logs")}
        >
          Conversation logs
        </button>
      </div>

      {activeTab === "stats" && (
        <>
          {loading && !stats ? (
            <div className="admin-loading"><div className="admin-spinner" /> Loading…</div>
          ) : stats ? (
            <div className="admin-stat-cards" style={{ marginBottom: "1.5rem" }}>
              <div className="admin-stat-card admin-stat-card-with-icon">
                <div className="admin-stat-card-icon" style={{ background: "#9c27b018", color: "#9c27b0" }}>
                  <Users size={22} strokeWidth={2} />
                </div>
                <div className="admin-stat-card-label">Learners using AI</div>
                <div className="admin-stat-card-value">{stats.learnersUsingAI}</div>
              </div>
              <div className="admin-stat-card admin-stat-card-with-icon">
                <div className="admin-stat-card-icon" style={{ background: "#1976d218", color: "#1976d2" }}>
                  <Activity size={22} strokeWidth={2} />
                </div>
                <div className="admin-stat-card-label">Learning independently</div>
                <div className="admin-stat-card-value">{stats.learnersIndependent}</div>
              </div>
              <div className="admin-stat-card admin-stat-card-with-icon">
                <div className="admin-stat-card-icon" style={{ background: "#2e7d3218", color: "#2e7d32" }}>
                  <MessageCircle size={22} strokeWidth={2} />
                </div>
                <div className="admin-stat-card-label">Total AI activations</div>
                <div className="admin-stat-card-value">{stats.totalActivations}</div>
              </div>
              <div className="admin-stat-card admin-stat-card-with-icon">
                <div className="admin-stat-card-icon" style={{ background: "#ed6c0218", color: "#ed6c02" }}>
                  <Activity size={22} strokeWidth={2} />
                </div>
                <div className="admin-stat-card-label">Avg conversation length (chars)</div>
                <div className="admin-stat-card-value">{stats.avgConversationLength}</div>
              </div>
            </div>
          ) : null}
          {stats && stats.topUsersByAIActivations.length > 0 && (
            <>
              <h2 className="admin-section-title">Top users by AI activations</h2>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th style={{ textAlign: "right" }}>AI chats</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topUsersByAIActivations.map(({ uid, count }) => (
                      <tr key={uid}>
                        <td className="admin-table-mono">{uid}</td>
                        <td style={{ textAlign: "right" }}>{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {activeTab === "logs" && (
        <>
          {logsLoading && logs.length === 0 ? (
            <div className="admin-loading"><div className="admin-spinner" /> Loading logs…</div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>User ID</th>
                    <th>User message</th>
                    <th>AI reply</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="admin-table-mono" style={{ whiteSpace: "nowrap" }}>{log.createdAt ? new Date(log.createdAt).toLocaleString() : "—"}</td>
                      <td className="admin-table-mono">{log.uid}</td>
                      <td style={{ maxWidth: 280 }}>{log.message || "—"}</td>
                      <td style={{ maxWidth: 280 }}>{log.reply || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {logs.length === 0 && <div className="admin-empty">No AI conversations yet.</div>}
              {nextAfter && (
                <button type="button" className="admin-btn admin-btn-secondary" style={{ marginTop: "0.75rem" }} onClick={() => loadLogs(nextAfter)} disabled={logsLoading}>
                  Load more
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
