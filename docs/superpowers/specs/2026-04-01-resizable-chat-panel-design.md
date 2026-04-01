# Resizable Chat Panel

**Date:** 2026-04-01
**Status:** Draft

## Goal

Make the chat panel (`ChatPanel`) horizontally resizable on desktop while preserving the existing overlay (Sheet) behavior. On mobile the panel stays full-width with no resize affordance.

## Architecture

The chat panel currently renders inside a shadcn `Sheet` with `side="right"`. The `SheetContent` is fixed at `w-full sm:max-w-[400px]`.

### Changes

1. **Install the shadcn `Resizable` component** (`pnpm dlx shadcn@latest add resizable`).

2. **Wrap the chat content inside a `ResizablePanelGroup`** within the existing `SheetContent`:
   - The `SheetContent` becomes a wider container (`sm:max-w-[75vw]`) that acts as the resizable boundary.
   - A horizontal `ResizablePanelGroup` with two panels:
     - **Left panel (spacer):** An empty, transparent panel. Defaults to taking the remaining space. This panel is what "gives way" when the user drags the handle.
     - **Right panel (chat):** Contains all the existing chat UI (header, messages, input). Has `defaultSize="40%"`, `minSize="25%"`, and `maxSize="100%"` (percentage of the SheetContent width).
   - A `ResizableHandle` sits between them, visible only on `sm:` and above (`hidden sm:flex`).

3. **Mobile behavior (< `sm`):**
   - The `SheetContent` stays `w-full` (existing behavior).
   - The `ResizableHandle` is hidden via `hidden sm:flex`.
   - The right panel takes `defaultSize="100%"` effectively — since there's no handle, the left spacer panel collapses to 0 and the chat fills the sheet.
   - Alternatively: skip rendering the `ResizablePanelGroup` entirely on mobile and render the chat content directly. This avoids unnecessary DOM. A simple approach is a CSS-based check: the panel group renders with `hidden sm:flex` and a plain `div` renders with `sm:hidden`.

4. **No changes to the Sheet component itself** — all modifications are within `chat-panel.tsx`.

### Component Structure (Desktop)

```
Sheet (overlay, open/close unchanged)
└── SheetContent (w-full sm:max-w-[75vw], p-0)
    └── ResizablePanelGroup (horizontal, h-full)  ← hidden sm:flex
        ├── ResizablePanel (spacer, transparent)
        ├── ResizableHandle (withHandle, hidden sm:flex)
        └── ResizablePanel (chat content, defaultSize="40%", minSize="25%")
            └── [existing header / messages / input]
```

### Component Structure (Mobile)

```
Sheet (overlay)
└── SheetContent (w-full, p-0)
    └── div (h-full)  ← sm:hidden
        └── [existing header / messages / input]
```

## Sizing Details

| Property | Value | Rationale |
|---|---|---|
| SheetContent max-width (desktop) | `sm:max-w-[75vw]` | Allows the panel to grow up to 75% of viewport |
| Right panel default size | `40%` | ~400px on a 1280px screen — close to current 400px |
| Right panel min size | `25%` | Prevents the chat from becoming unusably narrow (~240px at 1280px viewport) |
| Right panel max size | `100%` | User can expand chat to fill the entire sheet |

## Interaction Details

- **Drag handle:** The `ResizableHandle` with `withHandle` prop shows a visible grip indicator.
- **Keyboard:** `react-resizable-panels` supports arrow keys for resizing when the handle is focused.
- **Cursor:** The library sets `col-resize` cursor automatically.
- **The handle has a left border** that visually separates the transparent spacer from the chat area — this also serves as the left edge of the chat panel visually.

## Files Changed

| File | Change |
|---|---|
| `app/(dashboard)/chat/[id]/chat-panel.tsx` | Wrap chat content in `ResizablePanelGroup`, add mobile/desktop rendering split |
| `components/ui/resizable.tsx` | New file — added by `shadcn add resizable` |

## Testing

- Manual: open chat panel on desktop, drag handle to resize, verify min/max constraints.
- Manual: open chat panel on mobile viewport, verify full-width, no handle visible.
- Manual: verify Sheet open/close animations still work.
- Manual: verify keyboard resize (Tab to handle, use arrow keys).

## Out of Scope

- Persisting the user's chosen panel width across sessions (could be added later with localStorage).
- Vertical resizing.
- Changing the Sheet to a non-overlay layout.
