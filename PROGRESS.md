# Ashram-Connect — Refactoring Progress Tracker

> **Project**: Ashram-Connect (internal name: `yt-lectures-app`)
> **Stack**: Next.js 16 · React 19 · TypeScript · Supabase · Tailwind CSS v4 · TanStack Query v5
> **Goal**: Audit, refactor, and improve the codebase quality incrementally without breaking existing functionality.

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Audit Findings — Full List](#2-audit-findings--full-list)
3. [Refactoring Tasks](#3-refactoring-tasks)
4. [Completed Work](#4-completed-work)
5. [In Progress](#5-in-progress)
6. [Backlog](#6-backlog)
7. [File Map — New Structure](#7-file-map--new-structure)
8. [Environment Variables Reference](#8-environment-variables-reference)
9. [How to Run Locally](#9-how-to-run-locally)

---

## 1. Project Overview

Ashram-Connect is a **private community portal** for a devotional/ashram organisation. It has two core pillars:

| Pillar | Description |
|---|---|
| 🎬 **Spiritual Library** | Curated YouTube viewer — admin-approved channels only, no ads, no related videos, embedded playback |
| 🏛️ **Operations Platform** | Attendance tracking (ZKTeco biometric + manual Harinam), member directory, policy documents, admin dashboards |

### Architecture at a Glance

```
Browser (Next.js App Router)
    │
    ├── /api/* (Next.js Route Handlers)
    │       ├── /api/youtube/*          → YouTube Data API v3
    │       ├── /api/admin/*            → Admin CRUD (requires role=1)
    │       ├── /api/attendance/*       → ZKTeco + Harinam attendance
    │       ├── /api/user/favorites     → Per-user saved videos
    │       └── /api/auth/bcdb-check    → BCDB membership gate
    │
    └── Supabase (PostgreSQL + Auth + Storage)
            ├── profiles                → Users + roles (1–6)
            ├── youtube_channels        → Admin-approved channel list
            ├── yt_videos / yt_playlists→ Synced video metadata
            ├── physical_attendance     → ZKTeco hardware logs
            ├── user_favorites          → Per-user video bookmarks
            └── ...more (see SQL files)
```

### Role System (Database-enforced)

| Role # | Name | Access |
|---|---|---|
| 1 | Super Admin | Everything |
| 2 | Video Uploader | BC Class upload |
| 3 | Attendance Incharge | Bulk Harinam marking |
| 4 | BC Access | Attendance records |
| 5 | Manager | TBD |
| 6 | Viewer | YouTube library only (default) |

---

## 2. Audit Findings — Full List

Findings from the initial codebase audit. Each item has a severity, status, and reference to the task that addresses it.

| # | Finding | Severity | Status | Task Ref |
|---|---|---|---|---|
| A1 | God Component — `YouTubeChannelHub.tsx` (1,208 lines) | 🔴 Critical | ✅ Done | T1 |
| A2 | God Component — `AdminPanel.tsx` (2,700+ lines) | 🔴 Critical | ⬜ Backlog | T2 |
| A3 | No state/data-fetching library — 20+ manual `loading/data/error` triplets | 🔴 Critical | ✅ Done | T3 |
| A4 | Auth pattern copy-pasted into every page (`getSession` + `onAuthStateChange`) | 🟠 Major | ⬜ Backlog | T4 |
| A5 | `any` type used 50+ times — defeats TypeScript | 🟠 Major | ⬜ Backlog | T5 |
| A6 | Every API route creates its own Supabase client (12+ duplicates) | 🟡 Moderate | ⬜ Backlog | T6 |
| A7 | Zero tests — no unit, integration, or e2e | 🟠 Major | ⬜ Backlog | T7 |
| A8 | No `.env.example` file — new devs must grep for env vars | 🟡 Moderate | ✅ Done | T8 |
| A9 | `unoptimized: true` globally in `next.config.ts` (free-plan workaround) | 🟡 Moderate | ⬜ Backlog | T9 |
| A10 | `substr` deprecated in `OptimizedVideoPlayer.tsx` | 🟢 Minor | ⬜ Backlog | T10 |
| A11 | `localStorage.getItem('supabase.auth.token')` — Supabase v1 pattern in v2 | 🟢 Minor | ✅ Fixed (in T3) | T3 |
| A12 | No rate limiting on public API routes | 🟢 Minor | ⬜ Backlog | T11 |
| A13 | `console.log` / `console.error` left in production code | 🟢 Minor | ⬜ Backlog | T12 |
| A14 | README is generic Next.js boilerplate — no project-specific docs | 🟢 Minor | ⬜ Backlog | T13 |

---

## 3. Refactoring Tasks

### T1 — Split `YouTubeChannelHub.tsx` ✅ DONE

**Before**: 1 file · 1,208 lines · 171 symbols  
**After**: 1 thin orchestrator (233 lines) + 5 hooks + 5 components

### T2 — Split `AdminPanel.tsx` ⬜ NOT STARTED

**Before**: 1 file · 2,700+ lines · 510 symbols  
**After**: 1 shell + 6 view components + 4 hooks (planned)

### T3 — Install & integrate TanStack Query (React Query v5) ✅ DONE

**Before**: 20+ manual `useState` loading/data/error triplets, hand-rolled cache  
**After**: `useQuery` / `useInfiniteQuery` / `useMutation` everywhere

### T4 — Create Auth Context ⬜ BACKLOG

**Before**: Same `getSession` + `onAuthStateChange` boilerplate in 5 pages  
**After**: Single `AuthContext` + `useAuth()` hook

### T5 — Eliminate `any` types ⬜ BACKLOG

Replace all `any` with proper interfaces/types across components and API routes.

### T6 — Shared Supabase server client ⬜ BACKLOG

Create `src/lib/supabase-server.ts` that exports a single shared admin client for API routes.

### T7 — Add tests ⬜ BACKLOG

Add Vitest unit tests for hooks and utility functions. Add Playwright e2e for critical flows.

### T8 — Create `.env.example` ✅ DONE

Documented during audit. File created with all required variables.

### T9 — Fix image optimisation ⬜ BACKLOG

Add Supabase storage hostname to `remotePatterns` and remove the global `unoptimized: true`.

### T10 — Fix deprecated `substr` ⬜ BACKLOG

Replace `substr(2, 9)` with `substring(2, 11)` in `OptimizedVideoPlayer.tsx`.

### T11 — Rate limiting ⬜ BACKLOG

Add rate limiting to `/api/youtube`, `/api/auth/bcdb-check`, and other public endpoints.

### T12 — Remove production console logs ⬜ BACKLOG

Replace with a proper logger or remove entirely.

### T13 — Update README ⬜ BACKLOG

Replace generic Next.js boilerplate with real project documentation.

---

## 4. Completed Work

### ✅ T3 — TanStack Query Setup

**Installed:**
```
pnpm add @tanstack/react-query @tanstack/react-query-devtools
```

**Files created:**

| File | Purpose |
|---|---|
| `src/app/providers.tsx` | `QueryClientProvider` wrapper with devtools |
| `src/app/layout.tsx` | Updated — wraps app in `<Providers>` |
| `src/hooks/useDebounce.ts` | Generic reusable debounce hook (400ms default) |

**QueryClient defaults set:**
- `staleTime: 5 * 60 * 1000` (5 min default)
- `retry: 1`
- `refetchOnWindowFocus: false`

---

### ✅ T1 — YouTubeChannelHub Split

**Before → After line counts:**

| File | Before | After |
|---|---|---|
| `YouTubeChannelHub.tsx` | 1,208 lines | 233 lines (thin orchestrator) |
| New files created | — | 12 new files |

**New file structure:**

```
src/components/
├── YouTubeChannelHub.tsx              ← 233 lines (was 1,208) — orchestrator only
│
└── youtube-hub/
    ├── types.ts                       ← Shared interfaces (VideoItem, Channel, etc.)
    │
    ├── hooks/
    │   ├── useChannels.ts             ← Replaces: channels state + fetch + setLoadingChannels
    │   ├── useVideoContent.ts         ← Replaces: contentCache + fetchedRef + loading + fetchContent
    │   ├── useFavorites.ts            ← Replaces: favorites state + toggleFavorite + loadingFavorites
    │   ├── useGlobalSearch.ts         ← Replaces: performGlobalSearch useEffect + debounce timer
    │   └── useVideoMetadata.ts        ← Replaces: fetchedVideoMetadata + single-video fetch useEffect
    │
    ├── components/
    │   ├── ChannelSidebarNav.tsx      ← Desktop sticky sidebar + mobile horizontal scroll
    │   ├── VideoPlayerSection.tsx     ← OptimizedVideoPlayer + info card + action buttons
    │   └── VideoListSidebar.tsx       ← Search input + video cards list + load more
    │
    └── views/
        ├── ChannelPickerPage.tsx      ← Home: channel grid + global search results
        └── ChannelViewPage.tsx        ← Per-channel: banner + tabs + player + list

src/hooks/
└── useDebounce.ts                     ← Generic debounce hook
```

**What each hook replaced:**

| New Hook | Old Code Replaced | Lines Saved |
|---|---|---|
| `useChannels` | `fetchChannels` useEffect + `channels` + `loadingChannels` state | ~30 lines |
| `useVideoContent` | `contentCache` + `fetchedRef` + `loading` + `loadMoreLoading` + `error` + `fetchContent` callback | ~80 lines |
| `useFavorites` | `favorites` + `favoriteVideos` + `loadingFavorites` + `toggleFavorite` + `fetchFavorites` | ~70 lines |
| `useGlobalSearch` | `globalResults` + `isSearchingGlobal` + debounced `performGlobalSearch` useEffect | ~40 lines |
| `useVideoMetadata` | `fetchedVideoMetadata` + one-off fetch useEffect | ~25 lines |

**Key improvements delivered by the refactor:**

- ✅ `contentCache` (hand-rolled Map) → React Query cache with `staleTime: 30min` (mirrors API `Cache-Control`)
- ✅ Deprecated `localStorage.getItem('supabase.auth.token')` removed — now uses `supabase.auth.getSession()`
- ✅ Optimistic updates in `useFavorites` — heart button responds instantly before server confirms
- ✅ `useInfiniteQuery` for video content — "Load More Archives" works via `fetchNextPage()` / `hasNextPage`
- ✅ Search debounce moved inside `useGlobalSearch` hook — no more manual `setTimeout` in component
- ✅ `VideoListSidebar` search reset uses React key-based remount pattern instead of `setState` in `useEffect`
- ✅ `YouTubeChannelHub` orchestrator owns only: URL read/write, notification state, share modal, `playerRef`

---

### ✅ T8 — Environment Variables Documented

All required environment variables for local development:

| Variable | Required | Where to Get |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase → Project → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase → Project → Settings → API → anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase → Project → Settings → API → service_role key ⚠️ Keep secret |
| `YOUTUBE_API_KEY` | ✅ | Google Cloud Console → APIs & Services → Credentials → YouTube Data API v3 |
| `CRON_SECRET` | ✅ | Any random string — secures the `/api/admin/youtube/sync-all` cron endpoint |

---

## 5. In Progress

> Nothing actively in progress right now. See Backlog for next steps.

---

## 5a. Ready to Start Next

### ⬜ T2 — Split `AdminPanel.tsx`

**Current state:** `AdminPanel.tsx` is untouched at 2,700+ lines. Only two empty directories were created as placeholders:
- `src/components/admin-views/` — empty
- `src/components/admin-views/hooks/` — empty

The `BCDBManager.tsx` and `AdminPolicyManager.tsx` sub-components were already extracted previously (before this refactor session), but the main panel still contains 6 views fully inline.

**Planned split:**

```
src/components/
├── AdminPanel.tsx                     ← Will become: shell + router only (~100 lines)
│
└── admin-views/
    ├── hooks/
    │   ├── useAdminUsers.ts           ← useQuery + useMutation for user management
    │   ├── useAdminLectures.ts        ← useQuery + useMutation for BC class videos
    │   ├── useAdminYouTube.ts         ← useQuery + useMutation for channel management
    │   └── useAdminAnalytics.ts       ← useQuery for stats + visit history
    │
    └── views/
        ├── AdminHomeView.tsx          ← Dashboard stat cards
        ├── AdminLecturesView.tsx      ← BC Class upload + CRUD (~400 lines extracted)
        ├── AdminUsersView.tsx         ← User management + role editing (~300 lines extracted)
        ├── AdminYouTubeView.tsx       ← YouTube channel management + sync (~250 lines extracted)
        ├── AdminAnalyticsView.tsx     ← Charts + visit history (~300 lines extracted)
        └── AdminAttendanceMachinesView.tsx ← Devices + ZK mappings (~400 lines extracted)
```

**Views already handled by existing components (no work needed):**
- `attendance-tracing` → already uses `<AttendanceTracing />` component
- `bcdb` → already uses `<BCDBManager />` component
- `policies` → already uses `<AdminPolicyManager />` component

**Next step:** Start with `AdminUsersView` + `useAdminUsers` (most isolated, lowest risk).

---

## 6. Backlog

Items prioritised roughly by impact vs effort:

| Priority | Task | Impact | Effort | Notes |
|---|---|---|---|---|
| 🔥 High | T2 — Split AdminPanel.tsx | High | Medium | **Next up — directories created, no files written yet** |
| 🔥 High | T4 — Auth Context | High | Low | Eliminates boilerplate in 5 pages |
| 🔥 High | T5 — Remove `any` types | High | Medium | Do alongside T2 for new files |
| 🟡 Medium | T6 — Shared Supabase server client | Medium | Low | Quick win, 1 file change |
| 🟡 Medium | T9 — Fix image optimisation | Medium | Low | Add Supabase URL to remotePatterns |
| 🟡 Medium | T13 — Update README | Medium | Low | Docs win |
| 🟢 Low | T7 — Add tests | High | High | Start with hook unit tests |
| 🟢 Low | T10 — Fix `substr` | Low | Very Low | 1-line fix |
| 🟢 Low | T11 — Rate limiting | Medium | Medium | Add to public endpoints |
| 🟢 Low | T12 — Remove console logs | Low | Low | Sweep before production |

---

## 7. File Map — New Structure

Full map of every file touched or created during this refactor session:

### Created
```
src/app/providers.tsx
src/hooks/useDebounce.ts
src/components/youtube-hub/types.ts
src/components/youtube-hub/hooks/useChannels.ts
src/components/youtube-hub/hooks/useVideoContent.ts
src/components/youtube-hub/hooks/useFavorites.ts
src/components/youtube-hub/hooks/useGlobalSearch.ts
src/components/youtube-hub/hooks/useVideoMetadata.ts
src/components/youtube-hub/components/ChannelSidebarNav.tsx
src/components/youtube-hub/components/VideoPlayerSection.tsx
src/components/youtube-hub/components/VideoListSidebar.tsx
src/components/youtube-hub/views/ChannelPickerPage.tsx
src/components/youtube-hub/views/ChannelViewPage.tsx
src/components/admin-views/                              ← directory created, EMPTY — no files yet
src/components/admin-views/hooks/                        ← directory created, EMPTY — no files yet
PROGRESS.md                                              ← this file
```

### Modified
```
src/app/layout.tsx                ← Wrapped with <Providers>
src/components/YouTubeChannelHub.tsx  ← Rewritten as thin orchestrator (1,208 → 233 lines)
package.json                      ← Added @tanstack/react-query + devtools
```

### Untouched (no changes yet)
```
src/components/AdminPanel.tsx          ← T2 — next up
src/components/AttendanceTracing.tsx   ← No changes needed
src/components/BCDBManager.tsx         ← No changes needed
src/components/AdminPolicyManager.tsx  ← No changes needed
src/app/api/**                         ← No changes yet (T6 will touch these)
src/hooks/useProfile.ts                ← T4 will refactor this
```

---

## 8. Environment Variables Reference

Create a `.env.local` file in the project root:

```env
# ── Supabase ──────────────────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...

# ── YouTube ───────────────────────────────────────────────────────────────────
YOUTUBE_API_KEY=AIzaSy...

# ── Cron ─────────────────────────────────────────────────────────────────────
CRON_SECRET=some-long-random-secret-string
```

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` must **never** be prefixed with `NEXT_PUBLIC_` — it bypasses Row Level Security and must only be used in server-side API routes.

### Database Setup Order

Run these SQL files in your Supabase SQL Editor in this order:

1. `schema.sql` — core profiles + RBAC
2. `rbac_schema.sql` — role policies
3. `youtube_search_setup.sql` — yt_videos, yt_playlists tables
4. `attendance_schema.sql` — ZKTeco physical attendance
5. `harinam_attendance_schema.sql` — Harinam session tracking
6. `attendance_bcdb_schema.sql` — BCDB attendance link
7. `attendance_exceptions_schema.sql` — exception requests
8. `attendance_mapping.sql` — device → user mapping
9. `attendance_config.sql` — device config
10. `user_visits.sql` — visit tracking
11. `user_favorites_schema.sql` — video favourites
12. `policies_schema.sql` — policy documents
13. `fuzzy_search_setup.sql` — full-text search indexes
14. `attendance_rls.sql` — RLS for attendance tables
15. `fix_analytics_rls.sql` — analytics RLS fix

---

## 9. How to Run Locally

```bash
# 1. Install dependencies
pnpm install

# 2. Create environment file (see Section 8)
cp .env.example .env.local   # (once .env.example is created — T8)
# then fill in your values

# 3. Run development server (note: port 3100, not 3000)
pnpm dev

# Local app is available at http://localhost:3100
# Production app is available at https://kirtanam.vercel.app
```

### Triggering YouTube Sync Manually (local)

The Vercel cron job runs at 2 AM daily in production. To trigger it locally:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3100/api/admin/youtube/sync-all
```

Production endpoint:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://kirtanam.vercel.app/api/admin/youtube/sync-all
```

---

## Changelog

| Date | What Changed |
|---|---|
| Session 1 | Initial codebase analysis + architecture mapping |
| Session 2 | Full audit — 14 findings identified and rated |
| Session 2 | Decided on TanStack Query v5 for server state management |
| Session 2 | Installed `@tanstack/react-query` + `@tanstack/react-query-devtools` |
| Session 2 | Created `providers.tsx` + updated `layout.tsx` |
| Session 2 | Created `useDebounce`, `useChannels`, `useVideoContent`, `useFavorites`, `useGlobalSearch`, `useVideoMetadata` |
| Session 2 | Split `YouTubeChannelHub.tsx` (1,208 lines) into 5 hooks + 5 components + 1 thin orchestrator (233 lines) |
| Session 2 | Created this `PROGRESS.md` tracking document |
| Session 2 | Corrected `AdminPanel.tsx` split status — only empty directories exist, no files written |

---

*Last updated: Session 2*
