# Dashboard Database Integration PRD

## Overview
Convert the dashboard from mock Zustand store to Supabase database integration using Server Components with Next.js loading patterns.

## Goals
- Fetch user's documents from `documents` table filtered by `user_id`
- Display empty state with "Upload Book" CTA when no documents exist
- Show "Continue Reading" section based on `last_accessed` and `current_page` fields
- Sort documents by most recent first (`upload_date` DESC)
- Maintain current UI/UX design and premium reading atmosphere

## Technical Requirements

### 1. Data Fetching
- **Component Type**: Server Component (remove `"use client"`)
- **Data Source**: Supabase `documents` table via `@/lib/supabase/server`
- **Type Safety**: Use `Tables<"documents">` from `@/lib/supabase/database.types.ts`

### 2. Field Mapping
Map database columns to current UI expectations:

| Database Column | Current Store Field | Usage |
|----------------|-------------------|-------|
| `id` | `id` | Document identifier |
| `name` | `name` | Book title display |
| `author` | `author` | Author display |
| `size` | `size` | File size (not currently displayed) |
| `upload_date` | `uploadDate` | Sort order, "Last opened" date |
| `thumbnail_url` | `thumbnailUrl` | Cover image |
| `page_count` | `pageCount` | Page count display |
| `blob_url` | - | PDF storage location (not used in dashboard) |
| `current_page` | - | Reading progress (for future progress bar) |
| `last_accessed` | - | Determine "Continue Reading" book |

### 3. Continue Reading Logic
- Find document with most recent `last_accessed` timestamp
- If `last_accessed` is `null` for all documents, don't show section
- Display `current_page` progress (future enhancement: calculate percentage)

### 4. Empty State
When query returns 0 documents:
- Show centered empty state with message: "No books found in your library."
- Display "Upload Book" button
- Hide "Continue Reading" section
- Hide search/filter bar

### 5. Loading Pattern
Create `app/(dashboard)/dashboard/loading.tsx`:
- Skeleton UI matching dashboard layout
- Skeleton cards in grid matching book card dimensions
- Maintain visual hierarchy during load

### 6. Error Handling
Create `app/(dashboard)/dashboard/error.tsx`:
- Display user-friendly error message
- "Try again" button using `reset` prop
- Maintain premium design aesthetic

### 7. Remove Zustand Dependencies
- Remove `useAppStore` import and usage
- Remove `setLastOpened` call (tracking will be handled via database updates in chat route)
- Keep router navigation to `/chat/${doc.id}` as-is

## Implementation Checklist

- [ ] Convert `page.tsx` to Server Component
- [ ] Create server-side data fetching function
- [ ] Query documents table with user filter and sort
- [ ] Map database fields to UI
- [ ] Implement "Continue Reading" logic using `last_accessed`
- [ ] Handle empty state (0 documents)
- [ ] Create `loading.tsx` with skeleton UI
- [ ] Create `error.tsx` with error boundary
- [ ] Remove all Zustand store references
- [ ] Update imports (remove client-side dependencies)
- [ ] Test with empty database
- [ ] Test with populated database
- [ ] Verify auth filtering (users only see their documents)

## Out of Scope (Future PRDs)
- Search functionality implementation
- Filter functionality implementation
- Reading progress bar visualization
- Updating `last_accessed` on document open
- Updating `current_page` during reading
- List view toggle implementation
- Pagination for large libraries

## Success Criteria
- Dashboard displays only current user's documents
- Documents sorted by upload date (newest first)
- Empty state shows when user has no documents
- "Continue Reading" shows most recently accessed book
- Loading state displays during data fetch
- No client-side state management (Zustand removed)
- All data fetched server-side with proper types
