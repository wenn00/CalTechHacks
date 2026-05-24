import { Request, Response, NextFunction } from "express";
import { ok, fail } from "../utils/response";
import * as svc from "../services/graph.service";

export async function getGraph(req: Request, res: Response, next: NextFunction) {
  try {
    const { research_area, career_stage, institution, type, min_strength } = req.query as Record<string, string>;
    const graph = await svc.getGraph({
      research_area,
      career_stage,
      institution,
      type,
      min_strength: min_strength ? parseFloat(min_strength) : undefined,
    });
    ok(res, graph);
  } catch (err) { next(err); }
}

export async function getNode(req: Request, res: Response, next: NextFunction) {
  try {
    const node = await svc.getNode(req.params.id);
    if (!node) return fail(res, "Profile not found", 404);
    ok(res, node);
  } catch (err) { next(err); }
}

export async function getFilterOptions(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.getFilterOptions());
  } catch (err) { next(err); }
}
