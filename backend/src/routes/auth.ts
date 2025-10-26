import { Router } from "express";
import passport from "passport";
import { generateToken } from "../middleware/auth";
import { AuthRequest, authenticate } from "../middleware/auth";

const router = Router();

// Google OAuth login
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

// Google OAuth callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed`,
  }),
  (req, res) => {
    try {
      const user = req.user as any;

      // Generate JWT token
      const token = generateToken(user._id.toString());

      // Set cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Redirect to frontend with token in URL (as backup)
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Auth callback failed",
      });
    }
  }
);

// Get current user
router.get("/me", authenticate, (req: AuthRequest, res) => {
  try {
    const user = req.user!;

    res.json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        tutorialCompleted: user.tutorialCompleted,
        settings: user.settings,
        canvasState: user.canvasState,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error fetching user data",
    });
  }
});

// Logout
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

// Update user settings
router.patch("/settings", authenticate, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const { theme, defaultNotebook, displayName, tutorialCompleted } = req.body;

    if (theme) {
      user.settings.theme = theme;
    }
    if (defaultNotebook) {
      user.settings.defaultNotebook = defaultNotebook;
    }
    if (displayName) {
      user.displayName = displayName;
    }
    if (tutorialCompleted !== undefined) {
      user.tutorialCompleted = tutorialCompleted;
    }

    await user.save();

    res.json({
      success: true,
      data: {
        settings: user.settings,
        displayName: user.displayName,
        tutorialCompleted: user.tutorialCompleted,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error updating settings",
    });
  }
});

// Update canvas state
router.patch("/canvas-state", authenticate, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const {
      expandedPanels,
      currentNotebookId,
      currentPageId,
      lastAccessedPages,
      lastAccessedNotebook,
      canvasViewport,
      lastUsedTool,
    } = req.body;

    // Update expanded panels
    if (expandedPanels) {
      if (expandedPanels.sidebar !== undefined) {
        user.canvasState.expandedPanels.sidebar = expandedPanels.sidebar;
      }
      if (expandedPanels.pagesList !== undefined) {
        user.canvasState.expandedPanels.pagesList = expandedPanels.pagesList;
      }
      if (expandedPanels.toolbar !== undefined) {
        user.canvasState.expandedPanels.toolbar = expandedPanels.toolbar;
      }
    }

    // Update current notebook/page
    if (currentNotebookId !== undefined) {
      user.canvasState.currentNotebookId = currentNotebookId;
    }
    if (currentPageId !== undefined) {
      user.canvasState.currentPageId = currentPageId;
    }
    if (lastAccessedPages !== undefined) {
      user.canvasState.lastAccessedPages = lastAccessedPages;
    }
    if (lastAccessedNotebook !== undefined) {
      user.canvasState.lastAccessedNotebook = lastAccessedNotebook;
    }

    // Update canvas viewport
    if (canvasViewport) {
      if (canvasViewport.x !== undefined) {
        user.canvasState.canvasViewport.x = canvasViewport.x;
      }
      if (canvasViewport.y !== undefined) {
        user.canvasState.canvasViewport.y = canvasViewport.y;
      }
      if (canvasViewport.zoom !== undefined) {
        user.canvasState.canvasViewport.zoom = canvasViewport.zoom;
      }
    }

    // Update last used tool
    if (lastUsedTool !== undefined) {
      user.canvasState.lastUsedTool = lastUsedTool;
    }

    await user.save();

    res.json({
      success: true,
      data: {
        canvasState: user.canvasState,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error updating canvas state",
    });
  }
});

export default router;
