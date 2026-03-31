/**
 * MenyAI API client – connects to Node.js + Express backend.
 * Uses EXPO_PUBLIC_API_URL or defaults for emulator/simulator.
 * Lesson list and lesson detail are cached for offline use.
 * On a real device (APK), we never use 10.0.2.2 – use production URL so lessons/progress load.
 */
import { Platform } from "react-native";
import * as lessonCache from "./lesson-cache";

const PRODUCTION_API_URL = "https://menyai-nslw.onrender.com";

export const getBaseUrl = (): string => {
  const envUrl =
    typeof process !== "undefined" && process.env?.EXPO_PUBLIC_API_URL
      ? process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, "")
      : "";
  if (envUrl) return envUrl;
  // Dev: emulator/simulator can use host machine. Release/real device: always use production.
  const isDev = typeof __DEV__ !== "undefined" && __DEV__;
  if (isDev && Platform.OS === "android") return "http://10.0.2.2:4000";
  if (isDev) return "http://localhost:4000";
  return PRODUCTION_API_URL;
};

const BASE_URL = getBaseUrl();

export type LessonProgressItem = {
  lessonId: string;
  passed?: boolean;
  score?: number;
  attempts?: number;
  completedAt?: string;
  updatedAt?: string;
  descriptionRead?: boolean;
  videoWatched?: boolean;
};

/** Progress % per lesson: description only 30%, video 50%, test completed 100% */
export function lessonProgressPercent(item: LessonProgressItem | undefined): number {
  if (!item) return 0;
  if (item.passed) return 100;
  if (item.videoWatched) return 50;
  if (item.descriptionRead) return 30;
  return 0;
}

export type ProgressData = {
  completedLessons: number;
  totalLessons: number;
  remainingLessons?: number;
  streakDays: number;
  averageScore?: number;
  lessonHistory?: LessonProgressItem[];
  badge?: { key: string; label: string; color: string; minLessons: number };
  nextBadge?: { label: string; needsTotal: number; remaining: number } | null;
};

export type EnhancedAssessmentResult = {
  score: number;
  passed: boolean;
  timeBonus?: number;
  breakdown?: any[];
  learningMetrics?: {
    engagementScore: number;
    masteryLevel: string;
    improvementAreas: string[];
    nextRecommendations: any[];
  };
};

export type AssessmentAnalytics = {
  overallPerformance: {
    averageScore: number;
    totalAssessments: number;
    passRate: number;
    improvementTrend: string;
  };
  modulePerformance: Record<string, any>;
  difficultyProgression: Record<string, any>;
  learningTrends: {
    weeklyProgress: number;
    streakDays: number;
    averageTimePerAssessment: number;
  };
  recommendations: any[];
};

export type ApiLesson = {
  id: string;
  title: string;
  duration?: string;
  level?: string;
};

export type LessonListItem = {
  id: string;
  title: string;
  duration: string;
  meta: string;
  progress: number;
  status: "completed" | "progress" | "new";
  icon: string;
  gradient: [string, string];
};

const DEFAULT_META = "Ijwi + Amashusho";
const ICONS = ["nutrition", "calculator", "medical"] as const;
const GRADIENTS: [string, string][] = [
  ["#FFE5B4", "#FFDAB9"],
  ["#B4E5FF", "#B9D9FF"],
  ["#E5FFB4", "#D9FFB9"],
];

function mapLesson(api: ApiLesson, index: number): LessonListItem {
  const status: LessonListItem["status"] =
    index === 0 ? "completed" : index === 1 ? "progress" : "new";
  const progress = index === 0 ? 100 : index === 1 ? 45 : 0;
  return {
    id: api.id,
    title: api.title,
    duration: api.duration ?? "10 min",
    meta: DEFAULT_META,
    progress,
    status,
    icon: ICONS[index % ICONS.length],
    gradient: GRADIENTS[index % GRADIENTS.length],
  };
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

/** One retry after 2s to handle backend cold start (e.g. Render). */
async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retryDelayMs = 2000
): Promise<Response> {
  try {
    const res = await fetch(url, options);
    if (res.ok) return res;
    if (res.status >= 500 && retryDelayMs > 0) {
      await new Promise((r) => setTimeout(r, retryDelayMs));
      return fetch(url, options);
    }
    return res;
  } catch {
    if (retryDelayMs > 0) {
      await new Promise((r) => setTimeout(r, retryDelayMs));
      return fetch(url, options);
    }
    throw new Error("Network error");
  }
}

