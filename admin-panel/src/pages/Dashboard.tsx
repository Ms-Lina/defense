import { useEffect, useState } from "react";
import { BookOpen, Users, Activity, RefreshCw, MessageCircle, Target, TrendingUp, Flame } from "lucide-react";
import { fetchStats, fetchAnalytics, type Stats, type Analytics } from "../lib/admin-api";

const CARD_ICON_SIZE = 22;

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    setError("");
    Promise.all([
      fetchStats(),
      fetchAnalytics().catch(() => null),
    ])
      .then(([s, a]) => {
        setStats(s);
        setAnalytics(a ?? null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  if (error) {
    return (
      <div>
        <div className="admin-page-header">
          <h1 className="admin-page-title">Dashboard</h1>
          <button type="button" onClick={load} className="admin-btn admin-btn-primary">
            Retry
          </button>
        </div>
        <div className="admin-alert admin-alert-error">{error}</div>
      </div>
    );
  }

  if (loading && !stats) {
    return (
      <div>
        <h1 className="admin-page-title">Dashboard</h1>
        <div className="admin-loading">
          <div className="admin-spinner" />
          <span style={{ marginLeft: "0.75rem" }}>Loading…</span>
        </div>
      </div>
    );
  }

  const primaryCards = [
    { label: "Total lessons", value: stats!.totalLessons, icon: BookOpen, color: "var(--primary)" },
    { label: "Registered users", value: stats!.totalUsers, icon: Users, color: "#1976d2" },
    { label: "Progress records", value: stats!.totalProgressDocs, icon: Activity, color: "#7b1fa2" },
  ];

  const analyticsCards = analytics
    ? [
        { label: "Active learners", value: `${analytics.activeUsers} / ${analytics.totalUsers}`, icon: Users, color: "#2e7d32" },
        { label: "Lessons completed (today)", value: analytics.lessonsCompletedToday, icon: Target, color: "#ed6c02" },
        { label: "Lessons completed (this week)", value: analytics.lessonsCompletedThisWeek, icon: TrendingUp, color: "#0288d1" },
        { label: "AI usage", value: `${analytics.aiUsagePercent}%`, sub: `${analytics.uniqueAIVisitors} learners, ${analytics.totalAIConversations} chats`, icon: MessageCircle, color: "#9c27b0" },
        { label: "Avg progress", value: `${analytics.avgProgressPercent}%`, icon: Activity, color: "#00838f" },
        { label: "Avg streak (days)", value: analytics.avgStreakDays ?? 0, icon: TrendingUp, color: "#388e3c" },
        { label: "Longest streak (days)", value: analytics.maxStreakDays ?? 0, icon: Flame, color: "#f57c00" },
      ]
    : [];

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-subtitle">Overview of learners, lessons, progress, and AI usage.</p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="admin-btn admin-btn-secondary"
        >
          <RefreshCw size={18} className={loading ? "admin-spinner-icon" : ""} />
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      <div className="admin-stat-cards">
        {primaryCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="admin-stat-card admin-stat-card-with-icon">
            <div className="admin-stat-card-icon" style={{ background: `${color}18`, color }}>
              <Icon size={CARD_ICON_SIZE} strokeWidth={2} />
            </div>
            <div className="admin-stat-card-label">{label}</div>
            <div className="admin-stat-card-value">{value}</div>
          </div>
        ))}
      </div>
      {analyticsCards.length > 0 && (
        <>
          <h2 className="admin-section-title">Learning analytics</h2>
          <div className="admin-stat-cards">
            {analyticsCards.map(({ label, value, sub, icon: Icon, color }) => (
              <div key={label} className="admin-stat-card admin-stat-card-with-icon">
                <div className="admin-stat-card-icon" style={{ background: `${color}18`, color }}>
                  <Icon size={CARD_ICON_SIZE} strokeWidth={2} />
                </div>
                <div className="admin-stat-card-label">{label}</div>
                <div className="admin-stat-card-value">{value}</div>
                {sub && <div className="admin-stat-card-sub">{sub}</div>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
