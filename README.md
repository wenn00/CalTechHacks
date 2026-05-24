# CalTech Hack — Mycellium

ARDD Conference App by **Pepto Bismol**.

Two surfaces:

1. **Mycellium app** — Next.js attendee directory, matching, onboarding, and real-time messaging. (Existing.)
2. **ARDD Community Bot (Claw Bot)** — a single `/ardd` Slack slash command for community-level interactions during the conference. (New.)

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

### What's out of scope for this MVP

- Production deploy (Vercel / Fly / Railway) — the bot is designed for Socket Mode dev.
- Telegram support — track spec only required a single platform.
- Speaker photos in `/ardd speaker` blocks — Slack `image_url` requires stable public hosting; defer to Cloudinary / Supabase Storage.
- AI-summarised digests — `composeDigest()` is intentionally deterministic with a clear contribution slot.
- `external_select` for `/ardd note` — demo has ~10 sessions, well under the 100-option static-select cap.
- Distributed cron locking, retry queues, observability — this is demo-ready, not production-quality.

See `docs/ardd-slack-bot/` (gitignored, local-only) for the detailed implementation plan, schema reference, and Slack setup walkthrough.
