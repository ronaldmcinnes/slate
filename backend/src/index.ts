import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";
import dotenv from "dotenv";
import { connectDatabase } from "./config/database";
import { configurePassport } from "./config/passport";

// Import routes
import authRoutes from "./routes/auth";
import notebooksRoutes from "./routes/notebooks";
import pagesRoutes from "./routes/pages";
import searchRoutes from "./routes/search";
import trashRoutes from "./routes/trash";

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(passport.initialize());

// Configure Passport
configurePassport();

// Health check
app.get("/", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Slate API is running",
    version: "1.0.0",
  });
});

app.get("/health", (req: Request, res: Response) => {
  res.json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/notebooks", notebooksRoutes);
app.use("/api/pages", pagesRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/trash", trashRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal server error",
  });
});

// Start server (only if not in Vercel serverless environment)
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  const PORT = process.env.PORT || 3001;

  // Connect to database
  connectDatabase().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
    });
  });
}

// Export for Vercel serverless
export default app;
