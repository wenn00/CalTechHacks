/**
 * /ardd subcommand router.
 *
 * Slash command handler at the entry point (bot/slack.ts) is responsible for
 * the ack/respond/archive choreography. This module only owns:
 *   - parsing command.text into { subcommand, rest }
 *   - mapping subcommand → HandlerResult
 *
 * Note: /ardd note is handled out-of-band by the entry point because it
 * needs the Slack client (views.open) and the originating channel id. Notes
 * (/ardd notes), announce, etc. go through here normally.
 */

import type { WebClient } from "@slack/web-api";
import type { HandlerResult, ParsedArddCommand } from "./types";

import { handleNow } from "./handlers/now";
import { handleNext } from "./handlers/next";
import { handleSchedule } from "./handlers/schedule";
import { handleSpeaker } from "./handlers/speaker";
import { handleNotes } from "./handlers/notes";
import { handleAnnounce } from "./handlers/announce";
import { handleDigest } from "./handlers/digest";
import { handleHelp, handleUnknown } from "./handlers/help";

export function parseArddCommand(text: string | undefined): ParsedArddCommand {
  const trimmed = (text ?? "").trim();
  if (!trimmed) return { subcommand: "help", rest: "" };
  const firstSpace = trimmed.indexOf(" ");
  if (firstSpace === -1) {
    return { subcommand: trimmed.toLowerCase(), rest: "" };
  }
  return {
    subcommand: trimmed.slice(0, firstSpace).toLowerCase(),
    rest: trimmed.slice(firstSpace + 1).trim(),
  };
}

export type DispatchContext = {
  subcommand: string;
  rest: string;
  slackUserId: string;
  slackClient: WebClient;
};

/**
 * Dispatches a parsed subcommand to its handler. `note` is NOT handled here —
 * the caller (bot/slack.ts) opens the modal directly because it needs
 * trigger_id and the originating channel id, neither of which fits the
 * HandlerResult contract.
 */
export async function dispatch(ctx: DispatchContext): Promise<HandlerResult> {
  switch (ctx.subcommand) {
    case "now":
      return handleNow();
    case "next":
      return handleNext(ctx.rest);
    case "schedule":
      return handleSchedule(ctx.rest);
    case "speaker":
      return handleSpeaker(ctx.rest);
    case "notes":
      return handleNotes(ctx.rest);
    case "announce":
      return handleAnnounce({
        rest: ctx.rest,
        slackUserId: ctx.slackUserId,
        slackClient: ctx.slackClient,
      });
    case "digest":
      return handleDigest();
    case "help":
    case "":
      return handleHelp();
    default:
      return handleUnknown(ctx.subcommand);
  }
}
