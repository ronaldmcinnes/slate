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
  canvasState: {
    expandedPanels: {
      sidebar?: boolean;
      pagesList?: boolean;
      toolbar?: boolean;
    };
    currentNotebookId?: mongoose.Types.ObjectId;
    currentPageId?: mongoose.Types.ObjectId;
    canvasViewport: {
      x?: number;
      y?: number;
      zoom?: number;
    };
    lastUsedTool?: string;
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
    canvasState: {
      expandedPanels: {
        sidebar: {
          type: Boolean,
          default: true,
        },
        pagesList: {
          type: Boolean,
          default: true,
        },
        toolbar: {
          type: Boolean,
          default: true,
        },
      },
      currentNotebookId: {
        type: Schema.Types.ObjectId,
        ref: "Notebook",
      },
      currentPageId: {
        type: Schema.Types.ObjectId,
        ref: "Page",
      },
      canvasViewport: {
        x: {
          type: Number,
          default: 0,
        },
        y: {
          type: Number,
          default: 0,
        },
        zoom: {
          type: Number,
          default: 1,
        },
      },
      lastUsedTool: {
        type: String,
        default: "marker1",
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
