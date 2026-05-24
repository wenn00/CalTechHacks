import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { ok, fail } from "../utils/response";
import * as svc from "../services/match.service";
import { z } from "zod";

export async function getMatches(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { limit = "20", offset = "0" } = req.query as Record<string, string>;
    const matches = await svc.getMatches(req.user!.id, parseInt(limit), parseInt(offset));
    ok(res, matches);
  } catch (err) { next(err); }
}

export async function getOverlap(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const overlap = await svc.getOverlap(req.user!.id, req.params.profileId);
    if (!overlap) return fail(res, "Profile not found", 404);
    ok(res, overlap);
  } catch (err) { next(err); }
}

export async function recompute(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const count = await svc.recomputeMatches(req.user!.id);
    ok(res, { computed: count });
  } catch (err) { next(err); }
}

export async function swipe(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const schema = z.object({
      targetId: z.string().uuid(),
      action:   z.enum(["interested", "skip", "save", "connect"]),
    });
    const { targetId, action } = schema.parse(req.body);
    if (targetId === req.user!.id) return fail(res, "Cannot swipe on yourself");
    const result = await svc.recordSwipe(req.user!.id, targetId, action);
    ok(res, result);
  } catch (err) { next(err); }
}

export async function getSwipes(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.getSwipes(req.user!.id));
  } catch (err) { next(err); }
}

export async function addPublication(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const schema = z.object({
      title:    z.string().min(3),
      abstract: z.string().optional(),
      keywords: z.array(z.string()).default([]),
      year:     z.number().int().optional(),
      journal:  z.string().optional(),
      url:      z.string().url().optional(),
    });
    const data = schema.parse(req.body);
    const pub = await svc.addPublication(req.user!.id, data);
    ok(res, pub, 201);
  } catch (err) { next(err); }
}

export async function getPublications(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.getPublications(req.params.profileId));
  } catch (err) { next(err); }
}
