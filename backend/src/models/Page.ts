import mongoose, { Schema, Document } from "mongoose";

interface IGraph {
  id: string;
  type: string;
  data: any;
  layout?: any;
  config?: any;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

interface ITextBox {
  id: string;
  text: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  fontSize: number;
  fontFamily: string;
  color: string;
}

interface IDrawingData {
  paths: any[];
  width: number;
  height: number;
}

export interface IPage extends Document {
  notebookId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  createdAt: Date;
  lastModified: Date;
  lastModifiedBy: mongoose.Types.ObjectId;
  order: number;
  content: string;
  drawings: IDrawingData | null;
  graphs: IGraph[];
  textBoxes: ITextBox[];
  wordCount?: number;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
  tags: string[];
}

const PageSchema: Schema = new Schema(
  {
    notebookId: {
      type: Schema.Types.ObjectId,
      ref: "Notebook",
      required: true,
    },
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
    lastModified: {
      type: Date,
      default: Date.now,
    },
    lastModifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    content: {
      type: String,
      default: "",
    },
    drawings: {
      type: Schema.Types.Mixed,
      default: null,
    },
    graphs: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    textBoxes: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    wordCount: {
      type: Number,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
PageSchema.index({ notebookId: 1, isDeleted: 1, order: 1 });
PageSchema.index({ userId: 1, isDeleted: 1 });
PageSchema.index({ userId: 1, lastModified: -1 });
PageSchema.index({ notebookId: 1, title: 1 });
PageSchema.index({ notebookId: 1, tags: 1 });

// Full-text search index
PageSchema.index(
  {
    title: "text",
    content: "text",
    "textBoxes.text": "text",
  },
  {
    weights: {
      title: 10,
      content: 5,
      "textBoxes.text": 3,
    },
    name: "page_text_search",
  }
);

// Update lastModified and calculate wordCount on save
PageSchema.pre("save", function (next) {
  this.lastModified = new Date();

  // Calculate word count
  if (this.content) {
    this.wordCount = this.content
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }

  next();
});

export default mongoose.model<IPage>("Page", PageSchema);
