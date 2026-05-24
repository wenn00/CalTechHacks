/**
 * Drops sensitive / ephemeral Slack payload fields before persistence.
 *
 * Slack slash command and view_submission payloads include:
 *   - response_url: a temporary webhook URL (one-time / short-lived)
 *   - trigger_id:   a short-lived (~3s) token used to open modals
 *   - token:        the verification token (legacy, not the OAuth/bot token,
 *                   but still not for archival)
 *   - headers:      may carry signatures, IPs, etc.
 *
 * None of these belong in the archive. The bot's BotMessage table stores only
 * what is needed for audit: command, channel, user, team, and a short summary
 * decided by the handler.
 */

export type SanitizedCommand = {
  command: string | null;
  text: string | null;
  user_id: string | null;
  channel_id: string | null;
  team_id: string | null;
  ts: string;
};

/**
 * Minimal subset of fields we care about from a Slack slash command payload.
 * Typed loosely so we can pass either a Bolt SlashCommand or a constructed
 * proxy (for view_submission archive entries) without import gymnastics.
 */
export type SlackCommandLike = {
  command?: string;
  text?: string;
  user_id?: string;
  channel_id?: string;
  team_id?: string;
  user?: { id?: string };
  channel?: { id?: string };
  team?: { id?: string };
};

const FORBIDDEN_KEYS = [
  "response_url",
  "trigger_id",
  "token",
  "headers",
  "verification_token",
] as const;

export function sanitizeCommand(input: SlackCommandLike): SanitizedCommand {
  const command = input.command ?? null;
  const text = input.text ?? null;
  const user_id = input.user_id ?? input.user?.id ?? null;
  const channel_id = input.channel_id ?? input.channel?.id ?? null;
  const team_id = input.team_id ?? input.team?.id ?? null;

  return {
    command,
    text,
    user_id,
    channel_id,
    team_id,
    ts: new Date().toISOString(),
  };
}

/**
 * Asserts (in tests) that no forbidden field has leaked through. Not used in
 * production paths — sanitizeCommand already returns a fresh object with only
 * whitelisted keys.
 */
export function assertNoForbiddenKeys(obj: Record<string, unknown>): void {
  for (const key of FORBIDDEN_KEYS) {
    if (key in obj) {
      throw new Error(`Sanitization failure: forbidden key "${key}" present`);
    }
  }
}
