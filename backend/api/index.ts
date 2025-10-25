// Vercel serverless function entry point
import { connectDatabase } from "../src/config/database";
import app from "../src/index";

// Connect to database once when cold start
let isConnected = false;

const handler = async (req: any, res: any) => {
  // Connect to database if not already connected
  if (!isConnected) {
    await connectDatabase();
    isConnected = true;
  }

  // Handle the request
  return app(req, res);
};

export default handler;
