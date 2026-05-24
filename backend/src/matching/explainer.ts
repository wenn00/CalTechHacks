// ─── Rule-based explanation generator ────────────────────────────────────────
// Returns a 1-2 sentence human-readable match explanation.

interface ExplainInput {
  nameA: string;
  nameB: string;
  sharedKeywords: string[];
  sharedAreas: string[];
  areaA?: string | null;
  areaB?: string | null;
  stageA?: string | null;
  stageB?: string | null;
  goalsA: string[];
  goalsB: string[];
  keywordScore: number;
  areaScore: number;
  stageScore: number;
}

const STAGE_LABELS: Record<string, string> = {
  investor: "investor",
  founder: "founder",
  professor: "professor",
  postdoc: "postdoc",
  graduate_student: "PhD student",
  early_career_researcher: "early-career researcher",
  mid_career_researcher: "researcher",
  senior_researcher: "senior researcher",
  industry_professional: "industry professional",
};

const COMPLEMENTARY_PAIRS: [string, string][] = [
  ["investor", "founder"],
  ["professor", "postdoc"],
  ["professor", "graduate_student"],
  ["founder", "industry_professional"],
  ["investor", "industry_professional"],
];

function isComplementary(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  const al = a.toLowerCase(), bl = b.toLowerCase();
  return COMPLEMENTARY_PAIRS.some(([x, y]) => (al === x && bl === y) || (al === y && bl === x));
}

export function generateExplanation(input: ExplainInput): string {
  const parts: string[] = [];
  const { sharedKeywords, sharedAreas, areaA, areaB, stageA, stageB } = input;

  // Lead with strongest signal
  if (sharedKeywords.length >= 3) {
    const top = sharedKeywords.slice(0, 3).map((k) => k.replace(/-/g, " "));
    parts.push(`You both work on ${top.slice(0, 2).join(" and ")}${top[2] ? `, and ${top[2]}` : ""}.`);
  } else if (sharedKeywords.length === 2) {
    parts.push(`You share research interests in ${sharedKeywords[0].replace(/-/g, " ")} and ${sharedKeywords[1].replace(/-/g, " ")}.`);
  } else if (sharedKeywords.length === 1) {
    parts.push(`You both study ${sharedKeywords[0].replace(/-/g, " ")}.`);
  }

  // Research area overlap
  if (sharedAreas.length > 0) {
    parts.push(`Your research areas overlap in ${sharedAreas[0]}.`);
  } else if (areaA && areaB && areaA !== areaB && input.areaScore > 0.3) {
    parts.push(`Your ${areaA} work complements their focus on ${areaB}.`);
  }

  // Career stage relationship
  if (isComplementary(stageA, stageB)) {
    const labelA = STAGE_LABELS[stageA!.toLowerCase()] ?? stageA;
    const labelB = STAGE_LABELS[stageB!.toLowerCase()] ?? stageB;
    parts.push(`As a ${labelA} connecting with a ${labelB}, this could be a high-value relationship.`);
  }

  // Goals overlap fallback
  if (parts.length === 0) {
    const sharedGoals = input.goalsA.filter((g) =>
      input.goalsB.some((gb) => gb.toLowerCase().includes(g.toLowerCase().split(" ")[0]))
    );
    if (sharedGoals.length > 0) {
      parts.push(`You share similar conference goals around ${sharedGoals[0].toLowerCase()}.`);
    } else {
      parts.push(`You have complementary backgrounds that could spark new research directions.`);
    }
  }

  return parts.slice(0, 2).join(" ");
}
