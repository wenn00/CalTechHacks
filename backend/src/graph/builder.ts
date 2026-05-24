// ─── Graph builder ────────────────────────────────────────────────────────────
// Transforms profiles + matches into react-force-graph compatible JSON.
//
// Node groups (used for color coding on the frontend):
//   academic   → professor, postdoc, graduate_student, early/mid/senior_researcher
//   founder    → founder
//   investor   → investor
//   industry   → industry_professional
//
// Edge types:
//   keyword        → shared research keywords (from matches.shared_keywords)
//   area           → same/overlapping research area
//   institution    → same institution (computed from profiles)
//   complementary  → high stage compatibility (investor↔founder, professor↔postdoc)
//   interest       → shared session interests

const EDGE_SCORE_THRESHOLD = 0.08; // ignore very weak connections

type Profile = {
  id: string;
  name: string;
  photo_url: string | null;
  institution: string | null;
  career_stage: string | null;
  research_area: string | null;
  research_keywords: string[];
  session_interests: string[];
  goals: string[];
};

type Match = {
  profile_a_id: string;
  profile_b_id: string;
  score: number;
  keyword_score: number;
  area_score: number;
  stage_score: number;
  shared_keywords: string[];
  shared_areas: string[];
  explanation: string;
};

export type GraphNode = {
  id: string;
  name: string;
  photo_url: string | null;
  institution: string | null;
  career_stage: string | null;
  research_area: string | null;
  group: string;
  val: number; // node size
};

export type GraphLink = {
  source: string;
  target: string;
  strength: number;
  type: string;
  label: string;
  explanation: string;
};

function careerGroup(stage?: string | null): string {
  if (!stage) return "academic";
  const s = stage.toLowerCase();
  if (s === "investor") return "investor";
  if (s === "founder") return "founder";
  if (s === "industry_professional") return "industry";
  return "academic";
}

export function buildGraph(
  profiles: Profile[],
  matches: Match[],
  filters: {
    research_area?: string;
    career_stage?: string;
    institution?: string;
    type?: string;
    min_strength?: number;
  } = {}
): { nodes: GraphNode[]; links: GraphLink[]; meta: object } {

  // ── Apply node filters ─────────────────────────────────────────────────────
  let filteredProfiles = profiles;
  if (filters.research_area) {
    filteredProfiles = filteredProfiles.filter((p) =>
      p.research_area?.toLowerCase().includes(filters.research_area!.toLowerCase())
    );
  }
  if (filters.career_stage) {
    filteredProfiles = filteredProfiles.filter((p) =>
      p.career_stage?.toLowerCase() === filters.career_stage!.toLowerCase()
    );
  }
  if (filters.institution) {
    filteredProfiles = filteredProfiles.filter((p) =>
      p.institution?.toLowerCase().includes(filters.institution!.toLowerCase())
    );
  }

  const profileIds = new Set(filteredProfiles.map((p) => p.id));

  // ── Build nodes ────────────────────────────────────────────────────────────
  const connectionCount = new Map<string, number>();
  const nodes: GraphNode[] = filteredProfiles.map((p) => ({
    id: p.id,
    name: p.name,
    photo_url: p.photo_url,
    institution: p.institution,
    career_stage: p.career_stage,
    research_area: p.research_area,
    group: careerGroup(p.career_stage),
    val: 1, // will be updated after counting connections
  }));

  // ── Build links from matches ───────────────────────────────────────────────
  const links: GraphLink[] = [];
  const threshold = filters.min_strength ?? EDGE_SCORE_THRESHOLD;

  for (const m of matches) {
    if (!profileIds.has(m.profile_a_id) || !profileIds.has(m.profile_b_id)) continue;
    if (m.score < threshold) continue;

    // Determine primary edge type from strongest sub-score
    let type = "interest";
    let label = "";

    if (m.shared_keywords.length > 0) {
      type = "keyword";
      label = m.shared_keywords.slice(0, 3).join(", ");
    } else if (m.area_score > 0.4) {
      type = "area";
      label = m.shared_areas[0] ?? "shared research area";
    } else if (m.stage_score >= 0.8) {
      type = "complementary";
      label = "complementary expertise";
    }

    if (filters.type && type !== filters.type) continue;

    links.push({
      source:      m.profile_a_id,
      target:      m.profile_b_id,
      strength:    m.score,
      type,
      label,
      explanation: m.explanation,
    });

    connectionCount.set(m.profile_a_id, (connectionCount.get(m.profile_a_id) ?? 0) + 1);
    connectionCount.set(m.profile_b_id, (connectionCount.get(m.profile_b_id) ?? 0) + 1);
  }

  // ── Institution edges (not in matches — computed from profiles) ────────────
  if (!filters.type || filters.type === "institution") {
    const byInstitution = new Map<string, string[]>();
    for (const p of filteredProfiles) {
      if (!p.institution) continue;
      const key = p.institution.toLowerCase();
      const existing = byInstitution.get(key) ?? [];
      byInstitution.set(key, [...existing, p.id]);
    }

    for (const [institution, ids] of byInstitution) {
      if (ids.length < 2) continue;
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          // Only add if there isn't already a stronger match edge
          const alreadyLinked = links.some(
            (l) =>
              (l.source === ids[i] && l.target === ids[j]) ||
              (l.source === ids[j] && l.target === ids[i])
          );
          if (!alreadyLinked) {
            links.push({
              source:      ids[i],
              target:      ids[j],
              strength:    0.4,
              type:        "institution",
              label:       institution,
              explanation: `Both affiliated with ${institution}`,
            });
          }
        }
      }
    }
  }

  // ── Update node size based on connection count ─────────────────────────────
  for (const node of nodes) {
    node.val = Math.max(1, Math.min(10, (connectionCount.get(node.id) ?? 0) + 1));
  }

  // Remove isolated nodes (no connections) unless filtering would leave nothing
  const connectedIds = new Set(links.flatMap((l) => [l.source, l.target]));
  const connectedNodes = nodes.filter((n) => connectedIds.has(n.id));
  const finalNodes = connectedNodes.length > 0 ? connectedNodes : nodes;

  return {
    nodes: finalNodes,
    links,
    meta: {
      nodeCount: finalNodes.length,
      linkCount: links.length,
      types: [...new Set(links.map((l) => l.type))],
    },
  };
}
