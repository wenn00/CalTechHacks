---
name: project-context
description: ARDD Conference networking platform (CalTech Hacks) — attendee directory backend built with Node/Express/TypeScript/PostgreSQL/Prisma
metadata:
  type: project
---

**Project:** ARDD (Aging Research and Drug Discovery) Conference networking platform, built at CalTech Hacks.

**Why:** Hackathon project. Backend lives in `backend/` directory at the repo root.

**This engineer's scope:** Attendee directory system (auth, attendee browse/search/filter, profile management).

**Future modules (other teammates):** matchmaking, messaging, conference scheduling, research networking, AI recommendations.

**Tech stack:** Node.js · Express · TypeScript · PostgreSQL · Prisma ORM · JWT · bcrypt · Zod · express-rate-limit · helmet

**Key files:**
- `backend/prisma/schema.prisma` — full data model
- `backend/src/services/attendee.service.ts` — full-text search via PostgreSQL `to_tsvector`/`plainto_tsquery`
- `backend/src/services/profile.service.ts` — profile update with upsert for institution/keywords/research areas
- `backend/src/routes/index.ts` — all routes mounted under `/api`

**API surface:**
- `POST /api/auth/register` · `POST /api/auth/login` · `GET /api/auth/me`
- `GET /api/attendees` — browse + search + filter (query params: q, researchArea, institution, careerStage, page, limit)
- `GET /api/attendees/filters` — dropdown data
- `GET /api/attendees/:id`
- `GET /api/profile` · `PUT /api/profile` (protected)

**Free deployment options noted in .env.example:** Neon, Supabase, Railway for PostgreSQL.

**How to apply:** When extending this backend, place new feature routes under `src/routes/`, services under `src/services/`. The `profileInclude` constant in attendee.service.ts is the shared Prisma include shape — reuse it.
