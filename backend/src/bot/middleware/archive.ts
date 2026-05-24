/**
 * safeArchive — persists a sanitized record of each bot interaction.
 *
 * "Safe" because the write is wrapped in try/catch and only logs on failure.
 * The user has already received their Slack reply by the time this runs; a DB
 * hiccup must NOT surface as a :warning: after the fact.
 *
 * The sanitizer (../services/slack-sanitize) drops response_url, trigger_id,
 * raw tokens, and headers. Only command, text, user_id, channel_id, team_id,
 * and a handler-decided short summary are persisted.
 */

import { prisma } from "../../lib/prisma";
import {
  sanitizeCommand,
  type SlackCommandLike,
} from "../../services/slack-sanitize";

export type ArchiveMeta = {
  interactionType: "slash_command" | "view_submission" | "cron" | "system";
  subcommand?: string;
  resultKind: "success" | "error" | "denied" | "noop";
  resultSummary?: string;
};

/**
 * Records the interaction. Never throws — failures are logged only.
 */
export async function safeArchive(
  command: SlackCommandLike,
  meta: ArchiveMeta,
): Promise<void> {
  try {
    const sanitized = sanitizeCommand(command);
    await prisma.bot_messages.create({
      data: {
        interaction_type: meta.interactionType,
        slack_user_id: sanitized.user_id,
        slack_channel_id: sanitized.channel_id,
        slack_team_id: sanitized.team_id,
        command: sanitized.command,
        subcommand: meta.subcommand ?? null,
        text: sanitized.text,
        result_summary: meta.resultSummary ?? null,
        result_kind: meta.resultKind,
      },
    });
  } catch (err) {
    console.warn("[archive] failed to persist BotMessage:", err);
  }
}
