import { Response, NextFunction } from "express";
import * as profileService from "../services/profile.service";
import { AuthRequest } from "../types";
import { ok } from "../utils/response";

export async function getMyProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const profile = await profileService.getOwnProfile(req.user!.profileId);
    ok(res, profile);
  } catch (err) {
    next(err);
  }
}

export async function updateMyProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const profile = await profileService.updateProfile(req.user!.profileId, req.body);
    ok(res, profile);
  } catch (err) {
    next(err);
  }
}
