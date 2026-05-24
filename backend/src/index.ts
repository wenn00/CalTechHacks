import { createServer } from "http";
import { Server } from "socket.io";
import { env } from "./config/env";
import { app } from "./app";
import { prisma } from "./lib/prisma";
import { setupSockets } from "./sockets";
import { startBot } from "./bot/slack";
import { startDailyDigestCron } from "./cron/daily-digest.cron";

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

  // Feature gates — keep bot and cron OFF by default so importing this file
  // (tests, scripts, preview deploys) does not spin up a Socket Mode session
  // or a scheduled job.
  if (process.env.ENABLE_SLACK_BOT === "true") {
    try {
      await startBot();
    } catch (err) {
      console.error("✗ Failed to start Slack bot:", err);
    }
  }
  if (process.env.ENABLE_DAILY_DIGEST_CRON === "true") {
    startDailyDigestCron();
  }
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
