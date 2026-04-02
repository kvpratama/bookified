import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, test, expect, vi } from "vitest";
import { CitationList } from "./citation-list";
import type { Citation } from "@/lib/store";

describe("CitationList", () => {
  test("renders citations with page numbers as clickable links", () => {
    const citations: Citation[] = [
      { page: 5, text: "First quote" },
      { page: 12, text: "Second quote" },
    ];

    render(<CitationList citations={citations} onCitationClick={vi.fn()} />);

    expect(screen.getByText(/Page 5/i)).toBeInTheDocument();
    expect(screen.getByText(/Page 12/i)).toBeInTheDocument();
  });

  test("calls onCitationClick with page number when citation is clicked", async () => {
    const user = userEvent.setup();
    const onCitationClick = vi.fn();
    const citations: Citation[] = [{ page: 5, text: "Quote" }];

    const { container } = render(
      <CitationList citations={citations} onCitationClick={onCitationClick} />,
    );

    const citationButton = container.querySelector("button");
    expect(citationButton).toBeInTheDocument();
    await user.click(citationButton!);

    expect(onCitationClick).toHaveBeenCalledWith(5);
  });

  test("renders empty when no citations provided", () => {
    const { container } = render(
      <CitationList citations={[]} onCitationClick={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
