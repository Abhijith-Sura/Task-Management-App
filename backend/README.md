# ⚙️ Zenith Backend — API Server & Real-Time Orchestrator

The backend for **Zenith Workspace** is a high-performance, secure, and highly scalable Node.js/Express server. It orchestrates user authentication, database operations via MongoDB, real-time collaboration with WebSockets (Socket.io), transactional email delivery, and contextual AI integrations.

---

## 🚀 Key Features

*   **Secure Authentication**: Password hashing with `bcryptjs`, JWT session tokens, and dual-layered OTP email validation.
*   **Real-time Collaboration**: WebSocket presence tracking and instant canvas synchronization via `socket.io`.
*   **Contextual AI Engines**: Dynamic interface supporting Google Gemini, Groq, and xAI Grok to automate subtask checklists and summarize board discussions.
*   **Flexible Schema Architecture**: Structured mongoose models representing Workspaces, Boards, Lists, Cards, Comments, and Activity Feeds.
*   **Cloud Infrastructure**: Production-ready CORS policies, request timeouts, global error handling middleware, and blueprint-managed deployments.

---

## 📦 Tech Stack & Dependencies

*   **Runtime Environment**: Node.js (ES Modules - `type: "module"`)
*   **Web Framework**: Express (v5.x)
*   **Database Integration**: MongoDB & Mongoose ODM
*   **Real-Time Gateway**: Socket.io
*   **Email Deliverability**: Brevo SMTP/HTTP API & Nodemailer
*   **Authentication & Hashing**: JSON Web Tokens (JWT) & Bcryptjs
*   **Asset Management**: Multer (File upload pipeline)
*   **Development Tools**: Nodemon (Auto-restarts on code changes)

---

## 📂 Backend Architecture

```
backend/
├── config/             # Database connections and board initialization templates
├── controllers/        # Express request controllers containing business logic
├── middleware/         # Gated Auth, File Uploads, and Global Error handlers
├── models/             # Strict Mongoose schemas
├── routes/             # REST route mappings
├── services/           # Decoupled Core Services (AI Engines, Auth pipelines)
├── sockets/            # Socket.io presence events and broadcast logic
├── utils/              # API responders, async wrappers, and Email client
├── server.js           # Server initializer and main orchestration entrypoint
└── render.yaml         # Infrastructure as Code deployment configuration
```

---

## 🔧 Environment Variables Config

Create a `.env` file inside the `backend` folder containing the following:

```env
# Server Config
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/zenith

# Authentication
JWT_SECRET=your_jwt_signing_secret_key

# CORS Whitelist (Frontend Address)
FRONTEND_URL=http://localhost:5173

# Email Delivery (Brevo HTTP API - Recommended)
BREVO_API_KEY=xkeysib-your_brevo_v3_api_key
BREVO_FROM_EMAIL=your_verified_brevo_sender@gmail.com
FROM_NAME="Zenith Workspace"

# AI Integration Keys (Provide at least one to enable AI Autopilot features)
GEMINI_API_KEY=your_google_gemini_api_key
GROQ_API_KEY=your_groq_llama3_api_key
GROK_API_KEY=your_xai_grok_api_key
```

---

## 🚦 API Endpoints Reference

### 🔐 Authentication (`/api/auth`)
*   `POST /register`: Registers user credentials (unverified status) and triggers an OTP email.
*   `POST /login`: authenticates credentials and returns JWT token (only if account is verified).
*   `POST /verify-otp`: Validates the 6-digit OTP code to activate the user account.
*   `POST /resend-otp`: Invalidates old codes and generates a fresh verification OTP.

### 🏢 Workspaces (`/api/workspaces`)
*   `GET /`: Fetches all workspaces where the current user is a member/owner.
*   `POST /`: Creates a brand new workspace.
*   `GET /:id`: Retrieves workspace meta details.
*   `PUT /:id`: Updates workspace configurations.
*   `DELETE /:id`: Deletes workspace.

### 📋 Boards (`/api/boards`)
*   `GET /workspace/:workspaceId`: Fetches boards belonging to a workspace.
*   `POST /`: Creates a board (optionally using design templates from `config/boardTemplates.js`).
*   `GET /:id`: Retrieves board columns and cards inside.

### 📝 Cards & AI (`/api/ai`)
*   `POST /generate-subtasks`: Autocomplete checklist subtasks using the configured AI engine (Gemini/Grok/Groq) based on card title and description.
*   `POST /summarize-discussion`: Summarizes comment threads in a bulleted list using AI.

---

## 📡 WebSocket Event Orchestration

All real-time actions are piped through `sockets/socketHandler.js`:

| Event Trigger | Description | Data Structure |
| :--- | :--- | :--- |
| `join-board` | Subscribes socket to room `boardId` | `boardId` (String) |
| `join-card` | Registers socket as viewing `cardId` | `{ boardId, cardId, user }` |
| `leave-card` | Unsubscribes socket from `cardId` presence | `{ boardId, cardId, userId }` |
| `card-moved` | Broadcasts new drag-and-drop locations | `{ boardId, cardId, ...positionData }` |
| `board-mutation`| Tells other clients to perform refetch | `{ boardId }` |
| `disconnect` | Automatically cleans up card presence lists | None |

---

## 🛠️ Local Development & Running

### 1. Install Dependencies
```bash
npm install
```

### 2. Launch Local Dev Server (Nodemon)
```bash
npm run dev
```
The server will boot up by default on port `5000` (or the custom `PORT` variable defined in `.env`).

### 3. Production Boot
```bash
npm start
```
