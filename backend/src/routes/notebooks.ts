import { Router } from "express";
import { AuthRequest, authenticate } from "../middleware/auth";
import { checkNotebookAccess } from "../middleware/permissions";
import Notebook from "../models/Notebook";
import Page from "../models/Page";
import User from "../models/User";
import Trash from "../models/Trash";
import Activity from "../models/Activity";

const router = Router();

// Get all notebooks (owned + shared)
router.get("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;

    // Get owned notebooks
    const ownedNotebooks = await Notebook.find({
      userId,
      isDeleted: false,
    }).sort({ order: 1, lastModified: -1 });

    // Get shared notebooks
    const sharedNotebooks = await Notebook.find({
      "sharedWith.userId": userId,
      isDeleted: false,
    })
      .populate("userId", "displayName email")
      .sort({ lastModified: -1 });

    // Format response
    const formattedOwned = ownedNotebooks.map((nb) => ({
      ...nb.toObject(),
      id: nb._id,
      isOwner: true,
      permission: "edit" as const,
    }));

    const formattedShared = sharedNotebooks.map((nb) => {
      const share = nb.sharedWith.find(
        (s) => s.userId.toString() === userId.toString()
      );
      return {
        ...nb.toObject(),
        id: nb._id,
        isOwner: false,
        permission: share?.permission,
      };
    });

    res.json({
      success: true,
      data: {
        owned: formattedOwned,
        shared: formattedShared,
      },
    });
  } catch (error) {
    console.error("Error fetching notebooks:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching notebooks",
    });
  }
});

// Get single notebook
router.get(
  "/:id",
  authenticate,
  checkNotebookAccess("view"),
  async (req: AuthRequest, res) => {
    try {
      const notebook = await Notebook.findById(req.params.id);

      const userId = req.user!._id;
      const isOwner = notebook!.userId.toString() === userId.toString();
      const share = notebook!.sharedWith.find(
        (s) => s.userId.toString() === userId.toString()
      );

      res.json({
        success: true,
        data: {
          ...notebook!.toObject(),
          id: notebook!._id,
          isOwner,
          permission: isOwner ? "edit" : share?.permission,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Error fetching notebook",
      });
    }
  }
);

// Create notebook
router.post("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;
    const { title, description, tags, color, icon } = req.body;

    if (!title || title.trim() === "") {
      res.status(400).json({
        success: false,
        error: "Title is required",
      });
      return;
    }

    // Get max order
    const maxOrderNotebook = await Notebook.findOne({ userId }).sort({
      order: -1,
    });
    const order = maxOrderNotebook ? maxOrderNotebook.order + 1 : 0;

    const notebook = await Notebook.create({
      userId,
      title: title.trim(),
      description,
      tags: tags || [],
      color,
      icon,
      order,
    });

    // Log activity
    await Activity.create({
      userId,
      action: "create",
      targetType: "notebook",
      targetId: notebook._id,
    });

    res.status(201).json({
      success: true,
      data: {
        ...notebook.toObject(),
        id: notebook._id,
        isOwner: true,
        permission: "edit",
      },
    });
  } catch (error) {
    console.error("Error creating notebook:", error);
    res.status(500).json({
      success: false,
      error: "Error creating notebook",
    });
  }
});

