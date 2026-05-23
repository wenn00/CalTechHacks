import { Response } from "express";

export function ok<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ success: true, data });
}

export function paginated<T>(
  res: Response,
  data: T[],
  meta: { page: number; limit: number; total: number }
) {
  return res.json({
    success: true,
    data,
    meta: { ...meta, totalPages: Math.ceil(meta.total / meta.limit) },
  });
}

export function fail(res: Response, message: string, status = 400) {
  return res.status(status).json({ success: false, error: message });
}
