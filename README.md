# Sanctuary

> A private reading room where books think back.

---

## Vision

We are building a premium AI reading environment designed to feel like stepping into a quiet library. Warm lighting tones, subtle textures, and elegant serif typography create the atmosphere of sitting at a long wooden desk with a book open before you. The space is calm, intentional, and free from distraction — crafted for those who value depth over noise.

Within this refined setting, readers can converse with their books. Our AI sits beside you like a thoughtful study companion — intelligent, composed, and never intrusive. It offers clear explanations, structured insights, and guided prompts that deepen understanding without overwhelming the reading experience.

This transforms reading from passive consumption into an interactive, guided learning ritual. It is not overly technical or loud; it is sophisticated, confident, and focused. A sanctuary for serious readers — where books think back, and study becomes immersive.

---

## Design Philosophy

Design this product as if you are crafting a private reading room, not a tech interface. The atmosphere should feel warm, intimate, and intentional — inspired by classic libraries and long wooden desks under soft amber light. Use a restrained, warm color palette: deep walnut browns, muted parchment creams, soft charcoal, and subtle brass accents. Typography should lean toward elegant serif for reading (highly legible, generous line height, beautiful rhythm) paired with a minimal, refined sans-serif for UI elements. Spacing must breathe. Nothing should feel crowded, flashy, or hurried. The interface should feel quiet — almost reverent.

The AI should not feel like a chatbot; it should feel like a composed study companion. Avoid bright message bubbles or overly modern UI tropes. Integrate the AI responses into the reading flow — as margin notes, footnotes, or gently separated commentary panels. Animations must be slow and subtle, like turning a page or light shifting across a desk. No harsh contrasts, no aggressive notifications. Every interaction should reinforce calm focus, intellectual depth, and premium craftsmanship. This is not a productivity app — it is a sanctuary for thinking.

---

## Features

### 📚 Read Your Books
Open any PDF in Sanctuary's elegant reading environment. Navigate pages, zoom in for details, track your progress, and jump to chapters using the table of contents — all wrapped in a warm, library-inspired interface.

### 💬 Chat with Your Documents
Ask questions about any book you've uploaded. Sanctuary's AI companion reads your document and provides answers with citations, so you can verify sources and jump directly to the relevant pages. Summarize chapters, find specific references, or extract key insights — all through conversation.

### 📖 Build Your Library
Upload PDFs and watch them become part of your personal collection. Sanctuary automatically extracts titles, authors, and page counts, and generates the embeddings needed for AI-powered chat.

---

## Tech Stack

| Category | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) + React 19 + TypeScript |
| **Styling** | Tailwind CSS v4 + shadcn/ui + Lucide icons |
| **Database** | Supabase (PostgreSQL) with pgvector |
| **Storage** | Vercel Blob (private, user-scoped) |
| **AI/Streaming** | Vercel AI SDK with SSE streaming |
| **PDF** | react-pdf + pdfjs-dist |
| **State** | Zustand (client) + Server Components (server) |
| **Testing** | Vitest + Testing Library + jsdom |
| **Auth** | Supabase magic link (passwordless OTP) |

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (`corepack enable` or `npm i -g pnpm`)
- A Supabase project (local or cloud)
- Vercel Blob storage
- External AI service endpoint

### Environment Variables

Create a `.env.local` file based on `.env.example`:

```bash
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
BOOKIFIED_BLOB_READ_WRITE_TOKEN=your-vercel-blob-token
BOOKIFIED_API_ENDPOINT=your-ai-service-url
WELCOME_DOCUMENT_BLOB_URL=your-welcome-doc-blob-url
WELCOME_DOCUMENT_THUMBNAIL_URL=your-welcome-doc-thumbnail-url
```

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Build

```bash
pnpm build
```

### Testing

```bash
pnpm test:run           # Run all tests
pnpm dlx vitest run <file>  # Run a single test file
```

### Type Checking

```bash
pnpm type-check
```

---

## Project Structure

```
sanctuary/
├── app/                          # Next.js App Router
│   ├── (dashboard)/              # Protected routes
│   │   ├── dashboard/            # Home dashboard
│   │   ├── library/              # Full library browsing
│   │   ├── upload/               # PDF upload flow
│   │   └── chat/[id]/            # Reading view + AI chat
│   ├── api/                      # API routes (blob proxy, upload)
│   ├── auth/callback/            # Supabase OAuth callback
│   ├── login/                    # Magic link login
│   ├── welcome/                  # Onboarding guide
│   └── layout.tsx                # Root layout
├── components/
│   ├── ui/                       # shadcn/ui primitives
│   └── ai-elements/              # AI message components
├── lib/
│   ├── hooks/                    # Custom React hooks
│   ├── supabase/                 # Supabase clients + types
│   ├── store.ts                  # Zustand store
│   └── utils.ts                  # Shared utilities
├── supabase/
│   ├── schema.sql                # Database schema
│   └── migrations/               # Migration files
└── public/                       # Static assets
```

---

## Database

Sanctuary uses Supabase PostgreSQL with pgvector for semantic search:

- **`documents`** — User documents with metadata, progress tracking, and ingestion status
- **`document_embeddings`** — 768-dim vector embeddings for AI-powered RAG chat

Row Level Security (RLS) ensures all data is scoped to individual users.

---

## Architecture Highlights

### External AI Service
AI processing (document ingestion and chat) is handled by an external service. Ingestion is triggered via `POST /ingest/{documentId}`, and chat uses SSE streaming at `POST /chat/{documentId}`.

### Secure Blob Access
Private Vercel Blobs are accessed exclusively through `/api/blob?url=<private_url>`, which authenticates users and validates ownership.

### URL-as-State
The reading view syncs all UI state (page number, chat expanded, outline visible) to URL search params, making views bookmarkable and shareable.

### PDF Virtualization
The PDF viewer uses IntersectionObserver for efficient rendering of large documents, only rendering pages near the viewport.

---

## Development Conventions

See [AGENTS.md](./AGENTS.md) for detailed coding standards, including:

- Always use **pnpm** (never npm or yarn)
- TypeScript strict mode with `type` imports
- Component colocation rules
- Testing requirements (red/green TDD)
- Error handling patterns
- shadcn/ui usage guidelines
