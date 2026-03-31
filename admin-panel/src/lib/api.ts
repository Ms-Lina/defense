const ADMIN_KEY = "menyai_admin_key";
const API_BASE_KEY = "menyai_api_base";

/** Build-time API URL (e.g. for production deploy). */
function getEnvApiBase(): string {
  return (import.meta as unknown as { env?: { VITE_API_URL?: string; DEV?: boolean } }).env?.VITE_API_URL ?? "";
}

const DEFAULT_DEV_API = "http://localhost:4000";

export function getApiBase(): string {
  const stored = localStorage.getItem(API_BASE_KEY);
  if (stored != null && stored !== "") return stored.replace(/\/$/, "");
  const env = getEnvApiBase();
  if (env) return env.replace(/\/$/, "");
  if ((import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV) return DEFAULT_DEV_API;
  // When opened from localhost with no stored URL, assume backend on 4000 (dev/preview)
  if (typeof window !== "undefined" && window.location?.hostname === "localhost") return DEFAULT_DEV_API;
  return "";
}

export function setApiBase(url: string): void {
  const trimmed = url.trim().replace(/\/$/, "");
  if (trimmed) localStorage.setItem(API_BASE_KEY, trimmed);
  else localStorage.removeItem(API_BASE_KEY);
}

export function getAdminKey(): string | null {
  return localStorage.getItem(ADMIN_KEY);
}

export function setAdminKey(key: string): void {
  localStorage.setItem(ADMIN_KEY, key);
}

export function clearAdminKey(): void {
  localStorage.removeItem(ADMIN_KEY);
}

function getHeaders(): HeadersInit {
  const key = getAdminKey();
  return {
    "Content-Type": "application/json",
    ...(key ? { "X-Admin-Key": key } : {}),
  };
}

let _warned503 = false;
let _backendUnavailable = false;

/** Set when initial health check fails or a 503 is received; api() will skip fetches to avoid console spam. */
export function setBackendUnavailable(unavailable: boolean): void {
  _backendUnavailable = unavailable;
}

export function getBackendUnavailable(): boolean {
  return _backendUnavailable;
}

const BACKEND_UNAVAILABLE_MSG =
  "Backend or database unavailable. Set FIREBASE_SERVICE_ACCOUNT_JSON in backend/.env and restart the backend (port 4000).";

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  if (_backendUnavailable && path.startsWith("/api/")) {
    if (!_warned503) {
      _warned503 = true;
      console.warn("[MenyAI Admin] " + BACKEND_UNAVAILABLE_MSG);
    }
    throw new Error(BACKEND_UNAVAILABLE_MSG);
  }
  const base = getApiBase();
  const url = base ? `${base}${path}` : path;
  const res = await fetch(url, {
    ...options,
    headers: { ...getHeaders(), ...options?.headers } as HeadersInit,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) {
      clearAdminKey();
      if (typeof window !== "undefined" && window.location.pathname !== "/login" && !window.location.pathname.endsWith("/login")) {
        window.location.href = (import.meta.env.BASE_URL || "/").replace(/\/$/, "") + "/login";
      }
    }
    const msg = (data as { error?: string }).error || res.statusText;
    const friendly =
      res.status === 503 && msg
        ? msg
        : res.status === 503
          ? "Backend or database unavailable. Start the backend (port 4000) and set FIREBASE_SERVICE_ACCOUNT_JSON in backend/.env."
          : res.status === 401
            ? "Unauthorized. Log in with the admin password (must match ADMIN_SECRET on the server)."
            : msg;
    if (res.status === 503) {
      _backendUnavailable = true;
      if (!_warned503) {
        _warned503 = true;
        console.warn("[MenyAI Admin] " + BACKEND_UNAVAILABLE_MSG);
      }
    }
    throw new Error(friendly);
  }
  return data as T;
}

export type Stats = { totalLessons: number; totalUsers: number; totalProgressDocs: number };
export type Lesson = { id: string; title: string; duration?: string; level?: string; order?: number; description?: string; difficulty?: string; enabled?: boolean; videoUrl?: string; activities?: any[] };
export type User = { uid: string; email: string | null; displayName: string | null; createdAt: string; disabled?: boolean; profile?: UserProfile | null };
export type UserProfile = { name?: string; age?: number; sector?: string; contact?: string; enrollmentDate?: string; literacyScore?: number; active?: boolean; updatedAt?: string };
export type Progress = { uid: string; displayName?: string | null; completedLessons?: number; streakDays?: number; updatedAt?: string };
export type Analytics = { totalUsers: number; activeUsers: number; totalLessonsCompleted: number; lessonsCompletedToday: number; lessonsCompletedThisWeek: number; totalAIConversations: number; uniqueAIVisitors: number; aiUsagePercent: number; avgProgressPercent: number; avgStreakDays: number; maxStreakDays: number };
export type AILog = { id: string; uid: string; message: string; reply?: string; lessonContext?: string; createdAt: string };
export type AIStats = { learnersUsingAI: number; learnersIndependent: number; totalActivations: number; avgConversationLength: number; topUsersByAIActivations: { uid: string; count: number }[] };
