import { useState } from "react";
import { useAdminData } from "../hooks/useAdminData";
import { fetchReports } from "../lib/admin-api";

export default function Reports() {
    const { data, loading, error, reload: load } = useAdminData(fetchReports, []);
    const [tab, setTab] = useState<"summary" | "learners" | "lessons">("summary");

    const exportCSV = () => {
        if (!data) return;
        const rows = [
            ["UID", "Completed", "Avg Score", "Badge", "Streak", "Last Active"],
            ...data.learners.map((l) => [
                l.uid, l.completedLessons, l.avgScore ?? "—", l.badge, l.streakDays, l.lastActive ?? "—",
            ]),
        ];
        const csv = rows.map((r) => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `menyai-report-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
    };

    if (loading) {
        return (
            <div>
                <h1 className="admin-page-title">Raporo</h1>
                <div className="admin-loading">
                    <div className="admin-spinner" />
                    <span style={{ marginLeft: "0.75rem" }}>Gutegura raporo...</span>
                </div>
            </div>
        );
    }

    if (error && !data) {
        return (
            <div>
                <div className="admin-page-header">
                    <h1 className="admin-page-title">Raporo</h1>
                    <button type="button" onClick={load} className="admin-btn admin-btn-primary">Ongera Gerageza</button>
                </div>
                <div className="admin-alert admin-alert-error">{error}</div>
            </div>
        );
    }

    const s = data?.summary;

    return (
        <div>
            {/* Header */}
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Report — MenyAI</h1>
                    <p className="admin-page-subtitle">
                        Raporo y'iterambere ry'abanyeshuri — Yakozwe: {data?.generatedAt ? new Date(data.generatedAt).toLocaleString() : "—"}
                    </p>
                </div>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button type="button" onClick={exportCSV} className="admin-btn admin-btn-secondary">Kopi CSV</button>
                    <button type="button" onClick={load} disabled={loading} className="admin-btn admin-btn-secondary">
                        {loading ? "Refreshing…" : "Subiramo"}
                    </button>
                </div>
            </div>

            {error && <div className="admin-alert admin-alert-error" style={{ marginBottom: "1rem" }}>{error}</div>}

            {/* Summary Cards */}
            {s && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
                    {[
                        { label: "Amasomo", value: s.totalLessons, color: "#2D9B5F" },
                        { label: "Abanyeshuri", value: s.totalLearners, color: "#3B82F6" },
                        { label: "Amasomo Yarangiye", value: s.totalCompletions, color: "#10B981" },
                        { label: "Impuzandengo y'amanota", value: s.avgClassScore ? `${s.avgClassScore}%` : "—", color: "#F59E0B" },
                    ].map((c) => (
                        <div key={c.label} style={{ background: "#fff", borderRadius: 12, padding: "1.25rem", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", borderLeft: `4px solid ${c.color}` }}>
                            <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem", color: c.color }}>■</div>
                            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: c.color }}>{c.value}</div>
                            <div style={{ fontSize: "0.8rem", color: "#666" }}>{c.label}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Badge Distribution */}
            {s?.badgeCounts && Object.keys(s.badgeCounts).length > 0 && (
                <div style={{ background: "#fff", borderRadius: 12, padding: "1.25rem", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", marginBottom: "1.5rem" }}>
                    <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>Ibihembo by'Abanyeshuri</h2>
                    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                        {Object.entries(s.badgeCounts).map(([badge, count]) => (
                            <div key={badge} style={{ background: "#F9FAFB", borderRadius: 8, padding: "0.75rem 1rem", textAlign: "center" }}>
                                <div style={{ fontSize: "1.5rem" }}>{badge}</div>
                                <div style={{ fontWeight: 700, fontSize: "1.25rem" }}>{count}</div>
                                <div style={{ fontSize: "0.75rem", color: "#666" }}>abanyeshuri</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", borderBottom: "2px solid #E5E5E5", paddingBottom: "0.5rem" }}>
                {(["summary", "learners", "lessons"] as const).map((t) => (
                    <button
                        key={t}
                        type="button"
                        onClick={() => setTab(t)}
                        style={{
                            padding: "0.5rem 1rem", borderRadius: 8, border: "none", cursor: "pointer",
                            background: tab === t ? "#2D9B5F" : "transparent",
                            color: tab === t ? "#fff" : "#666",
                            fontWeight: tab === t ? 700 : 400,
                            fontSize: "0.875rem",
                        }}
                    >
                        {t === "summary" ? "Incamake" : t === "learners" ? "Abanyeshuri" : "Amasomo"}
                    </button>
                ))}
            </div>

            {/* Learners Table */}
            {tab === "learners" && (
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>UID</th>
                                <th>Amasomo</th>
                                <th>Impuzandengo y'amanota</th>
                                <th>Umudari</th>
                                <th>Streak</th>
                                <th>Igihe Cy'Umujyeho</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(data?.learners ?? []).map((l, i) => (
                                <tr key={l.uid}>
                                    <td>{i + 1}</td>
                                    <td className="admin-table-mono" style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis" }}>{l.uid}</td>
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                            <div style={{ width: 60, height: 6, background: "#E5E5E5", borderRadius: 3, overflow: "hidden" }}>
                                                <div style={{ width: `${Math.round((l.completedLessons / 30) * 100)}%`, height: "100%", background: "#2D9B5F", borderRadius: 3 }} />
                                            </div>
                                            <span style={{ fontSize: "0.8rem" }}>{l.completedLessons}/30</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{
                                            padding: "2px 8px", borderRadius: 12, fontSize: "0.8rem", fontWeight: 700,
                                            background: l.avgScore === null ? "#F5F5F5" : l.avgScore >= 80 ? "#E8F5E9" : l.avgScore >= 60 ? "#FFF3E0" : "#FFEBEE",
                                            color: l.avgScore === null ? "#999" : l.avgScore >= 80 ? "#2D9B5F" : l.avgScore >= 60 ? "#F57C00" : "#E53935",
                                        }}>
                                            {l.avgScore !== null ? `${l.avgScore}%` : "—"}
                                        </span>
                                    </td>
                                    <td>{l.badge}</td>
                                    <td>🔥 {l.streakDays}d</td>
                                    <td style={{ fontSize: "0.8rem", color: "#666" }}>{l.lastActive ? new Date(l.lastActive).toLocaleDateString() : "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {(data?.learners ?? []).length === 0 && <div className="admin-empty">Nta banyeshuri bahari ubu.</div>}
                </div>
            )}

            {/* Lesson Report Table */}
            {tab === "lessons" && (
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Isomo</th>
                                <th>Module</th>
                                <th>Ibigerageza</th>
                                <th>Basutsiye</th>
                                <th>Bagerageje</th>
                                <th>% Basutsiye</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(data?.lessonReport ?? []).map((l) => (
                                <tr key={l.id}>
                                    <td>{l.order ?? "—"}</td>
                                    <td style={{ fontWeight: 600 }}>{l.title}</td>
                                    <td><span style={{ padding: "2px 8px", borderRadius: 12, background: "#E8F5E9", color: "#2D9B5F", fontSize: "0.75rem" }}>{l.module}</span></td>
                                    <td>{l.totalAttempts}</td>
                                    <td style={{ color: "#2D9B5F", fontWeight: 700 }}>{l.passCount}</td>
                                    <td style={{ color: "#E53935" }}>{l.failCount}</td>
                                    <td>
                                        {l.passRate !== null ? (
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                <div style={{ width: 50, height: 6, background: "#E5E5E5", borderRadius: 3, overflow: "hidden" }}>
                                                    <div style={{ width: `${l.passRate}%`, height: "100%", background: l.passRate >= 70 ? "#2D9B5F" : l.passRate >= 50 ? "#F59E0B" : "#E53935", borderRadius: 3 }} />
                                                </div>
                                                <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>{l.passRate}%</span>
                                            </div>
                                        ) : <span style={{ color: "#999" }}>—</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {(data?.lessonReport ?? []).length === 0 && <div className="admin-empty">Nta makuru.</div>}
                </div>
            )}

            {/* Summary tab */}
            {tab === "summary" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div style={{ background: "#fff", borderRadius: 12, padding: "1.25rem", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                        <h3 style={{ marginBottom: "0.75rem", fontWeight: 700 }}>Ikibazo Inshuro Nyinshi Cyananiranye</h3>
                        {(data?.lessonReport ?? [])
                            .filter(l => l.totalAttempts > 0)
                            .sort((a, b) => (a.passRate ?? 0) - (b.passRate ?? 0))
                            .slice(0, 5)
                            .map(l => (
                                <div key={l.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid #F0F0F0" }}>
                                    <span style={{ fontSize: "0.875rem" }}>{l.title}</span>
                                    <span style={{ fontWeight: 700, color: "#E53935", fontSize: "0.875rem" }}>{l.passRate ?? 0}%</span>
                                </div>
                            ))}
                        {(data?.lessonReport ?? []).every(l => l.totalAttempts === 0) && <p style={{ color: "#999", fontSize: "0.875rem" }}>Nta makuru.</p>}
                    </div>
                    <div style={{ background: "#fff", borderRadius: 12, padding: "1.25rem", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                        <h3 style={{ marginBottom: "0.75rem", fontWeight: 700 }}>Abanyeshuri ba mbere 5</h3>
                        {(data?.learners ?? []).slice(0, 5).map((l, i) => (
                            <div key={l.uid} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid #F0F0F0", alignItems: "center" }}>
                                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                    <span style={{ fontWeight: 700, color: ["#FFD700", "#C0C0C0", "#CD7F32", "#666", "#666"][i] }}>{["🥇", "🥈", "🥉", "4.", "5."][i]}</span>
                                    <span style={{ fontSize: "0.8rem", color: "#666" }}>{l.uid.slice(0, 8)}…</span>
                                </div>
                                <span style={{ fontWeight: 700, color: "#2D9B5F" }}>{l.completedLessons}/30</span>
                            </div>
                        ))}
                        {(data?.learners ?? []).length === 0 && <p style={{ color: "#999", fontSize: "0.875rem" }}>Nta makuru.</p>}
                    </div>
                </div>
            )}
        </div>
    );
}
