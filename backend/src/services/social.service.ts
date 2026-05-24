import { prisma } from "../lib/prisma";
import { computeRecommendationsForUser } from "../social/engine";

const PROFILE_SELECT = {
  id: true, name: true, photo_url: true, institution: true,
  career_stage: true, research_area: true,
} as const;

// ─── Follow system ─────────────────────────────────────────────────────────────

export async function follow(followerId: string, followingId: string) {
  return prisma.follows.upsert({
    where: { follower_id_following_id: { follower_id: followerId, following_id: followingId } },
    create: { follower_id: followerId, following_id: followingId },
    update: {},
  });
}

export async function unfollow(followerId: string, followingId: string) {
  return prisma.follows.deleteMany({
    where: { follower_id: followerId, following_id: followingId },
  });
}

export async function getFollowers(profileId: string) {
  const rows = await prisma.follows.findMany({
    where: { following_id: profileId },
    orderBy: { created_at: "desc" },
  });
  const profiles = await prisma.profiles.findMany({
    where: { id: { in: rows.map((r) => r.follower_id) } },
    select: PROFILE_SELECT,
  });
  const map = new Map(profiles.map((p) => [p.id, p]));
  return rows.map((r) => ({ ...map.get(r.follower_id)!, followed_at: r.created_at }));
}

export async function getFollowing(profileId: string) {
  const rows = await prisma.follows.findMany({
    where: { follower_id: profileId },
    orderBy: { created_at: "desc" },
  });
  const profiles = await prisma.profiles.findMany({
    where: { id: { in: rows.map((r) => r.following_id) } },
    select: PROFILE_SELECT,
  });
  const map = new Map(profiles.map((p) => [p.id, p]));
  return rows.map((r) => ({ ...map.get(r.following_id)!, followed_at: r.created_at }));
}

export async function getMutualFollows(profileIdA: string, profileIdB: string) {
  const [followingA, followingB] = await Promise.all([
    prisma.follows.findMany({ where: { follower_id: profileIdA }, select: { following_id: true } }),
    prisma.follows.findMany({ where: { follower_id: profileIdB }, select: { following_id: true } }),
  ]);
  const setA = new Set(followingA.map((f) => f.following_id));
  const mutualIds = followingB.map((f) => f.following_id).filter((id) => setA.has(id));
  return prisma.profiles.findMany({
    where: { id: { in: mutualIds } },
    select: PROFILE_SELECT,
  });
}

export async function isFollowing(followerId: string, followingId: string) {
  const row = await prisma.follows.findUnique({
    where: { follower_id_following_id: { follower_id: followerId, following_id: followingId } },
  });
  return !!row;
}

export async function getFollowCounts(profileId: string) {
  const [followers, following] = await Promise.all([
    prisma.follows.count({ where: { following_id: profileId } }),
    prisma.follows.count({ where: { follower_id: profileId } }),
  ]);
  return { followers, following };
}

// ─── Profile views ─────────────────────────────────────────────────────────────

export async function recordProfileView(viewerId: string, targetId: string) {
  if (viewerId === targetId) return null;
  return prisma.profile_views.create({
    data: { viewer_id: viewerId, target_id: targetId },
  });
}

// ─── Recommendations ───────────────────────────────────────────────────────────

export async function getRecommendations(profileId: string, limit = 20, offset = 0) {
  const recs = await prisma.recommendations.findMany({
    where: { profile_id: profileId },
    orderBy: { score: "desc" },
    skip: offset,
    take: limit,
  });

  const profiles = await prisma.profiles.findMany({
    where: { id: { in: recs.map((r) => r.recommended_id) } },
    select: {
      ...PROFILE_SELECT,
      research_keywords: true,
      bio: true,
      linkedin_url: true,
    },
  });
  const map = new Map(profiles.map((p) => [p.id, p]));

  return recs.map((r) => ({
    id: r.id,
    score: r.score,
    reasons: r.reasons,
    computed_at: r.computed_at,
    profile: map.get(r.recommended_id) ?? null,
  }));
}

export async function computeRecommendations(userId: string) {
  return computeRecommendationsForUser(userId);
}
