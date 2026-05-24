import { prisma } from "../lib/prisma";
import { computeMatchesForUser } from "../matching/engine";
import { intersect } from "../matching/similarity";

// ─── Get top matches for a user ───────────────────────────────────────────────

export async function getMatches(userId: string, limit = 20, offset = 0) {
  // Matches are stored canonically (a < b), so query both columns
  const rows = await prisma.matches.findMany({
    where: {
      OR: [{ profile_a_id: userId }, { profile_b_id: userId }],
    },
    orderBy: { score: "desc" },
    skip: offset,
    take: limit,
  });

  // Attach the "other" profile's data
  const otherIds = rows.map((r) => (r.profile_a_id === userId ? r.profile_b_id : r.profile_a_id));
  const profiles = await prisma.profiles.findMany({
    where: { id: { in: otherIds } },
    select: {
      id: true, name: true, photo_url: true, institution: true,
      career_stage: true, research_area: true, research_keywords: true,
      bio: true, linkedin_url: true, google_scholar_url: true,
    },
  });
  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  return rows.map((r) => {
    const otherId = r.profile_a_id === userId ? r.profile_b_id : r.profile_a_id;
    return { ...r, profile: profileMap.get(otherId) ?? null };
  });
}

// ─── Venn diagram data for two specific users ─────────────────────────────────

export async function getOverlap(userIdA: string, userIdB: string) {
  const [a, b] = await Promise.all([
    prisma.profiles.findUnique({
      where: { id: userIdA },
      select: { id: true, name: true, research_keywords: true, session_interests: true, goals: true, research_area: true },
    }),
    prisma.profiles.findUnique({
      where: { id: userIdB },
      select: { id: true, name: true, research_keywords: true, session_interests: true, goals: true, research_area: true },
    }),
  ]);

  if (!a || !b) return null;

  const sharedKeywords  = intersect(a.research_keywords, b.research_keywords);
  const uniqueA_kw      = a.research_keywords.filter((k) => !sharedKeywords.includes(k.toLowerCase()));
  const uniqueB_kw      = b.research_keywords.filter((k) => !sharedKeywords.includes(k.toLowerCase()));
  const sharedInterests = intersect(a.session_interests, b.session_interests);
  const sharedGoals     = intersect(a.goals, b.goals);

  return {
    profiles: { a: { id: a.id, name: a.name }, b: { id: b.id, name: b.name } },
    keywords: {
      shared:   sharedKeywords,
      uniqueA:  uniqueA_kw,
      uniqueB:  uniqueB_kw,
      overlapStrength: sharedKeywords.length / Math.max(1, new Set([...a.research_keywords, ...b.research_keywords]).size),
    },
    interests: {
      shared:  sharedInterests,
      uniqueA: a.session_interests.filter((i) => !sharedInterests.includes(i.toLowerCase())),
      uniqueB: b.session_interests.filter((i) => !sharedInterests.includes(i.toLowerCase())),
    },
    goals: { shared: sharedGoals },
    areas: { a: a.research_area, b: b.research_area, match: a.research_area === b.research_area },
  };
}

// ─── Trigger recomputation ────────────────────────────────────────────────────

export async function recomputeMatches(userId: string) {
  return computeMatchesForUser(userId);
}

// ─── Swipe ────────────────────────────────────────────────────────────────────

const VALID_ACTIONS = ["interested", "skip", "save", "connect"] as const;
type SwipeAction = typeof VALID_ACTIONS[number];

export async function recordSwipe(swiperId: string, targetId: string, action: SwipeAction) {
  return prisma.swipe_actions.upsert({
    where: { swiper_id_target_id: { swiper_id: swiperId, target_id: targetId } },
    create: { swiper_id: swiperId, target_id: targetId, action },
    update: { action },
  });
}

export async function getSwipes(swiperId: string) {
  return prisma.swipe_actions.findMany({
    where: { swiper_id: swiperId },
    orderBy: { created_at: "desc" },
  });
}

// ─── Publications ─────────────────────────────────────────────────────────────

export async function addPublication(profileId: string, data: {
  title: string; abstract?: string; keywords: string[]; year?: number; journal?: string; url?: string;
}) {
  return prisma.publications.create({ data: { profile_id: profileId, ...data } });
}

export async function getPublications(profileId: string) {
  return prisma.publications.findMany({ where: { profile_id: profileId }, orderBy: { year: "desc" } });
}
