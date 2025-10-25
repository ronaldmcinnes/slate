import { Router } from "express";
import mongoose from "mongoose";
import { AuthRequest, authenticate } from "../middleware/auth";
import Trash from "../models/Trash";
import Notebook from "../models/Notebook";
import Page from "../models/Page";

const router = Router();

// Get all trash items
router.get("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id as mongoose.Types.ObjectId;

    const trashItems = await Trash.find({ userId }).sort({ deletedAt: -1 });

    const formatted = trashItems.map((item) => ({
      id: item._id,
      userId: item.userId,
      itemType: item.itemType,
      itemId: item.itemId,
      title: item.originalData.title,
      deletedAt: item.deletedAt,
      expiresAt: item.expiresAt,
    }));

    res.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error fetching trash",
    });
  }
});

// Permanently delete item
router.delete("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const trashItem = await Trash.findOne({
      _id: req.params.id,
      userId: req.user!._id,
    });

    if (!trashItem) {
      res.status(404).json({
        success: false,
        error: "Item not found in trash",
      });
      return;
    }

    // Permanently delete the item
    if (trashItem.itemType === "notebook") {
      await Notebook.findByIdAndDelete(trashItem.itemId);
      // Delete all pages in the notebook
      await Page.deleteMany({ notebookId: trashItem.itemId });
    } else if (trashItem.itemType === "page") {
      await Page.findByIdAndDelete(trashItem.itemId);
    }

    // Remove from trash
    await Trash.findByIdAndDelete(trashItem._id);

    res.json({
      success: true,
      message: "Item permanently deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error deleting item",
    });
  }
});

// Empty trash (delete all)
router.delete("/empty/all", authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id as mongoose.Types.ObjectId;

    const trashItems = await Trash.find({ userId });

    for (const item of trashItems) {
      if (item.itemType === "notebook") {
        await Notebook.findByIdAndDelete(item.itemId);
        await Page.deleteMany({ notebookId: item.itemId });
      } else if (item.itemType === "page") {
        await Page.findByIdAndDelete(item.itemId);
      }
    }

    await Trash.deleteMany({ userId });

    res.json({
      success: true,
      message: "Trash emptied successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error emptying trash",
    });
  }
});

export default router;
