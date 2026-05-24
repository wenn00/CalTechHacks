/**
 * Digest service — composes the daily digest markdown and (optionally) posts
 * it to the digest channel.
 *
 * Two surfaces consume this:
 *   - /ardd digest (manual preview): callers use composeDigest() directly to
 *     get markdown back. They do NOT call generateAndPostDigest(), so no
 *     DailyDigestRun row is created.
 *   - daily-digest.cron.ts (scheduled posting): calls generateAndPostDigest()
 *     which fetches data, composes markdown, posts to Slack, and persists a
 *     daily_digest_runs row.
 *
 * USER CONTRIBUTION POINT (plan §2): composeDigest() is the format decision.
 * The baseline below is chronological and includes all sessions, top
 * announcements, and quotes the most recent impression per session.
 *
 * Things to tune for your story:
 *   - top highlights vs full chronological list
 *   - quoting individual impressions vs aggregate counts
 *   - emoji / Slack-flavored markdown choices
 *   - whether to anonymize impression authors (currently shows slack_user_id)
 */

import type { WebClient } from "@slack/web-api";

import { prisma } from "../lib/prisma";
import { todayDateKey, getByDateKey } from "./session-query.service";
import type { SessionWithRelations } from "./session-query.service";
import {
  listImpressionsBySessionForDigest,
} from "./impression.service";

// ─── Composition ───────────────────────────────────────────────────────────

export type DigestData = {
  dateKey: string;
  sessions: SessionWithRelations[];
  announcementsByContent: { content: string; createdAt: Date }[];
  impressionsBySession: Record<
    string,
    { note: string; slackUserId: string; createdAt: Date }[]
  >;
};

/**
 * USER CONTRIBUTION POINT: customize this function to shape the daily digest
 * narrative. Inputs and outputs are stable; only the formatting changes.
 *
 * Default format:
 *   • Header line with date and conference-day if available
 *   • Sessions section in chronological order, one bullet per session
 *   • Up to 2 most-recent impression quotes per session (anonymized to first
 *     6 chars of Slack user id for now — easy to fully anonymize later)
 *   • Announcements section listing today's posted announcements
 */
export function composeDigest(data: DigestData): string {
  const lines: string[] = [];

  lines.push(`*ARDD Daily Digest — ${data.dateKey}*`);
  lines.push("");

  // Sessions
  if (data.sessions.length === 0) {
    lines.push("_No sessions on record for today._");
  } else {
    lines.push("*Sessions*");
    for (const s of data.sessions) {
      const time = s.start_time
        ? formatTimeHm(s.start_time)
        : "—";
      const speakerName = s.speaker_entity?.name ?? s.speaker ?? "TBA";
      const trackName = s.track_entity?.name ?? s.track ?? null;
      const trackBadge = trackName ? `  [${trackName}]` : "";
      lines.push(`• \`${time}\` *${s.title ?? "Untitled"}* — ${speakerName}${trackBadge}`);

      const impressions = data.impressionsBySession[s.id] ?? [];
      const latest = impressions.slice(-2);
      for (const imp of latest) {
        const stub = imp.slackUserId.slice(0, 6);
        lines.push(`    > "${imp.note}" — _${stub}_`);
      }
    }
  }
  lines.push("");

  // Announcements
  if (data.announcementsByContent.length === 0) {
    lines.push("_No announcements today._");
  } else {
    lines.push("*Announcements*");
    for (const a of data.announcementsByContent) {
      lines.push(`• ${a.content}`);
    }
  }

  return lines.join("\n");
}

function formatTimeHm(d: Date): string {
  // Display the underlying timestamp in HH:MM, no timezone conversion — the
  // sessions seed already stores them in conference local time.
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

// ─── Data assembly ─────────────────────────────────────────────────────────

export async function gatherDigestData(dateKey: string): Promise<DigestData> {
  const sessions = await getByDateKey(dateKey);

  // Announcements posted today (conference-local).
  // For MVP, we filter by created_at falling on the same calendar day in UTC;
  // for the demo seed which sets created_at = now() during seeding, this is
  // fine. Hardening: filter by CONFERENCE_TIMEZONE local day.
  const start = new Date(`${dateKey}T00:00:00.000Z`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const announcements = await prisma.announcements.findMany({
    where: {
      created_at: { gte: start, lt: end },
    },
    orderBy: { created_at: "asc" },
  });

  // Pull impressions for each session in one batched loop. For ~10 sessions
  // and small note counts this is acceptable; if seed grows large, batch with
  // a single findMany + groupBy.
  const impressionsBySession: DigestData["impressionsBySession"] = {};
  for (const s of sessions) {
    const rows = await listImpressionsBySessionForDigest(s.id);
    impressionsBySession[s.id] = rows.map((r) => ({
      note: r.note,
      slackUserId: r.slack_user_id,
      createdAt: r.created_at,
    }));
  }

  return {
    dateKey,
    sessions,
    announcementsByContent: announcements.map((a) => ({
      content: a.content,
      createdAt: a.created_at,
    })),
    impressionsBySession,
  };
}

// ─── Orchestration ─────────────────────────────────────────────────────────

export type GeneratePostDigestInput = {
  runKind: "scheduled" | "manual_post" | "test";
  channelId: string;
  slackClient: WebClient;
  dateKey?: string; // defaults to today
};

export type DigestRunResult = {
  id: string;
  posted: boolean;
  slackMessageTs: string | null;
  dateKey: string;
};

/**
 * Composes the digest, posts it to Slack, and records a daily_digest_runs row.
 * This is the only path that writes to daily_digest_runs.
 *
 * The /ardd digest preview command calls composeDigest() directly with the
 * data from gatherDigestData() — it never reaches this function, so no
 * DailyDigestRun row is created for previews.
 */
export async function generateAndPostDigest(
  input: GeneratePostDigestInput,
): Promise<DigestRunResult> {
  const dateKey = input.dateKey ?? todayDateKey();
  const data = await gatherDigestData(dateKey);
  const content = composeDigest(data);

  const post = await input.slackClient.chat.postMessage({
    channel: input.channelId,
    text: content,
  });

  const ts = (post.ts as string | undefined) ?? null;

  const row = await prisma.daily_digest_runs.create({
    data: {
      digest_date_key: dateKey,
      run_kind: input.runKind,
      channel_id: input.channelId,
      content,
      posted_at: new Date(),
      slack_message_ts: ts,
    },
  });

  return {
    id: row.id,
    posted: !!post.ok,
    slackMessageTs: ts,
    dateKey,
  };
}
