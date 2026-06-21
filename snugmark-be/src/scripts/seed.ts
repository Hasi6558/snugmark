// Copyright (c) 2026 Hasindu Shehan Liyanage. All Rights Reserved.
// This code may not be copied, modified, distributed, or used in production without written permission.

import { connectDB, disconnectDB } from "../db.js";
import { User } from "../models/User.js";
import { Collection } from "../models/Collection.js";
import { Link } from "../models/Link.js";
import { Tag } from "../models/Tag.js";
import { hashPassword } from "../lib/password.js";

const SEED_EMAIL = "demo@snugmark.app";
const SEED_PASSWORD = "password123";
const fav = (domain: string) =>
  `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

async function seed() {
  await connectDB();

  // Find or create the demo user
  let user = await User.findOne({ email: SEED_EMAIL });
  if (user) {
    await Collection.deleteMany({ userId: user._id });
    await Link.deleteMany({ userId: user._id });
    await Tag.deleteMany({ userId: user._id });
    console.log("Cleared existing seed data for", SEED_EMAIL);
  } else {
    user = await User.create({
      name: "Demo User",
      email: SEED_EMAIL,
      passwordHash: await hashPassword(SEED_PASSWORD),
    });
    console.log("Created demo user:", SEED_EMAIL);
  }

  const userId = user._id;

  // Tags
  const [tagDesign, tagReading, tagTools, tagInspiration] = await Tag.insertMany([
    { userId, name: "design", colorIndex: 1 },
    { userId, name: "reading", colorIndex: 2 },
    { userId, name: "tools", colorIndex: 3 },
    { userId, name: "inspiration", colorIndex: 5 },
  ]);

  // Top-level collections
  const [readingList, design, devTools] = await Collection.insertMany([
    { userId, parentId: null, name: "Reading list", order: 0 },
    { userId, parentId: null, name: "Design", order: 1 },
    { userId, parentId: null, name: "Dev tools", order: 2 },
  ]);

  // Sub-collections under Design
  const [typography, color] = await Collection.insertMany([
    { userId, parentId: design._id, name: "Typography", order: 0 },
    { userId, parentId: design._id, name: "Color", order: 1 },
  ]);

  const now = new Date();
  const ago = (ms: number) => new Date(now.getTime() - ms);

  await Link.insertMany([
    {
      userId, collectionId: readingList._id, position: 0,
      url: "https://paulgraham.com/greatwork.html",
      title: "How to Do Great Work",
      description: "Paul Graham's long essay on doing meaningful work.",
      favicon: fav("paulgraham.com"), isFavourite: true,
      tagIds: [tagReading._id, tagInspiration._id],
      visitCount: 12, lastVisitedAt: ago(1000 * 60 * 60 * 2), isRead: true,
    },
    {
      userId, collectionId: readingList._id, position: 1,
      url: "https://every.to/",
      title: "Every — Writing about business, AI and the internet",
      description: "A bundle of thoughtful newsletters worth a slow morning read.",
      favicon: fav("every.to"), isFavourite: false,
      tagIds: [tagReading._id],
      visitCount: 3, lastVisitedAt: ago(1000 * 60 * 60 * 26), isRead: false,
    },
    {
      userId, collectionId: typography._id, position: 0,
      url: "https://practicaltypography.com/",
      title: "Butterick's Practical Typography",
      description: "A free book on type that genuinely changes how you set text.",
      favicon: fav("practicaltypography.com"), isFavourite: true,
      tagIds: [tagDesign._id],
      visitCount: 8, lastVisitedAt: ago(1000 * 60 * 30), isRead: true,
    },
    {
      userId, collectionId: color._id, position: 0,
      url: "https://oklch.com/",
      title: "OKLCH Color Picker & Converter",
      description: "Pick perceptually uniform colors with live previews.",
      favicon: fav("oklch.com"), isFavourite: false,
      tagIds: [tagDesign._id, tagTools._id],
      visitCount: 15, lastVisitedAt: ago(1000 * 60 * 10), isRead: false,
    },
    {
      userId, collectionId: devTools._id, position: 0,
      url: "https://github.com/features/copilot",
      title: "GitHub Copilot",
      description: "AI pair programmer that lives in your editor.",
      favicon: fav("github.com"), isFavourite: false,
      tagIds: [tagTools._id],
      visitCount: 5, lastVisitedAt: ago(1000 * 60 * 60 * 5), isRead: false,
    },
    {
      userId, collectionId: devTools._id, position: 1,
      url: "https://raycast.com/",
      title: "Raycast — Your shortcut to everything",
      description: "A keyboard-first launcher that replaces a dozen tools.",
      favicon: fav("raycast.com"), isFavourite: true,
      tagIds: [tagTools._id],
      visitCount: 22, lastVisitedAt: ago(1000 * 60 * 60 * 1), isRead: true,
    },
  ]);

  console.log("✅ Seed complete:");
  console.log("   email   :", SEED_EMAIL);
  console.log("   password:", SEED_PASSWORD);
  console.log("   collections: 5 (3 top-level + 2 sub)");
  console.log("   links   : 6");
  console.log("   tags    : 4");

  await disconnectDB();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
