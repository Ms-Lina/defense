import { useEffect, useState } from "react";
import {
  BookOpen,
  Users,
  TrendingUp,
  Target,
  Award,
  BarChart3,
  RefreshCw,
  Activity,
  BookMarked,
  Flame,
} from "lucide-react";
import { fetchStats, fetchLessons, fetchProgress, type Stats, type Lesson, type Progress as ProgressType } from "../lib/admin-api";

type AnalyticsData = {
  stats: Stats | null;
  lessons: Lesson[];
  progress: ProgressType[];
  loading: boolean;
  error: string;
};

const iconSize = 20;
const cardIconSize = 24;

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData>({
    stats: null,
    lessons: [],
    progress: [],
    loading: true,
    error: "",
  });

  const load = async () => {
    setData((d) => ({ ...d, loading: true, error: "" }));
    try {
      const [stats, lessonsRes, progressRes] = await Promise.all([
        fetchStats(),
        fetchLessons().catch(() => ({ lessons: [] })),
        fetchProgress().catch(() => ({ progress: [] })),
      ]);
      setData({
        stats,
        lessons: lessonsRes.lessons,
        progress: progressRes.progress,
        loading: false,
        error: "",
      });
    } catch (e) {
      setData((d) => ({
        ...d,
        loading: false,
        error: e instanceof Error ? e.message : "Failed to load",
      }));
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (data.loading && !data.stats) {
    return (
      <div>
        <h1 className="admin-page-title">Advanced Analytics</h1>
        <div className="admin-loading">
          <RefreshCw size={24} className="admin-spinner-icon" />
          <span style={{ marginLeft: "0.75rem" }}>Loading analytics…</span>
        </div>
      </div>
    );
  }

  if (data.error && !data.stats) {
    return (
      <div>
        <div className="admin-page-header">
          <h1 className="admin-page-title">Advanced Analytics</h1>
          <button type="button" onClick={load} className="admin-btn admin-btn-primary">
            Retry
          </button>
        </div>
        <div className="admin-alert admin-alert-error">{data.error}</div>
      </div>
    );
  }

  const stats = data.stats!;
  const progress = data.progress;
  const lessons = data.lessons;

  const totalCompletions = progress.reduce((s, p) => s + (p.completedLessons ?? 0), 0);
  const avgLessonsPerUser =
    progress.length > 0 ? (totalCompletions / progress.length).toFixed(1) : "0";
  const maxStreak = progress.length
    ? Math.max(...progress.map((p) => p.streakDays ?? 0), 0)
    : 0;
  const avgStreak =
    progress.length > 0
      ? (
          progress.reduce((s, p) => s + (p.streakDays ?? 0), 0) / progress.length
        ).toFixed(1)
      : "0";
  const lessonsByLevel = lessons.reduce<Record<string, number>>((acc, l) => {
    const level = l.level || "—";
    acc[level] = (acc[level] ?? 0) + 1;
    return acc;
  }, {});

  const overviewCards = [
    { label: "Total lessons", value: stats.totalLessons, icon: BookOpen, color: "var(--primary)" },
    { label: "Registered users", value: stats.totalUsers, icon: Users, color: "#1976d2" },
    {
      label: "Progress records",
      value: stats.totalProgressDocs,
      icon: Activity,
      color: "#7b1fa2",
    },
  ];

  const engagementCards = [
    {
      label: "Total lesson completions",
      value: totalCompletions,
      icon: BookMarked,
      color: "var(--primary)",
    },
    {
      label: "Avg lessons per user",
      value: avgLessonsPerUser,
      icon: BarChart3,
      color: "#0288d1",
    },
    { label: "Avg streak (days)", value: avgStreak, icon: TrendingUp, color: "#388e3c" },
    { label: "Longest streak (days)", value: maxStreak, icon: Flame, color: "#f57c00" },
  ];

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Advanced Analytics</h1>
          <p className="admin-page-subtitle">Engagement and content metrics.</p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={data.loading}
          className="admin-btn admin-btn-secondary"
        >
          <RefreshCw size={iconSize} className={data.loading ? "admin-spinner-icon" : ""} />
          {data.loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      {data.error && <div className="admin-alert admin-alert-error">{data.error}</div>}

      <section className="admin-analytics-section">
        <h2 className="admin-analytics-heading">
          <Target size={20} />
          Overview
        </h2>
        <div className="admin-stat-cards">
          {overviewCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="admin-stat-card admin-stat-card-with-icon">
              <div className="admin-stat-card-icon" style={{ background: `${color}18`, color }}>
                <Icon size={cardIconSize} strokeWidth={2} />
              </div>
              <div className="admin-stat-card-label">{label}</div>
              <div className="admin-stat-card-value">{value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-analytics-section">
        <h2 className="admin-analytics-heading">
          <TrendingUp size={20} />
          Engagement
        </h2>
        <div className="admin-stat-cards">
          {engagementCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="admin-stat-card admin-stat-card-with-icon">
              <div className="admin-stat-card-icon" style={{ background: `${color}18`, color }}>
                <Icon size={cardIconSize} strokeWidth={2} />
              </div>
              <div className="admin-stat-card-label">{label}</div>
              <div className="admin-stat-card-value">{value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-analytics-section">
        <h2 className="admin-analytics-heading">
          <Award size={20} />
          Content by level
        </h2>
        <div className="admin-card admin-card-body" style={{ maxWidth: 400 }}>
          {Object.keys(lessonsByLevel).length === 0 ? (
            <p className="admin-empty" style={{ margin: 0 }}>No lessons yet.</p>
          ) : (
            <ul className="admin-analytics-list">
              {Object.entries(lessonsByLevel)
                .sort(([a], [b]) => String(a).localeCompare(String(b)))
                .map(([level, count]) => (
                  <li key={level} className="admin-analytics-list-item">
                    <span>Level {level}</span>
                    <span className="admin-analytics-list-value">{count} lessons</span>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
