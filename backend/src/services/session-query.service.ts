/**
 * Session query service — backs /ardd now, /ardd next, /ardd schedule,
 * /ardd speaker, and the daily digest's session listing.
 *
 * All time-based decisions go through getEffectiveNow() (lib/time) so the
 * DEMO_NOW_ISO override works uniformly. CONFERENCE_TIMEZONE controls the
 * local-time mapping for `today`.
 */

import { differenceInCalendarDays, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

import { prisma } from "../lib/prisma";
import { getEffectiveNow } from "../lib/time";

const TZ = process.env.CONFERENCE_TIMEZONE ?? "America/Los_Angeles";

export type GetNowOptions = {
  /**
   * Soft-window in minutes: include sessions that start within this many
   * minutes of `now` even if they have not started yet. Default 0 (strict).
   *
   * USER CONTRIBUTION POINT (plan §3): pick a value that matches what
   * attendees expect when they ask "/ardd now". A 5–10 minute soft window
   * makes /ardd now still useful during short between-session gaps. 0 is
   * stricter — only sessions actually in progress.
   */
  softWindowMinutes?: number;
};

/**
 * Returns sessions whose start_time <= now < end_time. With softWindowMinutes,
 * also includes sessions that start within that many minutes of now.
 */
export async function getNow(opts: GetNowOptions = {}): Promise<SessionWithRelations[]> {
  const now = getEffectiveNow();
  const soft = opts.softWindowMinutes ?? 0;
  const softNow = new Date(now.getTime() + soft * 60_000);

  return prisma.sessions.findMany({
    where: {
      start_time: { lte: softNow },
      end_time: { gt: now },
    },
    orderBy: { start_time: "asc" },
    include: { speaker_entity: true, track_entity: true },
  });
}

/**
 * Returns the next N upcoming sessions strictly after `now`.
 */
export async function getNext(
  n: number,
): Promise<SessionWithRelations[]> {
  const now = getEffectiveNow();
  const take = Math.max(1, Math.min(10, n));
  return prisma.sessions.findMany({
    where: { start_time: { gt: now } },
    orderBy: { start_time: "asc" },
    take,
    include: { speaker_entity: true, track_entity: true },
  });
}

/**
 * Resolves a day spec ("day1" | "day2" | ... | "today") to a conference_day
 * integer relative to CONFERENCE_START_DATE_KEY. Returns null if the spec is
 * unparseable.
 */
export function resolveDaySpec(spec: string): number | null {
  const trimmed = spec.trim().toLowerCase();
  if (!trimmed || trimmed === "today") {
    const start = process.env.CONFERENCE_START_DATE_KEY;
    if (!start) return null;
    const todayKey = formatInTimeZone(getEffectiveNow(), TZ, "yyyy-MM-dd");
    return differenceInCalendarDays(parseISO(todayKey), parseISO(start)) + 1;
  }
  const match = /^day(\d+)$/.exec(trimmed);
  if (match) return parseInt(match[1], 10);
  const asInt = parseInt(trimmed, 10);
  return Number.isFinite(asInt) ? asInt : null;
}

/**
 * Returns sessions for a given conference_day (1-indexed). Accepts either an
 * integer day number or one of the day specs accepted by resolveDaySpec.
 */
export async function getByDay(
  daySpec: number | string,
): Promise<SessionWithRelations[]> {
  const day =
    typeof daySpec === "number" ? daySpec : resolveDaySpec(daySpec);
  if (day === null) return [];
  return prisma.sessions.findMany({
    where: { conference_day: day },
    orderBy: { start_time: "asc" },
    include: { speaker_entity: true, track_entity: true },
  });
}

/**
 * Returns sessions on a given conference_date_key (YYYY-MM-DD). Used by the
 * daily digest.
 */
export async function getByDateKey(
  conference_date_key: string,
): Promise<SessionWithRelations[]> {
  return prisma.sessions.findMany({
    where: { conference_date_key },
    orderBy: { start_time: "asc" },
    include: { speaker_entity: true, track_entity: true },
  });
}

/**
 * Fuzzy substring match on speakers.name (case-insensitive). Returns each
 * match with their upcoming sessions for the card render.
 */
export async function findSpeaker(query: string): Promise<SpeakerWithSessions[]> {
  const q = query.trim();
  if (!q) return [];
  return prisma.speakers.findMany({
    where: { name: { contains: q, mode: "insensitive" } },
    include: {
      sessions: {
        orderBy: { start_time: "asc" },
        include: { track_entity: true },
      },
    },
    take: 5,
  });
}

/**
 * Returns the conference_date_key string for "today" in CONFERENCE_TIMEZONE.
 * Used by the daily digest and /ardd schedule today.
 */
export function todayDateKey(): string {
  return formatInTimeZone(getEffectiveNow(), TZ, "yyyy-MM-dd");
}

// ─── Types ─────────────────────────────────────────────────────────────────

import type { sessions, speakers, tracks } from "@prisma/client";

export type SessionWithRelations = sessions & {
  speaker_entity: speakers | null;
  track_entity: tracks | null;
};

export type SpeakerWithSessions = speakers & {
  sessions: (sessions & { track_entity: tracks | null })[];
};
