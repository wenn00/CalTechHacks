// ─── Social recommendation engine ────────────────────────────────────────────
// Scoring weights (must sum to 1.0):
//   research  0.35 — from existing matches table (already computed)
//   social    0.25 — people you follow who also follow the candidate
//   messaging 0.20 — people you've messaged who also follow the candidate
//   session   0.10 — Jaccard on session_interests
//   swipe     0.10 — people you swiped interested/connect on who follow candidate

import { prisma } from "../lib/prisma";
import { jaccard, intersect } from "../matching/similarity";

const W = { research: 0.35, social: 0.25, messaging: 0.20, session: 0.10, swipe: 0.10 };

export async function computeRecommendationsForUser(userId: string): Promise<number> {
  const me = await prisma.profiles.findUnique({
    where: { id: userId },
    select: { id: true, session_interests: true, goals: true },
  });
  if (!me) return 0;

  // All candidates: exclude self
  const candidates = await prisma.profiles.findMany({
    where: { id: { not: userId } },
    select: { id: true, name: true, session_interests: true },
  });

  // Who I already follow (exclude from recommendations)
  const myFollows = await prisma.follows.findMany({
    where: { follower_id: userId },
    select: { following_id: true },
  });
  const myFollowingSet = new Set(myFollows.map((f) => f.following_id));

  // My swipe actions
  const mySwipes = await prisma.swipe_actions.findMany({
    where: { swiper_id: userId },
    select: { target_id: true, action: true },
  });
  const skippedSet = new Set(mySwipes.filter((s) => s.action === "skip").map((s) => s.target_id));
  const interestedSet = new Set(
    mySwipes.filter((s) => s.action === "interested" || s.action === "connect").map((s) => s.target_id)
  );

  // Research match scores from existing matches table
  const matchRows = await prisma.matches.findMany({
    where: { OR: [{ profile_a_id: userId }, { profile_b_id: userId }] },
    select: { profile_a_id: true, profile_b_id: true, score: true, shared_keywords: true },
  });
  const matchMap = new Map<string, { score: number; shared_keywords: string[] }>();
  for (const m of matchRows) {
    const otherId = m.profile_a_id === userId ? m.profile_b_id : m.profile_a_id;
    matchMap.set(otherId, { score: m.score, shared_keywords: m.shared_keywords });
  }

  // All follows in the system — build candidate → follower set index
  const allFollows = await prisma.follows.findMany({
    select: { follower_id: true, following_id: true },
  });
  const candidateFollowers = new Map<string, Set<string>>();
  for (const f of allFollows) {
    if (!candidateFollowers.has(f.following_id)) {
      candidateFollowers.set(f.following_id, new Set());
    }
    candidateFollowers.get(f.following_id)!.add(f.follower_id);
  }

  // My conversation partners
  const myConvs = await prisma.conversation_participants.findMany({
    where: { profile_id: userId },
    select: { conversation_id: true },
  });
  const convPartners = await prisma.conversation_participants.findMany({
    where: {
      conversation_id: { in: myConvs.map((c) => c.conversation_id) },
      profile_id: { not: userId },
    },
    select: { profile_id: true },
  });
  const myConvPartnerSet = new Set(convPartners.map((c) => c.profile_id));

  // Score each candidate
  const scored: Array<{ candidateId: string; score: number; reasons: string[] }> = [];

  for (const candidate of candidates) {
    if (myFollowingSet.has(candidate.id)) continue;
    if (skippedSet.has(candidate.id)) continue;

    const matchData = matchMap.get(candidate.id);
    const researchScore = matchData?.score ?? 0;
    const sharedKeywords = matchData?.shared_keywords ?? [];

    // Social: people I follow who also follow the candidate
    const theirFollowers = candidateFollowers.get(candidate.id) ?? new Set();
    const networkReach = [...myFollowingSet].filter((id) => theirFollowers.has(id)).length;
    const socialScore = Math.min(1, networkReach / Math.max(1, myFollowingSet.size) * 2);

    // Messaging: people I've messaged who follow the candidate
    const messagingCount = [...myConvPartnerSet].filter((id) => theirFollowers.has(id)).length;
    const messagingScore = Math.min(1, messagingCount / Math.max(1, myConvPartnerSet.size) * 3);

    // Session interests overlap
    const sessionScore = jaccard(me.session_interests, candidate.session_interests);
    const sharedInterests = intersect(me.session_interests, candidate.session_interests);

    // Swipe: people I swiped interested on who follow the candidate
    const swipeCount = [...interestedSet].filter((id) => theirFollowers.has(id)).length;
    const swipeScore = Math.min(1, swipeCount / Math.max(1, interestedSet.size) * 3);

    const total =
      researchScore  * W.research  +
      socialScore    * W.social    +
      messagingScore * W.messaging +
      sessionScore   * W.session   +
      swipeScore     * W.swipe;

    const reasons = buildReasons({
      researchScore, sharedKeywords,
      networkReach, socialScore,
      messagingCount,
      sessionScore, sharedInterests,
    });

    scored.push({ candidateId: candidate.id, score: total, reasons });
  }

  scored.sort((a, b) => b.score - a.score);
  const top25 = scored.slice(0, 25);

  for (const rec of top25) {
    await prisma.recommendations.upsert({
      where: { profile_id_recommended_id: { profile_id: userId, recommended_id: rec.candidateId } },
      create: {
        profile_id: userId,
        recommended_id: rec.candidateId,
        score: Math.round(rec.score * 1000) / 1000,
        reasons: rec.reasons,
      },
      update: {
        score: Math.round(rec.score * 1000) / 1000,
        reasons: rec.reasons,
        computed_at: new Date(),
      },
    });
  }

  return top25.length;
}

function buildReasons(signals: {
  researchScore: number;
  sharedKeywords: string[];
  networkReach: number;
  socialScore: number;
  messagingCount: number;
  sessionScore: number;
  sharedInterests: string[];
}): string[] {
  const reasons: string[] = [];

  if (signals.sharedKeywords.length > 0) {
    const kw = signals.sharedKeywords.slice(0, 2).join(" and ");
    reasons.push(`You both study ${kw}.`);
  } else if (signals.researchScore > 0.2) {
    reasons.push("Similar research focus area.");
  }

  if (signals.networkReach === 1) {
    reasons.push("1 person you follow also follows this researcher.");
  } else if (signals.networkReach > 1) {
    reasons.push(`${signals.networkReach} people you follow also follow this researcher.`);
  }

  if (signals.messagingCount > 0) {
    reasons.push("Researchers you've connected with also know this person.");
  }

  if (signals.sharedInterests.length > 0) {
    reasons.push(`You both attended ${signals.sharedInterests[0]} sessions.`);
  } else if (signals.sessionScore > 0.25) {
    reasons.push("You share conference session interests.");
  }

  if (reasons.length === 0) {
    reasons.push("Active researcher in your network area.");
  }

  return reasons;
}
