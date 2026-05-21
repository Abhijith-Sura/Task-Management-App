# 🌌 Zenith Task Manager — MERN & WebSockets Workspace

Welcome to **Zenith Task Manager**, a premium, high-performance workspace and task-management application built using the MERN (MongoDB, Express, React, Node.js) stack.

Zenith is refined with dynamic glassmorphic styles, real-time collaboration via WebSockets, security-hardened dynamic CORS policies, transactional OTP verification, and contextual AI integrations (autogenerating task checklists and summarizing comment threads).

---

## 🌟 Core Pillars

1.  **High-Fidelity UI/UX**: Built with HSL-tailored colors, dynamic themes, backdrop blurs, and micro-animations via React 19, Tailwind CSS 4, and Framer Motion.
2.  **Real-Time Sync**: Instant board state updates and live user presence indicators (see who is looking at what card) powered by Socket.io.
3.  **Contextual AI Autopilot**: Automated checklist generation and discussion summaries utilizing Google Gemini, Groq (Llama-3), or xAI Grok.
4.  **Bulletproof Delivery**: Email verification gated by OTP codes sent reliably from cloud containers using the Brevo HTTP API.
5.  **Clean Architecture**: A clean separation of concerns between the React SPA client and the Express backend orchestrator.

---

## 📂 Project Structure

```
Task-Management-App/
├── client/              # Premium React SPA (React 19, Vite, Tailwind CSS 4)
│   ├── src/             # Frontend source code (Features, Layouts, Services)
│   ├── vercel.json      # Client production router configurations
│   └── README.md        # Frontend-specific documentation
│
├── backend/             # Express API Server & WebSockets Core
│   ├── routes/          # REST Endpoint definitions
│   ├── sockets/         # WebSocket presence and drag-drop updates
│   ├── utils/           # Brevo email adapters and global API responses
│   └── README.md        # Backend-specific documentation
│
├── render.yaml          # Infrastructure as Code (IaC) blueprint for Render
└── README.md            # Overall project documentation (this file)
```

---

## 🚀 Unified Local Development Quickstart

To run the entire application locally, you can start both the client and the backend servers.

### Prerequisites
*   Node.js (v18.x or higher)
*   MongoDB Instance (Local database or MongoDB Atlas cloud URL)
*   Email Gateway (Brevo API key for signup emails)
*   AI integration (Optional: Gemini, Groq, or Grok API keys for AI checklist features)

### Setup Configurations

1.  **Configure the Backend**:
    *   Navigate to the `backend/` directory.
    *   Create a `.env` file from the variables described in the [Backend Env Config Guide](backend/README.md#env-variables-config).
    
2.  **Configure the Client**:
    *   Navigate to the `client/` directory.
    *   Create a `.env` file specifying backend endpoint references:
        ```env
        VITE_API_URL=http://localhost:5000/api
        VITE_SOCKET_URL=http://localhost:5000
        ```

### Starting the Servers

Open two terminal windows:

*   **Terminal 1 (Backend Server)**:
    ```bash
    cd backend
    npm install
    npm run dev
    ```
*   **Terminal 2 (Client Dev Server)**:
    ```bash
    cd client
    npm install
    npm run dev
    ```

Once running, navigate to `http://localhost:5173` to explore Zenith Task Manager.

---

## ⚡ Production Deployment Blueprint

This project is optimized for **Continuous Integration & Continuous Deployment (CI/CD)** via GitHub.

### 🎨 Frontend Deployment (Vercel)
Vercel is recommended for hosting the client static bundle:
1.  Import your GitHub repository into Vercel.
2.  Set the **Root Directory** to `client/`.
3.  Configure the following environment variables:
    *   `VITE_API_URL`: `https://your-backend.onrender.com/api`
    *   `VITE_SOCKET_URL`: `https://your-backend.onrender.com`
4.  Click **Deploy**.

### ⚙️ Backend Deployment (Render Blueprint)
We have included a **Render Blueprint** (`render.yaml`). This enables one-click infrastructure setup:
1.  Go to your **Render Dashboard**, click **New +**, and select **Blueprint**.
2.  Connect your GitHub repository.
3.  Render will parse `render.yaml` and configure the build/start pipelines.
4.  Configure the secure environment variables:
    *   `MONGO_URI`, `JWT_SECRET`, `FRONTEND_URL` (your vercel url)
    *   `BREVO_API_KEY`, `BREVO_FROM_EMAIL` (for verified email sends)
    *   Optional: `GEMINI_API_KEY`, `GROQ_API_KEY`, or `GROK_API_KEY`
5.  Click **Apply**.

---

## 🔒 Security Architectures
*   **CORS Safeguards**: Secure, dynamic CORS middleware trusting only whitelist patterns (like your production Vercel address) prevents cross-site script injections.
*   **Authentication Gates**: Sessions are protected by cryptographic JWT tokens. Subtask generation and discussion summaries are protected by auth checkpoints.
*   **Database Constraints**: Strict mongoose schemas enforce data integrity, preventing invalid fields.
*   **Secure API Requests**: Outbound emails are sent through port-blocked bypass APIs (HTTP REST) preventing SMTP timeouts on container host networks.
