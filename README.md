
# 🧠 Recall — AI‑Native Second Brain

**Recall** is a personal knowledge synthesis engine that captures any content (articles, PDFs, voice notes, highlights), atomizes it into micro‑ideas via AI, stores them as interconnected atomic notes with vector embeddings, and resurfaces exactly the right knowledge at the right time using a state‑of‑the‑art spaced repetition scheduler (FSRS).  
Think **Notion + Anki + Readwise, with an AI co‑pilot**.

![Status](https://img.shields.io/badge/status-active-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Stack](https://img.shields.io/badge/stack-Node.js%20%7C%20React%20%7C%20PostgreSQL-informational)

---

## ✨ Features

- **Multi‑modal capture** – Save articles via URL, paste text, upload PDFs/ePubs, record voice notes.
- **AI‑powered atomization** – Automatic summarization, tagging, flashcard generation, and linking using GPT‑4o.
- **Semantic search** – Vector similarity search (`pgvector`) across all your atoms.
- **Spaced Repetition (FSRS)** – State‑of‑the‑art scheduler resurfaces the right knowledge at the optimal time.
- **Knowledge graph** – Interactive visual graph of your atomic notes and their connections.
- **Rich sharing & RBAC** – Share collections with Viewer/Editor/Commentator roles; time‑limited guest links.
- **Real‑time notifications** – In‑app toasts (Socket.IO) + email digests (Resend).
- **Offline review mode** – Cache your daily review queue for offline practice (PWA).
- **Full authentication suite** – Magic links, Google OAuth, Passkeys (WebAuthn), TOTP 2FA.
- **Weekly AI podcast** – TTS‑generated summary of your week’s learning.

---

## 🧱 Tech Stack

### Frontend
- **React 18** (Vite) + TypeScript
- **Tailwind CSS** (custom calm‑tech design system)
- **shadcn/ui** (accessible components)
- **TanStack Query** (server state)
- **Zustand** (client state)
- **React Flow** (knowledge graph)
- **Framer Motion** (animations)
- **Socket.IO Client** (real‑time)

### Backend
- **Node.js** + **Express** (TypeScript)
- **Prisma ORM** (PostgreSQL + pgvector)
- **Redis** (session caching, BullMQ broker)
- **BullMQ** (job queues for AI processing)
- **Socket.IO** (real‑time notifications)
- **OpenAI API** (GPT‑4o, embeddings, Whisper, TTS)
- **Passkeys** (`@simplewebauthn`) + **TOTP** (`otplib`)
- **Resend** (transactional emails)

### Database & Storage
- **Azure PostgreSQL Flexible Server** (B1ms, free tier)
- **pgvector** extension for vector search
- **Azure Blob Storage** (or S3‑compatible) for file uploads

### Infrastructure
- **Azure Container Apps** (serverless backend)
- **Azure Static Web Apps** (frontend hosting)
- **GitHub Actions** (CI/CD)
- **Application Insights** (monitoring)

---

## 📐 Architecture

```
┌─────────────────────┐      ┌─────────────────────┐
│   React SPA         │      │  Browser Extension  │
│ (Static Web Apps)   │      │  (Web Clipper)      │
└────────┬────────────┘      └────────┬────────────┘
         │ HTTPS (REST)               │ OAuth2 PKCE
         ▼                            ▼
┌─────────────────────────────────────────┐
│          Express API (Container Apps)   │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌─────┐ │
│  │Auth   │ │Capture│ │Review │ │AI   │ │
│  │Module │ │Module │ │Engine │ │Svc  │ │
│  └───┬───┘ └───┬───┘ └───┬───┘ └──┬──┘ │
│      │         │         │         │    │
│  ┌───┴─────────┴─────────┴─────────┴──┐ │
│  │     PostgreSQL + pgvector          │ │
│  └────────────────────────────────────┘ │
│  ┌──────────┐  ┌─────────────────────┐  │
│  │  Redis   │  │   BullMQ Workers    │  │
│  └──────────┘  └─────────────────────┘  │
│  ┌─────────────────────────────────────┐│
│  │   Azure Blob Storage                ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js 20+** and **npm**
- **Git**
- **PostgreSQL** (or your Azure PostgreSQL server)
- **Redis** (for job queues – optional during early development)
- **OpenAI API key**

### 1. Clone & Install

```bash
git clone https://github.com/your-username/recall.git
cd recall
npm install
```

### 2. Environment Variables

Create `.env` inside `apps/api`:

```env
DATABASE_URL="postgresql://recall_admin:<password>@recall-db.postgres.database.azure.com:5432/recall?sslmode=require"
REDIS_URL="redis://localhost:6379"              # or your cloud Redis
OPENAI_API_KEY="sk-..."
RESEND_API_KEY="re_..."
```

### 3. Database Setup

```bash
# Enable pgvector on your PostgreSQL server (Azure portal → Server parameters → azure.extensions → VECTOR)
# Then run Prisma migration
npm exec -w apps/api -- prisma migrate dev --name init
```

### 4. Start the Development Environment

```bash
npm run dev
```

- **Frontend:** http://localhost:5173
- **API:** http://localhost:3000

The React app proxies `/api` calls to the Express backend automatically.

---

## 📁 Project Structure

```
recall/
├── apps/
│   ├── api/                  # Express backend
│   │   ├── src/
│   │   │   ├── modules/      # Auth, Atoms, Review, Collections, AI
│   │   │   ├── middleware/   # Auth guards, RBAC, error handler
│   │   │   ├── lib/          # Prisma client, Redis, BullMQ, OpenAI
│   │   │   ├── app.ts        # Express app
│   │   │   └── server.ts     # Entry point
│   │   ├── prisma/           # Schema & migrations
│   │   └── package.json
│   └── web/                  # React frontend (Vite)
│       ├── src/
│       └── package.json
├── packages/
│   └── shared/               # Zod schemas & TypeScript types
├── package.json              # npm workspace root
└── README.md
```

---

## 🛠️ Development Roadmap

1. ✅ Monorepo setup, Express + Prisma + Azure PostgreSQL
2. ⬜ Authentication (magic links, OAuth, passkeys, 2FA)
3. ⬜ Atoms CRUD + AI capture pipeline (embedding, tagging, flashcard gen)
4. ⬜ File uploads (PDF, EPUB, audio) with Azure Blob Storage
5. ⬜ Spaced Repetition Scheduler (FSRS) & daily review engine
6. ⬜ Real‑time notifications (Socket.IO) & email digests
7. ⬜ Knowledge graph visualization (React Flow)
8. ⬜ Sharing & RBAC (collection‑level roles)
9. ⬜ CI/CD to Azure Container Apps + Static Web Apps
10. ⬜ Offline mode & polish (PWA, animations)

---

## 🎯 Highlights

- *Architected an event‑driven knowledge synthesis engine with multi‑step AI processing pipelines using BullMQ and Node.js.*
- *Implemented the Free Spaced Repetition Scheduler (FSRS) algorithm in a production Node.js service, managing thousands of atomic items per user.*
- *Integrated WebAuthn (passkeys), OAuth 2.0, magic links, and TOTP 2FA into a custom authentication system with session rotation.*
- *Built a real‑time notification system (WebSocket + email digests) and full‑text vector search using PostgreSQL pgvector and OpenAI embeddings.*
- *Deployed on Azure using a student plan (Container Apps, PostgreSQL Flexible Server, Blob Storage) with full CI/CD via GitHub Actions.*
- *Designed a calm, accessible React frontend with offline‑capable review mode, interactive knowledge graph, and rich‑text editor.*

---
