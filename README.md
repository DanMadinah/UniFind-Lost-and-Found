# UniFind - University Lost & Found Platform

Built by **Muhammad Abdullahi Bukar**.

Every semester on campus, students lose airpods, matric cards, water flasks, calculators, and hostel keys - and end up posting in five different WhatsApp groups hoping someone saw them. **UniFind** brings everything into one central campus hub with an interactive campus map, automatic Lost-to-Found matching, and a verification flow that stops false claims.

## Key Features

- **Interactive Campus Map:** Click any building zone (Main Library, Engineering & IT, Lecture Halls, Cafeteria, Surau, Hostels, Sports Complex, Bus Hub) to see live Lost/Found counts and filter reports visually.
- **Smart Match Scoring Engine:** Automatically scores every open Lost report against every open Found report (0-100%) using category match, building proximity, keyword overlap, and report date proximity, then alerts students when a likely match appears.
- **Ownership Claim Verification:** Finders attach a hidden verification question (for example, *"What sticker is on the back?"*). Claimants submit their answer and matric number; only the finder or Campus Security can approve or reject claims.
- **One-Time Handover Code:** When a claim is approved, UniFind generates a unique 6-character pickup code (e.g. `UF-8K4M`). At physical pickup, entering the code verifies the right student and marks the item **Returned**.
- **Privacy by Default:** Reporter email addresses and matric numbers stay hidden on public cards and are only revealed to Campus Security or to an approved claimant.
- **Validated Photo Uploads:** Photos are checked for image type and file size (max 2 MB) and automatically resized before saving.
- **Light & Dark Mode + Formula-Safe CSV Export:** Full dark theme support plus CSV log export for Campus Security with spreadsheet formula-injection protection.

## Two Modes: Demo Mode vs. Firebase Auth & Cloud Sync

> **Important:** Cloud sync and real authentication are **not active by default** until Firebase environment variables are configured.

### 1. Demo Mode (Default when `.env` is empty)
- Runs completely in the browser using `localStorage`.
- Student demo login accepts name, email, and matric number.
- Campus Security demo login uses the prototype code `sec123`.
- Great for quick local testing and portfolio previews without backend setup.

### 2. Real Firebase Auth & Cloud Sync (Optional Production Mode)
Set both variables in `.env` (or Vercel Environment Variables):

```bash
VITE_FIREBASE_DB_URL=https://<your-project>-default-rtdb.asia-southeast1.firebasedatabase.app
VITE_FIREBASE_API_KEY=<your-firebase-web-api-key>
```

When configured:
- The login screen automatically switches to **Firebase Email/Password Sign In & Create Account**.
- Roles (`STUDENT` / `SECURITY`) are stored in `/unifind/roles/<uid>` and enforced by [docs/FIREBASE_RULES.json](docs/FIREBASE_RULES.json).
- Each item is saved individually at `/unifind/items/<id>.json` with real-time `EventSource` (SSE) updates so concurrent edits never overwrite each other.

## Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Vite, Lucide Icons
- **Testing & CI:** Vitest unit tests + GitHub Actions CI (`tsc --noEmit`, `npm test`, `npm run build`)
- **Backend (Optional):** Firebase Authentication + Firebase Realtime Database

## Running Locally

```bash
npm install
npm test
npm run dev
```
