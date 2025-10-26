import { Router } from "express";
import mongoose from "mongoose";
import { AuthRequest, authenticate } from "../middleware/auth";
import User from "../models/User";
import Notebook from "../models/Notebook";
import Page from "../models/Page";

const router = Router();

// Get user with all notebooks and their pages (aggregation)
router.get("/user/full", authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;

    // Aggregate user with notebooks and pages
    const result = await User.aggregate([
      // Match the current user
      {
        $match: { _id: userId },
      },
      // Lookup owned notebooks
      {
        $lookup: {
          from: "notebooks",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$userId", "$$userId"] },
                    { $eq: ["$isDeleted", false] },
                  ],
                },
              },
            },
            // Lookup pages for each notebook
            {
              $lookup: {
                from: "pages",
                let: { notebookId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$notebookId", "$$notebookId"] },
                          { $eq: ["$isDeleted", false] },
                        ],
                      },
                    },
                  },
                  { $sort: { order: 1, createdAt: 1 } },
                ],
                as: "pages",
              },
            },
            { $sort: { order: 1, lastModified: -1 } },
          ],
          as: "ownedNotebooks",
        },
      },
      // Lookup shared notebooks
      {
        $lookup: {
          from: "notebooks",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ["$$userId", "$sharedWith.userId"] },
                    { $eq: ["$isDeleted", false] },
                  ],
                },
              },
            },
            // Lookup pages for each shared notebook
            {
              $lookup: {
                from: "pages",
                let: { notebookId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$notebookId", "$$notebookId"] },
                          { $eq: ["$isDeleted", false] },
                        ],
                      },
                    },
                  },
                  { $sort: { order: 1, createdAt: 1 } },
                ],
                as: "pages",
              },
            },
            { $sort: { lastModified: -1 } },
          ],
          as: "sharedNotebooks",
        },
      },
      // Project the final structure
      {
        $project: {
          _id: 1,
          email: 1,
          displayName: 1,
          profilePicture: 1,
          createdAt: 1,
          lastLogin: 1,
          tutorialCompleted: 1,
          settings: 1,
          ownedNotebooks: {
            $map: {
              input: "$ownedNotebooks",
              as: "notebook",
              in: {
                id: "$$notebook._id",
                userId: "$$notebook.userId",
                title: "$$notebook.title",
                description: "$$notebook.description",
                createdAt: "$$notebook.createdAt",
                lastModified: "$$notebook.lastModified",
                order: "$$notebook.order",
                color: "$$notebook.color",
                icon: "$$notebook.icon",
                tags: "$$notebook.tags",
                sharedWith: "$$notebook.sharedWith",
                isOwner: true,
                permission: "edit",
                pages: {
                  $map: {
                    input: "$$notebook.pages",
                    as: "page",
                    in: {
                      id: "$$page._id",
                      notebookId: "$$page.notebookId",
                      userId: "$$page.userId",
                      title: "$$page.title",
                      createdAt: "$$page.createdAt",
                      lastModified: "$$page.lastModified",
                      lastModifiedBy: "$$page.lastModifiedBy",
                      order: "$$page.order",
                      content: "$$page.content",
                      drawings: "$$page.drawings",
                      graphs: "$$page.graphs",
                      textBoxes: "$$page.textBoxes",
                      tags: "$$page.tags",
                    },
                  },
                },
              },
            },
          },
          sharedNotebooks: {
            $map: {
              input: "$sharedNotebooks",
              as: "notebook",
              in: {
                id: "$$notebook._id",
                userId: "$$notebook.userId",
                title: "$$notebook.title",
                description: "$$notebook.description",
                createdAt: "$$notebook.createdAt",
                lastModified: "$$notebook.lastModified",
                order: "$$notebook.order",
                color: "$$notebook.color",
                icon: "$$notebook.icon",
                tags: "$$notebook.tags",
                sharedWith: "$$notebook.sharedWith",
                isOwner: false,
                permission: {
                  $let: {
                    vars: {
                      share: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$$notebook.sharedWith",
                              as: "share",
                              cond: { $eq: ["$$share.userId", userId] },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    in: "$$share.permission",
                  },
                },
                pages: {
                  $map: {
                    input: "$$notebook.pages",
                    as: "page",
                    in: {
                      id: "$$page._id",
                      notebookId: "$$page.notebookId",
                      userId: "$$page.userId",
                      title: "$$page.title",
                      createdAt: "$$page.createdAt",
                      lastModified: "$$page.lastModified",
                      lastModifiedBy: "$$page.lastModifiedBy",
                      order: "$$page.order",
                      content: "$$page.content",
                      drawings: "$$page.drawings",
                      graphs: "$$page.graphs",
                      textBoxes: "$$page.textBoxes",
                      tags: "$$page.tags",
                    },
                  },
                },
              },
            },
          },
        },
      },
    ]);

    if (result.length === 0) {
      res.status(404).json({
        success: false,
        error: "User not found",
      });
      return;
    }

    res.json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error fetching aggregated user data",
    });
  }
});

// Get statistics for user's notebooks and pages
router.get("/stats", authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;

    const stats = await User.aggregate([
      { $match: { _id: userId } },
      {
        $lookup: {
          from: "notebooks",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$userId", "$$userId"] },
                    { $eq: ["$isDeleted", false] },
                  ],
                },
              },
            },
          ],
          as: "notebooks",
        },
      },
      {
        $lookup: {
          from: "pages",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$userId", "$$userId"] },
                    { $eq: ["$isDeleted", false] },
                  ],
                },
              },
            },
          ],
          as: "pages",
        },
      },
      {
        $project: {
          totalNotebooks: { $size: "$notebooks" },
          totalPages: { $size: "$pages" },
          totalWordCount: { $sum: "$pages.wordCount" },
          lastModified: { $max: "$pages.lastModified" },
        },
      },
    ]);

    res.json({
      success: true,
      data: stats[0] || {
        totalNotebooks: 0,
        totalPages: 0,
        totalWordCount: 0,
        lastModified: null,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error fetching statistics",
    });
  }
});

export default router;
