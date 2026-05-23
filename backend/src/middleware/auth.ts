import { Response, NextFunction } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { env } from "../config/env";
import { AuthRequest } from "../types";

// Fetches and caches Supabase's public EC keys. Handles key rotation automatically.
const JWKS = createRemoteJWKSet(
  new URL(`${env.supabaseUrl}/auth/v1/.well-known/jwks.json`)
);

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ success: false, error: "Missing Authorization header" });
    return;
  }

  try {
    const token = header.slice(7);
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `${env.supabaseUrl}/auth/v1`,
      audience: "authenticated",
    });

    req.user = {
      id: payload.sub!,
      email: payload["email"] as string,
    };
    next();
  } catch {
    res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
}
