import type { HandlerResult } from "../types";
import { findSpeaker } from "../../services/session-query.service";
import { renderSpeakerBlocks } from "../render/speakers";

export async function handleSpeaker(rest: string): Promise<HandlerResult> {
  const query = rest.trim();
  if (!query) {
    return {
      response: {
        text:
          "Usage: `/ardd speaker <name>` — try a substring of a speaker's name.",
        response_type: "ephemeral",
      },
      summary: "speaker: empty query",
      resultKind: "noop",
    };
  }

  const speakers = await findSpeaker(query);
  const blocks = renderSpeakerBlocks({ query, speakers });
  return {
    response: { blocks, response_type: "ephemeral" },
    summary: `speaker "${query}": ${speakers.length} match(es)`,
  };
}
