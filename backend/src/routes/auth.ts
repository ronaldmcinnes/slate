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
      console.error("Auth callback error:", error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=callback_failed`);
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
        settings: user.settings,
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
    const { theme, defaultNotebook } = req.body;

    if (theme) {
      user.settings.theme = theme;
    }
    if (defaultNotebook) {
      user.settings.defaultNotebook = defaultNotebook;
    }

    await user.save();

    res.json({
      success: true,
      data: user.settings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error updating settings",
    });
  }
});

export default router;
