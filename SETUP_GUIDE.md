# 🚀 Quick Setup Guide for Slate

Follow these steps to get your Slate application up and running!

## ✅ Step 1: Install Dependencies

```bash
# Backend
cd backend
pnpm install

# Frontend
cd ../frontend
pnpm install
```

## ✅ Step 2: MongoDB Setup (5 minutes)

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up for a free account
3. Create a new **FREE** cluster (M0 Sandbox)
4. Create a database user:
   - Click "Database Access" → "Add New Database User"
   - Username: `slate_user`
   - Password: (generate a strong password and save it!)
   - Database User Privileges: "Read and write to any database"
5. Whitelist your IP:
   - Click "Network Access" → "Add IP Address"
   - For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
   - For production: Add specific IPs
6. Get your connection string:
   - Click "Database" → "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your actual password
   - Replace `myFirstDatabase` with `slate`

Your connection string should look like:

```
mongodb+srv://slate_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/slate?retryWrites=true&w=majority
```

## ✅ Step 3: Google OAuth Setup (10 minutes)

1. Go to https://console.cloud.google.com/
2. Create a new project or select existing
3. In the left sidebar, click "APIs & Services" → "Credentials"
4. Click "Configure Consent Screen":
   - Choose "External"
   - App name: `Slate`
   - User support email: (your email)
   - Developer contact: (your email)
   - Click "Save and Continue" through all steps
5. Create OAuth credentials:
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - Name: `Slate App`
   - Authorized redirect URIs:
     - `http://localhost:3001/api/auth/google/callback`
   - Click "Create"
6. Copy your **Client ID** and **Client Secret** (you'll need these!)

## ✅ Step 4: Backend Configuration

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your actual values:

```env
# Replace with your MongoDB connection string from Step 2
MONGODB_URI=mongodb+srv://slate_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/slate?retryWrites=true&w=majority

# Generate a random secret (you can use: openssl rand -base64 32)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long

# Token expiration
JWT_EXPIRES_IN=7d

# Replace with your Google OAuth credentials from Step 3
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123xyz

# For local development
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
FRONTEND_URL=http://localhost:5173

# Development mode
NODE_ENV=development
PORT=3001
```

## ✅ Step 5: Frontend Configuration

```bash
cd frontend
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:3001
```

## ✅ Step 6: Run the Application

Open two terminal windows:

**Terminal 1 - Backend:**

```bash
cd backend
pnpm dev
```

You should see:

```
✅ MongoDB connected successfully
🚀 Server running on http://localhost:3001
```

**Terminal 2 - Frontend:**

```bash
cd frontend
pnpm dev
```

You should see:

```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

## ✅ Step 7: Test the Application

1. Open your browser to http://localhost:5173
2. Click "Sign in with Google"
3. Authorize the app
4. You should be redirected back and logged in!

## 🌐 Production Deployment

Once everything works locally, follow the deployment guide in the main README.md.

### Quick Checklist for Production:

- [ ] Push code to GitHub
- [ ] Deploy backend to Vercel
- [ ] Deploy frontend to Vercel
- [ ] Update Google OAuth redirect URIs with production URLs
- [ ] Update environment variables in Vercel
- [ ] (Optional) Add custom domains
- [ ] Test production deployment

## 🐛 Troubleshooting

### Backend won't start

- **Error: MONGODB_URI not defined**

  - Check that your `.env` file exists in the `backend/` folder
  - Verify the MongoDB connection string is correct

- **Error: MongoDB connection failed**
  - Check IP whitelist in MongoDB Atlas
  - Verify username and password are correct
  - Make sure you replaced `<password>` in the connection string

### OAuth doesn't work

- **Error: redirect_uri_mismatch**

  - Go to Google Cloud Console
  - Check that redirect URI is exactly: `http://localhost:3001/api/auth/google/callback`
  - No trailing slash!

- **Error: access_denied**
  - Make sure OAuth consent screen is configured
  - Try with a different Google account

### Frontend can't connect to backend

- **CORS errors**

  - Check that `FRONTEND_URL` in backend `.env` is `http://localhost:5173`
  - Restart the backend server after changing `.env`

- **Network errors**
  - Check that backend is running on port 3001
  - Check that `VITE_API_URL` in frontend `.env` is `http://localhost:3001`

## 📚 Next Steps

1. **Create your first notebook** - Test the basic functionality
2. **Try collaboration** - Share a notebook with another email
3. **Test the canvas** - Draw, add graphs, and text boxes
4. **Search** - Create multiple pages and test search
5. **Read the API docs** - See README.md for API endpoints

## 💡 Tips

- Use **Tags** to organize notebooks (e.g., `CSE300`, `TuTh`, `Fall2024`)
- **Share** notebooks with classmates for collaboration
- **Search** works across all your content - titles, text, even text in text boxes!
- Deleted items stay in **trash** for 30 days

## 🎉 You're All Set!

Enjoy using Slate! If you run into any issues, check the main README.md or open an issue on GitHub.

---

**Need help?** Open an issue or check the troubleshooting section above.
