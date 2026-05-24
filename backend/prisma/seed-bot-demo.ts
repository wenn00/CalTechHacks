/**
 * Seed synthetic demo data for the ARDD Slack bot demo.
 *
 * Run with: `npx tsx prisma/seed-bot-demo.ts`
 *
 * Adds tracks, speakers, ~10 sessions across 2 days, 3 announcements, and
 * 5 sample impressions — enough material so `/ardd now`, `/ardd schedule`,
 * `/ardd speaker`, `/ardd notes` produce non-empty results during a demo.
 *
 * IMPORTANT — synthetic speakers only.
 * Speaker names are clearly synthetic (Dr. A. Demo, Dr. Senolytic Example,
 * etc.) so a judge running /ardd speaker is not misled into believing real
 * researchers are attending. Swap to the official ARDD schedule only if/when
 * that data is officially available.
 *
 * NOT idempotent — running twice will create duplicate sessions. Use
 * `npx prisma migrate reset && npm run db:seed && npx tsx prisma/seed-bot-demo.ts`
 * to start clean.
 *
 * Existing attendee data (profiles, matches, swipe_actions, ...) is left
 * untouched — this script only writes to sessions, speakers, tracks,
 * announcements, session_impressions.
 */

import { PrismaClient } from "@prisma/client";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

const prisma = new PrismaClient();

const TZ = process.env.CONFERENCE_TIMEZONE ?? "America/Los_Angeles";
const START = process.env.CONFERENCE_START_DATE_KEY ?? "2026-09-01";

function dayKey(offsetDays: number): string {
  // Returns YYYY-MM-DD in CONFERENCE_TIMEZONE for (START + offsetDays).
  const startDate = parseISO(START);
  startDate.setUTCDate(startDate.getUTCDate() + offsetDays);
  return formatInTimeZone(startDate, TZ, "yyyy-MM-dd");
}

function conferenceDayOf(dateKey: string): number {
  return differenceInCalendarDays(parseISO(dateKey), parseISO(START)) + 1;
}

// Builds an ISO timestamp for a given conference local time. Example:
//   localAt("2026-09-01", "10:00") -> Date for 2026-09-01 10:00 local TZ
function localAt(dateKey: string, hhmm: string): Date {
  // Construct UTC ISO from local TZ. date-fns-tz `fromZonedTime` would be
  // cleaner but is not imported here; for demo data this manual conversion is
  // sufficient because CONFERENCE_TIMEZONE has a known fixed offset during the
  // conference window.
  return new Date(`${dateKey}T${hhmm}:00`);
}

type SessionSeed = {
  title: string;
  description: string;
  location: string;
  conference_day: number;
  date_key: string;
  start: string; // "HH:MM"
  end: string; // "HH:MM"
  speaker_name: string;
  track_name: string;
  tags: string[];
};

