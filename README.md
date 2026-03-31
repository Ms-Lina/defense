# MenyAI

AI-powered literacy platform (Kinyarwanda). **Mobile app** (React Native/Expo), **backend** (Node.js + Express + Firebase), and **admin panel** (React) for managing lessons, users, and progress.

---

## Recent updates

- **Home** (`Ahabanza`) and **Progress** (`Iterambere`) now use only backend data. No hardcoded totals, percentages, names, or featured lesson copy should appear in the UI.
- **Per-lesson progress** is stored and restored from the backend. Learners can resume a lesson from the saved step, keep their answers, continue from the saved video position, and see tracked time spent.
- **Lesson completion flow** now returns a reliable result screen after submit, including score and completion state.
- **AI tutor** answers in Kinyarwanda, uses lesson context when available, and is tuned to avoid inventing content.
- **Firestore rules** now cover the active project data model used by the mobile app and backend.
- **Android local build tooling** includes a postinstall fix for the async-storage `.settings` folder and a more resilient local APK build script for Windows.

---

## Project structure

```
MenyAI/
├── mobile/          # Expo app (auth, lessons, practice, progress)
├── backend/         # Express API (lessons, progress, auth, admin API)
├── admin-panel/     # Web dashboard (lessons CRUD, users, progress)
├── firestore.rules  # Firestore security rules
├── firebase.json    # Firebase CLI config
└── .firebaserc      # Firebase project id (menyai-27cfc)
```

---

## Prerequisites

- **Node.js** 18+
- **pnpm** (or npm)
- **Firebase project** (Auth + Firestore)
- **Firebase CLI** (optional, for deploying rules)

---

## Quick start

### Install (from repo root)

```bash
pnpm install
cd backend && pnpm install && cd ..
cd admin-panel && pnpm install && cd ..
cd mobile && pnpm install && cd ..
```

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env: GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_JSON (see Firebase below)
pnpm start
```

Runs at **http://localhost:4000**. Check **http://localhost:4000/health**.

### Mobile app

```bash
cd mobile
pnpm start
```

Press **a** (Android) or **i** (iOS), or scan QR with Expo Go. Auth: Firebase phone + PIN.

### Run on Android emulator

If you already have an Android Virtual Device configured:

```bash
cd mobile
pnpm android
```

This starts Metro if needed, boots/uses the connected Android emulator, and installs the app package `com.menyai.kwigarwanda`.

If Metro is already running, you can also press **a** in the Expo terminal to open the app on Android.

### Admin panel

```bash
cd admin-panel
pnpm dev
```

Opens at **http://localhost:3000**. Login **Admin** / **123** (mock) or your `ADMIN_SECRET`. Backend URL defaults to `http://localhost:4000` in dev.

---

## Firebase setup

### Console

