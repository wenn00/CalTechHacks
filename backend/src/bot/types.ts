import type { KnownBlock } from "@slack/types";

/**
 * Return contract for every /ardd subcommand handler.
 *
 * The dispatcher consumes `response` (sent back to Slack via respond/postEphemeral)
 * and `summary` (persisted to BotMessage.resultSummary) separately, so the
 * Slack-facing reply and the archive log never get tangled.
 *
 * `resultKind` lets a handler signal denied / noop / error without throwing.
 * Defaults to "success" when omitted.
 */
export type HandlerResult = {
  response: {
    text?: string;
    blocks?: KnownBlock[];
    response_type?: "ephemeral" | "in_channel";
  };
  summary: string;
  resultKind?: "success" | "error" | "denied" | "noop";
};

/**
 * Subcommands recognised by `/ardd`. Unknown tokens fall through to the help
 * handler. Keep this in sync with slack/app-manifest.yaml usage_hint.
 */
export type ArddSubcommand =
  | "now"
  | "next"
  | "schedule"
  | "speaker"
  | "note"
  | "notes"
  | "announce"
  | "digest"
  | "help";

/**
 * Output of parseArddCommand(text): the first whitespace-separated token is
 * the subcommand, everything after is `rest` (trimmed). Unknown subcommands
 * are returned as-is and handled as "help" downstream.
 */
export type ParsedArddCommand = {
  subcommand: string;
  rest: string;
};
