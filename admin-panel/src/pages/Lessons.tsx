import { useEffect, useState } from "react";
import { fetchLessons, createLesson, updateLesson, deleteLesson as deleteLessonApi, type Lesson } from "../lib/admin-api";
import { Search, Download, Trash2, Edit, Plus, Eye, EyeOff, Copy, ListOrdered, Type } from "lucide-react";

export default function Lessons() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [filteredLessons, setFilteredLessons] = useState<Lesson[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add" | Lesson | null>(null);
  const [selectedLessons, setSelectedLessons] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "enabled" | "disabled">("all");
  const [form, setForm] = useState({ 
    title: "", 
    duration: "", 
    level: "", 
    order: 0, 
    description: "", 
    difficulty: "", 
    enabled: true, 
    videoUrl: "", 
    activities: [] as any[],
    type: "lesson"
  });

  const load = () => {
    setLoading(true);
    fetchLessons()
      .then((r) => {
        setLessons(r.lessons);
        setFilteredLessons(r.lessons);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  useEffect(() => {
    let filtered = lessons;
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(lesson => 
        lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lesson as any).description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Level filter
    if (filterLevel) {
      filtered = filtered.filter(lesson => lesson.level === filterLevel);
    }
    
    // Status filter
    if (filterStatus === "enabled") {
      filtered = filtered.filter(lesson => (lesson as any).enabled !== false);
    } else if (filterStatus === "disabled") {
      filtered = filtered.filter(lesson => (lesson as any).enabled === false);
    }
    
    setFilteredLessons(filtered);
  }, [lessons, searchTerm, filterLevel, filterStatus]);

  const openAdd = () => {
    setForm({ 
      title: "", 
      duration: "", 
      level: "", 
      order: lessons.length, 
      description: "", 
      difficulty: "", 
      enabled: true, 
      videoUrl: "", 
      activities: [],
      type: "lesson"
    });
    setModal("add");
  };

  const openEdit = (l: Lesson) => {
    setForm({
      title: l.title,
      duration: l.duration ?? "",
      level: l.level ?? "",
      order: l.order ?? 0,
      description: (l as { description?: string }).description ?? "",
      difficulty: (l as { difficulty?: string }).difficulty ?? "",
      enabled: (l as { enabled?: boolean }).enabled !== false,
      videoUrl: (l as any).videoUrl ?? "",
      activities: (l as any).activities ?? [],
      type: (l as any).type ?? "lesson"
    });
    setModal(l);
  };

  const closeModal = () => setModal(null);

  const toggleSelection = (lessonId: string) => {
    setSelectedLessons(prev => 
      prev.includes(lessonId) 
        ? prev.filter(id => id !== lessonId)
        : [...prev, lessonId]
    );
  };

  const selectAll = () => {
    setSelectedLessons(filteredLessons.map(l => l.id));
  };

  const clearSelection = () => {
    setSelectedLessons([]);
  };

  const bulkDelete = async () => {
    if (!confirm(`Delete ${selectedLessons.length} lessons? This cannot be undone.`)) return;
    
    try {
      await Promise.all(
        selectedLessons.map((id) => deleteLessonApi(id))
      );
      setSelectedLessons([]);
      load();
    } catch (e) {
      setError("Failed to delete lessons");
    }
  };

  const bulkToggleStatus = async (enabled: boolean) => {
    try {
      await Promise.all(
        selectedLessons.map((id) => updateLesson(id, { enabled }))
      );
      setSelectedLessons([]);
      load();
    } catch (e) {
      setError("Failed to update lessons");
    }
  };

  const duplicateLesson = async (lesson: Lesson) => {
    try {
      const newLesson = {
        ...lesson,
        title: `${lesson.title} (Copy)`,
        order: lessons.length
      };
      delete (newLesson as any).id;
      await createLesson(newLesson);
      load();
    } catch (e) {
      setError("Failed to duplicate lesson");
    }
  };

  const exportLessons = () => {
    const data = JSON.stringify(filteredLessons, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lessons-export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    try {
      await createLesson({
        title: form.title.trim(),
        duration: form.duration.trim() || undefined,
        level: form.level.trim() || undefined,
        order: form.order,
        description: form.description.trim() || undefined,
        difficulty: form.difficulty.trim() || undefined,
        enabled: form.enabled,
        videoUrl: form.videoUrl.trim() || undefined,
        activities: form.activities,
        type: form.type,
      });
      closeModal();
      load();
    } catch (e) {
      setError("Failed to create lesson");
    }
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof modal !== "object" || modal === null || !form.title.trim()) return;
    const lessonId = modal.id;
    try {
      await updateLesson(lessonId, {
        title: form.title.trim(),
        duration: form.duration.trim() || undefined,
        level: form.level.trim() || undefined,
        order: form.order,
        description: form.description.trim() || undefined,
        difficulty: form.difficulty.trim() || undefined,
        enabled: form.enabled,
        videoUrl: form.videoUrl.trim() || undefined,
        activities: form.activities,
      });
      closeModal();
      load();
    } catch (e) {
      setError("Failed to update lesson");
    }
  };

  const deleteLesson = async (id: string) => {
    if (!confirm("Delete this lesson?")) return;
    try {
      await deleteLessonApi(id);
      load();
    } catch (e) {
      setError("Failed to delete lesson");
    }
  };

  if (error && lessons.length === 0) {
    return (
      <div>
        <div className="admin-page-header">
          <h1 className="admin-page-title">Lessons</h1>
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
          <h1 className="admin-page-title">Lessons</h1>
          <p className="admin-page-subtitle">Manage course content, activities, and lesson structure.</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={exportLessons} className="admin-btn admin-btn-secondary">
            <Download size={16} />
            Export
          </button>
          <button onClick={openAdd} className="admin-btn admin-btn-primary">
            <Plus size={16} />
            Add Lesson
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{ 
        display: "flex", 
        gap: "1rem", 
        marginBottom: "1.5rem",
        flexWrap: "wrap",
        alignItems: "center"
      }}>
        <div style={{ flex: 1, minWidth: "200px", position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: "0.75rem", top: "0.75rem", color: "#6b7280" }} />
          <input
            type="text"
            placeholder="Search lessons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-input"
            style={{ paddingLeft: "2.5rem" }}
          />
        </div>
        
        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
          className="admin-select"
          style={{ minWidth: "120px" }}
        >
          <option value="">All Levels</option>
          <option value="1">Level 1</option>
          <option value="2">Level 2</option>
          <option value="3">Level 3</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="admin-select"
          style={{ minWidth: "120px" }}
        >
          <option value="all">All Status</option>
          <option value="enabled">Enabled</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

      {/* Bulk Actions */}
      {selectedLessons.length > 0 && (
        <div style={{
          backgroundColor: "#f3f4f6",
          border: "1px solid #d1d5db",
          borderRadius: "0.5rem",
          padding: "0.75rem",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem"
        }}>
          <span style={{ fontSize: "0.875rem", fontWeight: "500" }}>
            {selectedLessons.length} lesson{selectedLessons.length !== 1 ? "s" : ""} selected
          </span>
          <button onClick={clearSelection} className="admin-btn admin-btn-secondary">
            Clear
          </button>
          <button onClick={() => bulkToggleStatus(true)} className="admin-btn admin-btn-secondary">
            <Eye size={16} />
            Enable
          </button>
          <button onClick={() => bulkToggleStatus(false)} className="admin-btn admin-btn-secondary">
            <EyeOff size={16} />
            Disable
          </button>
          <button onClick={bulkDelete} className="admin-btn admin-btn-danger">
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      )}

      {error && <div className="admin-alert admin-alert-error">{error}</div>}

      {loading ? (
        <div className="admin-loading">
          <div className="admin-spinner" />
          <span style={{ marginLeft: "0.75rem" }}>Loading lessons…</span>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: "1rem", fontSize: "0.875rem", color: "#6b7280" }}>
            Showing {filteredLessons.length} of {lessons.length} lessons
            {selectedLessons.length > 0 && ` (${selectedLessons.length} selected)`}
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: "40px" }}>
                    <input
                      type="checkbox"
                      checked={selectedLessons.length === filteredLessons.length && filteredLessons.length > 0}
                      onChange={() => selectedLessons.length === filteredLessons.length ? clearSelection() : selectAll()}
                    />
                  </th>
                  <th>Title</th>
                  <th>Level</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Order</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLessons.map((lesson) => (
                  <tr key={lesson.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedLessons.includes(lesson.id)}
                        onChange={() => toggleSelection(lesson.id)}
                      />
                    </td>
                    <td>
                      <div>
                        <div style={{ fontWeight: "500" }}>{lesson.title}</div>
                        {(lesson as any).description && (
                          <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>
                            {(lesson as any).description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>{lesson.level || "-"}</td>
                    <td>{(lesson as any).duration || "-"}</td>
                    <td>
                      <span
                        className={`admin-badge admin-badge-${
                          (lesson as any).enabled !== false ? "success" : "secondary"
                        }`}
                      >
                        {(lesson as any).enabled !== false ? "Enabled" : "Disabled"}
                      </span>
                    </td>
                    <td>{lesson.order ?? 0}</td>
                    <td>
                      <div style={{ display: "flex", gap: "0.25rem" }}>
                        <button
                          onClick={() => openEdit(lesson)}
                          className="admin-btn admin-btn-ghost admin-btn-sm"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => duplicateLesson(lesson)}
                          className="admin-btn admin-btn-ghost admin-btn-sm"
                          title="Duplicate"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={() => deleteLesson(lesson.id)}
                          className="admin-btn admin-btn-ghost admin-btn-sm admin-btn-danger"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Add/Edit Modal */}
      {modal && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal admin-modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">
                {modal === "add" ? "Add New Lesson" : "Edit Lesson"}
              </h2>
              <button onClick={closeModal} className="admin-btn admin-btn-ghost">
                ×
              </button>
            </div>
            <form onSubmit={modal === "add" ? saveAdd : saveEdit} className="admin-modal-body">
              <div className="admin-form-group">
                <label className="admin-form-label">Title *</label>
                <input
                  type="text"
                  className="admin-input"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">Level</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={form.level}
                    onChange={(e) => setForm({ ...form, level: e.target.value })}
                    placeholder="1, 2, 3"
                  />
                </div>
                
                <div className="admin-form-group">
                  <label className="admin-form-label">Duration</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    placeholder="15 min"
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Description</label>
                <textarea
                  className="admin-input"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="Lesson description..."
                />
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">Order</label>
                  <input
                    type="number"
                    className="admin-input"
                    value={form.order}
                    onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                  />
                </div>
                
                <div className="admin-form-group">
                  <label className="admin-form-label">Difficulty</label>
                  <select
                    className="admin-select"
                    value={form.difficulty}
                    onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                  >
                    <option value="">Select...</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Video URL</label>
                <input
                  type="url"
                  className="admin-input"
                  value={form.videoUrl}
                  onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.enabled}
                    onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                  />
                  Enabled
                </label>
              </div>

              {/* Activities / Assignments – Multiple Choice & Typing */}
              <div className="admin-form-group" style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #e5e7eb" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                  <label className="admin-form-label" style={{ marginBottom: 0 }}>Activities (assignments)</label>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      type="button"
                      className="admin-btn admin-btn-secondary admin-btn-sm"
                      onClick={() => setForm({ ...form, activities: [...form.activities, { id: `a${form.activities.length + 1}`, type: "mc", question: "", options: ["", "", "", ""], correctAnswer: "" }] })}
                    >
                      <ListOrdered size={14} /> Add Multiple Choice
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn-secondary admin-btn-sm"
                      onClick={() => setForm({ ...form, activities: [...form.activities, { id: `a${form.activities.length + 1}`, type: "typing", prompt: "", correctAnswer: "" }] })}
                    >
                      <Type size={14} /> Add Typing
                    </button>
                  </div>
                </div>
                {form.activities.length === 0 ? (
                  <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>No activities. Add MC or Typing above.</p>
                ) : (
                  <div className="admin-activity-cards">
                    {form.activities.map((act: any, idx: number) => (
                      <div key={idx} className="admin-activity-card">
                        <div className="admin-activity-card-header">
                          <span className="admin-activity-card-title">
                            {act.type === "mc" ? "Multiple choice" : "Typing"} #{idx + 1}
                          </span>
                          <button
                            type="button"
                            className="admin-btn admin-btn-ghost admin-btn-sm admin-btn-danger"
                            onClick={() => setForm({ ...form, activities: form.activities.filter((_, i) => i !== idx) })}
                          >
                            <Trash2 size={14} /> Remove
                          </button>
                        </div>
                        {act.type === "mc" ? (
                          <>
                            <div className="admin-form-group">
                              <label className="admin-form-label">Question</label>
                              <input
                                type="text"
                                className="admin-input"
                                value={act.question ?? ""}
                                onChange={(e) => {
                                  const next = [...form.activities];
                                  next[idx] = { ...next[idx], question: e.target.value };
                                  setForm({ ...form, activities: next });
                                }}
                                placeholder="e.g. Ni izihe inyajwi mu Kinyarwanda?"
                              />
                            </div>
                            <div className="admin-form-group">
                              <label className="admin-form-label">Options (one per line or comma-separated)</label>
                              <input
                                type="text"
                                className="admin-input"
                                value={Array.isArray(act.options) ? act.options.join(", ") : ""}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  const options = raw.split(/[\n,]/).map((s) => s.trim()).filter(Boolean).slice(0, 6);
                                  const next = [...form.activities];
                                  next[idx] = { ...next[idx], options: options.length ? options : ["", "", "", ""] };
                                  setForm({ ...form, activities: next });
                                }}
                                placeholder="A E I O U, Option B, Option C, Option D"
                              />
                            </div>
                            <div className="admin-form-group">
                              <label className="admin-form-label">Correct answer (exact text)</label>
                              <input
                                type="text"
                                className="admin-input"
                                value={act.correctAnswer ?? ""}
                                onChange={(e) => {
                                  const next = [...form.activities];
                                  next[idx] = { ...next[idx], correctAnswer: e.target.value };
                                  setForm({ ...form, activities: next });
                                }}
                                placeholder="e.g. A E I O U"
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="admin-form-group">
                              <label className="admin-form-label">Prompt</label>
                              <input
                                type="text"
                                className="admin-input"
                                value={act.prompt ?? ""}
                                onChange={(e) => {
                                  const next = [...form.activities];
                                  next[idx] = { ...next[idx], prompt: e.target.value };
                                  setForm({ ...form, activities: next });
                                }}
                                placeholder="e.g. Andika inyajwi eshanu mu Kinyarwanda:"
                              />
                            </div>
                            <div className="admin-form-group">
                              <label className="admin-form-label">Correct answer</label>
                              <input
                                type="text"
                                className="admin-input"
                                value={act.correctAnswer ?? ""}
                                onChange={(e) => {
                                  const next = [...form.activities];
                                  next[idx] = { ...next[idx], correctAnswer: e.target.value };
                                  setForm({ ...form, activities: next });
                                }}
                                placeholder="e.g. A E I O U"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="admin-modal-footer">
                <button type="button" onClick={closeModal} className="admin-btn admin-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  {modal === "add" ? "Create Lesson" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
