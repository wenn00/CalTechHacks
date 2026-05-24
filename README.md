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

1. **Create the Slack app from manifest.** Go to <https://api.slack.com/apps> → *Create New App* → *From an app manifest* → pick your workspace → paste `slack/app-manifest.yaml`.
2. **Install to Workspace** to obtain the Bot Token (`xoxb-…`).
3. **Enable Socket Mode** → generate an App-Level Token (`xapp-…`, scope `connections:write`).
4. **Invite the bot to a channel:** `/invite @ardd`. Copy that channel's ID.
5. **Identify admin Slack user IDs.** Slack profile → *More* → *Copy member ID*.
6. **Fill `backend/.env`:**
   ```
   SLACK_BOT_TOKEN=xoxb-...
   SLACK_APP_TOKEN=xapp-...
   SLACK_DIGEST_CHANNEL_ID=C...
   ADMIN_SLACK_USER_IDS=U123,U456
   CONFERENCE_TIMEZONE=America/Los_Angeles
   CONFERENCE_START_DATE_KEY=2026-09-01
   ENABLE_SLACK_BOT=true
   ENABLE_DAILY_DIGEST_CRON=true
   # DEMO_NOW_ISO=2026-09-01T10:15:00-07:00   # uncomment for off-day demos
   ```
   `DATABASE_URL` and `DIRECT_URL` must also point at the Supabase Postgres connection string (substitute `[YOUR-PASSWORD]`).
7. **Run database migrations and seed.** From `backend/`:
   ```bash
   npx prisma db push
   npx tsx prisma/seed-bot-demo.ts
   ```
   If the existing `sessions` table already has rows, run `npx tsx prisma/backfill-conference-dates.ts` afterwards to populate `conference_date_key` and `conference_day`, then drop the `?` on those columns in `schema.prisma` and re-run `npx prisma db push`.
8. **Start the backend.** From `backend/`:
   ```bash
   npm install
   ENABLE_SLACK_BOT=true npm run dev
   ```
   You should see: `Slack bot connected via Socket Mode`.
9. **Smoke test.** In your demo Slack channel: `/ardd help`, then `/ardd now`.

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
