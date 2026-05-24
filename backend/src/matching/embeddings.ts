// ─── Optional HuggingFace embeddings (free inference API) ────────────────────
// Set HF_API_KEY in .env for a free HuggingFace token.
// If not set or if the API fails, embedding score is skipped (returns null).
//
// Model: sentence-transformers/all-MiniLM-L6-v2
// Free tier: ~30k requests/month with a free HF account token.

import { cosine } from "./similarity";

const HF_MODEL = "sentence-transformers/all-MiniLM-L6-v2";
const HF_URL   = `https://api-inference.huggingface.co/pipeline/feature-extraction/${HF_MODEL}`;

async function fetchEmbedding(text: string, apiKey: string): Promise<number[] | null> {
  try {
    const res = await fetch(HF_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: text.slice(0, 512) }), // model max
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json() as number[];
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

/** Returns cosine similarity (0–1) between two text blobs, or null if unavailable. */
export async function textSimilarity(textA: string, textB: string): Promise<number | null> {
  const apiKey = process.env.HF_API_KEY;
  if (!apiKey) return null;

  const [embA, embB] = await Promise.all([
    fetchEmbedding(textA, apiKey),
    fetchEmbedding(textB, apiKey),
  ]);

  if (!embA || !embB) return null;

  // Cosine returns -1 to 1; normalize to 0–1
  return (cosine(embA, embB) + 1) / 2;
}

/** Builds the text blob used for embedding a profile. */
export function profileText(profile: {
  bio?: string | null;
  abstract_summary?: string | null;
  research_keywords: string[];
  research_area?: string | null;
}): string {
  return [
    profile.bio ?? "",
    profile.abstract_summary ?? "",
    profile.research_area ?? "",
    profile.research_keywords.join(" "),
  ]
    .filter(Boolean)
    .join(". ");
}
