# 🌌 Zenith Workspace — Enterprise Task Management Platform

[![MERN Stack](https://img.shields.io/badge/Stack-MERN-blue.svg?style=for-the-badge)](https://mongodb.com)
[![WebSocket Sync](https://img.shields.io/badge/Realtime-WebSockets-orange.svg?style=for-the-badge)](https://socket.io)
[![AI Orchestrated](https://img.shields.io/badge/AI-Gemini%20%7C%20Grok%20%7C%20Groq-purple.svg?style=for-the-badge)](https://deepmind.google/technologies/gemini/)
[![CORS Guarded](https://img.shields.io/badge/Security-CORS%20Gated-success.svg?style=for-the-badge)](#)

Zenith Workspace is an enterprise-grade, high-fidelity collaboration and task management system built on the MERN stack. Designed with a luxury glassmorphic design language, Zenith implements state-of-the-art real-time collaboration engines, dual-stage security authorization (JWT + REST OTP), and pluggable LLM copilots.

---

## 📐 System Architecture

Zenith separates client-side presentation from backend state operations, syncing updates instantly across active collaborative nodes.

```mermaid
graph TD
    %% Styling Classes
    classDef client fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#fff;
    classDef backend fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff;
    classDef database fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:#fff;
    classDef external fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#fff;

    %% Frontend Stack
    subgraph Client ["🎨 React SPA client (Vercel Edge)"]
        SPA["React 19 + Vite SPA"]
        RQ["TanStack React Query Cache"]
        SIOC["Socket.io-client Presence"]
        FM["Framer Motion Render Pipeline"]
        SPA --> RQ
        SPA --> SIOC
        SPA --> FM
    end
    class Client,SPA,RQ,SIOC,FM client;

    %% Backend Gateway
    subgraph Backend ["⚙️ Express Core App Container (Render Node)"]
        RT["Express Router Gateway"]
        Auth["JWT Token Verify Middleware"]
        SIOS["Socket.io Event Broker"]
        Controllers["Workspace / Board Controllers"]
        AIService["AI Autopilot Service Manager"]
        
        RT --> Auth
        Auth --> Controllers
        Controllers --> AIService
    end
    class Backend,RT,Auth,SIOS,Controllers,AIService backend;

    %% Data & External Layers
    subgraph Data ["🗄️ Persistence Layer"]
        MDB[("MongoDB Atlas Cloud Cluster")]
    end
    class Data,MDB database;

    subgraph External ["🔌 Third-Party APIs"]
        Brevo["Brevo HTTP Delivery REST API"]
        LLM["AI Orchestration (Gemini/Grok/Groq)"]
    end
    class External,Brevo,LLM external;

    %% Network Connections
    SPA -- HTTPS REST -- RT
    SIOC -- WSS Protocol / Heartbeats -- SIOS
    Controllers -- Mongoose ODM -- MDB
    Controllers -- HTTPS (Port 443) -- Brevo
    AIService -- Secure Token Bearer -- LLM
```

---

## 🔑 Authentication & OTP Verification Flow

Zenith enforces a dual-stage authentication pipeline to verify email addresses before users can access workspaces. Rather than failing on re-registration, the backend transparently triggers an OTP refresh.

```mermaid
sequenceDiagram
    autonumber
    actor User as Client Web Browser
    participant API as Express Auth Router
    participant DB as MongoDB Atlas
    participant Email as Brevo HTTP Service

    User->>API: POST /api/auth/register (Email, Pass)
    API->>DB: Query existing users by email
    
    alt User exists but unverified (OTP pending)
        DB-->>API: User Record (isVerified: false)
        API->>DB: Generate fresh 6-digit OTP & extend TTL
        API->>Email: POST /v3/smtp/email (Send Verification Code)
        Email-->>API: HTTP 200 OK (Sent)
        API-->>User: HTTP 200 OK (OTP Sent to Email - Redirect to /verify)
    else User is new
        API->>DB: Save User Document (isVerified: false, otpCode)
        API->>Email: POST /v3/smtp/email (Send Verification Code)
        Email-->>API: HTTP 200 OK (Sent)
        API-->>User: HTTP 201 Created (Redirect to /verify)
    else User is already verified
        DB-->>API: User Record (isVerified: true)
        API-->>User: HTTP 400 Bad Request ("User already registered")
    end

    Note over User, API: Verification Screen Phase
    User->>API: POST /api/auth/verify-otp (Email, Code)
    API->>DB: Verify matching code & TTL validation
    
    alt Code Matches & Valid Time
        API->>DB: Update User Document (isVerified: true, otpCode: null)
        API-->>User: HTTP 200 OK (JWT Session Token Granted)
    else Code Mismatch / Expired
        API-->>User: HTTP 400 Bad Request ("Invalid or expired verification code")
    end
```

---

## 📡 Live Board Synchronization & Presence Rooms

Zenith coordinates drag-and-drop actions and user locations through scoped room architectures in Socket.io.

```mermaid
graph LR
    %% Styling Classes
    classDef user fill:#64748b,stroke:#475569,stroke-width:1px,color:#fff;
    classDef room fill:#0369a1,stroke:#0369a1,stroke-width:2px,color:#fff;
    classDef broker fill:#15803d,stroke:#15803d,stroke-width:2px,color:#fff;

    UserA("👤 User A (Viewing Card 101)")
    UserB("👤 User B (Viewing Card 101)")
    UserC("👤 User C (Viewing Board Room)")
    
    class UserA,UserB,UserC user;

    subgraph SocketRooms ["Socket.io Shared Memory Rooms"]
        BoardRoom["🏢 Board Room [Room ID: board_505]"]
        CardRoom["📝 Card Detail Room [Room ID: card:101]"]
    end
    class BoardRoom,CardRoom room;

    Broker["📡 Socket.io Server Event Broker"]
    class Broker broker;

    UserA -->|1. join-board / join-card| Broker
    UserB -->|2. join-board / join-card| Broker
    UserC -->|3. join-board| Broker

    Broker -->|Subscribe| BoardRoom
    Broker -->|Subscribe| CardRoom

    %% Event dispatch
    UserA -->|Drag-n-Drop / card-moved| Broker
    Broker -->|Emit: update-card| BoardRoom
    BoardRoom -.->|Sync Kanban State| UserB
    BoardRoom -.->|Sync Kanban State| UserC

    UserB -->|Leave / disconnect| Broker
    Broker -->|Emit: card-viewers-updated| CardRoom
    CardRoom -.->|Update viewer presence avatars| UserA
```

---

## 📂 Project Architecture

```
Task-Management-App/
├── client/              # Single-Page Application (React 19, Vite, Tailwind CSS 4)
│   ├── src/             
│   │   ├── features/    # Module domain boundaries (auth, workspace, command, settings)
│   │   ├── services/    # WebSocket handlers and axios interceptors
│   │   └── index.css    # Global utility structures & glassmorphic tokens
│   ├── vercel.json      # Client production rewrite routing configuration
│   └── README.md        # Frontend-specific implementation details
│
├── backend/             # Enterprise API Server (Express Core & Sockets)
│   ├── config/          # Database orchestrations and templates
│   ├── models/          # Structured Mongoose Schemas (Workspace, Board, Card, User)
│   ├── routes/          # RESTful Endpoint boundaries
│   ├── sockets/         # WebSocket room controllers and presence maps
│   ├── services/        # AI engines, Mail routing, Auth logic
│   └── README.md        # Backend-specific architecture details
│
├── render.yaml          # Infrastructure as Code deployment descriptor
└── README.md            # Master overview (this file)
```

---

## 🏁 Development Setup & Deployment Playbook

For comprehensive local and production installation instructions, please refer to the targeted component documentations:

*   📖 **Backend Server Configuration**: [backend/README.md](backend/README.md)
*   📖 **Frontend Client Configuration**: [client/README.md](client/README.md)

---

## 🛡️ Enterprise Security Implementations

*   **Dynamic CORS Whitelisting**: The Express middleware queries origin headers dynamically, matching requests against verified regular expression arrays to secure REST and WebSockets from malicious cross-origin execution.
*   **Bypass Port Throttling**: Outbound transaction emails utilize Brevo's HTTPS API over port `443` rather than standard SMTP ports `465/587`. This bypasses port-blocking mechanisms found in modern container host networks (e.g. Render, AWS Fargate).
*   **Encapsulated Environments**: Critical secret configurations (JWT secrets, DB credentials, SMTP API keys) are secured within system environment keys and never loaded inside client runtimes.
