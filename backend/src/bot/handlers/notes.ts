import type { HandlerResult } from "../types";
import { listImpressionsBySession } from "../../services/impression.service";
import { renderImpressionsBlocks } from "../render/impressions";
import { prisma } from "../../lib/prisma";

export async function handleNotes(rest: string): Promise<HandlerResult> {
  const arg = rest.trim();
  if (!arg) {
    return {
      response: {
        text:
          "Usage: `/ardd notes <session_id>` — use the short ID shown by `/ardd now` or `/ardd schedule`.",
        response_type: "ephemeral",
      },
      summary: "notes: empty session_id",
      resultKind: "noop",
    };
  }

  // Accept either the full UUID or the 8-char prefix shown by render/sessions.
  // Prisma's UuidFilter does not support startsWith, so for a prefix lookup we
  // pull recent session ids and filter client-side. Demo seed is ~10 rows; if
  // the table grows, switch to a raw query with a UUID cast + LIKE.
  let session: { id: string; title: string | null } | null = null;
  if (/^[0-9a-fA-F-]{36}$/.test(arg)) {
    session = await prisma.sessions.findUnique({
      where: { id: arg },
      select: { id: true, title: true },
    });
  } else {
    const candidates = await prisma.sessions.findMany({
      select: { id: true, title: true },
      take: 500,
    });
    const lower = arg.toLowerCase();
    session = candidates.find((s) => s.id.toLowerCase().startsWith(lower)) ?? null;
  }

  if (!session) {
    return {
      response: {
        text: `No session matched ID \`${arg}\`. Try \`/ardd schedule today\` to find the right ID.`,
        response_type: "ephemeral",
      },
      summary: `notes: unknown session "${arg}"`,
      resultKind: "noop",
    };
  }

  const impressions = await listImpressionsBySession(session.id);
  const blocks = renderImpressionsBlocks({
    sessionTitle: session.title ?? "Untitled",
    impressions,
  });
  return {
    response: { blocks, response_type: "ephemeral" },
    summary: `notes for ${session.id.slice(0, 8)}: ${impressions.length} note(s)`,
  };
}
