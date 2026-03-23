# Salma

Interactive 3D experience built with **Vite**, **React**, **React Three Fiber**, and **Three.js**.

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview   # test production build locally
```

## Deploy on Vercel

1. Push this repo to GitHub (see commands below if you haven’t yet).
2. Go to [vercel.com](https://vercel.com) and sign in (GitHub is easiest).
3. **Add New Project** → **Import** the `Khalid-tk/Salma` repository.
4. Vercel will auto-detect **Vite**:
   - **Framework Preset:** Vite  
   - **Build Command:** `npm run build`  
   - **Output Directory:** `dist`  
   - **Install Command:** `npm install`
5. Click **Deploy**. After a minute you’ll get a URL like `salma-xxx.vercel.app`.
6. Optional: **Project → Settings → Domains** to add a custom domain.

No extra `vercel.json` is required for this single-page app; static files from `dist/` are served correctly.

### Environment variables

This project doesn’t require env vars for the default build. If you add API keys later, set them under **Project → Settings → Environment Variables** in Vercel.
