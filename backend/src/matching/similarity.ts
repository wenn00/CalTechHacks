// ─── Pure math helpers — no I/O, fully testable ───────────────────────────────

/** Jaccard similarity: |A ∩ B| / |A ∪ B|. Returns 0 if both sets are empty. */
export function jaccard(a: string[], b: string[]): number {
  if (!a.length && !b.length) return 0;
  const setA = new Set(a.map((s) => s.toLowerCase()));
  const setB = new Set(b.map((s) => s.toLowerCase()));
  const intersection = [...setA].filter((x) => setB.has(x));
  const union = new Set([...setA, ...setB]);
  return intersection.length / union.size;
}

/** Intersection of two string arrays (lowercased, deduped). */
export function intersect(a: string[], b: string[]): string[] {
  const setB = new Set(b.map((s) => s.toLowerCase()));
  return [...new Set(a.map((s) => s.toLowerCase()).filter((s) => setB.has(s)))];
}

/** Cosine similarity between two numeric vectors. */
export function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return normA === 0 || normB === 0 ? 0 : dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Career-stage compatibility score (0–1).
 * High when stages are complementary (investor↔founder, professor↔postdoc).
 * Medium for peers. Low for unrelated pairings.
 */
const STAGE_MATRIX: Record<string, Record<string, number>> = {
  investor:             { founder: 1.0, early_career_researcher: 0.7, mid_career_researcher: 0.6, professor: 0.5, postdoc: 0.4, graduate_student: 0.3, industry_professional: 0.7, senior_researcher: 0.6 },
  founder:              { investor: 1.0, professor: 0.8, mid_career_researcher: 0.7, senior_researcher: 0.7, industry_professional: 0.8, early_career_researcher: 0.5, postdoc: 0.4, graduate_student: 0.3 },
  professor:            { founder: 0.8, postdoc: 0.9, graduate_student: 0.7, early_career_researcher: 0.8, mid_career_researcher: 0.7, senior_researcher: 0.6, investor: 0.5, industry_professional: 0.6 },
  postdoc:              { professor: 0.9, graduate_student: 0.7, early_career_researcher: 0.7, mid_career_researcher: 0.6, founder: 0.4, industry_professional: 0.6, senior_researcher: 0.6, investor: 0.4 },
  graduate_student:     { professor: 0.7, postdoc: 0.7, early_career_researcher: 0.6, mid_career_researcher: 0.5, senior_researcher: 0.5, founder: 0.3, industry_professional: 0.4, investor: 0.3 },
  early_career_researcher: { professor: 0.8, postdoc: 0.7, mid_career_researcher: 0.7, senior_researcher: 0.6, founder: 0.5, industry_professional: 0.6, investor: 0.6, graduate_student: 0.6 },
  mid_career_researcher:   { professor: 0.7, senior_researcher: 0.7, early_career_researcher: 0.7, founder: 0.7, industry_professional: 0.7, investor: 0.6, postdoc: 0.6, graduate_student: 0.5 },
  senior_researcher:    { professor: 0.6, founder: 0.7, mid_career_researcher: 0.7, industry_professional: 0.7, investor: 0.6, early_career_researcher: 0.6, postdoc: 0.6, graduate_student: 0.5 },
  industry_professional:{ founder: 0.8, investor: 0.7, professor: 0.6, senior_researcher: 0.7, mid_career_researcher: 0.7, early_career_researcher: 0.6, postdoc: 0.6, graduate_student: 0.4 },
};

export function stageCompatibility(stageA?: string | null, stageB?: string | null): number {
  if (!stageA || !stageB) return 0.5; // neutral if unknown
  const a = stageA.toLowerCase();
  const b = stageB.toLowerCase();
  if (a === b) return 0.55; // same stage — peers, moderate compatibility
  return STAGE_MATRIX[a]?.[b] ?? STAGE_MATRIX[b]?.[a] ?? 0.4;
}
