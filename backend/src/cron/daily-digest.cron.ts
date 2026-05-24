/**
 * Daily digest cron — posts the day's digest at 18:00 conference local time.
 *
 * Gated by ENABLE_DAILY_DIGEST_CRON. node-cron's `timezone` option is the
 * single source of truth for when "18:00" is — we do not reverse-compute via
 * date-fns-tz in the handler.
 *
 * The /ardd digest preview command does NOT call generateAndPostDigest() and
 * therefore never inserts a daily_digest_runs row. This cron is the
 * scheduled writer; manual_post invocations are reserved for a future admin
 * command if needed.
 */

import cron from "node-cron";

import { getBotApp } from "../bot/slack";
import { generateAndPostDigest } from "../services/digest.service";
import { safeArchive } from "../bot/middleware/archive";

const DEFAULT_SCHEDULE = "0 18 * * *"; // 18:00 every day
const DEFAULT_TIMEZONE = "America/Los_Angeles";

export function startDailyDigestCron(): void {
  const schedule = process.env.DIGEST_CRON_SCHEDULE ?? DEFAULT_SCHEDULE;
  const timezone = process.env.CONFERENCE_TIMEZONE ?? DEFAULT_TIMEZONE;
  const channelId = process.env.SLACK_DIGEST_CHANNEL_ID;

  if (!channelId) {
    console.warn(
      "[digest cron] SLACK_DIGEST_CHANNEL_ID not set; cron will not start",
    );
    return;
  }

  cron.schedule(
    schedule,
    async () => {
      const bot = getBotApp();
      if (!bot) {
        console.warn(
          "[digest cron] bot app not ready; skipping this tick. Set ENABLE_SLACK_BOT=true and ensure startBot() ran first.",
        );
        return;
      }

      try {
        const result = await generateAndPostDigest({
          runKind: "scheduled",
          channelId,
          slackClient: bot.client,
        });
        console.log(
          `[digest cron] posted ${result.id} for ${result.dateKey} (ok=${result.posted})`,
        );
        await safeArchive(
          { channel: { id: channelId } },
          {
            interactionType: "cron",
            subcommand: "digest",
            resultKind: "success",
            resultSummary: `scheduled digest for ${result.dateKey}: id=${result.id}`,
          },
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("[digest cron] failed:", err);
        await safeArchive(
          { channel: { id: channelId } },
          {
            interactionType: "cron",
            subcommand: "digest",
            resultKind: "error",
            resultSummary: `scheduled digest failed: ${message}`,
          },
        );
      }
    },
    { timezone },
  );

  console.log(
    `[digest cron] scheduled "${schedule}" in ${timezone} → channel ${channelId}`,
  );
}
