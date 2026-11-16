# Tracker360

Every Lead. Every Follow-up. Every Opportunity. One Tracker.

Centralised BDO lead management for AiVision360 — Next.js (App Router) + Supabase
(Postgres, Auth, RLS). Built so every lead, outreach, follow-up and response is
shared in real time across the whole team.

## Setup

1. Create a Supabase project.
2. Run the SQL migrations in order against it (SQL editor or `supabase db push`):
   - `supabase/migrations/0001_init.sql` — schema (leads, contacts, activities, responses, meetings, follow-ups, notifications, import history)
   - `supabase/migrations/0002_automation.sql` — follow-up automation (2-day auto-reschedule), response/meeting RPCs, daily sweep function
   - `supabase/migrations/0003_rls.sql` — row-level security + auto-create profile on signup
3. In Supabase Auth settings, enable the **Email OTP / Magic Link** provider (no password).
4. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (used server-side only, for inviting team members — never exposed to the client)
5. `npm install && npm run dev`
6. Sign in once yourself via magic link — your profile row is created automatically.
   Promote yourself to admin in SQL:
   ```sql
   update profiles set role = 'admin' where email = 'you@aivision360.com';
   ```
7. From **Team Management**, invite the rest of the team (Monica, Sujitha, Dhinesh, Kezi, Arun, George) — this sends each of them a magic-link invite email.

## Daily follow-up sweep

`supabase/functions/daily-sweep` generates "due today" / "overdue" / "meeting
tomorrow" notifications. Deploy and schedule it once a Supabase CLI link is set up:

```bash
supabase functions deploy daily-sweep
supabase functions schedule create daily-sweep --cron "0 2 * * *"
```

## What's built (phase 1 — core workflow)

- Central Postgres lead database shared by all authenticated team members (RLS-enforced)
- Magic-link auth, auto-provisioned profiles, admin/BDO roles
- Excel/CSV import with column mapping, preview, duplicate detection (by company name or email), skip/update choice, and import history
- New Leads / All Leads / Previously Tracked views with search
- Lead profile with full activity timeline
- Status-driven automation: moving a lead to "Outreach Sent" auto-schedules a follow-up 2 days out; "Mark Done & Reschedule" rolls it forward another 2 days until the prospect responds or the lead closes
- Mandatory structured capture for responses (outcome, channel, next action) and meetings
- Dashboard KPIs, pipeline breakdown, today's/overdue follow-ups, recent leads
- In-app notifications (assignment, follow-up due/overdue, response received, meeting upcoming)
- Reports page comparing BDO performance (leads, outreach, responses, meetings, conversions, overdue)

## What's built (phase 2)

- Excel export: full list, current filtered view, or just the selected rows, plus a blank import template download
- Bulk actions on the All Leads table — multi-select rows, bulk status change, bulk reassignment
- Saved custom filters (per-user) on the All Leads view, plus source/priority/assignee/date-range filters and sort order
- Audit Log page — full activity history across all leads, filterable by team member (`supabase/migrations/0004_saved_filters.sql` also adds the `bulk_update_status` / `bulk_update_assignment` RPCs used here)

## Not yet built / stubbed

- Email/browser push notifications (in-app only for now)
