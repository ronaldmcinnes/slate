import { Router } from "express";
import mongoose from "mongoose";
import { AuthRequest, authenticate } from "../middleware/auth";
import Page from "../models/Page";
import Notebook from "../models/Notebook";

const router = Router();

// Full-text search across pages
router.get("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const { q, notebookId, tags, limit = 20 } = req.query;
    const userId = req.user!._id as mongoose.Types.ObjectId;

    if (!q || typeof q !== "string" || q.trim() === "") {
      res.status(400).json({
        success: false,
        error: "Search query is required",
      });
      return;
    }

    // Build query
    const searchQuery: any = {
      $text: { $search: q },
      isDeleted: false,
    };

    // Filter by notebook if specified
    if (notebookId) {
      searchQuery.notebookId = notebookId;
    } else {
      // Search only in user's notebooks (owned or shared)
      const ownedNotebooks = await Notebook.find({
        userId,
        isDeleted: false,
      }).select("_id");

      const sharedNotebooks = await Notebook.find({
        "sharedWith.userId": userId,
        isDeleted: false,
      }).select("_id");

      const accessibleNotebookIds = [
        ...ownedNotebooks.map((nb) => nb._id),
        ...sharedNotebooks.map((nb) => nb._id),
      ];

      searchQuery.notebookId = { $in: accessibleNotebookIds };
    }

    // Filter by tags if specified
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      searchQuery.tags = { $in: tagArray };
    }

    // Execute search with text score
    const pages = await Page.find(searchQuery, {
      score: { $meta: "textScore" },
    })
      .sort({ score: { $meta: "textScore" } })
      .limit(Number(limit))
      .populate("notebookId", "title");

    // Format results with excerpts
    const results = pages.map((page) => {
      const queryWords = q.toString().toLowerCase().split(/\s+/);

      // Find excerpt with highlighted text
      const contentLower = page.content.toLowerCase();
      let excerptStart = 0;

      for (const word of queryWords) {
        const index = contentLower.indexOf(word);
        if (index !== -1) {
          excerptStart = Math.max(0, index - 50);
          break;
        }
      }

      const excerpt = page.content
        .substring(excerptStart, excerptStart + 200)
        .trim();

      return {
        type: "page",
        id: page._id,
        title: page.title,
        notebookTitle: (page.notebookId as any)?.title,
        notebookId: page.notebookId,
        excerpt: excerpt + (excerpt.length < page.content.length ? "..." : ""),
        score: (page as any).score,
        lastModified: page.lastModified,
      };
    });

    res.json({
      success: true,
      data: results,
      total: results.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Search error",
    });
  }
});

// Search notebooks by title or tags
router.get("/notebooks", authenticate, async (req: AuthRequest, res) => {
  try {
    const { q, tags } = req.query;
    const userId = req.user!._id as mongoose.Types.ObjectId;

    if (!q && !tags) {
      res.status(400).json({
        success: false,
        error: "Search query or tags required",
      });
      return;
    }

    const query: any = {
      isDeleted: false,
      $or: [{ userId }, { "sharedWith.userId": userId }],
    };

    if (q && typeof q === "string") {
      query.title = { $regex: q, $options: "i" };
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagArray };
    }

    const notebooks = await Notebook.find(query).sort({ lastModified: -1 });

    const results = notebooks.map((nb) => {
      const isOwner = nb.userId.toString() === userId.toString();
      const share = nb.sharedWith.find(
        (s) => s.userId.toString() === userId.toString()
      );

      return {
        type: "notebook",
        id: nb._id,
        title: nb.title,
        description: nb.description,
        tags: nb.tags,
        isOwner,
        permission: isOwner ? "edit" : share?.permission,
        lastModified: nb.lastModified,
      };
    });

    res.json({
      success: true,
      data: results,
      total: results.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error searching notebooks",
    });
  }
});

export default router;
