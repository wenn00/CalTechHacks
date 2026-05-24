import type { HandlerResult } from "../types";
import { getNow } from "../../services/session-query.service";
import { renderSessionsBlocks } from "../render/sessions";

const SOFT_WINDOW_MINUTES = 5;

export async function handleNow(): Promise<HandlerResult> {
  const sessions = await getNow({ softWindowMinutes: SOFT_WINDOW_MINUTES });
  const blocks = renderSessionsBlocks({
    headline: "Happening now",
    emptyText:
      "No sessions are active right now. Try `/ardd next` to see what's coming up.",
    sessions,
  });
  return {
    response: { blocks, response_type: "ephemeral" },
    summary: `now: ${sessions.length} session(s)`,
  };
}
