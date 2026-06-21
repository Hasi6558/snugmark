// Copyright (c) 2026 Hasindu Shehan Liyanage. All Rights Reserved.
// This code may not be copied, modified, distributed, or used in production without written permission.

import { createApp } from "./app.js";
import { connectDB, disconnectDB } from "./db.js";
import { env } from "./env.js";

async function main(): Promise<void> {
  await connectDB();

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`🚀 Snugmark API listening on http://localhost:${env.PORT}`);
  });

  // Graceful shutdown: stop accepting connections, then close the DB.
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received, shutting down...`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
