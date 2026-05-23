import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error(err);
  const message = env.nodeEnv === "production" ? "Internal server error" : err.message;
  res.status(500).json({ success: false, error: message });
}
