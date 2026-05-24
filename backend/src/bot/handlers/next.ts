import type { HandlerResult } from "../types";
import { getNext } from "../../services/session-query.service";
import { renderSessionsBlocks } from "../render/sessions";

const DEFAULT_N = 3;
const MAX_N = 10;

export async function handleNext(rest: string): Promise<HandlerResult> {
  const parsedRaw = parseInt(rest.trim(), 10);
  const n = Number.isFinite(parsedRaw)
    ? Math.max(1, Math.min(MAX_N, parsedRaw))
    : DEFAULT_N;

  const sessions = await getNext(n);
  const blocks = renderSessionsBlocks({
    headline: `Next ${n} session(s)`,
    emptyText: "No upcoming sessions on record.",
    sessions,
  });
  return {
    response: { blocks, response_type: "ephemeral" },
    summary: `next ${n}: ${sessions.length} session(s) returned`,
  };
}
