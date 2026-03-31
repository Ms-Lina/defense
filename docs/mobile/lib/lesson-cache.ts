/**
 * Offline cache for lessons – capstone: "Lesson content cached for offline review"
 * TTL 24h; uses AsyncStorage.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_PREFIX = "menyai_lesson_";
const LIST_KEY = `${CACHE_PREFIX}list`;
const TTL_MS = 24 * 60 * 60 * 1000; // 24h

type CacheEntry<T> = { data: T; ts: number };

function isExpired(ts: number): boolean {
  return Date.now() - ts > TTL_MS;
}

export async function getCachedLessonList(): Promise<any[] | null> {
  try {
    const raw = await AsyncStorage.getItem(LIST_KEY);
    if (!raw) return null;
    const entry: CacheEntry<any[]> = JSON.parse(raw);
    if (isExpired(entry.ts)) return null;
    return entry.data;
  } catch {
    return null;
  }
}

export async function setCachedLessonList(lessons: any[]): Promise<void> {
  try {
    await AsyncStorage.setItem(
      LIST_KEY,
      JSON.stringify({ data: lessons, ts: Date.now() } as CacheEntry<any[]>)
    );
  } catch {
    // ignore
  }
}

export async function getCachedLesson(id: string): Promise<any | null> {
  try {
    const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${id}`);
    if (!raw) return null;
    const entry: CacheEntry<any> = JSON.parse(raw);
    if (isExpired(entry.ts)) return null;
    return entry.data;
  } catch {
    return null;
  }
}

export async function setCachedLesson(id: string, lesson: any): Promise<void> {
  try {
    await AsyncStorage.setItem(
      `${CACHE_PREFIX}${id}`,
      JSON.stringify({ data: lesson, ts: Date.now() } as CacheEntry<any>)
    );
  } catch {
    // ignore
  }
}
