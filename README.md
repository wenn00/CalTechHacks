# Mycellium

ARDD Conference App by **Pepto Bismol**.

Two surfaces:

1. **Mycellium app** — Next.js attendee directory, matching, onboarding, and real-time messaging.
2. **ARDD Community Bot (Claw Bot)** — a single `/ardd` Slack slash command for community-level interactions during the conference.

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

### Prerequisites

- Node.js ≥ 18 (recommended ≥ 20)
- npm (the lockfiles are npm-format)
- A Supabase project (free tier is fine) — get the project ref + database password ready
- A Slack workspace where you can install custom apps

The frontend and backend are separate npm projects. They run side-by-side: frontend on `http://localhost:3000`, backend on `http://localhost:3001`.

### Frontend (Mycellium app)

```bash
# From repo root
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
# (Find these in Supabase Dashboard → Project Settings → API)

npm install
npm run dev
# → http://localhost:3000
```

`NEXT_PUBLIC_API_URL` defaults to `http://localhost:3001`; only change it if the backend runs elsewhere.

### Backend (REST API + Socket.IO + Slack bot)

See the [bot setup walkthrough](#setup-walkthrough) below for the complete sequence including Slack tokens. The TL;DR for the **REST API alone** (no Slack bot) is:

```bash
cd backend
cp .env.example .env
# Fill in DATABASE_URL, DIRECT_URL, SUPABASE_URL (see Section 2 of the bot walkthrough for pooler URL details)

npm install
npx prisma generate
npx prisma db push
npm run dev
# → http://localhost:3001
```

`ENABLE_SLACK_BOT` and `ENABLE_DAILY_DIGEST_CRON` default to `false`, so this runs the REST API only and never touches Slack.

---

## ARDD Community Bot — `/ardd`

A single Slack slash command with subcommands, deployed via Socket Mode so the bot runs from a developer laptop with no public URL or ngrok.

### Subcommands

| Command | What it does |
|---------|--------------|
| `/ardd now` | Sessions currently in progress (with a 5-minute soft window) |
| `/ardd next [N]` | Next N upcoming sessions (default 3, max 10) |
| `/ardd schedule [day1\|day2\|today]` | Full schedule for the given day |
| `/ardd speaker <name>` | Speaker info — substring match on speaker names |
| `/ardd note` | Open a modal to submit a note / impression for a session |
| `/ardd notes <session_id>` | Latest 20 notes for a session (use the 8-char ID shown by `/ardd now`) |
| `/ardd announce <text>` | Admin-only: broadcast an announcement to the digest channel |
| `/ardd digest` | Ephemeral preview of today's daily digest (does NOT post or persist) |
| `/ardd help` | This list |

Run from the main message composer — Slack does not deliver developer slash commands inside threads.

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

---

## Architecture notes

The bot's design has a few non-obvious choices worth knowing before changing things:

- **Socket Mode over webhooks** — `@slack/bolt@^4` opens a websocket to Slack instead of expecting Slack to POST to a public URL. This is what makes ngrok unnecessary. Production deployments could switch to HTTP receiver with `SLACK_SIGNING_SECRET`, but everything in the bot's wiring works under either model.

- **Supavisor pooler over direct Postgres** — see Section 2 of the bot setup walkthrough. Direct connection is IPv6-only on Supabase now, so the pooler is the only path that works on most networks.

- **`conference_date_key` is a `String`, not a `DateTime`** — `"YYYY-MM-DD"` in `CONFERENCE_TIMEZONE`. JS `Date` representations of midnight tend to drift across UTC offsets and DST, especially when displayed in `prisma studio`. Sticking to a string sidesteps the whole class of timezone bugs at the cost of needing `date-fns-tz` at write time.

- **`getEffectiveNow()` is the only place we read "now"** — `backend/src/lib/time.ts`. Every now/today/digest decision routes through it, so `DEMO_NOW_ISO` shifts the entire bot's perception of time without code changes.

- **`ack()` is the first awaited operation in every slash handler** — Slack enforces a 3-second deadline, and `trigger_id` for modal opens expires ~3 seconds after the originating interaction. Any DB query or rendering before `ack()` risks `operation_timeout`. The `/ardd note` modal uses a `modal-cache` warmed at startup so views.open never blocks on a DB call.

- **`safeArchive` over plain `archive`** — `bot_messages` writes are wrapped in try/catch and only log on failure. The user has already received their Slack reply by the time archive runs; a DB hiccup must not surface a `:warning:` after success.

- **Bot users are not required to be app users** — `announcements.posted_by_profile_id` and `session_impressions.attendee_id` are nullable. The canonical identity is `slack_user_id`. Profile mapping is deferred unless `profiles.slack_user_id` is added later.

- **Bot + cron are gated by env, off by default** — `ENABLE_SLACK_BOT` and `ENABLE_DAILY_DIGEST_CRON` keep them dormant unless explicitly turned on. This stops tests and scripts that just import `index.ts` from accidentally connecting to Slack or scheduling jobs.

## User contribution slots

Three places in the code are intentionally left as small decision points for whoever takes the bot further:

1. **`/ardd announce` permission policy** — `backend/src/bot/middleware/admin-only.ts`. MVP uses an env allowlist (`ADMIN_SLACK_USER_IDS`). Swap in a `profiles.is_admin` flag if you want admins managed through the app.
2. **Daily digest format** — `backend/src/services/digest.service.ts` `composeDigest()`. Default is chronological with up to two quoted impressions per session. Reshape into highlight reels, anonymise impressions, or call an LLM — the data assembly (`gatherDigestData()`) is decoupled from formatting.
3. **`/ardd now` soft window** — `softWindowMinutes` parameter to `getNow()` in `backend/src/services/session-query.service.ts`. MVP is 5 minutes. Tune for the trade-off between "show me what's literally happening" vs. "show me what people are likely asking about".

## Troubleshooting

Real errors that came up during setup:

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Can't reach database server at db.<ref>.supabase.co:5432` | Direct connection is IPv6-only; your network probably has no IPv6 | Switch `DATABASE_URL` / `DIRECT_URL` to the Supavisor pooler URLs (see setup Section 2). |
| `prepared statement "s0" already exists` | Transaction pooler does not preserve session-state across queries; Prisma's default prepared statements break | Append `?pgbouncer=true&connection_limit=1` to `DATABASE_URL`. |
| `FATAL: Tenant or user not found` from pooler | Pooler hostname uses `aws-1-<region>` (or `aws-0-<region>`) — wrong one returns this; username is `postgres.<project-ref>`, not just `postgres` | Copy the exact URL from Supabase Dashboard → Connect. |
| `Property 'sessions' does not exist on type 'PrismaClient<...>'` (LSP / `tsc`) | Prisma client was generated before the bot models were added | `cd backend && npx prisma generate`. |
| `operation_timeout` on a slash command | A handler did DB or network work before `await ack()` | Move `ack()` to the first awaited operation; defer everything else until after. |
| `/ardd note` modal does not open, no error | `trigger_id` likely expired (~3s) before `views.open` ran | Use the cached view from `modal-cache.ts`; do not query the DB between the slash command and the modal open. |
| `chat.postEphemeral` returns `channel_not_found` | The bot passed `user.id` as the channel | The modal opener stashes the originating `channel_id` in `private_metadata`; the submit handler reads it back. |
| `/ardd announce` denied for an admin | The dev server was started before `ADMIN_SLACK_USER_IDS` was set or changed | Restart the dev server — `.env` is loaded once at startup. |
| `/ardd now` always empty even with sessions seeded | The system clock is outside the conference window | Set `DEMO_NOW_ISO=…` in `.env` and restart. |
| `db push` refuses with "Made the column required" errors | A NOT NULL column has rows that are NULL | Run `npx tsx prisma/backfill-conference-dates.ts`, verify no NULL rows remain, then re-`db push`. |

## What's out of scope for this MVP

- Production deploy (Vercel / Fly / Railway) — the bot is designed for Socket Mode dev.
- Telegram support — track spec only required a single platform.
- Speaker photos in `/ardd speaker` blocks — Slack `image_url` requires stable public hosting; defer to Cloudinary / Supabase Storage.
- AI-summarised digests — `composeDigest()` is intentionally deterministic with a clear contribution slot.
- `external_select` for `/ardd note` — demo has ~10 sessions, well under the 100-option static-select cap.
- Distributed cron locking, retry queues, observability — this is demo-ready, not production-quality.

See `docs/ardd-slack-bot/` (gitignored, local-only) for the detailed implementation plan, schema reference, and Slack setup walkthrough.
