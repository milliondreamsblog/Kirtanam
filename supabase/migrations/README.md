# Database migrations

These SQL files set up the Postgres schema, RLS policies, and search helpers
used by Ashram-Connect on Supabase.

## How to run

In a fresh Supabase project, open **SQL Editor** and run the files **in
filename order** (the numeric prefix is the run order). They are idempotent
where possible (`CREATE TABLE IF NOT EXISTS`, etc.), so re-running an earlier
file should be safe.

```
001_core_schema.sql            – profiles + extensions (run first)
002_rbac.sql                   – roles, helpers, role-based policies
003_policies.sql               – additional RLS policies
004_account_access.sql         – per-account access control
005_channel_access.sql         – per-user YouTube channel restriction

010_attendance.sql             – attendance core
011_attendance_config.sql
012_attendance_mapping.sql
013_attendance_rls.sql
014_attendance_exceptions.sql
015_attendance_bcdb.sql
016_harinam_attendance.sql

020_user_favorites.sql
021_sync_refinements.sql

030_user_visits.sql
031_user_visits_migration.sql
032_backfill_visits.sql
033_profiles_tracking.sql

040_fuzzy_search.sql           – pg_trgm setup
041_youtube_search.sql

050_fix_analytics_rls.sql      – patch
060_check_rls.sql              – verification queries (read-only)
070_data.sql                   – seed data slot (currently empty)
071_schema_utf8.sql            – legacy stub
```

> **Note:** `001_core_schema.sql` is currently saved as UTF-16. If your SQL
> editor rejects it, re-save the file as UTF-8 first.

## Groups

| Range   | Concern                     |
| ------- | --------------------------- |
| 001–005 | Core schema, auth, RBAC     |
| 010–016 | Attendance subsystem        |
| 020–021 | Favorites / sync            |
| 030–033 | User visits / tracking      |
| 040–041 | Search (trigram + YouTube)  |
| 050–060 | Patches / verification      |
| 070+    | Seed data / legacy          |
