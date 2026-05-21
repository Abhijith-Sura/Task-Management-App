# 🌌 Zenith Task Manager

Zenith is a premium, high-performance task management application built using the MERN stack, refined with dynamic glassmorphic styles, real-time collaboration via WebSockets, and secure dynamic CORS policies.

---

## 📂 Project Architecture

```
├── client/          # Premium React SPA (built with Vite, HSL-tailored colors, dynamic themes)
├── backend/         # Express server, Socket.io core orchestration, MongoDB data pipelines
├── render.yaml      # Automated Infrastructure-as-Code (IaC) blueprint for Render
└── .gitignore       # Global ignored patterns (securing environment configs and credentials)
```

---

## ⚡ Deployment Playbook

This repository is optimized for **Continuous Integration & Continuous Deployment (CI/CD)**. When you link your GitHub repository to Vercel and Render, every commit pushed to the `main` branch will trigger an automated build and zero-downtime deployment.

### 🎨 1. Frontend (Vercel)

Vercel hosts the premium single-page client app.

1. Go to **Vercel** and import this repository.
2. Set the **Root Directory** to `client/`.
3. Set the following environment variables:
   - `VITE_API_URL`: `https://your-backend.onrender.com/api`
   - `VITE_SOCKET_URL`: `https://your-backend.onrender.com`
4. Click **Deploy**. Vercel will host your client and provide a unique URL (e.g. `https://your-app.vercel.app`).

### ⚙️ 2. Backend (Render)

Render hosts the Node/Express server and active WebSocket connections.

We have included a **Render Blueprint** (`render.yaml`). This allows a one-click deployment:

1. Go to your **Render Dashboard**, click **New +**, and select **Blueprint**.
2. Connect this GitHub repository.
3. Render will parse `render.yaml` and auto-configure the service type, build instructions, start scripts, and port variables.
4. Input the following secure environment variables in the dashboard:
   - `MONGO_URI`: *Your secure MongoDB Atlas URI*
   - `JWT_SECRET`: *Your JWT authorization secret*
   - `FRONTEND_URL`: *The URL of your deployed Vercel frontend (e.g. `https://your-app.vercel.app`)*
5. Click **Apply**. Render will deploy your secure dynamic backend.
