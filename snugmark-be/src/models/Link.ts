// Copyright (c) 2026 Hasindu Shehan Liyanage. All Rights Reserved.
// This code may not be copied, modified, distributed, or used in production without written permission.

import { Schema, model, Types } from "mongoose";

export interface ILink {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  collectionId: Types.ObjectId;
  url: string;
  title: string;
  description: string;
  favicon: string;
  isFavourite: boolean;
  position: number;
  tagIds: Types.ObjectId[];
  visitCount: number;
  lastVisitedAt: Date | null;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const linkSchema = new Schema<ILink>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    collectionId: {
      type: Schema.Types.ObjectId,
      ref: "Collection",
      required: true,
    },
    url: { type: String, required: true, trim: true },
    title: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    favicon: { type: String, default: "" },
    isFavourite: { type: Boolean, default: false },
    position: { type: Number, required: true, default: 0 },
    tagIds: [{ type: Schema.Types.ObjectId, ref: "Tag" }],
    visitCount: { type: Number, default: 0 },
    lastVisitedAt: { type: Date, default: null },
    isRead: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = (ret._id as { toString(): string }).toString();
        if (ret.userId) ret.userId = (ret.userId as { toString(): string }).toString();
        if (ret.collectionId) ret.collectionId = (ret.collectionId as { toString(): string }).toString();
        if (Array.isArray(ret.tagIds)) {
          ret.tagIds = (ret.tagIds as { toString(): string }[]).map((id) => id.toString());
        }
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

linkSchema.index({ userId: 1 });
linkSchema.index({ collectionId: 1, position: 1 });

export const Link = model<ILink>("Link", linkSchema);
