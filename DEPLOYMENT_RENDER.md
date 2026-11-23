# ConsistAI — Render Deployment Guide

This guide walks you through deploying **ConsistAI** (React Frontend, Node.js Backend, and Python ML Service) onto [Render.com](https://render.com).

---

## Architecture Overview on Render

Using the included [`render.yaml`](./render.yaml), Render will automatically provision three synchronized free-tier services:

```
┌─────────────────────────────────────────────────────────────┐
│                       Render Cloud                          │
│                                                             │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │  consistai-frontend   │ ----> │   consistai-backend   │  │
│  │  (Static Site)        │       │   (Node.js Web Svc)   │  │
│  └───────────────────────┘       └───────────────────────┘  │
│                                              │              │
│                                              ▼              │
│                                  ┌───────────────────────┐  │
│                                  │     consistai-ml      │  │
│                                  │   (Python FastAPI)    │  │
│                                  └───────────────────────┘  │
└──────────────────────────────────────────────│──────────────┘
                                               │
                                               ▼
                                   ┌───────────────────────┐
                                   │  MongoDB Atlas (Free) │
                                   │  (Cloud Database)     │
                                   └───────────────────────┘
```

---

## Step 1: Set Up Free Cloud MongoDB Atlas

Render does not host MongoDB directly on the free tier, so we use a free MongoDB Atlas (M0) cluster:

1. Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. Create a **Free Shared Cluster (M0)**.
3. In **Database Access**: Create a database user (e.g., `consistai_admin`) and password.
4. In **Network Access**: Add IP Address `0.0.0.0/0` (Allow access from anywhere).
5. Click **Connect** -> **Drivers** (Node.js) and copy your connection string:
   ```
   mongodb+srv://consistai_admin:<password>@cluster0.xxxxx.mongodb.net/consistai?retryWrites=true&w=majority
   ```
   *(Replace `<password>` with your actual database user password).*

---

## Step 2: Push Repository to GitHub

If your code is not yet on GitHub:

```powershell
git init
git add .
git commit -m "feat: complete ConsistAI deployment configuration for Render"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```

---

## Step 3: Deploy via Render Blueprint (Recommended)

The repository includes a ready-to-use [`render.yaml`](./render.yaml) blueprint.

1. Log into your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** (top right) and select **Blueprint**.
3. Connect your GitHub repository.
4. Render will inspect `render.yaml` and display the 3 services:
   - `consistai-backend` (Node.js Web Service)
   - `consistai-frontend` (Static Site)
   - `consistai-ml` (Python FastAPI Web Service)
5. Under Environment Variables for `consistai-backend`, enter your **`MONGODB_URI`** from Step 1.
6. Click **Apply**.
7. Render will automatically build and deploy all 3 services!

---

## Step 4: Manual Deployment (Alternative to Blueprint)

If you prefer configuring each service manually on Render:

### Service 1: Python ML Microservice
- **Type**: Web Service
- **Name**: `consistai-ml`
- **Root Directory**: `ml-service`
- **Runtime**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Environment Variables**:
  - `ML_SERVICE_SECRET`: `consistai_ml_secure_secret_2026`

### Service 2: Backend API
- **Type**: Web Service
- **Name**: `consistai-backend`
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Health Check Path**: `/api/health`
- **Environment Variables**:
  - `NODE_ENV`: `production`
  - `MONGODB_URI`: `<Your MongoDB Atlas connection string>`
  - `JWT_SECRET`: `<Random 32+ character string>`
  - `ML_SERVICE_URL`: `<URL of consistai-ml service, e.g. https://consistai-ml.onrender.com>`
  - `ML_SERVICE_SECRET`: `consistai_ml_secure_secret_2026`
  - `CLIENT_URL`: `<URL of consistai-frontend, e.g. https://consistai-frontend.onrender.com>`

### Service 3: Frontend Web App
- **Type**: Static Site
- **Name**: `consistai-frontend`
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Redirects / Rewrites**:
  - `/*` -> `/index.html` (Rewrite)
- **Environment Variables**:
  - `VITE_API_URL`: `<URL of consistai-backend, e.g. https://consistai-backend.onrender.com>`

---

## Note on Local AI / Ollama on Render

- ConsistAI is built with a private-first local Ollama architecture (`qwen3.5:4b` running on device).
- Free-tier cloud hosts like Render do not provide GPUs or RAM to run 4-billion-parameter LLMs directly inside a 512MB free instance.
- **How AI works in cloud deployment:**
  1. The core application (Goals, Milestones, Tasks, Habits, Focus Timer, Calendar, Analytics 3.0, and ML Service) works **100% out of the box** without Ollama.
  2. To connect the AI assistant to your cloud deployment, you can expose your local Ollama server securely via a tunnel:
     ```powershell
     # Using ngrok to tunnel local Ollama port:
     ngrok http 11434
     ```
     Then set `OLLAMA_BASE_URL` in the Render backend environment variables to your ngrok URL (`https://xxxx.ngrok-free.app`).
  3. Alternatively, you can point `OLLAMA_BASE_URL` to any self-hosted cloud Ollama instance (RunPod, Lambda, AWS, or GCP).
