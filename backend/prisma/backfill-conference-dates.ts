/**
 * Backfill conference_date_key and conference_day for existing sessions rows.
 *
 * Run with: `npx tsx prisma/backfill-conference-dates.ts`
 *
 * Requires CONFERENCE_TIMEZONE and CONFERENCE_START_DATE_KEY in backend/.env.
 *
 * After this script reports "all rows filled", drop the `?` on
 * conference_date_key and conference_day in schema.prisma and run
 * `prisma db push` again so those columns become NOT NULL.
 *
 * Idempotent — skips rows that already have both columns populated.
 */

import { PrismaClient } from "@prisma/client";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

const prisma = new PrismaClient();

const TZ = process.env.CONFERENCE_TIMEZONE ?? "America/Los_Angeles";
const START = process.env.CONFERENCE_START_DATE_KEY;

async function main(): Promise<void> {
  if (!START) {
    throw new Error(
      "CONFERENCE_START_DATE_KEY is required (e.g. 2026-09-01). Set it in backend/.env",
    );
  }

  const rows = await prisma.sessions.findMany({
    select: {
      id: true,
      start_time: true,
      day: true,
      conference_date_key: true,
      conference_day: true,
    },
  });

  console.log(`Found ${rows.length} session row(s).`);

  let updated = 0;
  let skippedAlreadyFilled = 0;
  let skippedNoStartTime = 0;

  for (const row of rows) {
    if (row.conference_date_key && row.conference_day !== null) {
      skippedAlreadyFilled++;
      continue;
    }

    if (!row.start_time) {
      console.warn(
        `[skip] session ${row.id} has no start_time (legacy column missing); set conference_date_key/day manually`,
      );
      skippedNoStartTime++;
      continue;
    }

    const conference_date_key = formatInTimeZone(
      row.start_time,
      TZ,
      "yyyy-MM-dd",
    );
    const conference_day =
      differenceInCalendarDays(parseISO(conference_date_key), parseISO(START)) +
      1;

    await prisma.sessions.update({
      where: { id: row.id },
      data: { conference_date_key, conference_day },
    });
    updated++;
  }

  console.log(
    `Backfill complete. updated=${updated} skipped_already_filled=${skippedAlreadyFilled} skipped_no_start_time=${skippedNoStartTime}`,
  );

  // Verify no row still has a NULL in the two columns we just backfilled
  // (excluding the documented skipped_no_start_time rows).
  const remaining = await prisma.sessions.count({
    where: {
      OR: [{ conference_date_key: null }, { conference_day: null }],
    },
  });
  if (remaining > 0) {
    console.warn(
      `WARNING: ${remaining} row(s) still NULL — investigate before tightening schema.`,
    );
  } else {
    console.log(
      "All rows have conference_date_key and conference_day populated. Safe to drop `?` in schema.",
    );
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
