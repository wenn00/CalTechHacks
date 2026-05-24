import { Server } from "socket.io";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { env } from "../config/env";
import { registerMessageHandlers } from "./message.socket";

const JWKS = createRemoteJWKSet(
  new URL(`${env.supabaseUrl}/auth/v1/.well-known/jwks.json`)
);

export function setupSockets(io: Server) {
  // Auth middleware — every socket connection must provide a valid Supabase JWT
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("Missing auth token"));

    try {
      const { payload } = await jwtVerify(token, JWKS, {
        issuer:   `${env.supabaseUrl}/auth/v1`,
        audience: "authenticated",
      });
      // Attach user to socket for use in event handlers
      (socket as any).user = { id: payload.sub!, email: payload["email"] as string };
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const user = (socket as any).user;
    console.log(`Socket connected: ${user.id}`);

    // Put user in their own room so we can push notifications to them
    socket.join(`user:${user.id}`);

    registerMessageHandlers(io, socket);

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${user.id}`);
    });
  });
}
