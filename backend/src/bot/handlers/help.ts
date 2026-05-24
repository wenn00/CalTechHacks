import type { HandlerResult } from "../types";

const HELP_TEXT = [
  "*ARDD Community Bot — `/ardd` commands*",
  "",
  "• `/ardd now` — currently active sessions",
  "• `/ardd next [N]` — next N upcoming sessions (default 3, max 10)",
  "• `/ardd schedule [day1|day2|today]` — full day schedule",
  "• `/ardd speaker <name>` — speaker info (substring match)",
  "• `/ardd note` — open a modal to submit a session note",
  "• `/ardd notes <session_id>` — see notes submitted for a session",
  "• `/ardd announce <text>` — admin-only broadcast",
  "• `/ardd digest` — preview today's daily digest",
  "• `/ardd help` — this message",
  "",
  "_Run from the main composer, not inside a thread — Slack does not deliver slash commands inside threads._",
].join("\n");

export async function handleHelp(): Promise<HandlerResult> {
  return {
    response: { text: HELP_TEXT, response_type: "ephemeral" },
    summary: "help shown",
  };
}

/**
 * Returns a help-like response for unknown subcommands, with `noop` resultKind
 * so archive analytics distinguish "user asked for help" from "user mistyped".
 */
export async function handleUnknown(subcommand: string): Promise<HandlerResult> {
  return {
    response: {
      text: `Unknown subcommand \`${subcommand}\`.\n\n${HELP_TEXT}`,
      response_type: "ephemeral",
    },
    summary: `unknown subcommand: ${subcommand}`,
    resultKind: "noop",
  };
}
