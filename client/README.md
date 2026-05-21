# 🎨 Zenith Client — React SPA & High-Fidelity UI

The frontend client for **Zenith Workspace** is a high-fidelity, interactive Single-Page Application (SPA) built with React and Vite. It boasts an ultra-modern glassmorphic design, dynamic real-time presence indicators, comprehensive accessibility markup, and responsive layouts.

---

## ✨ Features

*   **Glassmorphic Design System**: Custom HSL color tokens, backdrop blurs, and border glows configured for dark mode.
*   **Real-time Collaboration**: Live tracking showing which card other users are currently viewing, plus instant kanban board updates.
*   **Drag-and-Drop Canvas**: Intuitive task rearrangement across columns powered by React state pipelines.
*   **Interactive Command Menu**: Contextual search and command triggers (`Cmd/Ctrl + K`) for instant workspace navigation.
*   **AI Autopilot Actions**: One-click AI checklist generation and comment summaries within task detail modals.
*   **Interactive Analytics**: Data visualization showing board activity metrics and workflow progress distributions.

---

## 📦 Tech Stack & Dependencies

*   **Bundler & Tooling**: Vite & ESLint
*   **Component Framework**: React (v19.x)
*   **State Management & Caching**: TanStack React Query (v5.x)
*   **Animation System**: Framer Motion
*   **HTTP Pipelines**: Axios
*   **Styling Engine**: Tailwind CSS (v4.x)
*   **Iconography**: Lucide React
*   **Real-Time Sync**: Socket.io-client
*   **Rich Content Renderer**: React Markdown & Remark GFM

---

## 📂 Client Architecture

```
client/
├── public/             # Static public assets
├── src/
│   ├── assets/         # Images, background gradients, and media
│   ├── components/     # Reusable global design UI components (Buttons, Modals, Loaders)
│   ├── features/       # Modular features
│   │   ├── auth/          # Registration, Login, and OTP validation screens
│   │   ├── workspace/     # Canvas workspace, Trello-like Boards, Lists, and Cards
│   │   ├── analytics/     # Dashboard activity charts
│   │   ├── command/       # Ctrl+K Command Palette
│   │   └── accessibility/ # Accessibility theme settings
│   ├── layouts/        # App shells, Navigation bars, and layout wrappers
│   ├── services/       # Decoupled API wrappers and WebSocket listeners
│   ├── utils/          # Formatting helpers and local storage wrappers
│   ├── App.jsx         # App routing and React Query providers
│   ├── index.css       # Core Tailwind CSS imports, theme variables, and keyframes
│   └── main.jsx        # App mount orchestrator
└── vercel.json         # SPA fallback routing configuration for Vercel
```

---

## 🔧 Environment Setup

Create a `.env` file inside the `client` folder:

```env
# URL of the Backend API gateway
VITE_API_URL=http://localhost:5000/api

# URL of the Backend Socket server
VITE_SOCKET_URL=http://localhost:5000
```

---

## 🛠️ Local Development

### 1. Install Project Dependencies
```bash
npm install
```

### 2. Launch Local Dev Server (HMR Enabled)
```bash
npm run dev
```
The client app will open by default at `http://localhost:5173`.

### 3. Build Production Bundle
```bash
npm run build
```
This builds static assets inside the `dist/` directory, optimized for zero-downtime edge hosting.

### 4. Local Production Preview
```bash
npm run preview
```
Runs a local preview of the production bundle.
