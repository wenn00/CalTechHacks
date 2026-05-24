// Seed realistic follow relationships for ARDD conference networking,
// then compute initial recommendations for all profiles.
//
// Run: npx tsx prisma/seed-social.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const profiles = await prisma.profiles.findMany({
    select: { id: true, career_stage: true, research_area: true },
  });

  if (profiles.length === 0) {
    console.log("No profiles found. Run the main seed first.");
    return;
  }

  // Clear existing social data
  await prisma.recommendations.deleteMany({});
  await prisma.follows.deleteMany({});
  console.log("Cleared existing social data.");

  // Group by career stage for realistic ARDD networking patterns
  const byStage = (stage: string) => profiles.filter((p) => p.career_stage === stage);
  const investors  = byStage("investor");
  const founders   = byStage("founder");
  const pis        = byStage("pi");
  const phds       = byStage("phd_student");
  const executives = byStage("executive");
  const seniors    = byStage("senior");
  const others     = profiles.filter((p) =>
    !["investor", "founder", "pi", "phd_student", "executive", "senior"].includes(p.career_stage ?? "")
  );

  const pairs: Array<{ follower_id: string; following_id: string }> = [];

  const add = (followerId: string, followingId: string) => {
    if (followerId !== followingId) pairs.push({ follower_id: followerId, following_id: followingId });
  };

  // Investors follow founders (high-value ARDD networking)
  for (const inv of investors) {
    for (const f of founders.slice(0, 4)) add(inv.id, f.id);
    for (const pi of pis.slice(0, 2))    add(inv.id, pi.id);
  }

  // Founders follow investors + PIs (fundraising + research partnerships)
  for (const f of founders) {
    for (const inv of investors.slice(0, 3)) add(f.id, inv.id);
    for (const pi of pis.slice(0, 2))        add(f.id, pi.id);
    for (const ex of executives.slice(0, 1)) add(f.id, ex.id);
  }

  // PIs follow each other and their PhD students
  for (let i = 0; i < pis.length; i++) {
    for (let j = i + 1; j < Math.min(i + 4, pis.length); j++) {
      add(pis[i].id, pis[j].id);
      add(pis[j].id, pis[i].id);
    }
    for (const phd of phds.slice(0, 3)) add(pis[i].id, phd.id);
  }

  // PhD students follow PIs (mentor relationships)
  for (const phd of phds) {
    for (const pi of pis.slice(0, 4))    add(phd.id, pi.id);
    for (const sr of seniors.slice(0, 1)) add(phd.id, sr.id);
  }

  // Executives follow investors + founders
  for (const ex of executives) {
    for (const inv of investors.slice(0, 2)) add(ex.id, inv.id);
    for (const f of founders.slice(0, 2))    add(ex.id, f.id);
  }

  // Seniors follow executives + PIs
  for (const sr of seniors) {
    for (const ex of executives.slice(0, 2)) add(sr.id, ex.id);
    for (const pi of pis.slice(0, 2))        add(sr.id, pi.id);
  }

  // Others follow PIs + founders
  for (const other of others) {
    for (const pi of pis.slice(0, 2))  add(other.id, pi.id);
    for (const f of founders.slice(0, 1)) add(other.id, f.id);
  }

  // Deduplicate
  const seen = new Set<string>();
  const unique = pairs.filter((p) => {
    const key = `${p.follower_id}:${p.following_id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  await prisma.follows.createMany({ data: unique, skipDuplicates: true });
  console.log(`Seeded ${unique.length} follow relationships.`);

  // Compute recommendations for every profile
  const { computeRecommendationsForUser } = await import("../src/social/engine");
  let totalRecs = 0;
  for (const profile of profiles) {
    const count = await computeRecommendationsForUser(profile.id);
    totalRecs += count;
    process.stdout.write(".");
  }
  console.log(`\nComputed ${totalRecs} recommendations across ${profiles.length} profiles.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
