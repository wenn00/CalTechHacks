import { env } from "./config/env";
import { app } from "./app";
import { prisma } from "./lib/prisma";

async function main() {
  // Verify DB connection before accepting traffic
  await prisma.$connect();
  console.log("✓ Database connected");

  app.listen(env.port, () => {
    console.log(`✓ Server running on http://localhost:${env.port}`);
    console.log(`  Environment: ${env.nodeEnv}`);
    console.log(`  API: http://localhost:${env.port}/api`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
