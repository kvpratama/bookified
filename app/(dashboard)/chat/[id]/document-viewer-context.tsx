"use client";

import { createContext, use, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { OutlineItem } from "./types";

interface DocumentViewerState {
  pdfDocument: PDFDocumentProxy | null;
  currentPage: number;
  outline: OutlineItem[] | null;
  isOutlineLoading: boolean;
  hasOutline: boolean;
  outlineVisible: boolean;
  chatCollapsed: boolean;
  selectedPage: number | undefined;
}

interface DocumentViewerActions {
  setPdfDocument: (pdf: PDFDocumentProxy) => void;
  setCurrentPage: (page: number) => void;
  handleOutlineExtracted: (
    outline: OutlineItem[] | null,
    isLoading: boolean,
  ) => void;
  handlePageSelect: (pageNumber: number) => void;
  toggleOutline: () => void;
  closeOutline: () => void;
  toggleChat: () => void;
}

interface DocumentViewerContextValue {
  state: DocumentViewerState;
  actions: DocumentViewerActions;
}

const DocumentViewerContext = createContext<DocumentViewerContextValue | null>(
  null,
);

export function useDocumentViewer(): DocumentViewerContextValue {
  const value = use(DocumentViewerContext);
  if (!value) {
    throw new Error(
      "useDocumentViewer must be used within a DocumentViewerProvider",
    );
  }
  return value;
}

export function DocumentViewerProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [chatCollapsed, setChatCollapsed] = useState(
    searchParams.get("chat") === "expanded" ? false : true,
  );
  const [outlineVisible, setOutlineVisible] = useState(
    searchParams.get("outline") === "true",
  );
  const [outline, setOutline] = useState<OutlineItem[] | null>(null);
  const [isOutlineLoading, setIsOutlineLoading] = useState(true);
  const [hasOutline, setHasOutline] = useState(false);
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [selectedPage, setSelectedPage] = useState<number | undefined>();
  const [currentPage, setCurrentPage] = useState(1);

  const updateUrl = useCallback(
    (params: Record<string, string | null>) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([key, value]) => {
        if (value === null) {
          nextParams.delete(key);
        } else {
          nextParams.set(key, value);
        }
      });

      const queryString = nextParams.toString();
      const url = `${pathname}${queryString ? `?${queryString}` : ""}`;
      router.replace(url, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const handleOutlineExtracted = useCallback(
    (extractedOutline: OutlineItem[] | null, isLoading: boolean) => {
      setOutline(extractedOutline);
      setIsOutlineLoading(isLoading);
      setHasOutline(!!extractedOutline);
    },
    [],
  );

  const handlePageSelect = useCallback((pageNumber: number) => {
    setSelectedPage(pageNumber);
    setTimeout(() => setSelectedPage(undefined), 100);
  }, []);

  const toggleChat = useCallback(() => {
    const nextState = !chatCollapsed;
    setChatCollapsed(nextState);
    updateUrl({ chat: nextState ? null : "expanded" });
  }, [chatCollapsed, updateUrl]);

  const toggleOutline = useCallback(() => {
    const nextState = !outlineVisible;
    setOutlineVisible(nextState);
    updateUrl({ outline: nextState ? "true" : null });
  }, [outlineVisible, updateUrl]);

  const closeOutline = useCallback(() => {
    setOutlineVisible(false);
    updateUrl({ outline: null });
  }, [updateUrl]);

  const setDocumentProxy = useCallback((pdf: PDFDocumentProxy) => {
    setPdfDocument(pdf);
  }, []);

  const value: DocumentViewerContextValue = {
    state: {
      pdfDocument,
      currentPage,
      outline,
      isOutlineLoading,
      hasOutline,
      outlineVisible,
      chatCollapsed,
      selectedPage,
    },
    actions: {
      setPdfDocument: setDocumentProxy,
      setCurrentPage,
      handleOutlineExtracted,
      handlePageSelect,
      toggleOutline,
      closeOutline,
      toggleChat,
    },
  };

  return (
    <DocumentViewerContext value={value}>{children}</DocumentViewerContext>
  );
}
