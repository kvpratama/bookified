import { create } from "zustand";

// TODO: Replace with actual data fetching from backend
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
    thumbnailUrl: "/books.png",
    author: "Eleanor Whitmore",
    pageCount: 342,
  },
  {
    id: "2",
    name: "The Art of Seeing.pdf",
    size: 8200000,
    uploadDate: "2026-03-04T10:15:00Z",
    thumbnailUrl: "/milknhoney.png",
    author: "Helena Rousseau",
    pageCount: 412,
  },
  {
    id: "3",
    name: "Philosophy of Silence.pdf",
    size: 1500000,
    uploadDate: "2026-02-26T09:00:00Z",
    thumbnailUrl: "/philosopyofsilence.png",
    author: "Thomas Blackwell",
    pageCount: 298,
  },
  {
    id: "4",
    name: "Letters to a Young Scholar.pdf",
    size: 3100000,
    uploadDate: "2026-03-02T16:45:00Z",
    author: "Victoria Ashford",
    pageCount: 256,
  },
  {
    id: "5",
    name: "Meditations_on_Time.pdf",
    size: 5600000,
    uploadDate: "2026-01-20T11:20:00Z",
    author: "Marcus Vance",
    pageCount: 512,
  },
  {
    id: "6",
    name: "Architectural_Theory_Vol_1.pdf",
    size: 9800000,
    uploadDate: "2026-03-01T08:30:00Z",
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
