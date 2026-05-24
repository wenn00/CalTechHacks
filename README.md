# Mycellium

ARDD Conference App by **Pepto Bismol**.

Two surfaces:

1. **Mycellium app** — Next.js attendee directory, matching, onboarding, and real-time messaging.
2. **ARDD Community Bot (Claw Bot)** — a single `/ardd` Slack slash command for community-level interactions during the conference.

---

## Table of contents

- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Local setup](#local-setup)
  - [Daily startup](#daily-startup-every-time-you-sit-down-to-work)
  - [First-time setup](#first-time-setup)
    - [Frontend (Mycellium app)](#frontend-mycellium-app)
    - [Backend (REST API + Socket.IO + Slack bot)](#backend-rest-api--socketio--slack-bot)
- [`/ardd` Slack bot](#ardd-slack-bot)
  - [Subcommands](#subcommands)
  - [Daily digest](#daily-digest)
  - [Setup walkthrough](#setup-walkthrough)
  - [Demo data](#demo-data)
  - [Archive export](#archive-export)
  - [Adding a new subcommand](#adding-a-new-subcommand)
  - [User contribution slots](#user-contribution-slots)
- [Troubleshooting](#troubleshooting)

---

## Tech stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Frontend | Next.js 14 + React 18 + TypeScript + Tailwind | Auth-aware navbar, attendee directory, onboarding flow |
| Backend | Express 4 + TypeScript, Socket.IO 4 for realtime messaging | Single process also hosts the Slack bot + cron |
| Database | PostgreSQL (Supabase) + Prisma 5 ORM | `prisma db push` workflow, no migrations folder |
| Auth | Supabase Auth (Google OAuth + email OTP) | JWT verified server-side |
| Slack | `@slack/bolt@^4` over Socket Mode | No public URL / ngrok needed |
| Scheduler | `node-cron` with explicit timezone | Daily digest at 18:00 conference time |
| Validation | Zod | All API inputs |

## Project structure

```
.
├── app/                     Next.js routes (page.tsx, login/, onboarding/, directory/)
├── components/              Shared React components (Navbar, onboarding steps)
├── lib/                     Frontend Supabase client
├── types/                   Frontend TS types
├── features/                Standalone helper modules (schedule-navigator, ...)
├── backend/                 Express + Prisma + Slack bot
│   ├── src/
│   │   ├── app.ts           Express app setup
│   │   ├── index.ts         Entrypoint (HTTP + Socket.IO + bot + cron, gated)
│   │   ├── lib/             Prisma client, getEffectiveNow time helper
│   │   ├── config/          env loader
│   │   ├── controllers/     REST handlers
│   │   ├── routes/          /api routes
│   │   ├── services/        Domain services (session-query, impression, digest, ...)
│   │   ├── sockets/         Socket.IO event handlers (messaging)
│   │   ├── bot/             Slack bot — slack.ts, dispatch.ts, handlers/, render/, middleware/
│   │   └── cron/            node-cron jobs (daily digest)
│   ├── prisma/
│   │   ├── schema.prisma    All models (existing + bot)
│   │   ├── seed.ts          Existing attendee seed
│   │   ├── seed-bot-demo.ts Demo content for /ardd
│   │   └── backfill-conference-dates.ts
│   └── scripts/
│       └── export-archive.ts  End-of-conference JSON dump
└── slack/
    └── app-manifest.yaml    Paste into Slack App Manifest UI
```

---

## Local setup

### Daily startup (every time you sit down to work)

Open **two terminal tabs** in the repo root.

```bash
# Tab 1 — backend (REST API + Slack bot + daily-digest cron)
cd backend && ENABLE_SLACK_BOT=true ENABLE_DAILY_DIGEST_CRON=true npm run dev   # → http://localhost:3001

# Tab 2 — frontend
npm run dev                                                                     # → http://localhost:3000
```

Open <http://localhost:3000>. Stop with `Ctrl+C` in each tab.

> Omit `ENABLE_SLACK_BOT` / `ENABLE_DAILY_DIGEST_CRON` (or set them to `false`) to run the REST API alone — the Slack bot and cron will stay dormant. This is the right mode for tests, scripts, and anything that just imports `index.ts`.

Quick health check (any tab):

```bash
curl -sS -o /dev/null -w "frontend %{http_code}\n" http://localhost:3000
curl -sS -o /dev/null -w "backend  %{http_code}\n" http://localhost:3001/api/attendees/filters
```

Both should print `200`. If a port is busy from a previous session: `kill $(lsof -ti:3000)` or `:3001`.

### First-time setup

Only needed after a fresh clone or after the schema changes.

#### Prerequisites

- Node.js ≥ 18 (recommended ≥ 20)
- npm (the lockfiles are npm-format)
- A Supabase project (free tier is fine) — get the project ref + database password ready
- A Slack workspace where you can install custom apps (only needed for `/ardd`)

The frontend and backend are separate npm projects. They run side-by-side: frontend on `http://localhost:3000`, backend on `http://localhost:3001`.

#### Frontend (Mycellium app)

```bash
# From repo root
npm run setup
# → copies .env.example to .env.local (if missing) and runs npm install

# Edit .env.local — fill in:
#   NEXT_PUBLIC_SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY
# (Find these in Supabase Dashboard → Project Settings → API)

npm run dev
# → http://localhost:3000
```

`NEXT_PUBLIC_API_URL` defaults to `http://localhost:3001`; only change it if the backend runs elsewhere.

#### Backend (REST API + Socket.IO + Slack bot)

```bash
cd backend
npm run setup
# → copies .env.example to .env (if missing), runs npm install, runs prisma generate

# Edit .env — fill in:
#   DATABASE_URL, DIRECT_URL, SUPABASE_URL
# (Use the Supavisor pooler URLs — see the gotcha box below.)

npx prisma db push
npm run dev
# → http://localhost:3001
```

> **⚠️ Database URL gotcha.** Supabase's **direct** connection (`db.<project>.supabase.co:5432`) is **IPv6-only** since 2024 and fails on most home / office / CI networks. Use the **Supavisor pooler** instead — see [Setup walkthrough Section 2](#2-get-the-supabase-connection-string) below for the exact format.

`ENABLE_SLACK_BOT` and `ENABLE_DAILY_DIGEST_CRON` default to `false`, so this runs the REST API only and never touches Slack. To turn on the bot and cron, see [`/ardd` Slack bot](#ardd-slack-bot) below.

---

## `/ardd` Slack bot

A single Slack slash command with subcommands, deployed via Socket Mode so the bot runs from a developer laptop with no public URL or ngrok.

### Subcommands

**Look up info** (anyone can run):

| Command | What it does |
|---------|--------------|
| `/ardd now` | Sessions currently in progress (with a 5-minute soft window) |
| `/ardd next [N]` | Next N upcoming sessions (default 3, max 10) |
| `/ardd schedule [day1\|day2\|today]` | Full schedule for the given day |
| `/ardd speaker <name>` | Speaker info — substring match on speaker names |
| `/ardd notes <session_id>` | Latest 20 notes for a session (use the 8-char ID shown by `/ardd now`) |
| `/ardd help` | This list |

**Submit info** (anyone can run):

| Command | What it does |
|---------|--------------|
| `/ardd note` | Open a modal to submit a note / impression for a session |

**Admin-only:**

| Command | What it does |
|---------|--------------|
| `/ardd announce <text>` | Broadcast an announcement to the digest channel (gated by `ADMIN_SLACK_USER_IDS`) |

**Preview / diagnostics:**

| Command | What it does |
|---------|--------------|
| `/ardd digest` | Ephemeral preview of today's daily digest (does **not** post, does **not** persist) |

> ⚠️ **`/ardd note` and `/ardd notes` are two different commands** — singular opens a modal to *write* a note; plural lists notes *for a session*. Easy to confuse, mind the `s`.

Unrecognised subcommands (`/ardd foo`) return the help text instead of erroring.

Run all commands from the main message composer — Slack does not deliver developer slash commands inside threads.

### Daily digest

`node-cron` schedules a digest at 18:00 `CONFERENCE_TIMEZONE` every day. It posts to `SLACK_DIGEST_CHANNEL_ID` and writes a row to `daily_digest_runs`. Gated by `ENABLE_DAILY_DIGEST_CRON`.

The manual `/ardd digest` command produces a preview only — it does **not** post and does **not** create a `daily_digest_runs` row.

### Setup walkthrough

Run every step from `backend/` unless noted otherwise.

#### 1. Create the Slack app

1. Open <https://api.slack.com/apps> → **Create New App** → **From an app manifest**.
2. Pick your workspace → paste the contents of `slack/app-manifest.yaml` → **Create**.
3. **Install to Workspace** → copy the **Bot User OAuth Token** (`xoxb-…`).
4. **Basic Information** → **App-Level Tokens** → **Generate Token and Scopes** → add scope `connections:write` → copy the token (`xapp-…`).
5. In Slack: `/invite @ardd` into your demo channel. Copy the channel ID from the URL (`…/archives/C0XXXXX`).
6. In Slack: click your profile → **More (⋯)** → **Copy member ID** for each admin (`U0XXXXX`). Commas separate multiple admins.

#### 2. Get the Supabase connection string

Supabase's **direct** connection (`db.<project>.supabase.co`) is **IPv6-only** since 2024 and fails on most home / office / CI networks. Always use the **Supavisor pooler** instead.

In Supabase Dashboard → look for the **Connect** button (top of the page) or the Database section in the sidebar. You'll see two pooler URIs:

- **Transaction pooler** (port `6543`) → use for `DATABASE_URL` at runtime
- **Session pooler** (port `5432`) → use for `DIRECT_URL` for Prisma migrations

Username is `postgres.<project-ref>` (not just `postgres`). Append `?pgbouncer=true&connection_limit=1` to `DATABASE_URL` — the transaction pooler does not support Prisma's prepared statements without it.

#### 3. Fill `backend/.env`

Copy `backend/.env.example` to `backend/.env`, then fill in the real values:

```env
# Database — pooler URLs from Supabase (Section 2 above).
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-1-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres.<project-ref>:<password>@aws-1-<region>.pooler.supabase.com:5432/postgres

SUPABASE_URL=https://<project-ref>.supabase.co

# Slack — tokens from Section 1.
SLACK_BOT_TOKEN=xoxb-…
SLACK_APP_TOKEN=xapp-…
SLACK_DIGEST_CHANNEL_ID=C0XXXXX
ADMIN_SLACK_USER_IDS=U0XXXXX,U0YYYYY

CONFERENCE_TIMEZONE=America/Los_Angeles
CONFERENCE_START_DATE_KEY=2026-09-01

ENABLE_SLACK_BOT=true
ENABLE_DAILY_DIGEST_CRON=true

# Uncomment for deterministic demo time when the wall clock is not the conference day.
# DEMO_NOW_ISO=2026-09-01T10:15:00-07:00
```

> **The dev server reads `.env` once at startup.** Any env change (new admin, different channel, new tokens) requires a restart to take effect — `tsx watch` only watches source files.

#### 4. Install dependencies, push schema, seed

```bash
npm install
npx prisma generate                   # regenerate Prisma client for the new models
npx prisma db push                    # apply schema to Supabase (additive, non-destructive)
npx tsx prisma/seed-bot-demo.ts       # 3 tracks, 5 synthetic speakers, 10 sessions, 3 announcements, 5 impressions
```

If the existing `sessions` table already had rows from a previous setup, run `npx tsx prisma/backfill-conference-dates.ts` after `db push` to populate `conference_date_key` and `conference_day`. The columns are NOT NULL — `db push` will refuse if any row is missing them.

#### 5. Start the backend

```bash
ENABLE_SLACK_BOT=true ENABLE_DAILY_DIGEST_CRON=true npm run dev
```

You should see:

```
✓ Database connected
✓ Server running on http://localhost:3001
Slack bot connected via Socket Mode
[digest cron] scheduled "0 18 * * *" in America/Los_Angeles → channel C0XXXXX
```

#### 6. Smoke test in Slack

Run from the main message composer (Slack does not deliver developer slash commands inside threads):

```
/ardd help
/ardd schedule day1
/ardd speaker Demo
/ardd note          ← opens a modal; pick a session, type a note, submit
/ardd announce Lunch moved to 12:30   ← needs ADMIN_SLACK_USER_IDS to include your member ID
/ardd digest        ← ephemeral preview only; does not post
```

`/ardd now` will be empty unless the system clock falls inside a seeded session. To exercise it on a non-conference day, uncomment `DEMO_NOW_ISO` in `.env` and restart the bot.

### Demo data

`prisma/seed-bot-demo.ts` seeds **clearly synthetic** speakers (`Dr. A. Demo`, `Dr. Senolytic Example`, …). Do not swap to real ARDD speakers unless their attendance is confirmed via the official schedule — otherwise demo `/ardd speaker` results would mislead judges.

### Archive export

After the conference closes:

```bash
cd backend
npx tsx scripts/export-archive.ts > archive.json
```

Exports `sessions`, `session_impressions`, `announcements`, `bot_messages`, `daily_digest_runs`. Profile/match/messaging tables are out of scope for the bot archive.

### Adding a new subcommand

If you want to extend the bot with a new `/ardd <something>`, edit four places:

1. **`backend/src/bot/handlers/<name>.ts`** — new handler that returns a `HandlerResult`. Copy `help.ts` or `now.ts` as a template.
2. **`backend/src/bot/dispatch.ts`** — add a `case "<name>":` that calls your handler.
3. **`backend/src/bot/handlers/help.ts`** — add a `• \`/ardd <name>\` — ...` line so it shows up in `/ardd help`.
4. **This README** — add a row to the [Subcommands](#subcommands) table so it stays an accurate source of truth.

Slack's 3-second `ack()` deadline applies to every handler — do not run DB or network work before `await ack()` in the entry point. See [Troubleshooting](#troubleshooting) for the `operation_timeout` row if you hit this.

### User contribution slots

Three places in the code are intentionally left as small decision points for whoever takes the bot further:

1. **`/ardd announce` permission policy** — `backend/src/bot/middleware/admin-only.ts`. MVP uses an env allowlist (`ADMIN_SLACK_USER_IDS`). Swap in a `profiles.is_admin` flag if you want admins managed through the app.
2. **Daily digest format** — `backend/src/services/digest.service.ts` `composeDigest()`. Default is chronological with up to two quoted impressions per session. Reshape into highlight reels, anonymise impressions, or call an LLM — the data assembly (`gatherDigestData()`) is decoupled from formatting.
3. **`/ardd now` soft window** — `softWindowMinutes` parameter to `getNow()` in `backend/src/services/session-query.service.ts`. MVP is 5 minutes. Tune for the trade-off between "show me what's literally happening" vs. "show me what people are likely asking about".

---

## Troubleshooting

Real errors that came up during setup:

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Can't reach database server at db.<ref>.supabase.co:5432` | Direct connection is IPv6-only; your network probably has no IPv6 | Switch `DATABASE_URL` / `DIRECT_URL` to the Supavisor pooler URLs (see [Setup walkthrough Section 2](#2-get-the-supabase-connection-string)). |
| `prepared statement "s0" already exists` | Transaction pooler does not preserve session-state across queries; Prisma's default prepared statements break | Append `?pgbouncer=true&connection_limit=1` to `DATABASE_URL`. |
| `FATAL: Tenant or user not found` from pooler | Pooler hostname uses `aws-1-<region>` (or `aws-0-<region>`) — wrong one returns this; username is `postgres.<project-ref>`, not just `postgres` | Copy the exact URL from Supabase Dashboard → Connect. |
| `Property 'sessions' does not exist on type 'PrismaClient<...>'` (LSP / `tsc`) | Prisma client was generated before the bot models were added | `cd backend && npx prisma generate`. |
| `operation_timeout` on a slash command | A handler did DB or network work before `await ack()` | Move `ack()` to the first awaited operation; defer everything else until after. |
| `/ardd note` modal does not open, no error | `trigger_id` likely expired (~3s) before `views.open` ran | Use the cached view from `modal-cache.ts`; do not query the DB between the slash command and the modal open. |
| `chat.postEphemeral` returns `channel_not_found` | The bot passed `user.id` as the channel | The modal opener stashes the originating `channel_id` in `private_metadata`; the submit handler reads it back. |
| `/ardd announce` denied for an admin | The dev server was started before `ADMIN_SLACK_USER_IDS` was set or changed | Restart the dev server — `.env` is loaded once at startup. |
| `/ardd now` always empty even with sessions seeded | The system clock is outside the conference window | Set `DEMO_NOW_ISO=…` in `.env` and restart. |
| `db push` refuses with "Made the column required" errors | A NOT NULL column has rows that are NULL | Run `npx tsx prisma/backfill-conference-dates.ts`, verify no NULL rows remain, then re-`db push`. |