export const api = {
  getBaseUrl: () => BASE_URL,

  async getLessons(token?: string | null): Promise<any[]> {
    try {
      const url = `${BASE_URL}/api/lessons`;
      const res = await fetchWithRetry(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch lessons");
      const data = await res.json();
      const list = data.lessons ?? [];
      await lessonCache.setCachedLessonList(list);
      return list;
    } catch {
      const cached = await lessonCache.getCachedLessonList();
      return cached ?? [];
    }
  },

  async ping(token?: string | null): Promise<void> {
    if (!token) return;
    // Skip in dev when API is remote to avoid 404 console noise (e.g. Render without /api/ping)
    const isLocal =
      BASE_URL.includes("localhost") ||
      BASE_URL.includes("127.0.0.1") ||
      BASE_URL.includes("10.0.2.2");
    if (typeof __DEV__ !== "undefined" && __DEV__ && !isLocal) return;
    try {
      const res = await fetch(`${BASE_URL}/api/ping`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return; // don't retry or log
    } catch {
      // ignore
    }
  },

  async deleteAccount(token: string | null): Promise<{ ok: boolean; message?: string }> {
    if (!token) return { ok: false, message: "Not authenticated" };
    try {
      const res = await fetch(`${BASE_URL}/api/auth/delete-account`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, message: (data as { message?: string }).message || "Request failed" };
      return { ok: true };
    } catch (e) {
      return { ok: false, message: (e as Error).message };
    }
  },

  async getProgress(token?: string | null): Promise<ProgressData | null> {
    try {
      const url = `${BASE_URL}/api/progress`;
      const res = await fetchWithRetry(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch progress");
      const data = await res.json();
      const total = data.totalLessons ?? 0;
      const completed = data.completedLessons ?? 0;
      return {
        completedLessons: completed,
        totalLessons: total,
        remainingLessons: data.remainingLessons ?? Math.max(0, total - completed),
        streakDays: data.streakDays ?? 0,
        lessonHistory: data.lessonHistory ?? [],
        averageScore: data.averageScore ?? undefined,
        badge: data.badge,
        nextBadge: data.nextBadge,
      };
    } catch {
      return null;
    }
  },

  async getLessonHistory(token?: string | null): Promise<{ lessonId: string; score: number; passed: boolean; attempts: number; updatedAt: string }[]> {
    try {
      const url = `${BASE_URL}/api/progress/history`;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.history ?? [];
    } catch {
      return [];
    }
  },

  async postAiChat(
    message: string,
    token?: string | null,
    options?: { lessonContext?: string }
  ): Promise<
    | { reply: string }
    | { error: "auth" | "unavailable" | "network"; code?: string }
  > {
    try {
      const res = await fetch(`${BASE_URL}/api/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message,
          ...(options?.lessonContext != null && options.lessonContext !== ""
            ? { lessonContext: options.lessonContext }
            : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) return { error: "auth" };
      if (!res.ok) {
        const code = typeof data?.code === "string" ? data.code : undefined;
        return { error: "unavailable", code };
      }
      const reply = data.reply ?? null;
      if (reply && typeof reply === "string") return { reply };
      return { error: "unavailable", code: data?.code };
    } catch {
      return { error: "network" };
    }
  },

  async getLesson(id: string, token?: string | null): Promise<any | null> {
    try {
      const cached = await lessonCache.getCachedLesson(id);
      const url = `${BASE_URL}/api/lessons/${id}`;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        if (cached) return cached;
        return null;
      }
      const lesson = await res.json();
      await lessonCache.setCachedLesson(id, lesson);
      return lesson;
    } catch {
      const cached = await lessonCache.getCachedLesson(id);
      return cached ?? null;
    }
  },

  /** GET saved progress for a lesson (resume step, time, video position, answers). */
  async getLessonProgress(
    lessonId: string,
    token?: string | null
  ): Promise<{
    progress: {
      currentStep: number;
      totalTimeSpent: number;
      videoProgressSeconds: number;
      answers: string[];
      descriptionRead: boolean;
      videoWatched: boolean;
    } | null;
    completed: boolean;
    score?: number;
  } | null> {
    try {
      const res = await fetch(`${BASE_URL}/api/lessons/${lessonId}/progress`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return null;
      const data = await res.json();
      return {
        progress: data.progress ?? null,
        completed: !!data.completed,
        score: data.score,
      };
    } catch {
      return null;
    }
  },

  async recordLessonProgress(
    lessonId: string,
    payload: {
      descriptionRead?: boolean;
      videoWatched?: boolean;
      currentStep?: number;
      totalTimeSpent?: number;
      videoProgressSeconds?: number;
      answers?: string[];
    },
    token?: string | null
  ): Promise<{ ok: boolean; progressPercent: number } | null> {
    try {
      const res = await fetch(`${BASE_URL}/api/lessons/${lessonId}/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return { ok: true, progressPercent: data.progressPercent ?? 0 };
    } catch {
      return null;
    }
  },

  async submitLesson(
    lessonId: string,
    answers: any[],
    token?: string | null,
    options?: { timeSpent?: number; questionTimes?: number[] }
  ): Promise<{ score: number; passed: boolean; error?: string } | null> {
    try {
      const timeSpent = Math.max(0, Number(options?.timeSpent) || 0);
      const questionTimes = Array.isArray(options?.questionTimes) ? options.questionTimes.map(t => Math.max(0, Number(t) || 0)) : [];
      // Normalize answers for backend: strings only; audio URI or non-string → "recorded" so backend counts as answered
      const normalizedAnswers = answers.map((a) => {
        if (a == null) return "";
        if (typeof a === "string") return a.trim();
        return "recorded"; // e.g. audio URI or any non-string answer
      });
      const res = await fetch(`${BASE_URL}/api/lessons/${lessonId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ answers: normalizedAnswers, timeSpent, questionTimes }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = typeof data?.error === "string" ? data.error : data?.details ?? `Request failed (${res.status})`;
        const details = typeof data?.details === "string" ? data.details : "";
        const fullMsg = details ? `${msg}\n${details}` : msg;
        return { score: 0, passed: false, error: fullMsg };
      }
      const score = typeof data.score === "number" ? data.score : 0;
      const passed = Boolean(data.passed);
      return { score, passed };
    } catch (e) {
      const message = e instanceof Error ? e.message : "Network error";
      return { score: 0, passed: false, error: message };
    }
  },

  async getPractice(): Promise<any[]> {
    try {
      const res = await fetch(`${BASE_URL}/api/practice`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.practiceItems || [];
    } catch {
      return [];
    }
  },

  async getPracticeItem(id: string, token?: string | null): Promise<any | null> {
    try {
      const res = await fetch(`${BASE_URL}/api/practice/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async submitPractice(id: string, answers: any[], token?: string | null): Promise<{ score: number; passed: boolean } | null> {
    try {
      const res = await fetch(`${BASE_URL}/api/practice/${id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  // Enhanced assessment methods
  async submitEnhancedPractice(id: string, answers: any[], timeSpent: number, questionTimes: number[], token?: string | null): Promise<EnhancedAssessmentResult | null> {
    try {
      const res = await fetch(`${BASE_URL}/api/assessments/enhanced-submit/practice/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ answers, timeSpent, questionTimes, deviceInfo: Platform.OS }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async submitEnhancedLesson(id: string, answers: any[], timeSpent: number, questionTimes: number[], token?: string | null): Promise<EnhancedAssessmentResult | null> {
    try {
      const res = await fetch(`${BASE_URL}/api/assessments/enhanced-submit/lesson/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ answers, timeSpent, questionTimes, deviceInfo: Platform.OS }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getAssessmentAnalytics(userId: string, token?: string | null): Promise<AssessmentAnalytics | null> {
    try {
      const res = await fetch(`${BASE_URL}/api/assessments/analytics/${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getAdaptiveAssessment(lessonId: string, userLevel: number, preferredDifficulty: string, weakAreas: string[], token?: string | null): Promise<any | null> {
    try {
      const res = await fetch(`${BASE_URL}/api/assessments/adaptive/${lessonId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userLevel, preferredDifficulty, weakAreas }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getNextLesson(lessonId: string, token?: string | null): Promise<{ nextLesson: any; recommendations: any[] } | null> {
    try {
      const res = await fetch(`${BASE_URL}/api/lessons/${lessonId}/next`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getPracticeHistory(token?: string | null): Promise<any[]> {
    try {
      const res = await fetch(`${BASE_URL}/api/practice/history`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.history || [];
    } catch {
      return [];
    }
  },

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE_URL}/health`);
      return res.ok;
    } catch {
      return false;
    }
  },
};
