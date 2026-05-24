import { prisma } from "../lib/prisma";
import { buildGraph } from "../graph/builder";

type GraphFilters = {
  research_area?: string;
  career_stage?: string;
  institution?: string;
  type?: string;
  min_strength?: number;
};

// ─── Full graph ────────────────────────────────────────────────────────────────

export async function getGraph(filters: GraphFilters = {}) {
  const [profiles, matches] = await Promise.all([
    prisma.profiles.findMany({
      select: {
        id: true, name: true, photo_url: true, institution: true,
        career_stage: true, research_area: true, research_keywords: true,
        session_interests: true, goals: true,
      },
    }),
    prisma.matches.findMany({
      select: {
        profile_a_id: true, profile_b_id: true, score: true,
        keyword_score: true, area_score: true, stage_score: true,
        shared_keywords: true, shared_areas: true, explanation: true,
      },
    }),
  ]);

  return buildGraph(profiles, matches, filters);
}

// ─── Single node with its connections ─────────────────────────────────────────

export async function getNode(profileId: string) {
  const profile = await prisma.profiles.findUnique({
    where: { id: profileId },
    select: {
      id: true, name: true, photo_url: true, institution: true,
      career_stage: true, research_area: true, research_keywords: true,
      bio: true, linkedin_url: true, goals: true, session_interests: true,
    },
  });

  if (!profile) return null;

  const connections = await prisma.matches.findMany({
    where: {
      OR: [{ profile_a_id: profileId }, { profile_b_id: profileId }],
      score: { gt: 0.1 },
    },
    orderBy: { score: "desc" },
    take: 20,
  });

  const otherIds = connections.map((c) =>
    c.profile_a_id === profileId ? c.profile_b_id : c.profile_a_id
  );

  const others = await prisma.profiles.findMany({
    where: { id: { in: otherIds } },
    select: { id: true, name: true, photo_url: true, institution: true, career_stage: true, research_area: true },
  });
  const othersMap = new Map(others.map((o) => [o.id, o]));

  return {
    profile,
    connections: connections.map((c) => {
      const otherId = c.profile_a_id === profileId ? c.profile_b_id : c.profile_a_id;
      return {
        profile: othersMap.get(otherId),
        score: c.score,
        shared_keywords: c.shared_keywords,
        shared_areas: c.shared_areas,
        explanation: c.explanation,
      };
    }),
  };
}

// ─── Available filter options ──────────────────────────────────────────────────

export async function getFilterOptions() {
  const profiles = await prisma.profiles.findMany({
    select: { research_area: true, career_stage: true, institution: true },
  });

  return {
    research_areas: [...new Set(profiles.map((p) => p.research_area).filter(Boolean))].sort(),
    career_stages:  [...new Set(profiles.map((p) => p.career_stage).filter(Boolean))].sort(),
    institutions:   [...new Set(profiles.map((p) => p.institution).filter(Boolean))].sort(),
    connection_types: ["keyword", "area", "institution", "complementary", "interest"],
  };
}
