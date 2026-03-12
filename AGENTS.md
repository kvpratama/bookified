# AGENTS.md

## Package Management

This project uses **pnpm** as its package manager. Always use pnpm for all package operations:

- Installing packages: `pnpm add <package>`
- Running scripts: `pnpm <script-name>`
- **For shadcn/ui components**: Use `pnpm dlx shadcn@latest add <component>` (not `npx`)

Never use npm or yarn for this project.

## Build & Test Commands

- `pnpm dev` — start dev server
- `pnpm build` — production build
- `pnpm lint` — run ESLint
- `pnpm format` — format with Prettier
- `pnpm test:run` — run all tests (vitest, jsdom environment)
- `pnpm dlx vitest run app/page.test.tsx` — run a single test file
- `pnpm type-check` — TypeScript type checking (`tsc --noEmit`)

## Architecture

- **Framework**: Next.js 16 (App Router) with React 19 and TypeScript (strict mode)
- **Styling**: Tailwind CSS v4, shadcn/ui components in `components/ui/`, utility `cn()` in `lib/utils.ts`
- **Testing**: Vitest + @testing-library/react + jsdom; tests colocated next to source (e.g., `page.test.tsx`)
- **Structure**: `app/` (routes/pages), `components/ui/` (shadcn primitives), `lib/` (shared utilities)
- Path alias: `@/*` maps to project root

## Code Style

- TypeScript strict mode; use `type` imports (`import type { X }`)
- Functional React components (no classes); use Next.js `Image`, `Link`, etc.
- Tailwind classes for all styling; use `cn()` from `@/lib/utils` to merge classes
- **No hardcoded colors**: Always use semantic CSS tokens from `globals.css`. This ensures the app's palette applies consistently in both light and dark modes.
- ESLint: next/core-web-vitals + next/typescript rules
- Formatting: Prettier (run `pnpm format`)
- **Colocation & Reuse (Nearest Common Ancestor):** Prioritize colocation for both sub-components and test files. When breaking a large component into smaller pieces, follow this hierarchy:
  1. **1 consumer** → colocate with that consumer.
  2. **2+ consumers in the same subtree** → move to the nearest shared parent folder.
  3. **App-wide use** → place in `components/ui/`.
  4. Never duplicate a component. Always check if one already exists in a shared location before creating a new one.

## Error Handling

**Server Actions & API Routes**

- Always return typed result objects (`{ data, error }`) rather than throwing; let the caller decide how to surface errors
- Use `next/server` `NextResponse.json({ error: "..." }, { status: 4xx })` for API route errors
- Never expose raw error messages or stack traces to the client

**Client-side Async**

- Use `try/catch` around all `fetch` / server action calls; handle loading, success, and error states explicitly
- Surface errors to the user via Sonner toast (`toast.error(...)`) — never `console.error` only

**Error Boundaries**

- Add an `error.tsx` alongside any `page.tsx` that does async data fetching (App Router convention)
- Add a root `app/error.tsx` as a global fallback
- Error boundaries must include a "Try again" reset button using the provided `reset` prop

**Form Validation**

- Use `zod` for all schema validation; colocate schemas with the form component
- Prefer React Hook Form + shadcn `Form` primitives for form state and error display
- Show field-level errors inline (via `FormMessage`), not as toasts

## Testing

- Prioritize colocation (place test files next to the source files they test). Always use `pnpm test:run` for automated verification.
- **Testing Types:** Do not use "any" type in tests. Type mocks, utilities, and assertions explicitly; prefer generics and type-safe helpers over type casts.
- **Use red/green TDD**: Write a failing test first, verify it fails, then implement.

## Database

- **Provider**: Supabase (PostgreSQL) via `@supabase/ssr`
- **Client helpers**: `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (Server Components / Server Actions), `lib/supabase/middleware.ts` (Next.js middleware for session refresh & auth redirects)
- **Types**: Auto-generated types live in `lib/supabase/database.types.ts`.
- **Migrations**: Stored in `supabase/migrations/`.
- **Environment variables** (see `.env.example`):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- **Usage conventions**:
  - In **Client Components**: `import { createClient } from "@/lib/supabase/client"`
  - In **Server Components / Server Actions**: `import { createClient } from "@/lib/supabase/server"`
  - Always type Supabase queries with the generated `Database` type
  - Use RLS (Row Level Security) policies for access control; never bypass with the service-role key in client-facing code

## Component Guidelines

- **Use shadcn/ui**: Always use shadcn/ui components when available. Do not create custom components that duplicate shadcn functionality
- **Add Components**: Use `pnpm dlx shadcn@latest add <component>` to add new shadcn components as needed
- **No Native Dialogs**: Never use native `alert()` or `confirm()` dialogs. Always use shadcn AlertDialog, Dialog, or Sonner toast components instead
