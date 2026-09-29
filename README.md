# MatriEntry Workspace

A matrimonial data entry, operator assignment, and administration platform structured into separate **Frontend** and **Backend** directories for independent deployment.

---

## Directory Structure

```text
Mt Latest/
├── frontend/                     # React + Vite + Tailwind frontend
│   ├── src/                      # Components, pages, services, types
│   ├── public/                   # Static assets & _redirects for Netlify/Cloudflare
│   ├── index.html                # HTML entry point
│   ├── package.json              # Frontend dependencies & scripts
│   ├── vite.config.ts            # Vite config with local dev API proxy
│   ├── tsconfig.json             # TypeScript configuration
│   ├── vercel.json               # SPA routing rewrite rules for Vercel
│   └── .env.example              # VITE_API_URL configuration
│
├── backend/                      # Node.js + Express + Supabase backend
│   ├── server.mjs                # Standalone Express server with CORS & health check
│   ├── server/                   # API router, security (scrypt), email templates
│   ├── scripts/                  # Admin bootstrap CLI (scripts/bootstrap-admin.mjs)
│   ├── supabase/                 # SQL migrations & RLS configs
│   ├── tests/                    # Backend unit & integration test suite
│   ├── package.json              # Backend dependencies & scripts
│   └── .env.example              # Server environment variables
│
└── package.json                  # Root convenience scripts to manage both
```

---

## Quick Start (Local Development)

### 1. Backend Setup
1. Open a terminal in `backend/`:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   ```
2. Fill in `.env` with your Supabase and Resend credentials:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `FRONTEND_URL=http://localhost:5173`
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
3. Start the backend:
   ```bash
   npm run dev
   ```
   The backend API will start on `http://localhost:3000`.

### 2. Frontend Setup
1. Open a separate terminal in `frontend/`:
   ```bash
   cd frontend
   npm install
   ```
2. Start the frontend:
   ```bash
   npm run dev
   ```
   The Vite dev server will start on `http://localhost:5173`.
   *(All `/api/*` calls from the browser are automatically proxied to `http://localhost:3000` via `vite.config.ts`)*.

---

## Deployment Guide (Separate Hosting)

### 1. Deploying the Backend (e.g. Render, Railway, Fly.io, Heroku, or VPS)
1. **Root Directory for Backend:** Select `backend` (or deploy from the `backend/` folder).
2. **Build Command:** `npm install`
3. **Start Command:** `npm start` (runs `node server.mjs`)
4. **Environment Variables:**
   - `PORT`: Set by hosting platform or `3000`
   - `NODE_ENV`: `production`
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your private Supabase service role key
   - `FRONTEND_URL`: The deployed URL of your frontend (e.g. `https://matrientry.vercel.app`)
   - `COOKIE_SAMESITE`: Set to `none` if frontend and backend are hosted on different domains (e.g. `.vercel.app` and `.onrender.com`).
   - `RESEND_API_KEY`: Your Resend API key
   - `RESEND_FROM_EMAIL`: Verified sender email in Resend
5. **Verify:** Navigate to `https://your-backend.onrender.com/`. It will return a 200 OK JSON status response (`{"status":"online", ...}`).

### 2. Deploying the Frontend (e.g. Vercel, Netlify, Cloudflare Pages)
1. **Root Directory for Frontend:** Select `frontend` (or deploy from the `frontend/` folder).
2. **Framework Preset:** Vite
3. **Build Command:** `npm run build`
4. **Output Directory:** `dist`
5. **Environment Variables:**
   - `VITE_API_URL`: The URL of your deployed backend (e.g. `https://your-backend.onrender.com`)
6. **Routing Configuration:**
   - For **Vercel**: Handled automatically via `frontend/vercel.json`.
   - For **Netlify / Cloudflare Pages**: Handled automatically via `frontend/public/_redirects`.

---

## Initial Admin Bootstrap

To create or reset the first administrator profile:
```bash
cd backend
npm run admin:bootstrap -- --name "Admin Name" --email admin@example.com --username admin_name
```
Temporary login credentials will be emailed to `admin@example.com` via Resend with a link pointing to `FRONTEND_URL`.

---

## Testing

Run the test suite inside `backend/`:
```bash
cd backend
npm test
```
