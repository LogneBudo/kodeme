# Vercel Environment Variables Setup

## 🔒 Security Update Complete

Firebase credentials have been moved to environment variables. Your `firebase.ts` file now loads configuration from `.env` file instead of hardcoded values.

---

## 📋 Exact Vercel Environment Variables

Add these **6 required Firebase variables** to your Vercel project (use your values from Firebase Console — placeholders shown below):

| Variable Name | Value | Source |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | `your_firebase_api_key_here` | From Firebase Console |
| `VITE_FIREBASE_AUTH_DOMAIN` | `your_project.firebaseapp.example.com` | From Firebase Console |
| `VITE_FIREBASE_PROJECT_ID` | `your_project_id_here` | From Firebase Console |
| `VITE_FIREBASE_STORAGE_BUCKET` | `your_project.appspot.com` | From Firebase Console |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `your_sender_id_here` | From Firebase Console |
| `VITE_FIREBASE_APP_ID` | `1:your_sender_id:web:your_app_id_here` | From Firebase Console |

---

## 🚀 How to Add Variables to Vercel

### Option 1: Via Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com)
2. Click on your project: **kodeme**
3. Navigate to **Settings** → **Environment Variables**
4. Add each variable from the table above:
   - Click **Add New** 
   - Enter the **Variable Name**
   - Enter the **Value**
   - Select scope: **Production, Preview, Development**
   - Click **Save**

### Option 2: Via Vercel CLI

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Add each environment variable
vercel env add VITE_FIREBASE_API_KEY
vercel env add VITE_FIREBASE_AUTH_DOMAIN
vercel env add VITE_FIREBASE_PROJECT_ID
vercel env add VITE_FIREBASE_STORAGE_BUCKET
vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID
vercel env add VITE_FIREBASE_APP_ID
```

### Option 3: Via JSON (Bulk Import)

Create a file named `vercel-env.json` (replace placeholders with your real values from Firebase Console):
```json
[
  {
    "key": "VITE_FIREBASE_API_KEY",
    "value": "your_firebase_api_key_here",
    "type": "encrypted"
  },
  {
    "key": "VITE_FIREBASE_AUTH_DOMAIN",
    "value": "your_project.firebaseapp.example.com",
    "type": "encrypted"
  },
  {
    "key": "VITE_FIREBASE_PROJECT_ID",
    "value": "your_project_id_here",
    "type": "encrypted"
  },
  {
    "key": "VITE_FIREBASE_STORAGE_BUCKET",
    "value": "your_project.appspot.com",
    "type": "encrypted"
  },
  {
    "key": "VITE_FIREBASE_MESSAGING_SENDER_ID",
    "value": "your_sender_id_here",
    "type": "encrypted"
  },
  {
    "key": "VITE_FIREBASE_APP_ID",
    "value": "1:your_sender_id:web:your_app_id_here",
    "type": "encrypted"
  }
]
```

---

## ✅ Verification Steps

After adding environment variables to Vercel:

1. **Deploy your project:**
   ```bash
   git add .
   git commit -m "🔒 Move Firebase credentials to environment variables"
   git push
   ```

2. **Check Vercel deployment:**
   - Go to [vercel.com](https://vercel.com) → Your Project
   - Wait for deployment to complete
   - Check the build logs for errors

3. **Test in production:**
   - Visit your deployed app
   - Try logging in or booking an appointment
   - Check browser console for any Firebase errors

4. **Local development:**
   - Your `.env` file already has Firebase credentials
   - Run `npm run dev` and verify everything works locally

---

## 📝 Files Changed

✅ **Modified:**
- `src/firebase.ts` - Now loads from environment variables with validation
- `.env` - Updated with Firebase credentials (for local development)
- `.env.example` - Updated with all required variables
- `.gitignore` - Added `.env` and `.env.local` to prevent accidental commits

---

## 🛡️ Security Improvements

- ✅ Firebase credentials no longer hardcoded in source
- ✅ `.env` files added to `.gitignore`
- ✅ Build-time validation ensures all required env vars exist
- ✅ Credentials are encrypted in Vercel dashboard
- ✅ Different env vars for development vs. production (optional)

---

## ⚠️ Important: Never Commit `.env`

Make sure `.env` file is **never** pushed to GitHub:

```bash
# Verify .env is ignored
git status

# If it shows .env, remove it from git
git rm --cached .env
git commit -m "Remove .env from tracking"
```

---

## 🔄 Optional: Multiple Environments

If you want different Firebase projects for dev/staging/production:

1. Create separate Firebase projects for each environment
2. In Vercel, use **Environment** dropdown when adding variables
3. Add different values for each environment:
   - **Production**: Your production Firebase project
   - **Preview**: Your staging Firebase project
   - **Development**: Your dev Firebase project

---

## ❓ Troubleshooting

### Error: "Missing required Firebase environment variables"

**Cause:** Environment variables not set in Vercel or Vite can't access them

**Solution:**
1. Verify variables are added to Vercel Settings → Environment Variables
2. Redeploy your project (Vercel sometimes needs a fresh build)
3. Check variable names match exactly (case-sensitive)
4. Variables must start with `VITE_` for Vite to expose them to the browser

### Build succeeds but app shows blank page

**Cause:** Firebase initialization failed due to missing env vars

**Solution:**
1. Check browser DevTools → Console for error messages
2. Look at Vercel deployment logs for missing variable warnings
3. Ensure all 6 Firebase variables are set

---

## 📚 References

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Firebase Console](https://console.firebase.google.com)

---

> Important: Never include real credentials in documentation or screenshots. Use placeholders and add secrets directly in Vercel.

**✨ Setup complete! Your Firebase credentials are now secure.** 🎉
