import { create } from "zustand";

export interface PdfDocument {
  id: string;
  name: string;
  size: number;
  uploadDate: string;
  thumbnailUrl?: string;
  author?: string;
  pageCount?: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: string;
}

interface AppState {
  documents: PdfDocument[];
  chats: Record<string, ChatMessage[]>;
  lastOpenedId: string | null;
  addDocument: (doc: PdfDocument) => void;
  addMessage: (pdfId: string, message: ChatMessage) => void;
  setLastOpened: (id: string) => void;
}

const MOCK_DOCUMENTS: PdfDocument[] = [
  {
    id: "1",
    name: "The Nature of Deep Thought.pdf",
    size: 2450000,
    uploadDate: "2026-03-05T14:30:00Z",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800",
    author: "Eleanor Whitmore",
    pageCount: 342,
  },
  {
    id: "2",
    name: "The Art of Seeing.pdf",
    size: 8200000,
    uploadDate: "2026-03-04T10:15:00Z",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=800",
    author: "Helena Rousseau",
    pageCount: 412,
  },
  {
    id: "3",
    name: "Philosophy of Silence.pdf",
    size: 1500000,
    uploadDate: "2026-02-26T09:00:00Z",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800",
    author: "Thomas Blackwell",
    pageCount: 298,
  },
  {
    id: "4",
    name: "Letters to a Young Scholar.pdf",
    size: 3100000,
    uploadDate: "2026-03-02T16:45:00Z",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=80&w=800",
    author: "Victoria Ashford",
    pageCount: 256,
  },
  {
    id: "5",
    name: "Meditations_on_Time.pdf",
    size: 5600000,
    uploadDate: "2026-01-20T11:20:00Z",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800",
    author: "Marcus Vance",
    pageCount: 512,
  },
  {
    id: "6",
    name: "Architectural_Theory_Vol_1.pdf",
    size: 9800000,
    uploadDate: "2026-03-01T08:30:00Z",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&q=80&w=800",
    author: "Julian Thorne",
    pageCount: 720,
  },
];

const INITIAL_CHATS: Record<string, ChatMessage[]> = {
  "1": [
    {
      id: "msg-1",
      role: "ai",
      content:
        "Hello. I've analyzed the Q3 Financial Analysis FY26 document. How can I assist you with it?",
      timestamp: "2026-03-01T10:35:00Z",
    },
  ],
};

export const useAppStore = create<AppState>((set) => ({
  documents: MOCK_DOCUMENTS,
  chats: INITIAL_CHATS,
  lastOpenedId: "1",
  addDocument: (doc) =>
    set((state) => ({
      documents: [doc, ...state.documents],
    })),
  addMessage: (pdfId, message) =>
    set((state) => {
      const currentMessages = state.chats[pdfId] || [];
      return {
        chats: {
          ...state.chats,
          [pdfId]: [...currentMessages, message],
        },
      };
    }),
  setLastOpened: (id) => set({ lastOpenedId: id }),
}));
