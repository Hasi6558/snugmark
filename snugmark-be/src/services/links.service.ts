import { Types } from "mongoose";
import { Link } from "../models/Link.js";
import { Collection } from "../models/Collection.js";
import { AppError } from "../middleware/error.js";

async function getOwned(id: string, userId: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(404, "not_found", "Link not found");
  }
  const link = await Link.findOne({ _id: id, userId });
  if (!link) throw new AppError(404, "not_found", "Link not found");
  return link;
}

async function verifyCollectionOwnership(collectionId: string, userId: string) {
  if (!Types.ObjectId.isValid(collectionId)) {
    throw new AppError(404, "not_found", "Collection not found");
  }
  const col = await Collection.findOne({ _id: collectionId, userId });
  if (!col) throw new AppError(404, "not_found", "Collection not found");
}

export interface CreateLinkData {
  collectionId: string;
  url: string;
  title?: string;
  description?: string;
  favicon?: string;
  tagIds?: string[];
}

export interface UpdateLinkData {
  url?: string;
  title?: string;
  description?: string;
  favicon?: string;
  tagIds?: string[];
  isFavourite?: boolean;
  isRead?: boolean;
}

export async function listLinks(userId: string) {
  return Link.find({ userId }).sort({ collectionId: 1, position: 1 });
}

export async function createLink(userId: string, data: CreateLinkData) {
  await verifyCollectionOwnership(data.collectionId, userId);

  const position = await Link.countDocuments({
    userId,
    collectionId: data.collectionId,
  });

  return Link.create({
    userId,
    collectionId: data.collectionId,
    url: data.url,
    title: data.title ?? "",
    description: data.description ?? "",
    favicon: data.favicon ?? "",
    tagIds: data.tagIds ?? [],
    position,
    visitCount: 0,
    lastVisitedAt: null,
    isRead: false,
    isFavourite: false,
  });
}

export async function updateLink(userId: string, id: string, data: UpdateLinkData) {
  const link = await getOwned(id, userId);
  Object.assign(link, data);
  await link.save();
  return link;
}

export async function deleteLink(userId: string, id: string) {
  const link = await getOwned(id, userId);
  await link.deleteOne();
}

export async function recordVisit(userId: string, id: string) {
  const link = await getOwned(id, userId);
  link.visitCount += 1;
  link.lastVisitedAt = new Date();
  link.isRead = true;
  await link.save();
  return link;
}

export async function moveLink(userId: string, id: string, targetCollectionId: string) {
  await verifyCollectionOwnership(targetCollectionId, userId);
  const link = await getOwned(id, userId);

  const position = await Link.countDocuments({
    userId,
    collectionId: targetCollectionId,
  });

  link.collectionId = new Types.ObjectId(targetCollectionId);
  link.position = position;
  await link.save();
  return link;
}

export async function reorderLinks(
  userId: string,
  collectionId: string,
  orderedIds: string[]
) {
  await verifyCollectionOwnership(collectionId, userId);

  await Promise.all(
    orderedIds.map((id, index) =>
      Link.updateOne({ _id: id, userId, collectionId }, { position: index })
    )
  );
}
