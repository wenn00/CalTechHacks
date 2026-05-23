import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AttendeeQuery } from "../validators/attendee";

// ─── List / Search / Filter ───────────────────────────────────────────────────

export async function listAttendees(params: AttendeeQuery) {
  const { q, research_area, institution, career_stage, role, page, limit } = params;
  const offset = (page - 1) * limit;

  // Prisma where clause for filter-only queries
  const filterWhere: Prisma.profilesWhereInput = {
    ...(institution  && { institution:  { contains: institution,  mode: "insensitive" } }),
    ...(career_stage && { career_stage: { equals:   career_stage, mode: "insensitive" } }),
    ...(role         && { role:         { equals:   role,         mode: "insensitive" } }),
    ...(research_area && { research_area: { contains: research_area, mode: "insensitive" } }),
  };

  // Full-text search path — searches name, bio, institution, research_area, and keywords
  if (q?.trim()) {
    const term = q.trim();

    const hits = await prisma.$queryRaw<{ id: string; rank: number }[]>`
      SELECT id,
        ts_rank(
          to_tsvector('english',
            name || ' ' ||
            COALESCE(bio, '') || ' ' ||
            COALESCE(institution, '') || ' ' ||
            COALESCE(research_area, '') || ' ' ||
            array_to_string(research_keywords, ' ')
          ),
          plainto_tsquery('english', ${term})
        ) AS rank
      FROM profiles
      WHERE
        to_tsvector('english',
          name || ' ' ||
          COALESCE(bio, '') || ' ' ||
          COALESCE(institution, '') || ' ' ||
          COALESCE(research_area, '') || ' ' ||
          array_to_string(research_keywords, ' ')
        ) @@ plainto_tsquery('english', ${term})
      ORDER BY rank DESC
    `;

    if (hits.length === 0) return { data: [], meta: { page, limit, total: 0 } };

    const rankedIds = hits.map((h) => h.id);

    // Fetch full profiles for matched IDs + apply any additional filters
    const profiles = await prisma.profiles.findMany({
      where: { id: { in: rankedIds }, ...filterWhere },
    });

    // Re-sort by FTS rank
    const sorted = rankedIds
      .map((id) => profiles.find((p) => p.id === id))
      .filter(Boolean) as typeof profiles;

    const total = sorted.length;
    const paged = sorted.slice(offset, offset + limit);

    return { data: paged.map(formatProfile), meta: { page, limit, total } };
  }

  // No search query — filter + paginate
  const [profiles, total] = await Promise.all([
    prisma.profiles.findMany({
      where: filterWhere,
      skip: offset,
      take: limit,
      orderBy: { name: "asc" },
    }),
    prisma.profiles.count({ where: filterWhere }),
  ]);

  return { data: profiles.map(formatProfile), meta: { page, limit, total } };
}

// ─── Single profile ───────────────────────────────────────────────────────────

export async function getAttendeeById(id: string) {
  const profile = await prisma.profiles.findUnique({ where: { id } });
  return profile ? formatProfile(profile) : null;
}

// ─── Filter options ───────────────────────────────────────────────────────────

export async function getFilterOptions() {
  const [researchAreas, institutions, careerStages, roles, keywordRows] = await Promise.all([
    prisma.profiles.findMany({
      where: { research_area: { not: null } },
      select: { research_area: true },
      distinct: ["research_area"],
      orderBy: { research_area: "asc" },
    }),
    prisma.profiles.findMany({
      where: { institution: { not: null } },
      select: { institution: true },
      distinct: ["institution"],
      orderBy: { institution: "asc" },
    }),
    prisma.profiles.findMany({
      where: { career_stage: { not: null } },
      select: { career_stage: true },
      distinct: ["career_stage"],
      orderBy: { career_stage: "asc" },
    }),
    prisma.profiles.findMany({
      where: { role: { not: null } },
      select: { role: true },
      distinct: ["role"],
      orderBy: { role: "asc" },
    }),
    // Unnest the keywords array to get all unique keywords
    prisma.$queryRaw<{ keyword: string }[]>`
      SELECT DISTINCT unnest(research_keywords) AS keyword
      FROM profiles
      WHERE array_length(research_keywords, 1) > 0
      ORDER BY keyword
    `,
  ]);

  return {
    researchAreas:  researchAreas.map((r) => r.research_area).filter(Boolean),
    institutions:   institutions.map((i) => i.institution).filter(Boolean),
    careerStages:   careerStages.map((c) => c.career_stage).filter(Boolean),
    roles:          roles.map((r) => r.role).filter(Boolean),
    keywords:       keywordRows.map((k) => k.keyword),
  };
}

// ─── Format helper ────────────────────────────────────────────────────────────

type Profile = Prisma.profilesGetPayload<Record<string, never>>;

function formatProfile(p: Profile) {
  return {
    id:                 p.id,
    name:               p.name,
    email:              p.email,
    photo_url:          p.photo_url,
    institution:        p.institution,
    role:               p.role,
    career_stage:       p.career_stage,
    bio:                p.bio,
    linkedin_url:       p.linkedin_url,
    google_scholar_url: p.google_scholar_url,
    research_area:      p.research_area,
    research_keywords:  p.research_keywords,
    abstract_summary:   p.abstract_summary,
    goals:              p.goals,
    session_interests:  p.session_interests,
    company_name:       p.company_name,
    company_stage:      p.company_stage,
    company_description:p.company_description,
    created_at:         p.created_at,
  };
}
