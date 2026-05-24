// ─── Core match engine ────────────────────────────────────────────────────────
// Scoring weights (must sum to 1.0):
//   keywords  0.40 — Jaccard on research_keywords + publication keywords
//   area      0.20 — research_area string overlap
//   stage     0.20 — career stage compatibility matrix
//   goals     0.10 — Jaccard on goals arrays
//   interests 0.10 — Jaccard on session_interests
//
// Embedding similarity (optional) replaces 10% of keyword weight when available.

import { prisma } from "../lib/prisma";
import { jaccard, intersect, stageCompatibility } from "./similarity";
import { generateExplanation } from "./explainer";
import { textSimilarity, profileText } from "./embeddings";

const W = { keywords: 0.40, area: 0.20, stage: 0.20, goals: 0.10, interests: 0.10 };

type Profile = {
  id: string;
  name: string;
  research_keywords: string[];
  research_area: string | null;
  career_stage: string | null;
  goals: string[];
  session_interests: string[];
  bio: string | null;
  abstract_summary: string | null;
};

// ─── Score a single pair ───────────────────────────────────────────────────────

export async function scorePair(a: Profile, b: Profile, pubKeywordsMap: Map<string, string[]>) {
  const kwA = [...a.research_keywords, ...(pubKeywordsMap.get(a.id) ?? [])];
  const kwB = [...b.research_keywords, ...(pubKeywordsMap.get(b.id) ?? [])];

  const keywordScore  = jaccard(kwA, kwB);
  const sharedKeywords = intersect(kwA, kwB);

  // Research area: partial string match (both contain same word)
  const areaScore = scoreAreaOverlap(a.research_area, b.research_area);
  const sharedAreas = getSharedAreas(a.research_area, b.research_area);

  const stageScore   = stageCompatibility(a.career_stage, b.career_stage);
  const goalsScore   = jaccard(a.goals, b.goals);
  const interestScore = jaccard(a.session_interests, b.session_interests);

  // Optional embedding similarity
  const embedSim = await textSimilarity(profileText(a), profileText(b));

  let score: number;
  if (embedSim !== null) {
    // Shift 10% from keywords to embedding
    score =
      keywordScore  * 0.30 +
      embedSim      * 0.10 +
      areaScore     * W.area +
      stageScore    * W.stage +
      goalsScore    * W.goals +
      interestScore * W.interests;
  } else {
    score =
      keywordScore  * W.keywords +
      areaScore     * W.area +
      stageScore    * W.stage +
      goalsScore    * W.goals +
      interestScore * W.interests;
  }

  const explanation = generateExplanation({
    nameA: a.name, nameB: b.name,
    sharedKeywords, sharedAreas,
    areaA: a.research_area, areaB: b.research_area,
    stageA: a.career_stage, stageB: b.career_stage,
    goalsA: a.goals, goalsB: b.goals,
    keywordScore, areaScore, stageScore,
  });

  return {
    score: Math.round(score * 1000) / 1000,
    keyword_score:  Math.round(keywordScore  * 1000) / 1000,
    area_score:     Math.round(areaScore     * 1000) / 1000,
    stage_score:    Math.round(stageScore    * 1000) / 1000,
    goals_score:    Math.round(goalsScore    * 1000) / 1000,
    shared_keywords: sharedKeywords,
    shared_areas:    sharedAreas,
    explanation,
  };
}

// ─── Batch compute for one user against all others ────────────────────────────

export async function computeMatchesForUser(userId: string): Promise<number> {
  const profiles = await prisma.profiles.findMany({
    where: { onboarding_complete: { not: false } },
    select: {
      id: true, name: true, research_keywords: true, research_area: true,
      career_stage: true, goals: true, session_interests: true,
      bio: true, abstract_summary: true,
    },
  });

  const me = profiles.find((p) => p.id === userId);
  if (!me) return 0;

  // Pull publication keywords for all profiles
  const pubs = await prisma.publications.findMany({
    select: { profile_id: true, keywords: true },
  });
  const pubKeywordsMap = new Map<string, string[]>();
  for (const pub of pubs) {
    const existing = pubKeywordsMap.get(pub.profile_id) ?? [];
    pubKeywordsMap.set(pub.profile_id, [...existing, ...pub.keywords]);
  }

  const others = profiles.filter((p) => p.id !== userId);
  let count = 0;

  for (const other of others) {
    const [aId, bId] = [me.id, other.id].sort(); // canonical order
    const result = await scorePair(
      aId === me.id ? me : other,
      aId === me.id ? other : me,
      pubKeywordsMap
    );

    await prisma.matches.upsert({
      where: { profile_a_id_profile_b_id: { profile_a_id: aId, profile_b_id: bId } },
      create: { profile_a_id: aId, profile_b_id: bId, ...result },
      update: { ...result, computed_at: new Date() },
    });
    count++;
  }

  return count;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function scoreAreaOverlap(areaA?: string | null, areaB?: string | null): number {
  if (!areaA || !areaB) return 0;
  if (areaA.toLowerCase() === areaB.toLowerCase()) return 1;
  const wordsA = areaA.toLowerCase().split(/\s+/);
  const wordsB = areaB.toLowerCase().split(/\s+/);
  const shared = wordsA.filter((w) => w.length > 3 && wordsB.includes(w));
  return shared.length > 0 ? 0.5 : 0;
}

function getSharedAreas(areaA?: string | null, areaB?: string | null): string[] {
  if (!areaA || !areaB) return [];
  if (areaA.toLowerCase() === areaB.toLowerCase()) return [areaA];
  const wordsA = areaA.toLowerCase().split(/\s+/);
  const wordsB = areaB.toLowerCase().split(/\s+/);
  const shared = wordsA.filter((w) => w.length > 3 && wordsB.includes(w));
  return shared.length > 0 ? [`${areaA} / ${areaB}`] : [];
}
