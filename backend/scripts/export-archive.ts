/**
 * Dumps the bot-side tables to JSON on stdout for end-of-conference archive.
 *
 * Usage:
 *   npx tsx scripts/export-archive.ts > archive.json
 *
 * Tables exported:
 *   - sessions
 *   - session_impressions
 *   - announcements
 *   - bot_messages
 *   - daily_digest_runs
 *
 * Profiles / matches / messages are deliberately NOT included — those are the
 * main app's domain. This script is scoped to the ARDD Community Bot footprint.
 */

import { prisma } from "../src/lib/prisma";

async function main(): Promise<void> {
  const [
    sessions,
    session_impressions,
    announcements,
    bot_messages,
    daily_digest_runs,
  ] = await Promise.all([
    prisma.sessions.findMany({ orderBy: { start_time: "asc" } }),
    prisma.session_impressions.findMany({ orderBy: { created_at: "asc" } }),
    prisma.announcements.findMany({ orderBy: { created_at: "asc" } }),
    prisma.bot_messages.findMany({ orderBy: { created_at: "asc" } }),
    prisma.daily_digest_runs.findMany({ orderBy: { created_at: "asc" } }),
  ]);

  const archive = {
    exported_at: new Date().toISOString(),
    conference_timezone: process.env.CONFERENCE_TIMEZONE ?? null,
    conference_start_date_key: process.env.CONFERENCE_START_DATE_KEY ?? null,
    counts: {
      sessions: sessions.length,
      session_impressions: session_impressions.length,
      announcements: announcements.length,
      bot_messages: bot_messages.length,
      daily_digest_runs: daily_digest_runs.length,
    },
    sessions,
    session_impressions,
    announcements,
    bot_messages,
    daily_digest_runs,
  };

  process.stdout.write(JSON.stringify(archive, null, 2) + "\n");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
