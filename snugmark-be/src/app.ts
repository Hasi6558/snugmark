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

  app.use(cors({ origin: env.CORS_ORIGIN }));
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
