// Copyright (c) 2026 Hasindu Shehan Liyanage. All Rights Reserved.
// This code may not be copied, modified, distributed, or used in production without written permission.

import mongoose from "mongoose";
import { env } from "./env.js";

// Connect to MongoDB. Mongoose buffers commands until connected, but we await
// the initial connection at startup so the process fails fast if the DB is
// unreachable rather than hanging on the first query.
export async function connectDB(): Promise<void> {
  mongoose.set("strictQuery", true);

  mongoose.connection.on("connected", () => {
    console.log("✅ MongoDB connected");
  });
  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err);
  });
  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️  MongoDB disconnected");
  });

  await mongoose.connect(env.MONGODB_URI);
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
