/**
 * Block Kit renderer for /ardd notes — lists impressions on a given session.
 */

import type { KnownBlock } from "@slack/types";
import type { session_impressions } from "@prisma/client";

export type RenderImpressionsInput = {
  sessionTitle: string;
  impressions: session_impressions[];
};

export function renderImpressionsBlocks(
  input: RenderImpressionsInput,
): KnownBlock[] {
  const blocks: KnownBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `Notes — ${input.sessionTitle}`,
        emoji: true,
      },
    },
  ];

  if (input.impressions.length === 0) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          "_No notes yet for this session. Be the first — run `/ardd note`._",
      },
    });
    return blocks;
  }

  for (const imp of input.impressions) {
    const userStub = imp.slack_user_id.slice(0, 6);
    const when = formatTimeHm(imp.created_at);
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `> ${escapeMrkdwn(imp.note)}\n_${userStub} • ${when}_`,
      },
    });
  }

  return blocks;
}

function formatTimeHm(d: Date): string {
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

// Slack mrkdwn does not have full markdown escaping, but blockquote prefixes
// inside a quoted line can render oddly. Strip leading `>` so multi-line
// notes do not nest blockquotes.
function escapeMrkdwn(s: string): string {
  return s.replace(/^>\s*/gm, "");
}