1. [Firebase Console](https://console.firebase.google.com) → create or open project (e.g. **menyai-27cfc**).
2. **Authentication** → enable **Phone** (and any other sign-in).
3. **Firestore Database** → Create database (test or production), choose region.

### Backend credentials

**Option A – Service account file (local)**  
1. Project settings → **Service accounts** → **Generate new private key** → download JSON.  
2. Place JSON in repo (e.g. root); **do not commit** (`.gitignore`: `*-firebase-adminsdk-*.json`).  
3. **backend/.env**: `GOOGLE_APPLICATION_CREDENTIALS=../your-key-file.json` (path relative to `backend/`).

**Option B – JSON in env (e.g. Render)**  
1. One-line key: `node backend/scripts/minify-firebase-json.js path/to/key.json`  
2. On host: set **FIREBASE_SERVICE_ACCOUNT_JSON** to that string.

### Mobile app config

In Firebase Console add Android/iOS apps; download `google-services.json` and `GoogleService-Info.plist` into **mobile/** and configure **mobile/lib/firebase.ts** (or use Expo config).

---

## Firebase CLI (deploy rules)

From repo root:

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

Project is in **.firebaserc** (default **menyai-27cfc**). Switch: `firebase use <project-id>`.  
**firestore.rules** allow authenticated reads for app content such as `lessons` and `practice`, and per-user reads/writes only on that user's own progress/profile documents and supported `users/{uid}` subcollections. Backend (Admin SDK) is not restricted by these rules.

---

## Environment variables

| Where         | Variable                         | Purpose |
|---------------|-----------------------------------|--------|
| backend/.env  | `PORT`                           | Server port (default 4000) |
| backend/.env  | `GOOGLE_APPLICATION_CREDENTIALS` | Path to service account JSON (local) |
| backend/.env  | `FIREBASE_SERVICE_ACCOUNT_JSON`  | Inline JSON (e.g. Render) |
| backend/.env  | `ADMIN_SECRET`                   | Admin API key; omit for mock Admin/123 |
| backend/.env  | `OPENAI_API_KEY`                 | Optional; for /api/ai/chat |
| admin-panel   | `VITE_API_URL`                   | Optional; backend URL for production build |
| mobile        | `EXPO_PUBLIC_API_URL`            | Backend URL for production |

---

## Deploy backend

**Live backend (Render):** `https://menyai-nslw.onrender.com` — use this as **EXPO_PUBLIC_API_URL** (mobile) and **VITE_API_URL** or Backend URL (admin panel).

**Order:** Push code → Deploy (Render/Railway/Fly) → Add Firebase env.

### Render

**Option A – Blueprint (recommended)**  
1. [render.com](https://render.com) → sign in with GitHub.  
2. **New** → **Blueprint** → connect the MenyAI repo, branch **main**.  
3. Render will read **`render.yaml`** at the repo root and create the `menyai-backend` web service with **Root Directory** `backend`.  
4. In the new service’s **Environment** tab, add:
   - **FIREBASE_SERVICE_ACCOUNT_JSON** – paste the **entire** Firebase service account JSON as one line (from Firebase Console → Project settings → Service accounts → Generate new private key). Required.
   - **OPENAI_API_KEY** – (optional) for AI chat.
   - **ADMIN_SECRET** – (optional) for admin API; omit to use mock Admin/123.
5. Do **not** set `PORT`; Render sets it automatically.  
6. Deploy. Your backend URL will be like `https://menyai-backend.onrender.com`. Use it as **EXPO_PUBLIC_API_URL** in the mobile app and as the Backend URL in the admin panel.

**Option B – Manual Web Service**  
1. **New** → **Web Service** → connect repo, branch **main**.  
2. **Root Directory:** `backend`. **Build command:** `npm install`. **Start command:** `node index.js`.  
3. Add the same environment variables as in Option A, then deploy.

### Railway

New Project → Deploy from GitHub → **Root Directory** `backend`. **Variables:** `FIREBASE_SERVICE_ACCOUNT_JSON`, etc. **Settings** → **Networking** → Generate domain.

### Fly.io

```bash
fly auth login
cd backend && fly launch
# No to existing app; no DB
fly secrets set FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
fly deploy
```

### After deploy

- **Health:** `https://YOUR-URL/health` → `{"status":"ok","service":"menyai-backend","firebase":true|false}`.
- **API:** `GET https://YOUR-URL/api/lessons` → `{ "lessons": [...] }`.
- Set **EXPO_PUBLIC_API_URL** in mobile and Backend URL in admin panel.

---

## API overview

| Endpoint | Auth | Description |
|----------|------|-------------|
| GET /health | — | Health + `firebase` status |
| GET /api/lessons | Bearer (optional) | List lessons |
| GET/POST /api/progress | Bearer | User progress |
| POST /api/auth/reset-pin | — | Forgot PIN (phone + new PIN) |
| /api/admin/* | X-Admin-Key | Stats, lessons CRUD, users, progress |

---

## Admin panel (production)

- **Build:** `cd admin-panel && pnpm build`. Set `VITE_API_URL` for baked-in backend URL or configure in Settings at runtime.
- **Serve from backend:** `pnpm build -- --base=/admin/` then copy `dist/` contents to **backend/public/admin**. Backend serves admin at `http://localhost:4000/admin/`.

### Deploy admin panel to Netlify

1. **Connect repo**  
   [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project** → choose Git provider and the **MenyAI** repo.

2. **Build settings**  
   - **Base directory:** `admin-panel`  
   - **Build command:** `pnpm build` (from `netlify.toml`; Netlify uses pnpm if it sees `pnpm-lock.yaml`)  
   - **Publish directory:** `admin-panel/dist` (or leave empty; `netlify.toml` sets `publish = "dist"` relative to base)

3. **Environment variables**  
   In **Site settings** → **Environment variables** → **Add variable** (or **Add single variable**):  
   - **Key:** `VITE_API_URL`  
   - **Value:** your backend URL (e.g. `https://menyai-nslw.onrender.com`)  
   - **Scopes:** All (or only Production).  
   Redeploy after adding so the value is baked into the build.

4. **Deploy**  
   Trigger a deploy (e.g. **Trigger deploy** → **Deploy site**). The admin panel will be available at your Netlify URL (e.g. `https://your-site.netlify.app`). Log in with **Admin** / **123** or your `ADMIN_SECRET`; Backend URL can stay empty if `VITE_API_URL` is set.

---

## Firebase (Firestore) security rules

Rules live in **`firestore.rules`** and apply to **direct client access** (e.g. mobile Firestore SDK). The backend uses the **Admin SDK** and bypasses these rules.

| Path | Read | Write | Notes |
|------|------|-------|--------|
| `lessons/{lessonId}` | ✅ if authenticated | ❌ | Writes via backend/admin only. |
| `practice/{practiceId}` | ✅ if authenticated | ❌ | Same as lessons. |
| `modules/{moduleId}` | ✅ if authenticated | ❌ | Client-readable supporting content. |
| `progress/{userId}` | ✅ if `auth.uid == userId` | ✅ if `auth.uid == userId` | Legacy/user progress doc. |
| `progress/{userId}/history/{lessonId}` | ✅ if `auth.uid == userId` | ✅ if `auth.uid == userId` | Legacy per-lesson history path. |
| `userProfiles/{userId}` | ✅ if `auth.uid == userId` | ✅ if `auth.uid == userId` | Mobile profile screen. |
| `users/{userId}` | ✅ if `auth.uid == userId` | ✅ if `auth.uid == userId` | User root doc. |
| `users/{userId}/lessonHistory/{lessonId}` | ✅ if `auth.uid == userId` | ✅ if `auth.uid == userId` | Lesson completion/history. |
| `users/{userId}/progress/{docId}` | ✅ if `auth.uid == userId` | ✅ if `auth.uid == userId` | Overall/progress docs. |
| `users/{userId}/practiceHistory/{docId}` | ✅ if `auth.uid == userId` | ✅ if `auth.uid == userId` | Practice progress/history. |
| `users/{userId}/achievements/{docId}` | ✅ if `auth.uid == userId` | ✅ if `auth.uid == userId` | Achievement/result data. |
| `aiChatLogs/{logId}` | ❌ | ❌ | Backend-only; logs each AI chat. |
| `system/{docId}` | ❌ | ❌ | Backend/system-only config. |

**Note:** `firebase-rules.json` and `deploy-firebase-rules.js` are for **Realtime Database**. This app uses **Firestore**; the active rules are in `firestore.rules`.

---

## AI (MenyAI Umufasha)

- **Endpoint:** `POST /api/ai/chat` (Bearer token). Body: `{ message, lessonContext? }`. Returns `{ reply }`.
- **Model:** OpenAI; `OPENAI_MODEL` in backend `.env` (default `gpt-4o-mini`). **Requires `OPENAI_API_KEY`** in backend `.env`; if missing, the API returns 503 and the app shows a fallback message.
- **Health check:** `GET /api/ai/health` (no auth). Returns `{ configured: true, model }` when AI is configured, or 503 when not.
- **Logging:** Each chat is written to Firestore `aiChatLogs`. Mobile: "Baza AI Umufasha" / "MenyAI Umufasha".

### AI in CLI (backend)

From `backend/`:

```bash
npm run ai:health
```

- Checks `GET /api/ai/health` and prints configured/model status.
- Uses `BASE_URL` env when set; defaults to `http://localhost:4000` (or `DEPLOYED_BACKEND_URL`).

Chat from CLI (requires Firebase ID token):

```bash
npm run ai:chat -- --message "Sobanura inyuguti A" --token "<FIREBASE_ID_TOKEN>"
```

Optional context:

```bash
npm run ai:chat -- --message "Mfasha kuri iri somo" --context "Isomo: Inyuguti. Moduli: Imirongo." --token "<FIREBASE_ID_TOKEN>"
```

You can also use env vars:

```bash
AI_TOKEN="<FIREBASE_ID_TOKEN>" AI_MESSAGE="Sobanura neza" npm run ai:chat
```

### AI: helping the user use the app well (target ~90%)

The AI tutor is designed to help learners use the app: on-demand, Kinyarwanda only, context-aware (lesson title/description when opened from a lesson), simple and short answers, encouragement. To improve: review Firestore `aiChatLogs`, tweak the system prompt in `backend/routes/ai.js`, optionally add feedback (e.g. thumbs up/down).

### How to get an OpenAI API key

1. Create an account at **https://platform.openai.com** and add billing at **https://platform.openai.com/account/billing**.
2. Create a key at **https://platform.openai.com/api-keys** → **Create new secret key** → copy the `sk-...` key (shown once).
3. In **`backend/.env`** add: `OPENAI_API_KEY=sk-your-key-here` and optionally `OPENAI_MODEL=gpt-4o-mini`. Do not commit `.env`.
4. Restart the backend. Verify: **http://localhost:4000/api/ai/health** or `node backend/scripts/fetch-verify-endpoints.js`.

---

## Progress and lesson state

Home, Progress, and Lessons screens use backend data only. Nothing is hardcoded.

- **Overall progress** comes from **GET `/api/progress`**.
- **Per-lesson resume state** comes from **GET `/api/lessons/:id/progress`**.
- **Saved lesson state** can include `currentStep`, `totalTimeSpent`, `videoProgressSeconds`, `answers`, `descriptionRead`, and `videoWatched`.
- **Completed lessons** are derived from lesson history where the learner passed the assessment.
- **Lessons list progress** shows partial completion states like reading started, video watched, and fully completed.

Verify in DB: `node backend/scripts/fetch-where-12-38-50.js`

---

## Lesson assessment and progress storage

Lessons can have **activities** (multiple choice and typing). MC: `question`, `options`, `correctAnswer`; typing: `prompt`, `correctAnswer`. Backend evaluates answers, computes score and `passed`, stores in `users/{uid}/lessonHistory/{lessonId}` and updates `users/{uid}/progress/overall` and `userProfiles`. Progress API uses `lessonHistory` for completed count. Admin can add/edit MC and typing in the lesson modal.

---

## Admin: lessons, users, delete account

- **Lessons:** Create, edit, delete, duplicate, bulk enable/disable. Activities (MC, typing) in Add/Edit Lesson modal.
- **Users:** List, filter by sector. Disable/enable (PATCH), **delete account** (DELETE) — removes Firebase Auth user and Firestore data.
- **Delete own account (mobile):** Account tab → "Siba konti yawe" → `POST /api/auth/delete-account`.

---

## Backend scripts

**Active:** `seed-lessons.js`, `update-lessons-in-db.js`, `check-lessons-count.js`, `seed-practice.js`, `add-practice-data.js`, `fetch-where-12-38-50.js`, `fetch-verify-endpoints.js` (health, AI health, lessons). **Archived:** `backend/scripts/archive/`.

---

## Building the Android APK

You can build the APK **with EAS** (Expo’s cloud) or **locally without EAS** (no Expo account required for the build).

### Option A: Build APK locally (no EAS)

Build on your machine with Gradle. No Expo account or EAS needed for this path.

**Requirements:** [Android Studio](https://developer.android.com/studio) (or Android SDK + NDK), Node.js, and `JAVA_HOME` set to your JDK.

1. From **`mobile`** run:
   ```bash
   cd mobile
   pnpm run build:apk
   ```
   This runs `expo prebuild --platform android --clean` (generates the `android/` folder) then `gradlew assembleRelease`. The first run can take several minutes.

2. **APK output:**  
   `mobile/android/app/build/outputs/apk/release/app-release.apk`

3. **Install:** Copy the APK to your device, enable “Install from unknown sources” if prompted, and install.

**If the app opens then closes immediately on your phone:** (1) Use the **release** APK from `build:apk` (not the dev build from `pnpm android`). (2) In **`mobile/.env`** set `EXPO_PUBLIC_API_URL` to your backend URL and rebuild the APK. (3) Ensure **`mobile/google-services.json`** has `"package_name": "com.menyai.kwigarwanda"`.

If `pnpm run build:apk` fails (e.g. Gradle or SDK not found), run the steps manually:
```bash
cd mobile
npx expo prebuild --platform android --clean
cd android
gradlew.bat assembleRelease   # Windows
# or: ./gradlew assembleRelease   # Mac/Linux
```

### Local APK build notes for Windows

- The repo includes `mobile/scripts/build-apk.js`, which retries removal of the generated `android/` folder and handles common Windows file-lock issues more gracefully.
- `mobile/package.json` also runs `postinstall` to recreate the missing async-storage Android `.settings` folder used by some Gradle/Java tooling.
- If `android/` cannot be deleted because of `EPERM`, close Android Studio and terminals using `mobile/android`, then remove the folder manually and retry.
- If Gradle reports `Timeout waiting to lock build logic queue`, stop stray Java/Gradle processes, wait a few seconds, and rerun the build.

### Option B: Build with EAS (Expo cloud)

1. **One-time:** Create account at **https://expo.dev/signup**. From **`mobile`**: `npx eas-cli login` (enter email/password in your terminal).
2. **Build:** From **`mobile`**: `npx eas-cli build --platform android --profile preview`. You get an APK download link when the build finishes.
3. **Install:** Download the APK, on device enable "Install from unknown sources", then install.

**Optional:** Set `EXPO_TOKEN` (from https://expo.dev/accounts/.../settings/access-tokens) to avoid logging in each time.

**If the build fails at Prebuild:** (1) Ensure `mobile/assets/MenyAI-Logo.png` exists (used for app icon + splash + adaptive icon). (2) `mobile/eas.json` has `"appVersionSource": "local"`. (3) Retry with `npx eas-cli build --platform android --profile preview --clear-cache`.

**If the build fails at "Run gradlew" (Gradle):** This project uses **Expo SDK 53** (and the **default** EAS image for Option B). SDK 53 includes fixes for the "expo-module-gradle-plugin not found" and "release" SoftwareComponent errors seen on SDK 52. For local builds, delete `mobile/android` and run `pnpm run build:apk` again after upgrading.

**"Build concurrency limit reached":** On the free tier, only one (or a few) builds can run at a time. Your build is **queued** and will start automatically when a slot is free. You can: wait for the current build to finish; cancel a running build in [Expo dashboard](https://expo.dev) → your project → Builds to free a slot; or add more concurrency at **https://expo.dev/accounts/teletechsolutions/settings/billing** (paid plan).

---

## Capstone alignment (summary)

Modules: Basic Literacy (Imirongo, Inyuguti), Everyday Numbers (Imibare), Practical Life Skills (Ubuzima n'ubucuruzi). AI: on-demand, Kinyarwanda, context-aware, logged server-side. Offline: lesson list and detail cached. Profile: Intara / Akarere / Umurenge. Pilot: lastActivityAt on submit and ping; AI logs include sessionId.
