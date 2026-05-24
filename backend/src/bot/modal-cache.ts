/**
 * Modal view cache for /ardd note.
 *
 * Slash command handlers must call views.open within ~3 seconds of receiving
 * the trigger_id. Loading sessions from the DB at modal-open time risks
 * blowing past that window. Instead, we preload a static_select view at bot
 * startup and refresh periodically.
 *
 * The cached view is "session-select-with-empty-private-metadata" — the
 * caller injects channel context via private_metadata immediately before
 * passing it to views.open.
 *
 * NOTE on capacity: Slack static_select supports up to 100 options. The demo
 * seed has ~10 sessions. If the real schedule exceeds 100, swap to
 * external_select with options_load_url and server-side filtering — see
 * plan deferred section. There is a TODO marker below.
 */

import type { View } from "@slack/types";
import { prisma } from "../lib/prisma";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // refresh cached view every 5 minutes

type SessionOption = {
  id: string;
  title: string;
  conferenceDay: number | null;
};

let cachedView: View | null = null;
let refreshHandle: NodeJS.Timeout | null = null;

async function fetchOptions(): Promise<SessionOption[]> {
  const sessions = await prisma.sessions.findMany({
    select: { id: true, title: true, conference_day: true },
    orderBy: [
      { conference_day: "asc" },
      { start_time: "asc" },
    ],
    take: 100, // TODO(deferred): if schedule grows past 100, switch to external_select
  });
  return sessions.map((s) => ({
    id: s.id,
    title: s.title ?? "Untitled session",
    conferenceDay: s.conference_day,
  }));
}

function buildView(options: SessionOption[]): View {
  const slackOptions = options.length > 0
    ? options.map((o) => ({
        text: {
          type: "plain_text" as const,
          text: truncatePlainText(
            o.conferenceDay !== null
              ? `Day ${o.conferenceDay} — ${o.title}`
              : o.title,
            75, // Slack option text limit
          ),
          emoji: true,
        },
        value: o.id,
      }))
    : [
        {
          text: {
            type: "plain_text" as const,
            text: "No sessions available yet",
            emoji: true,
          },
          value: "__none__",
        },
      ];

  return {
    type: "modal",
    callback_id: "ardd_note_submit",
    private_metadata: "", // caller MUST overwrite this with the originating channel id
    title: { type: "plain_text", text: "Session Note", emoji: true },
    submit: { type: "plain_text", text: "Save", emoji: true },
    close: { type: "plain_text", text: "Cancel", emoji: true },
    blocks: [
      {
        type: "input",
        block_id: "session_block",
        label: { type: "plain_text", text: "Session", emoji: true },
        element: {
          type: "static_select",
          action_id: "session_select",
          placeholder: {
            type: "plain_text",
            text: "Pick a session…",
            emoji: true,
          },
          options: slackOptions,
        },
      },
      {
        type: "input",
        block_id: "note_block",
        label: { type: "plain_text", text: "Your note", emoji: true },
        element: {
          type: "plain_text_input",
          action_id: "note_input",
          multiline: true,
          placeholder: {
            type: "plain_text",
            text: "Quick impressions, takeaways, or questions…",
          },
          max_length: 2000,
        },
      },
    ],
  };
}

function truncatePlainText(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}

/**
 * Refreshes the cached view from the DB. Returns the new view. Called once
 * at startup and then on an interval.
 */
export async function refreshNoteModalCache(): Promise<View> {
  const options = await fetchOptions();
  cachedView = buildView(options);
  return cachedView;
}

/**
 * Returns the cached view. Throws if not yet initialised — callers should
 * ensure refreshNoteModalCache() has been called at startup.
 */
export function getNoteView(): View {
  if (!cachedView) {
    throw new Error(
      "Note modal cache not initialised. Call refreshNoteModalCache() at startup.",
    );
  }
  // Return a defensive shallow clone so the caller can mutate private_metadata
  // without polluting the cache.
  return { ...cachedView };
}

export function startModalCacheRefreshLoop(): void {
  if (refreshHandle) return;
  refreshHandle = setInterval(() => {
    refreshNoteModalCache().catch((err) => {
      console.warn("[modal-cache] periodic refresh failed:", err);
    });
  }, REFRESH_INTERVAL_MS);
  // Don't keep the process alive just for this timer.
  refreshHandle.unref();
}

export function stopModalCacheRefreshLoop(): void {
  if (refreshHandle) {
    clearInterval(refreshHandle);
    refreshHandle = null;
  }
}
