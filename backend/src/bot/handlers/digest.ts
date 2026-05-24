import type { HandlerResult } from "../types";
import {
  composeDigest,
  gatherDigestData,
} from "../../services/digest.service";
import { todayDateKey } from "../../services/session-query.service";

/**
 * /ardd digest produces an EPHEMERAL markdown preview. It does NOT post to
 * SLACK_DIGEST_CHANNEL_ID and does NOT create a daily_digest_runs row.
 * Only the scheduled cron (or an explicit manual_post invocation) does that.
 */
export async function handleDigest(): Promise<HandlerResult> {
  const dateKey = todayDateKey();
  const data = await gatherDigestData(dateKey);
  const markdown = composeDigest(data);

  return {
    response: {
      text: markdown,
      response_type: "ephemeral",
    },
    summary: `digest preview for ${dateKey}: ${data.sessions.length} session(s)`,
  };
}
