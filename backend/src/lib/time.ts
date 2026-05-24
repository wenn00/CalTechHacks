/**
 * Single source of truth for "now" across the Slack bot.
 *
 * When DEMO_NOW_ISO is set, getEffectiveNow() returns that timestamp instead of
 * the system clock. This lets /ardd now, /ardd schedule today, and the daily
 * digest produce conference-day-relative output on demo days that do not
 * coincide with the real conference dates.
 *
 * Every "now" decision (session-query.service, digest.service, cron) MUST go
 * through this helper. Calling new Date() directly defeats the override.
 */
export function getEffectiveNow(): Date {
  const override = process.env.DEMO_NOW_ISO;
  if (!override) return new Date();
  const parsed = new Date(override);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(
      `DEMO_NOW_ISO is set but not a valid ISO 8601 timestamp: "${override}"`,
    );
  }
  return parsed;
}
