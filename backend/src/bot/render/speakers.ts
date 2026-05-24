/**
 * Block Kit renderer for /ardd speaker. Pure function — no IO, no Prisma.
 * Intentionally omits photo blocks in MVP (Slack image_url requires stable
 * public hosting; see deferred section in plan).
 */

import type { KnownBlock } from "@slack/types";
import type { SpeakerWithSessions } from "../../services/session-query.service";

export type RenderSpeakerCardsInput = {
  query: string;
  speakers: SpeakerWithSessions[];
};

export function renderSpeakerBlocks(input: RenderSpeakerCardsInput): KnownBlock[] {
  const blocks: KnownBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `Speakers matching "${input.query}"`,
        emoji: true,
      },
    },
  ];

  if (input.speakers.length === 0) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `_No speakers found for "${input.query}". Try a different substring._`,
      },
    });
    return blocks;
  }

  for (const sp of input.speakers) {
    blocks.push({ type: "divider" });

    const headerLines: string[] = [`*${sp.name}*`];
    if (sp.title) headerLines.push(sp.title);
    if (sp.institution) headerLines.push(`_${sp.institution}_`);
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: headerLines.join("\n") },
    });

    if (sp.bio) {
      blocks.push({
        type: "section",
        text: { type: "mrkdwn", text: sp.bio },
      });
    }

    if (sp.sessions.length > 0) {
      const sessionLines = sp.sessions.map((s) => {
        const trackName = s.track_entity?.name ?? s.track ?? "";
        const trackTag = trackName ? `  _[${trackName}]_` : "";
        const time = s.start_time ? `\`${formatTimeHm(s.start_time)}\`` : "";
        return `• ${time} ${s.title ?? "Untitled"}${trackTag}`;
      });
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Sessions*\n${sessionLines.join("\n")}`,
        },
      });
    }
  }

  return blocks;
}

function formatTimeHm(d: Date): string {
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}
