import { Router } from "express";
import mongoose from "mongoose";
import { AuthRequest, authenticate } from "../middleware/auth";
import {
  checkNotebookAccess,
  checkPageAccess,
} from "../middleware/permissions";
import Page from "../models/Page";
import Notebook from "../models/Notebook";
import Trash from "../models/Trash";

const router = Router();

// Get all pages in a notebook (metadata only - fast!)
router.get(
  "/notebook/:notebookId",
  authenticate,
  checkNotebookAccess("view"),
  async (req: AuthRequest, res) => {
    try {
      const pages = await Page.find({
        notebookId: req.params.notebookId,
        isDeleted: false,
      })
        .select(
          "title createdAt lastModified lastModifiedBy order tags notebookId userId"
        )
        .sort({ order: 1, createdAt: 1 });

      res.json({
        success: true,
        data: pages.map((p) => ({
          id: p._id,
          title: p.title,
          createdAt: p.createdAt,
          lastModified: p.lastModified,
          lastModifiedBy: p.lastModifiedBy,
          order: p.order,
          tags: p.tags,
          notebookId: p.notebookId,
          userId: p.userId,
          content: "",
          drawings: null,
          graphs: [],
          textBoxes: [],
          isDeleted: false,
        })),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Error fetching pages",
      });
    }
  }
);

// Get single page
router.get(
  "/:id",
  authenticate,
  checkPageAccess("view"),
  async (req: AuthRequest, res) => {
    try {
      const page = await Page.findById(req.params.id);

      if (!page) {
        res.status(404).json({
          success: false,
          error: "Page not found",
        });
        return;
      }

      // Update recent pages for user
      const user = req.user!;
      user.recentPages = user.recentPages.filter(
        (rp) =>
          rp.pageId.toString() !==
          (page._id as mongoose.Types.ObjectId).toString()
      );
      user.recentPages.unshift({
        pageId: page._id as mongoose.Types.ObjectId,
        notebookId: page.notebookId,
        accessedAt: new Date(),
      });
      user.recentPages = user.recentPages.slice(0, 10); // Keep only 10 most recent
      await user.save();

      res.json({
        success: true,
        data: {
          ...page.toObject(),
          id: page._id,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Error fetching page",
      });
    }
  }
);

// Create page
router.post(
  "/notebook/:notebookId",
  authenticate,
  checkNotebookAccess("edit"),
  async (req: AuthRequest, res) => {
    try {
      const { title, content, tags } = req.body;
      const notebookId = req.params.notebookId;

      if (!title || title.trim() === "") {
        res.status(400).json({
          success: false,
          error: "Title is required",
        });
        return;
      }

      // Get max order
      const maxOrderPage = await Page.findOne({ notebookId }).sort({
        order: -1,
      });
      const order = maxOrderPage ? maxOrderPage.order + 1 : 0;

      const page = await Page.create({
        notebookId,
        userId: req.user!._id,
        title: title.trim(),
        content: content || "",
        tags: tags || [],
        order,
        lastModifiedBy: req.user!._id,
      });

      // Update notebook lastModified
      await Notebook.findByIdAndUpdate(notebookId, {
        lastModified: new Date(),
      });

      res.status(201).json({
        success: true,
        data: {
          ...page.toObject(),
          id: page._id,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Error creating page",
      });
    }
  }
);

// Update page
router.patch(
  "/:id",
  authenticate,
  checkPageAccess("edit"),
  async (req: AuthRequest, res) => {
    try {
      const { title, content, drawings, graphs, textBoxes, tags, order } =
        req.body;

      const page = await Page.findById(req.params.id);

      if (!page) {
        res.status(404).json({
          success: false,
          error: "Page not found",
        });
        return;
      }

      if (title !== undefined) page.title = title.trim();
      if (content !== undefined) page.content = content;
      if (drawings !== undefined) {
        page.drawings = drawings;
      }
      if (graphs !== undefined) page.graphs = graphs;
      if (textBoxes !== undefined) page.textBoxes = textBoxes;
      if (tags !== undefined) page.tags = tags;
      if (order !== undefined) page.order = order;

      page.lastModifiedBy = req.user!._id as mongoose.Types.ObjectId;
      await page.save();

      // Update notebook lastModified
      await Notebook.findByIdAndUpdate(page.notebookId, {
        lastModified: new Date(),
      });

      res.json({
        success: true,
        data: {
          ...page.toObject(),
          id: page._id,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Error updating page",
      });
    }
  }
);

// Soft delete page
router.delete(
  "/:id",
  authenticate,
  checkPageAccess("edit"),
  async (req: AuthRequest, res) => {
    try {
      // Use findByIdAndUpdate for atomic operation
      const page = await Page.findByIdAndUpdate(
        req.params.id,
        {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: req.user!._id as mongoose.Types.ObjectId,
        },
        { new: true } // Return the updated document
      );

      if (!page) {
        res.status(404).json({
          success: false,
          error: "Page not found",
        });
        return;
      }

      // Add to trash
      await Trash.create({
        userId: req.user!._id,
        itemType: "page",
        itemId: page._id,
        originalData: page.toObject(),
      });

      // Update notebook lastModified
      await Notebook.findByIdAndUpdate(page.notebookId, {
        lastModified: new Date(),
      });

      res.json({
        success: true,
        message: "Page moved to trash",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Error deleting page",
      });
    }
  }
);

// Restore page from trash
router.post("/:id/restore", authenticate, async (req: AuthRequest, res) => {
  try {
    const page = await Page.findOne({
      _id: req.params.id,
      isDeleted: true,
    });

    if (!page) {
      res.status(404).json({
        success: false,
        error: "Page not found in trash",
      });
      return;
    }

    // Check if notebook is accessible
    const notebook = await Notebook.findById(page.notebookId);
    if (!notebook || notebook.isDeleted) {
      res.status(400).json({
        success: false,
        error: "Cannot restore page: parent notebook is deleted",
      });
      return;
    }

    page.isDeleted = false;
    page.deletedAt = undefined;
    page.deletedBy = undefined;
    await page.save();

    // Remove from trash
    await Trash.deleteOne({
      itemType: "page",
      itemId: page._id,
    });

    res.json({
      success: true,
      data: {
        ...page.toObject(),
        id: page._id,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error restoring page",
    });
  }
});

// Get recent pages
router.get("/recent/list", authenticate, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;

    const recentPageIds = user.recentPages.map((rp) => rp.pageId);

    const pages = await Page.find({
      _id: { $in: recentPageIds },
      isDeleted: false,
    }).populate("notebookId", "title");

    // Sort by recent access order
    const sortedPages = recentPageIds
      .map((id) =>
        pages.find(
          (p) => (p._id as mongoose.Types.ObjectId).toString() === id.toString()
        )
      )
      .filter((p) => p !== undefined);

    res.json({
      success: true,
      data: sortedPages.map((p) => ({
        ...p!.toObject(),
        id: p!._id,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error fetching recent pages",
    });
  }
});

export default router;
