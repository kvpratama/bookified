import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { OutlinePanel } from "./outline-panel";

// Mock react-pdf - no longer needed in OutlinePanel
vi.mock("react-pdf", () => ({
  pdfjs: {
    GlobalWorkerOptions: {
      workerSrc: "",
    },
  },
}));

const mockOutline = [
  {
    title: "Chapter 1",
    dest: null,
    items: [
      { title: "Section 1.1", dest: null, items: [] },
      { title: "Section 1.2", dest: null, items: [] },
    ],
  },
  {
    title: "Chapter 2",
    dest: null,
    items: [],
  },
];

describe("OutlinePanel", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders outline items when outline data is provided", () => {
    const onPageSelect = vi.fn();

    render(
      <OutlinePanel
        outline={mockOutline}
        onPageSelect={onPageSelect}
        visible={true}
        isLoading={false}
      />,
    );

    expect(screen.getByText("Chapter 1")).toBeInTheDocument();
    expect(screen.getByText("Chapter 2")).toBeInTheDocument();
  });

  it("shows loading state when isLoading is true", () => {
    const onPageSelect = vi.fn();

    render(
      <OutlinePanel
        outline={null}
        onPageSelect={onPageSelect}
        visible={true}
        isLoading={true}
      />,
    );

    expect(screen.getByText(/Loading outline/i)).toBeInTheDocument();
  });

  it("is hidden when visible prop is false", () => {
    const onPageSelect = vi.fn();

    render(
      <OutlinePanel
        outline={mockOutline}
        onPageSelect={onPageSelect}
        visible={false}
        isLoading={false}
      />,
    );

    const panel = screen.getByTestId("outline-panel");
    expect(panel).toHaveClass("w-0");
  });

  it("is visible when visible prop is true", () => {
    const onPageSelect = vi.fn();

    render(
      <OutlinePanel
        outline={mockOutline}
        onPageSelect={onPageSelect}
        visible={true}
        isLoading={false}
      />,
    );

    const panel = screen.getByTestId("outline-panel");
    expect(panel).not.toHaveClass("w-0");
  });

  it("does not render Document component", () => {
    const onPageSelect = vi.fn();

    render(
      <OutlinePanel
        outline={mockOutline}
        onPageSelect={onPageSelect}
        visible={true}
        isLoading={false}
      />,
    );

    expect(screen.queryByTestId("pdf-document")).not.toBeInTheDocument();
  });
});
