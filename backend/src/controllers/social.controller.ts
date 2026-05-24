import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { ok, fail } from "../utils/response";
import * as svc from "../services/social.service";

// ─── Follow ────────────────────────────────────────────────────────────────────

export async function follow(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const profileId = req.params.profileId as string;
    if (profileId === req.user!.id) return fail(res, "Cannot follow yourself");
    await svc.follow(req.user!.id, profileId);
    ok(res, { following: true });
  } catch (err) { next(err); }
}

export async function unfollow(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await svc.unfollow(req.user!.id, req.params.profileId as string);
    ok(res, { following: false });
  } catch (err) { next(err); }
}

export async function getFollowers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const followers = await svc.getFollowers(req.params.profileId as string);
    ok(res, { followers, count: followers.length });
  } catch (err) { next(err); }
}

export async function getFollowing(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const following = await svc.getFollowing(req.params.profileId as string);
    ok(res, { following, count: following.length });
  } catch (err) { next(err); }
}

export async function getMutual(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const mutual = await svc.getMutualFollows(req.user!.id, req.params.profileId as string);
    ok(res, { mutual, count: mutual.length });
  } catch (err) { next(err); }
}

export async function getFollowStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const profileId = req.params.profileId as string;
    const [isFollowing, counts] = await Promise.all([
      svc.isFollowing(req.user!.id, profileId),
      svc.getFollowCounts(profileId),
    ]);
    ok(res, { isFollowing, ...counts });
  } catch (err) { next(err); }
}

// ─── Views ─────────────────────────────────────────────────────────────────────

export async function recordView(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await svc.recordProfileView(req.user!.id, req.params.profileId as string);
    ok(res, { recorded: true });
  } catch (err) { next(err); }
}

// ─── Recommendations ───────────────────────────────────────────────────────────

export async function getRecommendations(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const limit  = Math.min(50, parseInt((req.query.limit  as string) || "20"));
    const offset = parseInt((req.query.offset as string) || "0");
    const recs = await svc.getRecommendations(req.user!.id, limit, offset);
    ok(res, { recommendations: recs, count: recs.length });
  } catch (err) { next(err); }
}

export async function computeRecommendations(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const count = await svc.computeRecommendations(req.user!.id);
    ok(res, { computed: count });
  } catch (err) { next(err); }
}
