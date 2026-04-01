# Resizable Chat Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the chat panel horizontally resizable on desktop via a drag handle, while keeping full-width behavior on mobile.

**Architecture:** Install shadcn `Resizable` component, then wrap the existing chat content inside a `ResizablePanelGroup` within the `SheetContent`. A transparent spacer panel on the left and the chat panel on the right, separated by a `ResizableHandle` visible only on `sm:` screens and above.

**Tech Stack:** shadcn/ui `Resizable` (wraps `react-resizable-panels`), Vitest + Testing Library

---

### Task 1: Install shadcn Resizable component

**Files:**
- Create: `components/ui/resizable.tsx` (via CLI)

- [ ] **Step 1: Install the component**

```bash
pnpm dlx shadcn@latest add resizable
```

- [ ] **Step 2: Verify the file was created**

```bash
ls components/ui/resizable.tsx
```

Expected: file exists

- [ ] **Step 3: Verify existing tests still pass**

```bash
pnpm test:run
```

Expected: all tests PASS

- [ ] **Step 4: Commit**

```bash
git add components/ui/resizable.tsx package.json pnpm-lock.yaml
git commit -m "feat: add shadcn resizable component"
```

---

### Task 2: Write failing test — resize handle renders on desktop, hidden on mobile

**Files:**
- Modify: `app/(dashboard)/chat/[id]/chat-panel.test.tsx`

- [ ] **Step 1: Write the failing test**

Add a new `describe("resizable panel")` block at the end of the existing `describe("ChatPanel")` block in `chat-panel.test.tsx`:

```tsx
// --- Resizable panel ---
describe("resizable panel", () => {
  it("renders a resize handle when the panel is open", () => {
    render(
      <ChatPanel
        document={mockDocument}
        open={true}
        onToggle={mockOnToggle}
      />,
    );
    const handle = screen.getByRole("separator");
    expect(handle).toBeInTheDocument();
  });

  it("resize handle has hidden class for mobile and flex for sm+", () => {
    render(
      <ChatPanel
        document={mockDocument}
        open={true}
        onToggle={mockOnToggle}
      />,
    );
    const handle = screen.getByRole("separator");
    expect(handle).toHaveClass("hidden");
    expect(handle).toHaveClass("sm:flex");
  });

  it("does not render a resize handle when the panel is closed", () => {
    render(
      <ChatPanel
        document={mockDocument}
        open={false}
        onToggle={mockOnToggle}
      />,
    );
    expect(screen.queryByRole("separator")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm dlx vitest run app/\(dashboard\)/chat/\[id\]/chat-panel.test.tsx
```

Expected: FAIL — no element with role `separator` found

- [ ] **Step 3: Commit failing test**

```bash
git add app/\(dashboard\)/chat/\[id\]/chat-panel.test.tsx
git commit -m "test: add failing tests for resizable chat panel handle"
```

---

### Task 3: Implement resizable panel layout in chat-panel.tsx

**Files:**
- Modify: `app/(dashboard)/chat/[id]/chat-panel.tsx`

- [ ] **Step 1: Add imports**

At the top of `chat-panel.tsx`, add the resizable imports after the existing imports:

```tsx
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
```

- [ ] **Step 2: Update SheetContent className**

Change the `SheetContent` className from:

```tsx
className="w-full sm:max-w-[400px] p-0 gap-0"
```

to:

```tsx
className="w-full sm:max-w-[75vw] p-0 gap-0"
```

- [ ] **Step 3: Extract chat content into a variable**

Inside the `ChatPanel` component, just before the `return`, extract the inner chat content `<div>` (the one with `className="flex flex-col h-full bg-background/50 relative"`) into a `chatContent` variable:

