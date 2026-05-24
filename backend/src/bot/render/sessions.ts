/**
 * Block Kit renderer for session lists. Pure function — no IO, no Prisma.
 * Used by /ardd now, /ardd next, /ardd schedule.
 */

import type { KnownBlock } from "@slack/types";
import type { SessionWithRelations } from "../../services/session-query.service";

export type RenderSessionsInput = {
  headline: string;
  emptyText: string;
  sessions: SessionWithRelations[];
};

export function renderSessionsBlocks(input: RenderSessionsInput): KnownBlock[] {
  const blocks: KnownBlock[] = [
    {
      type: "header",
      text: { type: "plain_text", text: input.headline, emoji: true },
    },
  ];

  if (input.sessions.length === 0) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `_${input.emptyText}_` },
    });
    return blocks;
  }

  for (const s of input.sessions) {
    blocks.push({ type: "divider" });
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: formatSessionBlock(s) },
    });
  }

  return blocks;
}

function formatSessionBlock(s: SessionWithRelations): string {
  const time = s.start_time && s.end_time
    ? `${formatTimeHm(s.start_time)}–${formatTimeHm(s.end_time)}`
    : s.start_time
      ? formatTimeHm(s.start_time)
      : "—";

  const speakerName = s.speaker_entity?.name ?? s.speaker ?? "TBA";
  const trackName = s.track_entity?.name ?? s.track ?? null;
  const trackBadge = trackName ? `   :small_blue_diamond: ${trackName}` : "";
  const location = s.location ? `   :round_pushpin: ${s.location}` : "";

  const idLine = `\`${s.id.slice(0, 8)}\``;
  const titleLine = `*${s.title ?? "Untitled"}*`;
  const meta = `${idLine}   :clock1: ${time}${trackBadge}${location}`;
  const speakerLine = `:bust_in_silhouette: ${speakerName}`;
  const desc = s.description ? `\n${s.description}` : "";

  return `${titleLine}\n${meta}\n${speakerLine}${desc}`;
}

function formatTimeHm(d: Date): string {
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}
