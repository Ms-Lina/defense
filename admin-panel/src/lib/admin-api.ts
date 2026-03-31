/**
 * Centralized admin API – all dashboard data fetching in one place.
 * Uses the shared api() client from ./api (auth, base URL, error handling).
 */

import { api } from "./api";

// Re-export types so pages can import from here
export type {
  Stats,
  Lesson,
  User,
  UserProfile,
  Progress,
  Analytics,
  AILog,
  AIStats,
} from "./api";

// --- Stats & analytics ---

export async function fetchStats(): Promise<import("./api").Stats> {
  return api<import("./api").Stats>("/api/admin/stats");
}

export async function fetchAnalytics() {
  return api<{
    totalUsers: number;
    activeUsers: number;
    totalLessonsCompleted: number;
    lessonsCompletedToday: number;
    lessonsCompletedThisWeek: number;
    totalAIConversations: number;
    uniqueAIVisitors: number;
    aiUsagePercent: number;
    avgProgressPercent: number;
    avgStreakDays: number;
    maxStreakDays: number;
  }>("/api/admin/analytics");
}

// --- Lessons ---

export async function fetchLessons() {
  return api<{ lessons: import("./api").Lesson[] }>("/api/admin/lessons");
}

export async function createLesson(body: Record<string, unknown>) {
  return api<unknown>("/api/admin/lessons", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateLesson(id: string, body: Record<string, unknown>) {
  return api<unknown>(`/api/admin/lessons/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function deleteLesson(id: string) {
  return api<unknown>(`/api/admin/lessons/${id}`, { method: "DELETE" });
}

// --- Users ---

export async function fetchUsers(sector?: string) {
  const path = sector
    ? `/api/admin/users?sector=${encodeURIComponent(sector)}`
    : "/api/admin/users";
  return api<{ users: import("./api").User[] }>(path);
}

export async function deleteUser(uid: string) {
  return api<unknown>(`/api/admin/users/${uid}`, { method: "DELETE" });
}

// --- Progress ---

export async function fetchProgress() {
  return api<{ progress: import("./api").Progress[] }>("/api/admin/progress");
}

// --- Reports ---

export type ReportLearnerRow = {
  uid: string;
  completedLessons: number;
  streakDays: number;
  badge: string;
  avgScore: number | null;
  lastActive: string | null;
  historyCount: number;
};

export type ReportLessonRow = {
  id: string;
  title: string;
  module: string;
  order: number;
  passCount: number;
  failCount: number;
  totalAttempts: number;
  passRate: number | null;
};

export type ReportSummary = {
  totalLessons: number;
  totalLearners: number;
  totalCompletions: number;
  avgClassScore: number;
  badgeCounts: Record<string, number>;
};

export type ReportData = {
  summary: ReportSummary;
  learners: ReportLearnerRow[];
  lessonReport: ReportLessonRow[];
  generatedAt: string;
};

export async function fetchReports() {
  return api<ReportData>("/api/admin/reports");
}

// --- AI monitoring ---

export async function fetchAIStats() {
  return api<import("./api").AIStats>("/api/admin/ai-stats");
}

export async function fetchAILogs(params: { limit?: number; after?: string }) {
  const sp = new URLSearchParams();
  if (params.limit != null) sp.set("limit", String(params.limit));
  if (params.after != null) sp.set("after", params.after);
  const q = sp.toString();
  const path = q ? `/api/admin/ai-logs?${q}` : "/api/admin/ai-logs";
  return api<{ logs: import("./api").AILog[]; nextAfter: string | null }>(path);
}
