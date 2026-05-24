---
name: feedback-style
description: Keep code hackathon-appropriate — clean architecture but no over-engineering, microservices, Kubernetes, or unnecessary abstractions
metadata:
  type: feedback
---

Do NOT over-engineer. This is a hackathon project.

**Why:** The user explicitly corrected me mid-build when I was planning an enterprise-heavy approach.

**How to apply:**
- Clean folder structure (routes / controllers / services / middleware / validators) is fine
- No repository pattern, no dependency injection containers, no event bus, no microservices
- Direct Prisma usage in services is correct
- No Kubernetes, Docker Compose not required
- Simple offset-based pagination is fine (no cursor-based unless asked)
- Single access token (7-day JWT) — no refresh token complexity
- Prioritize: readability, fast implementation, easy teammate integration
