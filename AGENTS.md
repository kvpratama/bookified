# AGENTS.md

## Build & Test Commands

- `pnpm dev` — start dev server
- `pnpm build` — production build
- `pnpm lint` — run ESLint
- `pnpm format` — format with Prettier
- `pnpm test:run` — run all tests (vitest, jsdom environment)
- `npx vitest run app/page.test.tsx` — run a single test file
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
- ESLint: next/core-web-vitals + next/typescript rules
- Formatting: Prettier (run `pnpm format`)
- **Colocation & Reuse (Nearest Common Ancestor):** Prioritize colocation for both sub-components and test files. When breaking a large component into smaller pieces, follow this hierarchy:
  1. **1 consumer** → colocate with that consumer.
  2. **2+ consumers in the same subtree** → move to the nearest shared parent folder.
  3. **App-wide use** → place in `components/ui/`.
  4. Never duplicate a component. Always check if one already exists in a shared location before creating a new one.
- **Testing:** Prioritize colocation (place test files next to the source files they test). Always use `pnpm test:run` for automated verification.
- **Testing Types:** Do not use "any" type in tests. Type mocks, utilities, and assertions explicitly; prefer generics and type-safe helpers over type casts.
- **Use red/green TDD**

<!-- BEGIN:nextjs-agent-rules -->

## Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->