// Update notebook
router.patch(
  "/:id",
  authenticate,
  checkNotebookAccess("edit"),
  async (req: AuthRequest, res) => {
    try {
      const { title, description, tags, color, icon, order } = req.body;
      const notebook = await Notebook.findById(req.params.id);

      if (!notebook) {
        res.status(404).json({
          success: false,
          error: "Notebook not found",
        });
        return;
      }

      if (title !== undefined) notebook.title = title.trim();
      if (description !== undefined) notebook.description = description;
      if (tags !== undefined) notebook.tags = tags;
      if (color !== undefined) notebook.color = color;
      if (icon !== undefined) notebook.icon = icon;
      if (order !== undefined) notebook.order = order;

      await notebook.save();

      // Log activity
      await Activity.create({
        userId: req.user!._id,
        action: "update",
        targetType: "notebook",
        targetId: notebook._id,
        changes: req.body,
      });

      res.json({
        success: true,
        data: {
          ...notebook.toObject(),
          id: notebook._id,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Error updating notebook",
      });
    }
  }
);

// Soft delete notebook
router.delete(
  "/:id",
  authenticate,
  checkNotebookAccess("edit"),
  async (req: AuthRequest, res) => {
    try {
      const notebook = await Notebook.findById(req.params.id);

      if (!notebook) {
        res.status(404).json({
          success: false,
          error: "Notebook not found",
        });
        return;
      }

      // Only owner can delete
      if (notebook.userId.toString() !== req.user!._id.toString()) {
        res.status(403).json({
          success: false,
          error: "Only owner can delete notebook",
        });
        return;
      }

      // Soft delete notebook
      notebook.isDeleted = true;
      notebook.deletedAt = new Date();
      await notebook.save();

      // Soft delete all pages
      await Page.updateMany(
        { notebookId: notebook._id },
        { isDeleted: true, deletedAt: new Date(), deletedBy: req.user!._id }
      );

      // Add to trash
      await Trash.create({
        userId: req.user!._id,
        itemType: "notebook",
        itemId: notebook._id,
        originalData: notebook.toObject(),
      });

      // Log activity
      await Activity.create({
        userId: req.user!._id,
        action: "delete",
        targetType: "notebook",
        targetId: notebook._id,
      });

      res.json({
        success: true,
        message: "Notebook moved to trash",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Error deleting notebook",
      });
    }
  }
);

// Restore notebook from trash
router.post("/:id/restore", authenticate, async (req: AuthRequest, res) => {
  try {
    const notebook = await Notebook.findOne({
      _id: req.params.id,
      userId: req.user!._id,
      isDeleted: true,
    });

    if (!notebook) {
      res.status(404).json({
        success: false,
        error: "Notebook not found in trash",
      });
      return;
    }

    notebook.isDeleted = false;
    notebook.deletedAt = undefined;
    await notebook.save();

    // Restore pages
    await Page.updateMany(
      { notebookId: notebook._id },
      { $unset: { deletedAt: "", deletedBy: "" }, isDeleted: false }
    );

    // Remove from trash
    await Trash.deleteOne({
      itemType: "notebook",
      itemId: notebook._id,
    });

    // Log activity
    await Activity.create({
      userId: req.user!._id,
      action: "restore",
      targetType: "notebook",
      targetId: notebook._id,
    });

    res.json({
      success: true,
      data: {
        ...notebook.toObject(),
        id: notebook._id,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error restoring notebook",
    });
  }
});

// Share notebook
router.post(
  "/:id/share",
  authenticate,
  checkNotebookAccess("edit"),
  async (req: AuthRequest, res) => {
    try {
      const { email, permission } = req.body;
      const notebook = await Notebook.findById(req.params.id);

      if (!notebook) {
        res.status(404).json({
          success: false,
          error: "Notebook not found",
        });
        return;
      }

      // Only owner can share
      if (notebook.userId.toString() !== req.user!._id.toString()) {
        res.status(403).json({
          success: false,
          error: "Only owner can share notebook",
        });
        return;
      }

      // Find user to share with
      const userToShare = await User.findOne({ email: email.toLowerCase() });

      if (!userToShare) {
        res.status(404).json({
          success: false,
          error: "User not found",
        });
        return;
      }

      // Check if already shared
      const existingShare = notebook.sharedWith.find(
        (s) => s.userId.toString() === userToShare._id.toString()
      );

      if (existingShare) {
        // Update permission
        existingShare.permission = permission;
      } else {
        // Add new share
        notebook.sharedWith.push({
          userId: userToShare._id,
          permission,
          sharedAt: new Date(),
          sharedBy: req.user!._id,
        });
      }

      await notebook.save();

      // Log activity
      await Activity.create({
        userId: req.user!._id,
        action: "share",
        targetType: "notebook",
        targetId: notebook._id,
        collaboratorId: userToShare._id,
      });

      res.json({
        success: true,
        message: "Notebook shared successfully",
        data: {
          userId: userToShare._id,
          email: userToShare.email,
          displayName: userToShare.displayName,
          permission,
        },
      });
    } catch (error) {
      console.error("Error sharing notebook:", error);
      res.status(500).json({
        success: false,
        error: "Error sharing notebook",
      });
    }
  }
);

// Unshare notebook
router.delete(
  "/:id/share/:userId",
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      const notebook = await Notebook.findById(req.params.id);

      if (!notebook) {
        res.status(404).json({
          success: false,
          error: "Notebook not found",
        });
        return;
      }

      // Only owner can unshare
      if (notebook.userId.toString() !== req.user!._id.toString()) {
        res.status(403).json({
          success: false,
          error: "Only owner can unshare notebook",
        });
        return;
      }

      notebook.sharedWith = notebook.sharedWith.filter(
        (s) => s.userId.toString() !== req.params.userId
      );

      await notebook.save();

      // Log activity
      await Activity.create({
        userId: req.user!._id,
        action: "unshare",
        targetType: "notebook",
        targetId: notebook._id,
        collaboratorId: req.params.userId,
      });

      res.json({
        success: true,
        message: "User removed from notebook",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Error unsharing notebook",
      });
    }
  }
);

// Get all unique tags
router.get("/tags/list", authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;

    const notebooks = await Notebook.find({
      userId,
      isDeleted: false,
    });

    const tags = new Set<string>();
    notebooks.forEach((nb) => {
      nb.tags.forEach((tag) => tags.add(tag));
    });

    res.json({
      success: true,
      data: Array.from(tags).sort(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error fetching tags",
    });
  }
});

export default router;
