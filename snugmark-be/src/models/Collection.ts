// Copyright (c) 2026 Hasindu Shehan Liyanage. All Rights Reserved.
// This code may not be copied, modified, distributed, or used in production without written permission.

import { Schema, model, Types } from "mongoose";

export interface ICollection {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  parentId: Types.ObjectId | null;
  name: string;
  order: number;
  locked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const collectionSchema = new Schema<ICollection>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    parentId: { type: Schema.Types.ObjectId, ref: "Collection", default: null },
    name: { type: String, required: true, trim: true },
    order: { type: Number, required: true, default: 0 },
    locked: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = (ret._id as { toString(): string }).toString();
        if (ret.userId) ret.userId = (ret.userId as { toString(): string }).toString();
        if (ret.parentId) ret.parentId = (ret.parentId as { toString(): string }).toString();
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

collectionSchema.index({ userId: 1, order: 1 });

export const Collection = model<ICollection>("Collection", collectionSchema);
