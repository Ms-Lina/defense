# Firebase setup for MenyAI backend

The backend needs a **Firebase service account key** so it can read/write Firestore (lessons, progress) and verify Firebase Auth users.

## Steps

### 1. Open Firebase Console

- Go to [Firebase Console](https://console.firebase.google.com/)
- Select your project (or create one)

### 2. Get the service account key

- Click the **gear** (Project settings) → **Service accounts**
- Click **Generate new private key** → **Generate key**
- A JSON file will download (e.g. `menyai-xxxxx-firebase-adminsdk-xxxxx.json`)

### 3. Use it in the backend

**Option A – use the file (recommended for local dev)**

1. Move or copy the downloaded JSON into the backend folder.
2. Rename it to `serviceAccountKey.json` (or keep the name and set that name in `.env`).
3. In `backend/.env`, set:
   ```env
   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
   ```
4. Restart the backend: `node backend/index.js` (or `npm run dev` from the repo root).

**Option B – paste JSON in .env (e.g. for Render)**

1. From the repo root, run:
   ```bash
   node backend/scripts/archive/minify-firebase-json.js "path/to/downloaded-key.json"
   ```
2. Copy the single-line output.
3. In `backend/.env`, set:
   ```env
   FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
   ```
   (Paste the whole line. Comment out or remove `GOOGLE_APPLICATION_CREDENTIALS` if it’s set.)
4. Restart the backend.

### 4. Check it works

- Start the backend and open: http://localhost:4000/health  
- You should see `"firebase": true`.  
- The admin panel (port 3000) should then load without the “Backend database not configured” message.
