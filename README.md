# Recall

Recall is a spaced-repetition knowledge app. You capture content (articles, PDFs, notes, voice, images), it turns that content into small knowledge units called **atoms**, enriches them with AI, and schedules reviews using the FSRS spaced-repetition algorithm.

## Features

- **Capture** — create atoms from articles, PDFs, voice transcriptions, images, or plain notes
- **Review** — daily review queue with FSRS-based scheduling and grading
- **Library** — browse and manage your atoms and tags
- **Serendipity** — AI-generated connections and discovery across your atoms
- **Search** — semantic/vector similarity search over atom embeddings
- **Auth** — passwordless magic-link login (Resend) with JWT access/refresh tokens
- **Collections** — group and share atoms

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, React Router, Tailwind CSS 4, Radix UI/shadcn, Zustand |
| Backend | Express 5, TypeScript (Node) |
| Database | PostgreSQL via Prisma |
| Cache/Queue | Redis + BullMQ (AI enrichment and serendipity workers) |
| AI | Azure OpenAI (embeddings, chat, Whisper transcription) |
| Storage | Azure Blob Storage with SAS upload URLs |
| Scheduling | `ts-fsrs` (FSRS spaced repetition) |
| Email | Resend (magic links) |

## Repository structure

```
apps/
  api/          Express API
    prisma/     Schema + migrations
    src/
      lib/      Prisma, Redis, FSRS, Azure, AI, errors
      middleware/  Auth, error handling
      modules/  auth, atoms, review, search, upload, ai, serendipity, collection
  web/          React frontend (Vite)
    src/
      features/ dashboard, review, library, capture, atoms, auth, serendipity
      components/, contexts/, stores/, hooks/
packages/
  shared/       Shared TypeScript code
```

## Getting started

### Prerequisites

- Node.js + npm
- PostgreSQL
- Redis
- (Optional for full functionality) Azure OpenAI, Azure Storage, Resend accounts

### Install

```bash
npm install
```

### Environment variables

Create `.env` files for the API (`apps/api/.env`) and web (`apps/web/.env`).

**API (`apps/api`)**

```bash
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379

PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

JWT_SECRET=...
REFRESH_TOKEN_SECRET=...
ACCESS_TOKEN_EXPIRY=1h
REFRESH_TOKEN_EXPIRY=7d
MAGIC_LINK_EXPIRY=15m

RESEND_API_KEY=...
DEMO_EMAIL=demo@recall.app
ENABLE_DEMO=true

AZURE_OPENAI_ENDPOINT=...
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_API_VERSION=2024-08-01-preview
AZURE_OPENAI_EMBEDDING_DEPLOYMENT=...
AZURE_OPENAI_CHAT_DEPLOYMENT=...
AZURE_OPENAI_WHISPER_DEPLOYMENT=...

AZURE_STORAGE_CONNECTION_STRING=...
AZURE_STORAGE_CONTAINER_NAME=...
```

**Web (`apps/web`)**

```bash
VITE_API_URL=http://localhost:3000
```

### Database

```bash
npx prisma migrate dev --schema apps/api/prisma/schema.prisma
```

### Run

```bash
npm run dev        # API + web together
npm run dev:api    # API only (http://localhost:3000)
npm run dev:web    # web only (http://localhost:5173)
```

The API exposes a health check at `GET /health`.

## API overview

All endpoints are versioned under `/api/v1`:

| Route | Purpose |
|---|---|
| `/api/v1/auth` | Login (magic link), verification, refresh, profile |
| `/api/v1/atoms` | Create/fetch atoms from article, PDF, voice, image, note |
| `/api/v1/review` | Daily review queue and grading |
| `/api/v1/search` | Vector similarity search |
| `/api/v1/upload` | SAS URL generation for direct Azure Blob uploads |
| `/api/v1/serendipity` | AI-generated discovery content |

## How it works

1. **Capture** — content is parsed (Readability for articles, `pdf-parse` for PDFs, Whisper for voice) and stored as an atom.
2. **Enrich** — a BullMQ worker uses Azure OpenAI to generate embeddings, summaries, and flashcard material without blocking requests.
3. **Review** — each atom gets FSRS review state (stability, difficulty, scheduling); the review queue returns due items and grades update scheduling on each response.
4. **Discover** — vector search and the serendipity worker surface related atoms across your library.

## Additional documentation

- [`Schema.md`](Schema.md) — database entities and relationships
- [`FSRS.md`](FSRS.md) — notes on the FSRS spaced-repetition model
- [`Issues.md`](Issues.md) — known issues
- [`todo.md`](todo.md) — roadmap