```tsx
const chatContent = (
  <div className="flex flex-col h-full bg-background/50 relative">
    {/* Header */}
    <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 bg-background/95 backdrop-blur-xl shrink-0 z-10 shadow-sm">
      <div className="flex items-center gap-2 min-w-0">
        <Sparkles className="w-4 h-4 text-primary shrink-0 opacity-80" />
        <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-foreground/80 truncate">
          Ask Document
        </span>
      </div>
      <SheetClose asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Close chat"
          className="rounded-full text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </Button>
      </SheetClose>
    </div>

    {/* Ingestion warning */}
    {!isIngested && (
      <div className="px-4 py-3 bg-accent border-b border-border/40 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
        <AlertCircle className="w-4 h-4 text-accent-foreground mt-0.5 shrink-0" />
        <div className="flex flex-col gap-1">
          <p className="text-[12px] font-medium text-foreground leading-none">
            Analyzing Document
          </p>
          <p className="text-[11px] text-muted-foreground leading-relaxed font-sans">
            Chat is available but answers may be inaccurate while the
            ingestion process is running.
          </p>
        </div>
      </div>
    )}

    {/* Messages */}
    <ScrollArea
      className="flex-1 px-4 py-6"
      viewportRef={scrollViewportRef}
    >
      <div className="space-y-8 flex flex-col pb-4">
        {currentChat.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center mx-auto max-w-[260px] animate-in fade-in duration-700 relative">
            {/* Warm radial glow */}
            <div className="absolute inset-0 -top-10 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-accent-foreground/4 blur-3xl" />
              <div className="absolute top-1/3 left-1/3 w-32 h-32 rounded-full bg-primary/3 blur-2xl" />
            </div>
            <div className="relative w-16 h-16 rounded-full bg-linear-to-br from-accent-foreground/10 to-primary/5 border border-accent-foreground/10 flex items-center justify-center mb-6 shadow-sm">
              <Sparkles className="w-6 h-6 text-accent-foreground animate-breathe" />
            </div>
            <h3 className="relative text-xl font-serif text-foreground mb-3 tracking-tight">
              Ask the Document
            </h3>
            <p className="relative text-[13px] text-muted-foreground leading-relaxed">
              Extract key insights, summarize chapters, or find specific
              references within this volume.
            </p>
          </div>
        ) : (
          currentChat.map((msg: ChatMessage) => (
            <div key={msg.id}>
              {/* System/Error Message */}
              {msg.role === "system" ? (
                <div className="flex items-center justify-center py-3 px-4 bg-destructive/10 border border-destructive/20 rounded-lg my-2">
                  <AlertCircle className="w-4 h-4 text-destructive mr-2 shrink-0" />
                  <p className="text-sm text-destructive font-medium">
                    {msg.content}
                  </p>
                </div>
              ) : msg.role === "user" ? (
                /* User Message */
                <Message from="user" className="max-w-[92%]">
                  <MessageContent className="rounded-2xl rounded-tr-sm shadow-sm">
                    {msg.content}
                  </MessageContent>
                  <span className="text-[10px] text-muted-foreground/60 font-medium select-none tracking-wide mt-1 self-end mr-1">
                    {formatTime(msg.timestamp)}
                  </span>
                </Message>
              ) : (
                /* AI Message */
                <Message from="assistant" className="max-w-[92%]">
                  <MessageContent className="p-0 gap-0 min-w-[280px]">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shadow-sm text-primary">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <MessageResponse className="font-serif text-[15.5px] leading-relaxed text-foreground">
                          {`${msg.content}${formatCitationsAsMarkdown(msg.citations || [])}`}
                        </MessageResponse>
                      </div>
                    </div>
                  </MessageContent>
                  <span className="text-[10px] text-muted-foreground/60 font-medium select-none tracking-wide mt-1 ml-12">
                    {formatTime(msg.timestamp)}
                  </span>
                </Message>
              )}
            </div>
          ))
        )}

        {isStreaming && (
          <Message
            from="assistant"
            className="max-w-[92%] animate-in fade-in slide-in-from-bottom-2 duration-500"
          >
            <MessageContent className="p-0 gap-0 min-w-[280px]">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shadow-sm text-primary">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="flex-1 min-w-0 py-1">
                  <div className="flex gap-1.5 items-center h-[20px]">
                    <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            </MessageContent>
          </Message>
        )}
      </div>
    </ScrollArea>

    {/* Input */}
    <div className="p-4 bg-background/95 backdrop-blur-xl border-t border-border/40 shrink-0 relative z-20 shadow-sm">
      <div className="relative flex items-center overflow-hidden shadow-sm rounded-full bg-muted/30 border border-border/50 transition-all focus-within:ring-1 focus-within:ring-primary/30 focus-within:border-primary/30 focus-within:bg-background focus-within:shadow-md">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about this document…"
          aria-label="Chat message input"
          className="pr-14 pl-5 py-6 text-[14px] bg-transparent dark:bg-transparent border-none focus-visible:ring-0 shadow-none font-sans rounded-full"
        />
        <Button
          size="icon"
          className="absolute right-1.5 w-9 h-9 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all shadow-sm disabled:opacity-50"
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || isStreaming}
        >
          <Send className="w-4 h-4 ml-0.5" />
          <span className="sr-only">Send message</span>
        </Button>
      </div>
      <p className="text-center text-[10px] text-muted-foreground/60 mt-3 font-medium select-none tracking-wide uppercase">
        AI can make mistakes. Verify important info.
      </p>
    </div>
  </div>
);
```

- [ ] **Step 4: Replace SheetContent children with resizable layout**

Replace the `SheetContent` children (what was the `<div className="flex flex-col h-full ...">` block) with the following:

```tsx
<SheetContent
  side="right"
  showCloseButton={false}
  className="w-full sm:max-w-[75vw] p-0 gap-0"
>
  <SheetTitle className="sr-only">Chat</SheetTitle>
  <ResizablePanelGroup
    orientation="horizontal"
    className="h-full"
  >
    <ResizablePanel
      defaultSize="60%"
      className="hidden sm:block"
    />
    <ResizableHandle
      withHandle
      className="hidden sm:flex"
    />
    <ResizablePanel
      defaultSize="40%"
      minSize="25%"
      className="!flex-auto sm:!flex-none"
    >
      {chatContent}
    </ResizablePanel>
  </ResizablePanelGroup>
</SheetContent>
```

Note: `!flex-auto` on the chat panel ensures it fills the full width on mobile where the spacer panel is hidden. `sm:!flex-none` restores the resizable behavior on desktop.

- [ ] **Step 5: Run tests to verify they pass**

```bash
pnpm dlx vitest run app/\(dashboard\)/chat/\[id\]/chat-panel.test.tsx
```

Expected: ALL tests PASS (both new resizable tests and all existing tests)

- [ ] **Step 6: Run full test suite**

```bash
pnpm test:run
```

Expected: all tests PASS

- [ ] **Step 7: Run type check**

```bash
pnpm type-check
```

Expected: no type errors

- [ ] **Step 8: Commit**

```bash
git add app/\(dashboard\)/chat/\[id\]/chat-panel.tsx app/\(dashboard\)/chat/\[id\]/chat-panel.test.tsx
git commit -m "feat: make chat panel resizable on desktop with shadcn Resizable"
```

---

### Task 4: Verify all existing behavior is preserved

**Files:**
- None (verification only)

- [ ] **Step 1: Run the full test suite**

```bash
pnpm test:run
```

Expected: all tests PASS

- [ ] **Step 2: Run lint**

```bash
pnpm lint
```

Expected: no errors

- [ ] **Step 3: Run type check**

```bash
pnpm type-check
```

Expected: no errors
