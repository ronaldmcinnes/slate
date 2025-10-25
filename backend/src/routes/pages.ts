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
      console.log("📄 Fetching pages for notebook:", req.params.notebookId);

      const pages = await Page.find({
        notebookId: req.params.notebookId,
        isDeleted: false,
      })
        .select(
          "title createdAt lastModified lastModifiedBy order tags notebookId userId"
        ) // Only lightweight fields
        .sort({ order: 1, createdAt: 1 });

      console.log("✅ Found", pages.length, "pages");

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
          // These are excluded but set to null/empty for frontend compatibility
          content: "",
          drawings: null,
          graphs: [],
          textBoxes: [],
          isDeleted: false,
        })),
      });
    } catch (error) {
      console.error("❌ Error fetching pages:", error);
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
      console.error("Error creating page:", error);
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

      // DEBUG: Log what we received
      console.log("🔵 PATCH /api/pages/:id - Received update request");
      console.log("  Page ID:", req.params.id);
      console.log("  Update fields:", Object.keys(req.body));
      if (drawings) {
        console.log("  Drawings data:", {
          type: typeof drawings,
          isArray: Array.isArray(drawings),
          hasPaths: !!drawings.paths,
          pathCount: drawings.paths?.length || 0,
          hasWidth: !!drawings.width,
          hasHeight: !!drawings.height,
        });
      }

      const page = await Page.findById(req.params.id);

      if (!page) {
        console.log("  ❌ Page not found");
        res.status(404).json({
          success: false,
          error: "Page not found",
        });
        return;
      }

      console.log("  📄 Found page:", page.title);

      if (title !== undefined) page.title = title.trim();
      if (content !== undefined) page.content = content;
      if (drawings !== undefined) {
        console.log("  💾 Saving drawings:", {
          pathCount: drawings.paths?.length || 0,
          previousPathCount: page.drawings?.paths?.length || 0,
        });
        page.drawings = drawings;
      }
      if (graphs !== undefined) page.graphs = graphs;
      if (textBoxes !== undefined) page.textBoxes = textBoxes;
      if (tags !== undefined) page.tags = tags;
      if (order !== undefined) page.order = order;

      page.lastModifiedBy = req.user!._id as mongoose.Types.ObjectId;
      await page.save();

      console.log("  ✅ Page saved to database");
      console.log("  📊 Current drawings in DB:", {
        hasPaths: !!page.drawings?.paths,
        pathCount: page.drawings?.paths?.length || 0,
      });

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
      console.error("Error updating page:", error);
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
      console.log("🗑️ DELETE /api/pages/:id - Received delete request");
      console.log("  Page ID:", req.params.id);

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
        console.log("  ❌ Page not found");
        res.status(404).json({
          success: false,
          error: "Page not found",
        });
        return;
      }

      console.log("  📄 Found and updated page:", page.title);
      console.log("  ✅ isDeleted is now:", page.isDeleted);
      console.log(
        "  📋 Full page object:",
        JSON.stringify(
          {
            _id: page._id,
            title: page.title,
            isDeleted: page.isDeleted,
            deletedAt: page.deletedAt,
            deletedBy: page.deletedBy,
          },
          null,
          2
        )
      );

      // Verify deletion in database with fresh query
      const verifyPage = await Page.findById(req.params.id);
      console.log(
        "  🔍 Fresh verification - Page in DB:",
        JSON.stringify(
          {
            _id: verifyPage?._id,
            title: verifyPage?.title,
            isDeleted: verifyPage?.isDeleted,
            deletedAt: verifyPage?.deletedAt,
          },
          null,
          2
        )
      );

      // Add to trash
      await Trash.create({
        userId: req.user!._id,
        itemType: "page",
        itemId: page._id,
        originalData: page.toObject(),
      });

      console.log("  🗑️ Added to trash");

      // Update notebook lastModified
      await Notebook.findByIdAndUpdate(page.notebookId, {
        lastModified: new Date(),
      });

      console.log("  📤 Sending success response");
      res.json({
        success: true,
        message: "Page moved to trash",
      });
      console.log("  ✅ Response sent");
    } catch (error) {
      console.error("❌ Error deleting page:", error);
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
