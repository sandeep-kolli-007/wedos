# WedOS

**Wedding Operations, beautifully connected.** A planner-first workspace for running Indian weddings end to end—from client onboarding and multi-event timelines to vendor coordination, budgets, payment milestones, and creative approvals.

## Product direction

WedOS is designed for professional wedding planners managing multiple celebrations and a distributed vendor team. The product combines a calm operations dashboard with a connected planning and design workspace.

### Current foundation

- Responsive Next.js App Router application with a bespoke dashboard UI
- Overview for active weddings, budget commitments, approvals, tasks, upcoming events, and vendor activity
- Interactive task completion, task creation, dashboard search, and navigation states (sample data at this stage)
- Supabase/Postgres migration for workspaces, memberships, clients, weddings, events, tasks, vendors, bookings, budgets, payment milestones, design assets, documents, and activity history
- Workspace-scoped Row Level Security policies as a starting point for tenant isolation

## Tech stack

- Next.js 15, React 19, TypeScript
- Supabase Auth + PostgreSQL
- Lucide icons; custom CSS design system

## Run locally

Requirements: Node.js 20.9+ and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

The dashboard currently uses illustrative seed data and works without Supabase credentials. Connect a Supabase project before enabling persisted records or authentication.

## Supabase setup

1. Create a Supabase project.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.
3. Apply `supabase/migrations/0001_core_schema.sql` using the Supabase CLI or SQL editor.
4. Review RLS policies against the roles and access model you intend to ship before using real client data.

Never expose a Supabase service-role key in the browser. Production onboarding should create the workspace and owner membership atomically, and server-side writes should validate workspace membership and role.

## Important status

This is the initial implementation foundation, not yet a production-ready multi-user service. Authentication flows, persisted CRUD, invitation/onboarding, automated tests, audit retention, file storage policies, and deployment configuration remain to be implemented and verified.