async function main(): Promise<void> {
  console.log(`Seeding demo data — TZ=${TZ}, START=${START}`);

  // ───── tracks ─────
  const trackDefs = [
    { name: "Basic Science", description: "Fundamental aging biology" },
    {
      name: "Translational",
      description: "Bench-to-clinic pipelines and biomarkers",
    },
    {
      name: "Clinical",
      description: "Human trials and clinical interventions",
    },
  ];
  const tracks: Record<string, string> = {};
  for (const t of trackDefs) {
    const row = await prisma.tracks.upsert({
      where: { name: t.name },
      update: { description: t.description },
      create: t,
    });
    tracks[t.name] = row.id;
  }
  console.log(`Tracks: ${Object.keys(tracks).join(", ")}`);

  // ───── speakers (clearly synthetic) ─────
  const speakerDefs = [
    {
      name: "Dr. A. Demo",
      title: "Principal Investigator",
      institution: "Demo Aging Institute",
      bio: "Demo speaker for the ARDD Slack bot. Studies the longevity of synthetic mice in test fixtures.",
    },
    {
      name: "Dr. Senolytic Example",
      title: "Associate Professor",
      institution: "Example University",
      bio: "Synthetic demo profile. Research focus: senolytic combinations in cell-culture demos.",
    },
    {
      name: "Dr. NAD Placeholder",
      title: "Research Scientist",
      institution: "Placeholder Labs",
      bio: "Synthetic demo profile. Studies NAD+ precursor effects in demo cohorts.",
    },
    {
      name: "Dr. Rapamycin Fixture",
      title: "Director of Aging Research",
      institution: "Fixture Biotech",
      bio: "Synthetic demo profile. mTOR pathway interventions in demo data sets.",
    },
    {
      name: "Dr. Epigenome Sample",
      title: "Postdoctoral Fellow",
      institution: "Sample Research Center",
      bio: "Synthetic demo profile. Epigenetic clock reprogramming, demo edition.",
    },
  ];
  const speakers: Record<string, string> = {};
  for (const s of speakerDefs) {
    // No unique constraint on speakers.name, so look up first.
    const existing = await prisma.speakers.findFirst({
      where: { name: s.name },
    });
    const row = existing
      ? await prisma.speakers.update({ where: { id: existing.id }, data: s })
      : await prisma.speakers.create({ data: s });
    speakers[s.name] = row.id;
  }
  console.log(`Speakers: ${Object.keys(speakers).join(", ")}`);

  // ───── sessions: ~10 across 2 days ─────
  const day1 = dayKey(0);
  const day2 = dayKey(1);

  const sessionDefs: SessionSeed[] = [
    {
      title: "Opening Keynote — State of Longevity Research",
      description: "Year-in-review across geroscience, biomarkers, and pipelines.",
      location: "Main Hall",
      conference_day: conferenceDayOf(day1),
      date_key: day1,
      start: "09:00",
      end: "10:00",
      speaker_name: "Dr. A. Demo",
      track_name: "Basic Science",
      tags: ["keynote", "overview"],
    },
    {
      title: "Senolytics: Combination Therapy Pipeline",
      description: "Latest data on D+Q and adjacent senolytic combinations in demo cohorts.",
      location: "Track A — Cypress",
      conference_day: conferenceDayOf(day1),
      date_key: day1,
      start: "10:30",
      end: "11:15",
      speaker_name: "Dr. Senolytic Example",
      track_name: "Translational",
      tags: ["senolytics", "combination"],
    },
    {
      title: "NAD+ Precursors — What Worked, What Didn't",
      description: "Results from recent NR/NMN intervention demo studies.",
      location: "Track B — Redwood",
      conference_day: conferenceDayOf(day1),
      date_key: day1,
      start: "11:30",
      end: "12:15",
      speaker_name: "Dr. NAD Placeholder",
      track_name: "Translational",
      tags: ["NAD+", "intervention"],
    },
    {
      title: "mTOR & Rapamycin in Healthy Aging",
      description: "Long-term outcomes from rapamycin demo cohorts.",
      location: "Track A — Cypress",
      conference_day: conferenceDayOf(day1),
      date_key: day1,
      start: "13:30",
      end: "14:15",
      speaker_name: "Dr. Rapamycin Fixture",
      track_name: "Clinical",
      tags: ["rapamycin", "mTOR"],
    },
    {
      title: "Epigenetic Clocks 101 — Workshop",
      description: "Hands-on intro to methylation clocks. Bring laptop.",
      location: "Workshop Room 1",
      conference_day: conferenceDayOf(day1),
      date_key: day1,
      start: "14:30",
      end: "16:00",
      speaker_name: "Dr. Epigenome Sample",
      track_name: "Basic Science",
      tags: ["workshop", "epigenetic-clock"],
    },
    {
      title: "Day 2 Opening — Future of Geroscience",
      description: "Where the field is headed and where the funding is going.",
      location: "Main Hall",
      conference_day: conferenceDayOf(day2),
      date_key: day2,
      start: "09:00",
      end: "10:00",
      speaker_name: "Dr. A. Demo",
      track_name: "Basic Science",
      tags: ["keynote", "future"],
    },
    {
      title: "Cellular Reprogramming Safety Profile",
      description: "Recent demo data on partial reprogramming in non-human primates.",
      location: "Track A — Cypress",
      conference_day: conferenceDayOf(day2),
      date_key: day2,
      start: "10:30",
      end: "11:15",
      speaker_name: "Dr. Epigenome Sample",
      track_name: "Translational",
      tags: ["reprogramming", "safety"],
    },
    {
      title: "Late-Onset Diseases: Shared Mechanisms",
      description: "Linking Alzheimer's, sarcopenia, and frailty through cellular senescence.",
      location: "Track B — Redwood",
      conference_day: conferenceDayOf(day2),
      date_key: day2,
      start: "11:30",
      end: "12:15",
      speaker_name: "Dr. Senolytic Example",
      track_name: "Clinical",
      tags: ["alzheimers", "frailty"],
    },
    {
      title: "Panel: Translating Geroscience to the Clinic",
      description: "Cross-disciplinary panel on regulatory and trial-design challenges.",
      location: "Main Hall",
      conference_day: conferenceDayOf(day2),
      date_key: day2,
      start: "14:00",
      end: "15:00",
      speaker_name: "Dr. Rapamycin Fixture",
      track_name: "Clinical",
      tags: ["panel", "translation"],
    },
    {
      title: "Closing Keynote — Open Questions",
      description: "Recap and pointers to the next wave of demo research.",
      location: "Main Hall",
      conference_day: conferenceDayOf(day2),
      date_key: day2,
      start: "16:00",
      end: "17:00",
      speaker_name: "Dr. NAD Placeholder",
      track_name: "Basic Science",
      tags: ["keynote", "closing"],
    },
  ];

  const sessionIds: string[] = [];
  for (const s of sessionDefs) {
    const row = await prisma.sessions.create({
      data: {
        title: s.title,
        description: s.description,
        location: s.location,
        speaker: s.speaker_name,
        track: s.track_name,
        conference_date_key: s.date_key,
        conference_day: s.conference_day,
        day: `day${s.conference_day}`,
        start_time: localAt(s.date_key, s.start),
        end_time: localAt(s.date_key, s.end),
        tags: s.tags,
        speaker_id: speakers[s.speaker_name] ?? null,
        track_id: tracks[s.track_name] ?? null,
      },
    });
    sessionIds.push(row.id);
  }
  console.log(`Sessions created: ${sessionIds.length}`);

  // ───── announcements (demo) ─────
  const announcementDefs = [
    {
      content: "Welcome to ARDD! Lunch is served at 12:30 in the Atrium.",
      posted_by_slack_user_id: "UDEMOADMIN1",
    },
    {
      content: "Reminder: Day 2 keynote starts at 9 AM sharp in the Main Hall.",
      posted_by_slack_user_id: "UDEMOADMIN1",
    },
    {
      content: "Closing reception moved to the Garden Terrace.",
      posted_by_slack_user_id: "UDEMOADMIN2",
    },
  ];
  for (const a of announcementDefs) {
    await prisma.announcements.create({
      data: {
        content: a.content,
        posted_by_slack_user_id: a.posted_by_slack_user_id,
        broadcasted_at: new Date(),
        slack_channel_id: process.env.SLACK_DIGEST_CHANNEL_ID ?? null,
      },
    });
  }
  console.log(`Announcements: ${announcementDefs.length}`);

  // ───── sample impressions ─────
  const impressionDefs = [
    { session_idx: 0, slack_user_id: "UDEMOUSER1", note: "Great overview, set the stage well." },
    { session_idx: 1, slack_user_id: "UDEMOUSER2", note: "Combination dosing data was the most actionable part." },
    { session_idx: 2, slack_user_id: "UDEMOUSER3", note: "Wished they'd talked more about precursor selection." },
    { session_idx: 3, slack_user_id: "UDEMOUSER1", note: "Long-term outcomes finally addressed — about time." },
    { session_idx: 4, slack_user_id: "UDEMOUSER4", note: "Workshop was hands-on and well paced." },
  ];
  for (const i of impressionDefs) {
    await prisma.session_impressions.create({
      data: {
        session_id: sessionIds[i.session_idx],
        slack_user_id: i.slack_user_id,
        note: i.note,
      },
    });
  }
  console.log(`Impressions: ${impressionDefs.length}`);

  console.log("Demo seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
