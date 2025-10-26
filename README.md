# Slate - Notebook Application

A modern, collaborative notebook application with real-time canvas drawing, mathematical graphs, and AI-powered features.

## 🏗️ Project Structure

This is a monorepo containing both frontend and backend:

```
slate/
├── frontend/          # React + Vite frontend
├── backend/           # Express + MongoDB backend
└── shared/            # Shared TypeScript types
```

## 🚀 Features

- **User Authentication**: Google OAuth integration
- **Notebooks & Pages**: Organize your work with notebooks and pages
- **Collaborative Editing**: Share notebooks with view/edit permissions
- **Rich Canvas**: Draw, add text boxes, and create mathematical graphs
- **Full-Text Search**: Search across all your content
- **Tags & Organization**: Organize with tags (e.g., CSE300-TuTh, CSE300-MoWe)
- **Trash & Restore**: Soft delete with 30-day retention
- **AI Integration**: (Coming soon) AI can fetch content from pages

## 📦 Setup Instructions

### Prerequisites

- Node.js 18+ and pnpm
- MongoDB Atlas account (free tier works great)
- Google OAuth credentials
- Vercel account (for deployment)

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd slate

# Install frontend dependencies
cd frontend
pnpm install

# Install backend dependencies
cd ../backend
pnpm install
```

### 2. MongoDB Setup

1. Create a free MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Create a database user with read/write permissions
4. Whitelist your IP (or allow all: 0.0.0.0/0 for development)
5. Get your connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure consent screen
6. Add authorized redirect URIs:
   - Development: `http://localhost:3001/api/auth/google/callback`
   - Production: `https://your-backend.vercel.app/api/auth/google/callback`
7. Save your Client ID and Client Secret

### 4. Backend Configuration

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your values:

```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/slate?retryWrites=true&w=majority

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Node Environment
NODE_ENV=development

# Server
PORT=3001
```

### 5. Frontend Configuration

```bash
cd frontend
```

Create `.env`:

```env
VITE_API_URL=http://localhost:3001
```

### 6. Run Development Servers

**Terminal 1 - Backend:**

```bash
cd backend
pnpm dev
```

**Terminal 2 - Frontend:**

```bash
cd frontend
pnpm dev
```

Visit http://localhost:5173 to see your app!

## 🌐 Deployment to Vercel

### Deploy Backend

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Add New" → "Project"
4. Import your repository
5. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: `backend`
   - **Build Command**: `pnpm run build`
   - **Output Directory**: `dist`
6. Add Environment Variables (from your `.env` file):
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_CALLBACK_URL` (use your production URL)
   - `FRONTEND_URL` (use your frontend production URL)
   - `NODE_ENV=production`
7. Deploy!
8. Copy your backend URL (e.g., `https://slate-backend.vercel.app`)

### Deploy Frontend

1. In Vercel Dashboard, click "Add New" → "Project"
2. Import the same repository
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `pnpm run build`
   - **Output Directory**: `dist`
4. Add Environment Variables:
   - `VITE_API_URL=https://your-backend.vercel.app` (from previous step)
5. Deploy!

### Update OAuth Redirect URLs

1. Go back to [Google Cloud Console](https://console.cloud.google.com/)
2. Update OAuth redirect URIs to include:
   - `https://your-backend.vercel.app/api/auth/google/callback`

### Update Backend Environment Variables

In your Vercel backend project settings, update:

- `GOOGLE_CALLBACK_URL=https://your-backend.vercel.app/api/auth/google/callback`
- `FRONTEND_URL=https://your-frontend.vercel.app`

Redeploy both projects after these changes.

## 🎯 Custom Domain Setup

### Frontend Custom Domain

1. In Vercel → Frontend Project → Settings → Domains
2. Add your custom domain (e.g., `slate.yourdomain.com`)
3. Follow Vercel's DNS instructions
4. Update `FRONTEND_URL` in backend environment variables

### Backend Custom Domain

1. In Vercel → Backend Project → Settings → Domains
2. Add your API subdomain (e.g., `api.yourdomain.com`)
3. Follow Vercel's DNS instructions
4. Update:
   - `VITE_API_URL` in frontend environment variables
   - `GOOGLE_CALLBACK_URL` in backend environment variables
   - Google OAuth redirect URIs in Google Cloud Console

## 📚 API Documentation

### Authentication

- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - OAuth callback
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout
- `PATCH /api/auth/settings` - Update user settings

### Notebooks

- `GET /api/notebooks` - Get all notebooks (owned + shared)
- `GET /api/notebooks/:id` - Get single notebook
- `POST /api/notebooks` - Create notebook
- `PATCH /api/notebooks/:id` - Update notebook
- `DELETE /api/notebooks/:id` - Soft delete notebook
- `POST /api/notebooks/:id/restore` - Restore from trash
- `POST /api/notebooks/:id/share` - Share notebook
- `DELETE /api/notebooks/:id/share/:userId` - Unshare notebook
- `GET /api/notebooks/tags/list` - Get all tags

### Pages

- `GET /api/pages/notebook/:notebookId` - Get pages in notebook
- `GET /api/pages/:id` - Get single page
- `POST /api/pages/notebook/:notebookId` - Create page
- `PATCH /api/pages/:id` - Update page
- `DELETE /api/pages/:id` - Soft delete page
- `POST /api/pages/:id/restore` - Restore from trash
- `GET /api/pages/recent/list` - Get recently accessed pages

### Search

- `GET /api/search?q=query` - Full-text search pages
- `GET /api/search/notebooks?q=query` - Search notebooks

### Trash

- `GET /api/trash` - Get all trash items
- `DELETE /api/trash/:id` - Permanently delete
- `DELETE /api/trash/empty/all` - Empty trash

## 🔧 Development

### Frontend Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Radix UI components
- Three.js (for 3D graphs)

### Backend Stack

- Node.js
- Express
- TypeScript
- MongoDB + Mongoose
- Passport.js (Google OAuth)
- JWT authentication

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

MIT License - feel free to use this project for your own purposes!

## 🐛 Troubleshooting

### MongoDB Connection Issues

- Check your IP whitelist in MongoDB Atlas
- Verify connection string is correct
- Ensure database user has proper permissions

### OAuth Issues

- Verify redirect URIs match exactly (including http/https)
- Check that Google+ API is enabled
- Ensure OAuth consent screen is configured

### CORS Errors

- Verify `FRONTEND_URL` in backend `.env` matches your frontend URL
- Check that credentials are included in API requests

### Vercel Deployment Issues

- Ensure all environment variables are set correctly
- Check build logs for errors
- Verify root directory is set correctly for each project

## 📧 Support

For issues and questions, please open an issue on GitHub.
