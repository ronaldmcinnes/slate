import mongoose, { Schema, Document } from "mongoose";

export interface IActivity extends Document {
  userId: mongoose.Types.ObjectId;
  action: "create" | "update" | "delete" | "restore" | "share" | "unshare";
  targetType: "notebook" | "page";
  targetId: mongoose.Types.ObjectId;
  changes?: any;
  timestamp: Date;
  collaboratorId?: mongoose.Types.ObjectId;
}

const ActivitySchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      enum: ["create", "update", "delete", "restore", "share", "unshare"],
      required: true,
    },
    targetType: {
      type: String,
      enum: ["notebook", "page"],
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    changes: {
      type: Schema.Types.Mixed,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    collaboratorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: false,
  }
);

// Indexes
ActivitySchema.index({ userId: 1, timestamp: -1 });
ActivitySchema.index({ targetId: 1, timestamp: -1 });

export default mongoose.model<IActivity>("Activity", ActivitySchema);
