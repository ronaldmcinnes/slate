# Slate Backend

Express.js + MongoDB backend API for the Slate notebook application.

## Quick Start

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Edit .env with your values
# Then start development server
pnpm dev
```

## Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm vercel-build` - Build for Vercel deployment

## Environment Variables

See `.env.example` for all required environment variables.

## Project Structure

```
backend/
├── src/
│   ├── config/          # Database and Passport configuration
│   ├── models/          # MongoDB Mongoose models
│   ├── routes/          # API route handlers
│   ├── middleware/      # Auth and permission middleware
│   └── index.ts         # Main Express app
├── api/
│   └── index.ts         # Vercel serverless entry point
└── vercel.jso  n          # Vercel deployment config
```

## MongoDB Schema

See the main README for complete schema documentation.

## API Endpoints

See the main README for API documentation.
