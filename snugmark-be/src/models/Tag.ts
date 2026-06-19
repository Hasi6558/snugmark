import { Schema, model, Types } from "mongoose";

export interface ITag {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  colorIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

const tagSchema = new Schema<ITag>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    colorIndex: { type: Number, required: true, min: 1, max: 6 },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = (ret._id as { toString(): string }).toString();
        if (ret.userId) ret.userId = (ret.userId as { toString(): string }).toString();
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

// Case-insensitive unique tag name per user
tagSchema.index(
  { userId: 1, name: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);

export const Tag = model<ITag>("Tag", tagSchema);
