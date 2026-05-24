import { createServer } from "http";
import { Server } from "socket.io";
import { env } from "./config/env";
import { app } from "./app";
import { prisma } from "./lib/prisma";
import { setupSockets } from "./sockets";

async function main() {
  await prisma.$connect();
  console.log("✓ Database connected");

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: env.corsOrigin, credentials: true },
  });

  setupSockets(io);

  httpServer.listen(env.port, () => {
    console.log(`✓ Server running on http://localhost:${env.port}`);
    console.log(`  Environment: ${env.nodeEnv}`);
    console.log(`  API: http://localhost:${env.port}/api`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
