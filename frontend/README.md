# Slate Frontend

React + Vite frontend for the Slate notebook application.

## Quick Start

```bash
# Install dependencies
pnpm install

# Create .env file
echo "VITE_API_URL=http://localhost:3001" > .env

# Start development server
pnpm dev
```

## Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build

## Environment Variables

Create a `.env` file:

```env
VITE_API_URL=http://localhost:3001
```

For production, set this to your deployed backend URL.

## Project Structure

```
frontend/
├── src/
│   ├── components/      # React components
│   │   ├── canvas/      # Canvas-related components
│   │   ├── dialogs/     # Dialog components
│   │   ├── layout/      # Layout components
│   │   ├── menus/       # Menu components
│   │   └── ui/          # UI primitives (Radix)
│   ├── lib/             # Utilities and API client
│   ├── types/           # TypeScript types
│   ├── App.tsx          # Main app component
│   └── main.tsx         # Entry point
└── public/              # Static assets
```

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Radix UI
- Three.js

## Using the API Client

```typescript
import { api } from "./lib/api";

// Get notebooks
const { owned, shared } = await api.getNotebooks();

// Create page
const page = await api.createPage(notebookId, {
  title: "My Page",
  content: "Hello world",
});

// Search
const results = await api.search({
  query: "machine learning",
  limit: 20,
});
```

## Authentication

The app uses Google OAuth. Users are redirected to:

1. `/api/auth/google` - Initiates OAuth flow
2. `/auth/callback` - Handles OAuth callback and saves token
3. Token is stored in localStorage and sent with all API requests
