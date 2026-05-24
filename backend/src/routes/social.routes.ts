import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import * as social from "../controllers/social.controller";
import { prisma } from "../lib/prisma";

const router = Router();

// Public demo — no auth needed
router.get("/demo", async (_req, res) => {
  const [followCount, recCount, sample] = await Promise.all([
    prisma.follows.count(),
    prisma.recommendations.count(),
    prisma.recommendations.findMany({
      orderBy: { score: "desc" },
      take: 3,
      select: { score: true, reasons: true, profile_id: true, recommended_id: true },
    }),
  ]);
  res.json({ success: true, message: "Social graph is live", followCount, recCount, sampleRecommendations: sample });
});

router.use(requireAuth);

// Follow system
router.post("/follow/:profileId",    social.follow);
router.delete("/follow/:profileId",  social.unfollow);
router.get("/followers/:profileId",  social.getFollowers);
router.get("/following/:profileId",  social.getFollowing);
router.get("/mutual/:profileId",     social.getMutual);
router.get("/status/:profileId",     social.getFollowStatus);

// Profile views
router.post("/view/:profileId",      social.recordView);

// Recommendations
router.get("/recommendations",              social.getRecommendations);
router.post("/recommendations/compute",     social.computeRecommendations);

export default router;
