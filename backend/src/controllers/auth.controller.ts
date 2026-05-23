import { Response, NextFunction } from "express";
import { getMe } from "../services/auth.service";
import { AuthRequest } from "../types";
import { ok, fail } from "../utils/response";

export async function me(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const profile = await getMe(req.user!.id);
    if (!profile) return fail(res, "Profile not found", 404);
    ok(res, profile);
  } catch (err) {
    next(err);
  }
}
