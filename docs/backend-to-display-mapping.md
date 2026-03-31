# Backend ↔ Screen Display Mapping

This document maps what the backend returns to what is shown on each screen.

---

## 1. Backend APIs (data source)

### GET /api/progress (requires auth)
**File:** `backend/routes/progress.js`

| Backend returns | Firestore source |
|-----------------|------------------|
| `completedLessons` | Count of `users/{uid}/lessonHistory` docs where `passed === true` |
| `totalLessons` | `lessons` collection size (ordered by `order`) |
| `remainingLessons` | `totalLessons - completedLessons` |
| `streakDays` | `users/{uid}/progress/overall` → `currentStreak` |
| `averageScore` | From lessonHistory scores |
| `lessonHistory` | `users/{uid}/lessonHistory` (lessonId, passed, score, etc.) |
| `badge` | Computed from completedLessons (e.g. bronze/silver/gold) |
| `nextBadge` | Next badge tier (label, needsTotal, remaining) |

### GET /api/progress/history (requires auth)
**File:** `backend/routes/progress.js`

| Backend returns | Firestore source |
|-----------------|------------------|
| `history[]` | `users/{uid}/lessonHistory` — each item: `lessonId`, `score`, `passed`, `attempts`, `updatedAt` |

### GET /api/lessons (no auth)
**File:** `backend/routes/lessons.js`

| Backend returns | Firestore source |
|-----------------|------------------|
| `lessons[]` | `lessons` collection, ordered by `order` — each: `id`, `title`, `description`, `order`, `module`, plus enhanced fields |

### User name / avatar
**Source:** Not from backend API. Comes from **Firebase Auth** (`user.displayName`) in the app via `useAuth()`.

---

## 2. Home screen (`mobile/app/(tabs)/index.tsx`)

| What you see on screen | Source |
|------------------------|--------|
| Greeting "Muraho, Lina!" | `copy.home.greeting(userName)` where `userName = user?.displayName` (Firebase Auth) |
| Avatar letter "L" | `userName.charAt(0)` (from Auth) |
| "Komeza kwiga neza" | `copy.home.encouragement` (static copy) |
| Featured card title "Isomo Ryawe Rya None" | `copy.home.featuredLessonTitle` (static copy) |
| Featured lesson title (e.g. "Imirongo Yegeranye") | **Backend:** first uncompleted lesson from `api.getLessons()` + `api.getLessonHistory()` → `lesson.title` |
| Featured lesson description | **Backend:** same lesson → `lesson.description` or `summary` or `learningObjectives[0]` |
| Number **12** (Amasomo Yarangiye) | **Backend:** `api.getProgress()` → `progress.completedLessons` |
| Number **38** (Amasomo Asigaye) | **Backend:** `api.getProgress()` → `progress.remainingLessons` |
| "Tangira Isomo" button | `copy.home.startLesson` (static copy) |
| Quick Actions labels | `copy.home.*` (static copy) |

---

## 3. Progress screen (`mobile/app/(tabs)/progress.tsx`)

| What you see on screen | Source |
|------------------------|--------|
| Title "Iterambere" | `copy.progress.title` |
| Subtitle "Reba aho ugejeje wiga" | `copy.progress.subtitle` |
| **"Aho ugeze wiga"** (progress bar label) | `copy.progress.overallPercentage` |
| **24%** | Computed: `(progress.completedLessons / progress.totalLessons) * 100` — both from **Backend** `GET /api/progress` |
| "12 muri 50 amasomo yarangiye" | `copy.progress.completedCount(progress.completedLessons, progress.totalLessons)` — numbers from **Backend** |
| **12** (Yarangiye card) | **Backend:** `progress.completedLessons` |
| **38** (Asigaye card) | **Backend:** `progress.remainingLessons` |
| **5** (Iminsi card) | **Backend:** `progress.streakDays` |
| Labels "Yarangiye", "Asigaye", "Iminsi" | `copy.progress.completed`, `remaining`, `days` |
| Badge card (e.g. Inzibacyuho) | **Backend:** `GET /api/progress` → `badge` (label, color) |
| Next badge progress | **Backend:** `nextBadge` (label, needsTotal, remaining) |
| "Amasomo Yarangiye" list items | **Backend:** `api.getLessonHistory()` → each item: `lessonId`, `score`, `passed`, `attempts`, `updatedAt`. Screen shows "Isomo #{lessonId.slice(0,6)}", score %, date (lesson **title** is not in history API; only lessonId is shown) |

---

## 4. Lessons screen (`mobile/app/(tabs)/lessons.tsx`)

| What you see on screen | Source |
|------------------------|--------|
| Lesson count in header | **Backend:** `lessons.length` from `api.getLessons()` |
| Module names & lesson cards | **Backend:** `api.getLessons()` → `lesson.id`, `lesson.title`, `lesson.module`, etc. |
| Completed checkmark per lesson | **Backend:** `api.getProgress()` → `progress.lessonHistory` (passed per lessonId) |

---

## 5. Summary

- **12, 38, 5, 24%** and progress bar text all come from **GET /api/progress** (and computed percent).
- **Yarangiye, Asigaye, Iminsi** are **labels** from `copy.progress` (not from DB).
- **"Aho ugeze wiga"** is the progress bar section title from `copy.progress.overallPercentage`.
- **Featured lesson** title/description on Home come from **GET /api/lessons** + **GET /api/progress/history** (next uncompleted lesson).
- **User name** (e.g. Lina) and avatar initial come from **Firebase Auth** (`user.displayName`), not from a backend API.

### Note on lesson history list (Progress tab)
The "Amasomo Yarangiye" list shows **lessonId** (truncated), score, attempts, and date. The backend history does not include lesson **titles**. To show the real lesson title, the app would need to merge with `api.getLessons()` by lessonId or the backend would need to include title in the history response.
