import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import * as match from "../controllers/match.controller";

const router = Router();

// Public demo endpoint — no auth needed
router.get("/demo", async (_req, res) => {
  const top = await prisma.matches.findMany({
    orderBy: { score: "desc" },
    take: 5,
  });
  res.json({ success: true, message: "Research Matcher is live", topMatches: top });
});

router.use(requireAuth);

// Match feed
router.get("/",                          match.getMatches);
router.get("/overlap/:profileId",        match.getOverlap);
router.post("/compute",                  match.recompute);

// Swipe
router.post("/swipe",                    match.swipe);
router.get("/swipes",                    match.getSwipes);

// Publications
router.post("/publications",             match.addPublication);
router.get("/publications/:profileId",   match.getPublications);

export default router;
