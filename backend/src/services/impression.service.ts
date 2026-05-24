/**
 * Impression service — persistence for /ardd note submissions and reads for
 * /ardd notes.
 *
 * Slack identity is the canonical identity here. attendee_id (Profile FK) is
 * left null in MVP — bot users are NOT required to be registered app users.
 * Future enhancement: if Profile.slack_user_id is added later, look up and
 * populate attendee_id from slack_user_id.
 */

import { prisma } from "../lib/prisma";
import type { session_impressions } from "@prisma/client";

export type CreateImpressionInput = {
  sessionId: string;
  slackUserId: string;
  note: string;
};

export async function createImpression(
  input: CreateImpressionInput,
): Promise<session_impressions> {
  const note = input.note.trim();
  if (!note) {
    throw new Error("Note cannot be empty");
  }
  return prisma.session_impressions.create({
    data: {
      session_id: input.sessionId,
      slack_user_id: input.slackUserId,
      note,
    },
  });
}

/**
 * Returns the latest N impressions for a session (most recent first).
 */
export async function listImpressionsBySession(
  sessionId: string,
  limit = 20,
): Promise<session_impressions[]> {
  const take = Math.max(1, Math.min(100, limit));
  return prisma.session_impressions.findMany({
    where: { session_id: sessionId },
    orderBy: { created_at: "desc" },
    take,
  });
}

/**
 * Returns ALL impressions for a session in chronological order. Used by the
 * daily digest aggregation, which groups by session and may want every note.
 */
export async function listImpressionsBySessionForDigest(
  sessionId: string,
): Promise<session_impressions[]> {
  return prisma.session_impressions.findMany({
    where: { session_id: sessionId },
    orderBy: { created_at: "asc" },
  });
}
