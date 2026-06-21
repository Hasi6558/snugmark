// Copyright (c) 2026 Hasindu Shehan Liyanage. All Rights Reserved.
// This code may not be copied, modified, distributed, or used in production without written permission.

import "dotenv/config";
import { z } from "zod";

// Validate and freeze environment configuration at startup. Reading env through
// this module means a missing/invalid var fails fast with a clear message
// instead of surfacing as a confusing runtime error later.
const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("http://localhost:8080"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
