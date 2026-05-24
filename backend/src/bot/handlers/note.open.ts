/**
 * /ardd note → open the impressions modal.
 *
 * Special-cased in the dispatcher because the response is a Slack view (not a
 * respond payload). The cached modal view from modal-cache is used so that
 * no DB query happens between ack() and views.open — that would risk hitting
 * the trigger_id expiry window.
 */

import type { WebClient } from "@slack/web-api";
import { getNoteView } from "../modal-cache";

export type OpenNoteContext = {
  triggerId: string;
  originatingChannelId: string;
  slackClient: WebClient;
};

export type OpenNoteResult = {
  ok: boolean;
  summary: string;
};

export async function openNoteModal(
  ctx: OpenNoteContext,
): Promise<OpenNoteResult> {
  const view = {
    ...getNoteView(),
    private_metadata: JSON.stringify({ channelId: ctx.originatingChannelId }),
  };

  const result = await ctx.slackClient.views.open({
    trigger_id: ctx.triggerId,
    view,
  });

  return {
    ok: !!result.ok,
    summary: result.ok ? "note modal opened" : "note modal open failed",
  };
}
