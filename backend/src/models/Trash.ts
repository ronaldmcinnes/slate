import mongoose, { Schema, Document } from "mongoose";

export interface ITrash extends Document {
  userId: mongoose.Types.ObjectId;
  itemType: "notebook" | "page";
  itemId: mongoose.Types.ObjectId;
  originalData: any;
  deletedAt: Date;
  expiresAt: Date;
}

const TrashSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    itemType: {
      type: String,
      enum: ["notebook", "page"],
      required: true,
    },
    itemId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    originalData: {
      type: Schema.Types.Mixed,
      required: true,
    },
    deletedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
TrashSchema.index({ userId: 1, deletedAt: -1 });
TrashSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

export default mongoose.model<ITrash>("Trash", TrashSchema);
