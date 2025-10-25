# ✅ Setup Checklist

Use this checklist to track your progress setting up Slate!

## 📦 Installation

- [ ] Install backend dependencies (`cd backend && pnpm install`)
- [ ] Install frontend dependencies (`cd frontend && pnpm install`)

## 🗄️ MongoDB Setup

- [ ] Create MongoDB Atlas account
- [ ] Create a free M0 cluster
- [ ] Create database user (username + password)
- [ ] Whitelist IP address (0.0.0.0/0 for development)
- [ ] Get connection string
- [ ] Test connection

## 🔐 Google OAuth Setup

- [ ] Create Google Cloud project
- [ ] Configure OAuth consent screen
- [ ] Create OAuth 2.0 Client ID
- [ ] Add redirect URI: `http://localhost:3001/api/auth/google/callback`
- [ ] Copy Client ID and Client Secret

## ⚙️ Configuration

### Backend

- [ ] Copy `backend/.env.example` to `backend/.env`
- [ ] Add MongoDB connection string to `MONGODB_URI`
- [ ] Generate and add `JWT_SECRET` (min 32 characters)
- [ ] Add Google `GOOGLE_CLIENT_ID`
- [ ] Add Google `GOOGLE_CLIENT_SECRET`
- [ ] Verify `GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback`
- [ ] Verify `FRONTEND_URL=http://localhost:5173`

### Frontend

- [ ] Create `frontend/.env`
- [ ] Add `VITE_API_URL=http://localhost:3001`

## 🚀 Local Testing

- [ ] Start backend (`cd backend && pnpm dev`)
- [ ] Verify MongoDB connection successful
- [ ] Start frontend (`cd frontend && pnpm dev`)
- [ ] Open http://localhost:5173
- [ ] Test Google login
- [ ] Create a test notebook
- [ ] Create a test page
- [ ] Test canvas features
- [ ] Test sharing (with another email)
- [ ] Test search
- [ ] Test trash and restore

## 🌐 Deployment (Optional)

### Preparation

- [ ] Push code to GitHub
- [ ] Verify all sensitive data is in `.env` (not hardcoded)

### Backend Deployment

- [ ] Create new Vercel project
- [ ] Set root directory to `backend`
- [ ] Add all environment variables
- [ ] Deploy backend
- [ ] Copy backend URL

### Frontend Deployment

- [ ] Create new Vercel project
- [ ] Set root directory to `frontend`
- [ ] Add `VITE_API_URL` with backend URL
- [ ] Deploy frontend
- [ ] Copy frontend URL

### Post-Deployment

- [ ] Update Google OAuth redirect URIs with production URLs
- [ ] Update backend `FRONTEND_URL` with production frontend URL
- [ ] Update backend `GOOGLE_CALLBACK_URL` with production callback URL
- [ ] Test production login
- [ ] Test all features in production

### Custom Domain (Optional)

- [ ] Add custom domain to frontend in Vercel
- [ ] Add custom API subdomain to backend in Vercel
- [ ] Update DNS records
- [ ] Update environment variables with custom domains
- [ ] Update Google OAuth redirect URIs
- [ ] Test with custom domains

## 🎉 Done!

Once all items are checked, your Slate application is fully set up!

---

**Having issues?** Check the SETUP_GUIDE.md troubleshooting section.
