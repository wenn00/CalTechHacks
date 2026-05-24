/**
 * Announcement service — handles /ardd announce.
 *
 * Flow:
 *   1. Insert announcement row (no broadcast yet)
 *   2. chat.postMessage to the configured channel
 *   3. Update the row with broadcasted_at + slack_message_ts so the audit log
 *      reflects the actual broadcast outcome
 *
 * Step (3) is best-effort: if (1) and (2) both succeeded, a failure in (3)
 * leaves an announcement row without slack_message_ts but the message has
 * gone out. Callers should not surface a user-facing error for that — the
 * effect Slack-side is what counts.
 */

import type { WebClient } from "@slack/web-api";
import { prisma } from "../lib/prisma";

export type CreateAnnouncementInput = {
  content: string;
  postedBySlackUserId: string;
  channelId: string;
  slackClient: WebClient;
};

export type AnnouncementResult = {
  id: string;
  posted: boolean;
  slackMessageTs: string | null;
};

export async function createAndBroadcastAnnouncement(
  input: CreateAnnouncementInput,
): Promise<AnnouncementResult> {
  const content = input.content.trim();
  if (!content) {
    throw new Error("Announcement content cannot be empty");
  }

  const row = await prisma.announcements.create({
    data: {
      content,
      posted_by_slack_user_id: input.postedBySlackUserId,
      slack_channel_id: input.channelId,
    },
  });

  // Broadcast. If this throws, the announcement row still exists — caller can
  // decide whether to retry. We do not roll back the DB row, because the
  // operator may want a record of the intent.
  const postResp = await input.slackClient.chat.postMessage({
    channel: input.channelId,
    text: `:loudspeaker: ${content}`,
  });

  const ts = (postResp.ts as string | undefined) ?? null;

  // Best-effort: record when the broadcast actually went out. If this update
  // fails (DB hiccup), the message has still gone out — return success.
  try {
    await prisma.announcements.update({
      where: { id: row.id },
      data: {
        broadcasted_at: new Date(),
        slack_message_ts: ts,
      },
    });
  } catch (err) {
    console.warn(
      `[announcement ${row.id}] broadcast succeeded but DB update failed:`,
      err,
    );
  }

  return { id: row.id, posted: !!postResp.ok, slackMessageTs: ts };
}
