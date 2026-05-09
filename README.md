# Ashram-Connect

A personalized YouTube-style lecture app for monastic communities. Built with
Next.js 16 + Supabase, with a Capacitor wrapper for Android.

Live site: https://kirtanam.vercel.app

> **Heads-up for OSS contributors:** the repo's git history may contain a
> `.env.local` reference and earlier development used now-rotated credentials.
> If you are forking from a snapshot rather than the public OSS release,
> **rotate your own Supabase service-role key, database password, and YouTube
> API key** before you publish or deploy. Never commit `.env.local`.

---

## Repo layout

```
.
├── src/                         Next.js app (app router)
│   ├── app/                     Routes + API handlers
│   ├── components/
│   ├── hooks/
│   └── lib/                     Supabase clients, helpers
├── public/                      Static assets
├── android/                     Capacitor Android project
├── supabase/
│   └── migrations/              Numbered SQL migrations (run in order)
├── scripts/                     Maintenance / one-off Node scripts
│   └── legacy/                  Older / archived helpers
├── docs/                        Design notes, progress log
├── resources/                   App icons / splash sources
├── capacitor.config.ts
├── next.config.ts
└── package.json
```

---

## Local install guide

### 1. Prerequisites

| Tool             | Version             | Notes                                     |
| ---------------- | ------------------- | ----------------------------------------- |
| Node.js          | 20.x                | Pinned in `package.json` `engines`        |
| pnpm             | 10.x                | Project uses pnpm (see `pnpm-lock.yaml`)  |
| Git              | any recent          |                                           |
| Supabase project | free tier is fine   | https://supabase.com                      |
| YouTube Data API | v3 key              | https://console.cloud.google.com          |
| Android Studio   | optional            | Only needed to build the Android wrapper  |

Install pnpm if you don't have it:

```bash
npm install -g pnpm@10
```

### 2. Clone and install

```bash
git clone https://github.com/<your-fork>/Ashram-Connect.git
cd Ashram-Connect
pnpm install
```

### 3. Configure environment

```bash
cp .env.example .env.local
```

Then open `.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` – from your
  Supabase project's **Settings → API** page.
- `SUPABASE_SERVICE_ROLE_KEY` – same page, *server-only* (never expose).
- `DATABASE_URL` – **Settings → Database → Connection string** (use the
  direct connection, not the pooler, for migrations).
- `YOUTUBE_API_KEY` – a Google Cloud project key with the YouTube Data API
  v3 enabled.
- `CRON_SECRET` – any long random string (`openssl rand -hex 32` works).

### 4. Set up the database

In your Supabase project's **SQL Editor**, run every file in
`supabase/migrations/` **in filename order** (the numeric prefix is the run
order). See [`supabase/migrations/README.md`](supabase/migrations/README.md)
for the grouping.

The minimum required to boot the app is the `001`–`005` range plus the
search files (`040`, `041`). The attendance/visits modules can be added
later.

### 5. Create the first admin user

1. Sign up a normal user through the running app, or directly in Supabase
   **Authentication → Users**.
2. Promote them to admin:

```bash
node scripts/create-admin.js <email> <password>
```

### 6. Run the dev server

```bash
pnpm dev
```

Open http://localhost:3100 — the dev server is pinned to port 3100 (see
`package.json`).

### 7. Production build

```bash
pnpm build
pnpm start
```

---

## Android (optional)

The Android wrapper uses Capacitor and lives in `android/`.

```bash
pnpm app:sync       # copy web build into the Android project
pnpm app:open       # open in Android Studio
pnpm app:assets     # regenerate launcher icons + splash from resources/
```

You need Android Studio + a configured Android SDK to build the APK.

---

## Project scripts

| Command           | What it does                               |
| ----------------- | ------------------------------------------ |
| `pnpm dev`        | Next.js dev server on port 3100            |
| `pnpm build`      | Production build                           |
| `pnpm start`      | Run the production build                   |
| `pnpm lint`       | ESLint                                     |
| `pnpm app:add`    | `cap add android` (one-time)               |
| `pnpm app:sync`   | `cap sync android`                         |
| `pnpm app:open`   | Open Android Studio                        |
| `pnpm app:assets` | Regenerate Android launcher/splash assets  |

Maintenance scripts live in `scripts/`:

- `scripts/create-admin.js` – promote a user to the admin role.
- `scripts/check_logs.js`   – tail recent attendance rows.
- `scripts/extract_cols.js` – dev helper.
- `scripts/legacy/`         – archived one-off scripts, kept for reference.

---

## Tech stack

- **Next.js 16** (App Router) + React 19
- **Supabase** (Postgres, Auth, RLS)
- **TanStack Query** for data fetching
- **Tailwind CSS v4**
- **Capacitor 6** for the Android wrapper
- **Recharts** for analytics views

---

## Contributing

Issues and PRs welcome. Before opening a PR:

1. Run `pnpm lint` and `pnpm build` and make sure both pass.
2. If you add a database change, drop a new numbered migration file in
   `supabase/migrations/` rather than editing an existing one.
3. Don't commit `.env.local`, build artifacts, or `node_modules`.

---

## License

TBD — add a license file before publishing.
