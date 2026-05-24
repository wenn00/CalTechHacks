import type { WebClient } from "@slack/web-api";
import type { HandlerResult } from "../types";
import { isAdmin, denyReason } from "../middleware/admin-only";
import { createAndBroadcastAnnouncement } from "../../services/announcement.service";

export type AnnounceContext = {
  rest: string;
  slackUserId: string;
  slackClient: WebClient;
};

export async function handleAnnounce(
  ctx: AnnounceContext,
): Promise<HandlerResult> {
  const content = ctx.rest.trim();

  if (!isAdmin(ctx.slackUserId)) {
    return {
      response: {
        text:
          ":lock: `/ardd announce` is restricted to admins. Ask an organizer or set `ADMIN_SLACK_USER_IDS` in backend/.env to include your user ID.",
        response_type: "ephemeral",
      },
      summary: denyReason(ctx.slackUserId),
      resultKind: "denied",
    };
  }

  if (!content) {
    return {
      response: {
        text: "Usage: `/ardd announce <text>` — anything after the command becomes the announcement body.",
        response_type: "ephemeral",
      },
      summary: "announce: empty content",
      resultKind: "noop",
    };
  }

  const channelId = process.env.SLACK_DIGEST_CHANNEL_ID;
  if (!channelId) {
    return {
      response: {
        text:
          ":warning: `SLACK_DIGEST_CHANNEL_ID` is not configured. Add it to backend/.env before broadcasting.",
        response_type: "ephemeral",
      },
      summary: "announce: missing SLACK_DIGEST_CHANNEL_ID",
      resultKind: "error",
    };
  }

  const result = await createAndBroadcastAnnouncement({
    content,
    postedBySlackUserId: ctx.slackUserId,
    channelId,
    slackClient: ctx.slackClient,
  });

  return {
    response: {
      text: result.posted
        ? `:white_check_mark: Announcement posted to <#${channelId}>.`
        : `:warning: Announcement recorded but Slack may not have accepted it. (id ${result.id})`,
      response_type: "ephemeral",
    },
    summary: `announce: posted ${result.id}`,
  };
}
