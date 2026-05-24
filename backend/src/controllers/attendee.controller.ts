import { Request, Response, NextFunction } from "express";
import * as attendeeService from "../services/attendee.service";
import { attendeeQuerySchema } from "../validators/attendee";
import { paginated, ok, fail } from "../utils/response";

export async function listAttendees(req: Request, res: Response, next: NextFunction) {
  try {
    const query = attendeeQuerySchema.parse(req.query);
    const result = await attendeeService.listAttendees(query);
    paginated(res, result.data, result.meta);
  } catch (err) {
    next(err);
  }
}

export async function getAttendee(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await attendeeService.getAttendeeById(req.params.id as string);
    if (!profile) return fail(res, "Attendee not found", 404);
    ok(res, profile);
  } catch (err) {
    next(err);
  }
}

export async function getFilterOptions(req: Request, res: Response, next: NextFunction) {
  try {
    const options = await attendeeService.getFilterOptions();
    ok(res, options);
  } catch (err) {
    next(err);
  }
}
