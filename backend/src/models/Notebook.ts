import mongoose, { Schema, Document } from "mongoose";

export interface ISharedUser {
  userId: mongoose.Types.ObjectId;
  permission: "view" | "edit";
  sharedAt: Date;
  sharedBy: mongoose.Types.ObjectId;
}

export interface INotebook extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  createdAt: Date;
  lastModified: Date;
  order: number;
  color?: string;
  icon?: string;
  tags: string[];
  isDeleted: boolean;
  deletedAt?: Date;
  sharedWith: ISharedUser[];
  lastAccessedBy?: mongoose.Types.ObjectId;
  lastAccessedAt?: Date;
}

const NotebookSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    lastModified: {
      type: Date,
      default: Date.now,
    },
    order: {
      type: Number,
      default: 0,
    },
    color: {
      type: String,
    },
    icon: {
      type: String,
    },
    tags: {
      type: [String],
      default: [],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    sharedWith: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        permission: {
          type: String,
          enum: ["view", "edit"],
          required: true,
        },
        sharedAt: {
          type: Date,
          default: Date.now,
        },
        sharedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
      },
    ],
    lastAccessedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    lastAccessedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
NotebookSchema.index({ userId: 1, isDeleted: 1, order: 1 });
NotebookSchema.index({ "sharedWith.userId": 1, isDeleted: 1 });
NotebookSchema.index({ userId: 1, tags: 1, isDeleted: 1 });
NotebookSchema.index({ userId: 1, lastAccessedAt: -1 });
NotebookSchema.index({ userId: 1, isDeleted: 1, deletedAt: -1 });

// Update lastModified on save
NotebookSchema.pre("save", function (next) {
  this.lastModified = new Date();
  next();
});

export default mongoose.model<INotebook>("Notebook", NotebookSchema);
