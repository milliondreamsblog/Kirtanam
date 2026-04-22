

---

## 🔍 Ashram-Connect — Full Code Audit

---

### 📊 Overall Rating: **7 / 10**

> A solid, well-thought-out product with real-world integrations (hardware biometrics, YouTube API, cron jobs, RBAC). The architecture is clean and the UI is polished. It loses marks mainly on code quality, maintainability, and lack of tests.

---

## ✅ What's GOOD

---

### 1. 🔐 Security — **9/10**
- **RLS on every table** — Every Supabase table has Row Level Security enabled. This is the right way to secure a Supabase app.
- **Role system is well-defined** — 6 clear roles (1=Super Admin → 6=Viewer) with DB-enforced constraints.
- **`YOUTUBE_API_KEY` is server-side only** — Not prefixed with `NEXT_PUBLIC_`, so it's never exposed to the browser. ✅
- **CRON endpoint is protected** — The sync route checks a `CRON_SECRET` bearer token before running.
- **`supabaseAdmin` (service role key) is server-side only** — Only used in API routes, never in client code.
- **Auth is centralized in `AuthGuard`** — All routes are wrapped, redirects are handled.

---

### 2. 🎬 Video Player — **9/10**
The `OptimizedVideoPlayer.tsx` is genuinely impressive:
- Uses **YouTube IFrame API** for full control (play/pause/seek).
- **Auto-fallback** to standard `<iframe>` if the API is blocked (ad-blockers, high-security laptops).
- **Media Session API** integration — shows video title/artist in the phone notification bar.
- **UI shields** over the YouTube logo and title bar prevent users from navigating away to YouTube.
- **Paused interceptor overlay** blocks the "related videos" grid that YouTube shows when paused.
- **Tab visibility persistence** — keeps playing if you switch tabs.
- **Sandbox attribute** on iframes for security.

---

### 3. 🔄 YouTube Sync — **8/10**
- **Full + Incremental sync modes** — Full sync fetches all videos and playlists; incremental only fetches the latest 50 (saves API quota).
- **Vercel Cron** runs daily at 2 AM (`"0 2 * * *"`) automatically.
- **Upsert on conflict** — re-syncing won't create duplicates.
- **Sync status tracking** — `sync_status` column tracks `idle/syncing/completed/error` per channel.
- **30-minute server-side cache** on the YouTube API route — avoids hammering the API quota.

---

### 4. 🏗️ Architecture — **8/10**
- Clean **Next.js App Router** structure.
- Good **separation of concerns** — `lib/`, `hooks/`, `components/`, `app/api/` are all well-defined layers.
- **BCDB profile claiming flow** is clever — pre-seeded profiles from BCDB roster get claimed when a user signs up with a matching email.
- **URL-driven state** — channel, video, playlist, and tab are all encoded in the URL query params, so links are shareable.
- **In-memory content cache** (`contentCache`) prevents redundant API calls during a session.

---

### 5. 🎨 UI/UX — **8/10**
- Responsive design for mobile and desktop.
- Skeleton loaders everywhere during loading states.
- Smooth animations (`animate-in`, `fade-in`, `slide-in-from-*`).
- Toast notifications for actions.
- Custom scrollbars, search with debounce (400ms timer).

---

## ❌ What's BAD / Needs Improvement

---

### 1. 🧱 God Components — **Critical**
The two biggest components are dangerously large:

| File | Lines | Problem |
|---|---|---|
| `AdminPanel.tsx` | **2700+ lines** | One component doing everything: users, YouTube, analytics, attendance, BCDB, policies |
| `YouTubeChannelHub.tsx` | **1200+ lines** | One component handling channels, search, player, favorites, playlists |

These should each be split into 5–10 focused sub-components. This makes debugging, testing, and future changes a nightmare.

---

### 2. 🔁 Auth Pattern Repeated Everywhere — **Major**
The same boilerplate is copy-pasted into **every single page**:

```Ashram-Connect/src/app/page.tsx#L17-25
useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingAuth(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);
```

This exact same block exists in `page.tsx`, `attendance/page.tsx`, `directory/page.tsx`, `policy-manual/page.tsx`, `class/page.tsx`. A **React Context (`AuthContext`)** should hold the session globally so every page doesn't need to re-subscribe.

---

### 3. 📦 `any` Type Overuse — **Major**
TypeScript is being bypassed constantly:

```Ashram-Connect/src/components/AdminPanel.tsx#L26-28
const [session, setSession] = useState<any>(null);
const [attendanceMappings, setAttendanceMappings] = useState<any[]>([]);
const [attendanceSettings, setAttendanceSettings] = useState<any>(null);
```

`any` is used in dozens of places — on sessions, API responses, state variables. This defeats the entire purpose of TypeScript. Proper interfaces should be defined for all data shapes.

---

### 4. 🔧 Multiple Supabase Client Creations — **Moderate**
Every API route recreates its own Supabase client:

```Ashram-Connect/src/app/api/admin/attendance-config/route.ts#L4-7
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

This is repeated in **12+ API routes**. There should be a single `lib/supabase-server.ts` that exports a shared server-side admin client.

---

### 5. 🚫 Zero Tests — **Major**
There are **no test files anywhere** in the project — no unit tests, no integration tests, no e2e tests. For a system managing real attendance records and member data, this is a significant risk.

---

### 6. 📝 No `.env.example` File — **Moderate**
The `.gitignore` correctly ignores `.env*` files, but there's **no `.env.example`** template checked into the repo. Any new developer has to dig through the code to find all the required variables.

---

### 7. 🖼️ `unoptimized: true` for All Images — **Moderate**
```Ashram-Connect/next.config.ts#L8-9
unoptimized: true, // Bypass Vercel image optimization to stay within free plan limits
```
This disables Next.js image optimization globally as a workaround for the free Vercel plan. A better solution would be to add Supabase storage URLs to `remotePatterns` and use self-hosted optimization or Cloudflare.

---

### 8. 🗄️ Deprecated/Risky Code — **Minor**
- **`substr` is deprecated** in `OptimizedVideoPlayer.tsx` (`Math.random().toString(36).substr(2, 9)` — should be `substring`).
- **`localStorage.getItem('supabase.auth.token')`** in `YouTubeChannelHub.tsx` — this is a Supabase v1 pattern and unreliable in v2.
- **`window.onYouTubeIframeAPIReady` override** — could conflict if multiple player instances exist.

---

### 9. 🚦 No Rate Limiting on API Routes — **Minor**
Public-facing API routes like `/api/youtube` and `/api/auth/bcdb-check` have no rate limiting. A bad actor could hammer them.

---

### 10. 💬 Console Logs Left in Production — **Minor**
Many `console.log` and `console.error` calls are left in throughout. These are fine for debugging but should be replaced with a proper logging strategy (or removed) in production.

---

## 🚀 How to Run Locally

### Step 1 — Prerequisites
Make sure you have installed:
- **Node.js** 18+ — [nodejs.org](https://nodejs.org)
- **pnpm** — run `npm install -g pnpm`

---

### Step 2 — Install Dependencies

```/dev/null/setup.sh#L1-3
cd Ashram-Connect
pnpm install
```

---

### Step 3 — Create Your `.env.local` File

Create a file called `.env.local` in the `Ashram-Connect/` root. Here are **all the environment variables** you need:

```/dev/null/.env.local#L1-20
# ─────────────────────────────────────────
# SUPABASE (Required)
# ─────────────────────────────────────────
# Your Supabase project URL
# Found at: supabase.com → Your Project → Settings → API → Project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co

# Your Supabase anon/public key (safe to expose to browser)
# Found at: supabase.com → Your Project → Settings → API → Project API Keys → anon/public
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...

# Your Supabase service role key (NEVER expose to browser — server-side only)
# Found at: supabase.com → Your Project → Settings → API → Project API Keys → service_role
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...

# ─────────────────────────────────────────
# YOUTUBE (Required for video browsing)
# ─────────────────────────────────────────
# YouTube Data API v3 Key
# Get it at: console.cloud.google.com → APIs & Services → Credentials → Create API Key
# Enable "YouTube Data API v3" in the API Library first
YOUTUBE_API_KEY=AIzaSy...

# ─────────────────────────────────────────
# CRON (Required for automated YouTube sync)
# ─────────────────────────────────────────
# Any secret string you make up — used to secure the /api/admin/youtube/sync-all endpoint
# On Vercel, add this same value under Project Settings → Environment Variables
CRON_SECRET=some-long-random-secret-string
```

---

### Step 4 — Set Up the Database

Run the SQL files in your Supabase SQL editor **in this order**:

| Order | File | Purpose |
|---|---|---|
| 1 | `schema.sql` | Core profiles table + RBAC |
| 2 | `rbac_schema.sql` | Role definitions and policies |
| 3 | `youtube_search_setup.sql` | `yt_videos`, `yt_playlists` tables |
| 4 | `attendance_schema.sql` | ZKTeco physical attendance |
| 5 | `harinam_attendance_schema.sql` | Harinam session tracking |
| 6 | `attendance_bcdb_schema.sql` | BCDB attendance link |
| 7 | `attendance_exceptions_schema.sql` | Exception requests |
| 8 | `attendance_mapping.sql` | ZK device → user mapping |
| 9 | `attendance_config.sql` | Device config |
| 10 | `user_visits.sql` | User visit tracking |
| 11 | `user_favorites_schema.sql` | Video favourites |
| 12 | `policies_schema.sql` | Policy documents |
| 13 | `fuzzy_search_setup.sql` | Full-text search indexes |
| 14 | `attendance_rls.sql` | RLS policies for attendance |
| 15 | `fix_analytics_rls.sql` | Fix analytics RLS |

> Go to **supabase.com → Your Project → SQL Editor** and run each file.

---

### Step 5 — Run the Dev Server

```/dev/null/run.sh#L1-2
pnpm dev
# App starts at http://localhost:3100
```

---

### 🔑 Where to Get Each Key

| Variable | Where to Get It |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | [supabase.com](https://supabase.com) → Project → Settings → API → **Project URL** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page → **anon / public** key |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page → **service_role** key (keep secret!) |
| `YOUTUBE_API_KEY` | [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials → Create API Key → Enable **YouTube Data API v3** |
| `CRON_SECRET` | Just make up any random string (e.g. use [randomkeygen.com](https://randomkeygen.com)) |

---

### ⚠️ Quick Gotchas
- The dev server runs on **port 3100**, not the default 3000.
- You need at least **one row in `youtube_channels`** table (with a real YouTube Channel ID) before the home page will show anything.
- For attendance to work, you'll need a ZKTeco device or to manually insert test rows into `physical_attendance`.
- The cron job only works on **Vercel** — locally you'd need to manually call `GET /api/admin/youtube/sync-all` with the `Authorization: Bearer <CRON_SECRET>` header.