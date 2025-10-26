import express from "express";
import { authenticate } from "../middleware/auth";
import Page from "../models/Page";
import Notebook from "../models/Notebook";
import Trash from "../models/Trash";
import User from "../models/User";

const router = express.Router();

// Clean up old deleted data to free up space
router.post("/cleanup", authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    console.log(`Starting cleanup for user ${userId}`);

    // 1. Permanently delete old trash items (older than 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldTrashItems = await Trash.find({
      userId,
      deletedAt: { $lt: thirtyDaysAgo },
    });

    if (oldTrashItems.length > 0) {
      await Trash.deleteMany({
        userId,
        deletedAt: { $lt: thirtyDaysAgo },
      });
      console.log(
        `Permanently deleted ${oldTrashItems.length} old trash items`
      );
    }

    // 2. Clean up pages with empty or minimal content
    const emptyPages = await Page.find({
      userId,
      isDeleted: false,
      $or: [
        { content: { $in: [null, "", " "] } },
        { content: { $exists: false } },
        { content: { $regex: /^\s*$/ } },
      ],
      $expr: {
        $or: [
          { $eq: [{ $size: { $ifNull: ["$drawings", []] } }, 0] },
          { $eq: [{ $size: { $ifNull: ["$textBoxes", []] } }, 0] },
          { $eq: [{ $size: { $ifNull: ["$graphs", []] } }, 0] },
        ],
      },
    });

    if (emptyPages.length > 0) {
      // Move to trash instead of permanent deletion
      const trashItems = emptyPages.map((page) => ({
        userId,
        type: "page",
        originalId: page._id,
        data: {
          title: page.title,
          notebookId: page.notebookId,
          content: page.content,
        },
        deletedAt: new Date(),
      }));

      await Trash.insertMany(trashItems);
      await Page.deleteMany({ _id: { $in: emptyPages.map((p) => p._id) } });
      console.log(`Moved ${emptyPages.length} empty pages to trash`);
    }

    // 3. Clean up notebooks with no pages
    const emptyNotebooks = await Notebook.find({
      userId,
      isDeleted: false,
    });

    const notebooksToDelete = [];
    for (const notebook of emptyNotebooks) {
      const pageCount = await Page.countDocuments({
        notebookId: notebook._id,
        isDeleted: false,
      });

      if (pageCount === 0) {
        notebooksToDelete.push(notebook);
      }
    }

    if (notebooksToDelete.length > 0) {
      const trashItems = notebooksToDelete.map((notebook) => ({
        userId,
        type: "notebook",
        originalId: notebook._id,
        data: {
          title: notebook.title,
          description: notebook.description,
        },
        deletedAt: new Date(),
      }));

      await Trash.insertMany(trashItems);
      await Notebook.deleteMany({
        _id: { $in: notebooksToDelete.map((n) => n._id) },
      });
      console.log(`Moved ${notebooksToDelete.length} empty notebooks to trash`);
    }

    // 4. Get storage statistics
    const totalPages = await Page.countDocuments({ userId, isDeleted: false });
    const totalNotebooks = await Notebook.countDocuments({
      userId,
      isDeleted: false,
    });
    const totalTrash = await Trash.countDocuments({ userId });

    res.json({
      success: true,
      message: "Cleanup completed successfully",
      stats: {
        totalPages,
        totalNotebooks,
        totalTrash,
        deletedTrashItems: oldTrashItems.length,
        movedEmptyPages: emptyPages.length,
        movedEmptyNotebooks: notebooksToDelete.length,
      },
    });
  } catch (error) {
    console.error("Cleanup failed:", error);
    res.status(500).json({
      error: "Cleanup failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get storage usage statistics
router.get("/stats", authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const stats = {
      pages: await Page.countDocuments({ userId, isDeleted: false }),
      notebooks: await Notebook.countDocuments({ userId, isDeleted: false }),
      trash: await Trash.countDocuments({ userId }),
      deletedPages: await Page.countDocuments({ userId, isDeleted: true }),
      deletedNotebooks: await Notebook.countDocuments({
        userId,
        isDeleted: true,
      }),
    };

    res.json({ success: true, stats });
  } catch (error) {
    console.error("Failed to get storage stats:", error);
    res.status(500).json({
      error: "Failed to get storage statistics",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
