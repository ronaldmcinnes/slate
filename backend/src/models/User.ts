import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  googleId: string;
  displayName: string;
  profilePicture?: string;
  createdAt: Date;
  lastLogin: Date;
  tutorialCompleted: boolean;
  settings: {
    theme?: "light" | "dark" | "system";
    defaultNotebook?: mongoose.Types.ObjectId;
  };
  recentPages: Array<{
    pageId: mongoose.Types.ObjectId;
    notebookId: mongoose.Types.ObjectId;
    accessedAt: Date;
  }>;
  isActive: boolean;
}

const UserSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    googleId: {
      type: String,
      required: true,
      unique: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    tutorialCompleted: {
      type: Boolean,
      default: false,
    },
    settings: {
      theme: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "system",
      },
      defaultNotebook: {
        type: Schema.Types.ObjectId,
        ref: "Notebook",
      },
    },
    recentPages: [
      {
        pageId: {
          type: Schema.Types.ObjectId,
          ref: "Page",
        },
        notebookId: {
          type: Schema.Types.ObjectId,
          ref: "Notebook",
        },
        accessedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ isActive: 1 });

export default mongoose.model<IUser>("User", UserSchema);
