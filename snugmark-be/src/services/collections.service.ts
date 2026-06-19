import { Types } from "mongoose";
import { Collection } from "../models/Collection.js";
import { Link } from "../models/Link.js";
import { AppError } from "../middleware/error.js";
import { verifyUserPassword } from "./auth.service.js";

async function getOwned(id: string, userId: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(404, "not_found", "Collection not found");
  }
  const col = await Collection.findOne({ _id: id, userId });
  if (!col) throw new AppError(404, "not_found", "Collection not found");
  return col;
}

async function requireValidPassword(userId: string, password: string): Promise<void> {
  const valid = await verifyUserPassword(userId, password);
  if (!valid) throw new AppError(403, "invalid_password", "Incorrect password");
}

export async function listCollections(userId: string) {
  return Collection.find({ userId }).sort({ order: 1 });
}

export async function createCollection(userId: string, name: string, parentId?: string) {
  if (parentId) await getOwned(parentId, userId);

  const siblingCount = await Collection.countDocuments({
    userId,
    parentId: parentId ?? null,
  });

  return Collection.create({
    userId,
    parentId: parentId ?? null,
    name,
    order: siblingCount,
  });
}

export async function reorderCollections(userId: string, orderedIds: string[]) {
  await Promise.all(
    orderedIds.map((id, index) =>
      Collection.updateOne({ _id: id, userId, parentId: null }, { order: index })
    )
  );
}

export async function renameCollection(userId: string, id: string, name: string) {
  const col = await getOwned(id, userId);
  col.name = name;
  await col.save();
  return col;
}

export async function deleteCollection(userId: string, id: string) {
  const col = await getOwned(id, userId);
  const children = await Collection.find({ userId, parentId: col._id });
  const allIds = [col._id, ...children.map((c) => c._id)];
  await Link.deleteMany({ userId, collectionId: { $in: allIds } });
  await Collection.deleteMany({ _id: { $in: allIds } });
}

export async function lockCollection(userId: string, id: string, password: string) {
  await requireValidPassword(userId, password);
  const col = await getOwned(id, userId);
  col.locked = true;
  await col.save();
  return col;
}

export async function removeLock(userId: string, id: string, password: string) {
  await requireValidPassword(userId, password);
  const col = await getOwned(id, userId);
  col.locked = false;
  await col.save();
  return col;
}

export async function unlockCollection(userId: string, id: string, password: string) {
  await requireValidPassword(userId, password);
  await getOwned(id, userId);
}
