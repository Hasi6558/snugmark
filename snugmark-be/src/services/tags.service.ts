import { Tag } from "../models/Tag.js";

export async function listTags(userId: string) {
  return Tag.find({ userId }).sort({ createdAt: 1 });
}

export async function findOrCreateTag(userId: string, name: string) {
  const existing = await Tag.findOne({ userId, name }).collation({
    locale: "en",
    strength: 2,
  });

  if (existing) {
    return { tag: existing, created: false };
  }

  const count = await Tag.countDocuments({ userId });
  const colorIndex = (count % 6) + 1;
  const tag = await Tag.create({ userId, name, colorIndex });
  return { tag, created: true };
}
