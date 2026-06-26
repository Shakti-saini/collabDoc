# CollabDocs — Local-First Collaborative Document Editor

A production-grade collaborative document editor built on local-first architecture with offline sync, deterministic conflict resolution, granular version control, and AI-powered writing assistance.

## Tech Stack

- **Framework**: Next.js 15 (App Router, TypeScript)
- **Editor**: TipTap (ProseMirror-based)
- **Local Storage**: IndexedDB via `idb`
- **Conflict Resolution**: Vector Clocks (CRDT-inspired)
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: NextAuth v5 (Credentials + JWT)
- **AI**: OpenAI GPT-4o-mini
- **Styling**: Tailwind CSS + Radix UI

## Architecture Highlights

### Local-First
Every edit is saved to IndexedDB **before** any network request. The UI never blocks on the network.

### Background Sync Engine
A `SyncEngine` singleton queues operations with vector clocks. On reconnection, it flushes the queue — sending only the latest state per document, reducing bandwidth.

### Conflict Resolution (Vector Clocks)
Each user maintains a vector clock. When clocks are **concurrent** (diverged writes), the server performs a deterministic merge: remote content wins for body, non-empty title wins for title. Both states are recorded.

### Security
- **Payload size guard**: 512KB limit on sync endpoint
- **Row-Level Security**: All queries scoped to authenticated user
- **Role enforcement**: VIEWER cannot push updates (enforced server-side)
- **Zod validation** on all incoming payloads

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Installation

```bash
# 1. Clone and install
git clone <repo>
cd collab-editor
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL, NEXTAUTH_SECRET

# 3. Set up database
npx prisma migrate dev --name init
npx prisma db push
npx tsx prisma/seed.ts

# 4. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Demo Credentials
- **Email**: alice@example.com / **Password**: password123
- **Email**: bob@example.com / **Password**: password123

## Features

- ✅ Offline editing (IndexedDB)
- ✅ Background sync with queue
- ✅ Vector clock conflict detection & merge
- ✅ Version history with time-travel restore
- ✅ Role-based access (Owner / Editor / Viewer)
- ✅ JWT authentication
- ✅ AI writing assistant (improve, summarize, expand, grammar, tone)
- ✅ Real-time connection status indicator
- ✅ Rich text editor (TipTap) — headings, lists, tasks, links, images, highlights
- ✅ Dark/light mode
- ✅ Document sharing

## Deployment

### Vercel

```bash
vercel deploy
```

Set environment variables in Vercel dashboard. Use Neon, Supabase, or Railway for PostgreSQL.

## Developer

- **Name**: Your Name
- **GitHub**: [github.com/yourusername](https://github.com/yourusername)
- **LinkedIn**: [linkedin.com/in/yourusername](https://linkedin.com/in/yourusername)
