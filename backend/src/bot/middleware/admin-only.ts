/**
 * Admin gate for /ardd announce.
 *
 * MVP strategy: a comma-separated allowlist of Slack user IDs in
 * ADMIN_SLACK_USER_IDS. This avoids tying announcement permission to the main
 * app's Profile table — bot users do not have to be registered app users.
 *
 * USER CONTRIBUTION POINT (plan §1): If you want a different policy — e.g.
 * also honor a `profiles.is_admin` boolean, or fall back to "anyone may
 * announce" in dev — extend isAdmin() below. Keep the env-list as the most
 * conservative baseline so a missing config is fail-closed, not fail-open.
 */

function parseAdminList(raw: string | undefined): Set<string> {
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id.length > 0),
  );
}

// Cache the parsed set per process startup. ADMIN_SLACK_USER_IDS is not
// expected to change at runtime; if you need hot reload, replace this with a
// per-call read.
const adminIds: Set<string> = parseAdminList(process.env.ADMIN_SLACK_USER_IDS);

export function isAdmin(slackUserId: string | undefined | null): boolean {
  if (!slackUserId) return false;
  return adminIds.has(slackUserId);
}

/**
 * Returns a short human-readable reason string for denied audits.
 * Used by /ardd announce to populate BotMessage.resultSummary on denial.
 */
export function denyReason(slackUserId: string | undefined | null): string {
  if (!slackUserId) return "denied: no user id on payload";
  return `denied: ${slackUserId} not in ADMIN_SLACK_USER_IDS`;
}
