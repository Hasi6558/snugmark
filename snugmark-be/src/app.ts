// Copyright (c) 2026 Hasindu Shehan Liyanage. All Rights Reserved.
// This code may not be copied, modified, distributed, or used in production without written permission.

import express, { type Express } from "express";
import cors from "cors";
import { env } from "./env.js";
import { errorHandler, notFound } from "./middleware/error.js";
import authRoutes from "./routes/auth.routes.js";
import collectionRoutes from "./routes/collections.routes.js";
import tagRoutes from "./routes/tags.routes.js";
import linkRoutes from "./routes/links.routes.js";
import metadataRoutes from "./routes/metadata.routes.js";

// Build the Express app. Kept separate from the server bootstrap (index.ts) so
// it can be imported directly by tests without opening a port.
export function createApp(): Express {
  const app = express();

  const allowedOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim());
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        cb(new Error(`CORS: origin ${origin} not allowed`));
      },
    }),
  );
  app.use(express.json());

  // Health check — useful for uptime probes and verifying the server is up.
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/collections", collectionRoutes);
  app.use("/api/tags", tagRoutes);
  app.use("/api/links", linkRoutes);
  app.use("/api/metadata", metadataRoutes);

  //   app.use("/api/links", linkRoutes);
  //   app.use("/api/tags", tagRoutes);
  //   app.use("/api/metadata", metadataRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
