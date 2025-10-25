import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
import Notebook from "../models/Notebook";
import Page from "../models/Page";
import mongoose from "mongoose";

// Check if user owns or has access to a notebook
export const checkNotebookAccess = (requiredPermission: "view" | "edit") => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const notebookId = req.params.notebookId || req.params.id;
      const userId = req.user!._id as mongoose.Types.ObjectId;

      if (!mongoose.Types.ObjectId.isValid(notebookId)) {
        res.status(400).json({
          success: false,
          error: "Invalid notebook ID",
        });
        return;
      }

      const notebook = await Notebook.findOne({
        _id: notebookId,
        isDeleted: false,
      });

      if (!notebook) {
        res.status(404).json({
          success: false,
          error: "Notebook not found",
        });
        return;
      }

      // Check if user is owner
      if (notebook.userId.toString() === userId.toString()) {
        next();
        return;
      }

      // Check if user has shared access
      const sharedAccess = notebook.sharedWith.find(
        (share) => share.userId.toString() === userId.toString()
      );

      if (!sharedAccess) {
        res.status(403).json({
          success: false,
          error: "Access denied",
        });
        return;
      }

      // Check permission level
      if (requiredPermission === "edit" && sharedAccess.permission !== "edit") {
        res.status(403).json({
          success: false,
          error: "Edit permission required",
        });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Error checking notebook access",
      });
    }
  };
};

// Check if user owns or has access to a page
export const checkPageAccess = (requiredPermission: "view" | "edit") => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const pageId = req.params.pageId || req.params.id;
      const userId = req.user!._id as mongoose.Types.ObjectId;

      if (!mongoose.Types.ObjectId.isValid(pageId)) {
        res.status(400).json({
          success: false,
          error: "Invalid page ID",
        });
        return;
      }

      const page = await Page.findOne({
        _id: pageId,
        isDeleted: false,
      });

      if (!page) {
        res.status(404).json({
          success: false,
          error: "Page not found",
        });
        return;
      }

      // Get the notebook to check permissions
      const notebook = await Notebook.findById(page.notebookId);

      if (!notebook) {
        res.status(404).json({
          success: false,
          error: "Parent notebook not found",
        });
        return;
      }

      // Check if user is owner
      if (notebook.userId.toString() === userId.toString()) {
        next();
        return;
      }

      // Check if user has shared access
      const sharedAccess = notebook.sharedWith.find(
        (share) => share.userId.toString() === userId.toString()
      );

      if (!sharedAccess) {
        res.status(403).json({
          success: false,
          error: "Access denied",
        });
        return;
      }

      // Check permission level
      if (requiredPermission === "edit" && sharedAccess.permission !== "edit") {
        res.status(403).json({
          success: false,
          error: "Edit permission required",
        });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Error checking page access",
      });
    }
  };
};
