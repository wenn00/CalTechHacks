import type { HandlerResult } from "../types";
import { getByDay, resolveDaySpec } from "../../services/session-query.service";
import { renderSessionsBlocks } from "../render/sessions";

export async function handleSchedule(rest: string): Promise<HandlerResult> {
  const spec = rest.trim() || "today";
  const day = resolveDaySpec(spec);

  if (day === null) {
    return {
      response: {
        text: `Could not understand day spec \`${spec}\`. Try \`today\`, \`day1\`, \`day2\`, or a number.`,
        response_type: "ephemeral",
      },
      summary: `schedule: unparseable spec "${spec}"`,
      resultKind: "noop",
    };
  }

  const sessions = await getByDay(day);
  const blocks = renderSessionsBlocks({
    headline: `Schedule — day ${day}`,
    emptyText: `No sessions scheduled for day ${day}.`,
    sessions,
  });
  return {
    response: { blocks, response_type: "ephemeral" },
    summary: `schedule day ${day}: ${sessions.length} session(s)`,
  };
}
