import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import AcroFormPreview from "./AcroFormPreview";

const mockState = {
  pdfDoc: {} as object,
  numPages: 2,
  loading: false,
  error: null as string | null,
  filledDataRef: { current: {} as Record<string, unknown> },
  pdfFieldLabelsRef: { current: {} as Record<string, string> },
  fieldRectsRef: { current: new Map<string, { page: number; rect: number[] }>() },
  pageViewportsRef: { current: new Map<number, { width: number; height: number }>() },
};

vi.mock("./hooks/usePdfFill", () => ({
  usePdfFill: () => mockState,
}));

vi.mock("./hooks/usePdfRender", () => ({
  usePdfRender: () => ({
    activeCanvas: "A",
    canvasRefsA: { current: new Map() },
    canvasRefsB: { current: new Map() },
  }),
}));

describe("AcroFormPreview accessibility", () => {
  beforeEach(() => {
    mockState.numPages = 2;
    mockState.loading = false;
    mockState.error = null;
    mockState.filledDataRef.current = {};
    mockState.pdfFieldLabelsRef.current = {};
    mockState.fieldRectsRef.current = new Map([
      ["name", { page: 1, rect: [72, 700, 300, 720] }],
    ]);
    mockState.pageViewportsRef.current = new Map([
      [1, { width: 612, height: 792 }],
    ]);
  });

  it("announces when the PDF has loaded", () => {
    render(
      <AcroFormPreview
        data={{}}
        templateUrl="/template.pdf"
      />,
    );

    expect(screen.getByRole("status").textContent).toBe("PDF loaded, 2 pages");
  });

  it("announces active field status for screen readers", () => {
    mockState.filledDataRef.current = { name: "John Smith" };
    mockState.pdfFieldLabelsRef.current = { name: "Profile name" };

    const { rerender } = render(
      <AcroFormPreview
        data={{}}
        templateUrl="/template.pdf"
      />,
    );

    rerender(
      <AcroFormPreview
        data={{ name: "John Smith" }}
        templateUrl="/template.pdf"
        activeField="name"
        fieldLabels={{ name: "Full name" }}
        highlightAllFields
        onFieldClick={() => {}}
      />,
    );

    expect(screen.getByRole("status").textContent).toBe("Field Full name is active and currently filled.");
    expect(screen.getByRole("button", { name: /active field: full name\./i })).toBeTruthy();
  });

  it("can prefer PDF metadata labels over manual labels", () => {
    mockState.filledDataRef.current = { name: "John Smith" };
    mockState.pdfFieldLabelsRef.current = { name: "Profile name" };

    render(
      <AcroFormPreview
        data={{ name: "John Smith" }}
        templateUrl="/template.pdf"
        activeField="name"
        fieldLabels={{ name: "Full name" }}
        fieldLabelSource="pdf-first"
        highlightAllFields
        onFieldClick={() => {}}
      />,
    );

    expect(screen.getByRole("status").textContent).toBe("Field Profile name is active and currently filled.");
    expect(screen.getByRole("button", { name: /active field: profile name\./i })).toBeTruthy();
  });

  it("falls back to manual labels when pdf-first has no PDF metadata label", () => {
    mockState.filledDataRef.current = { name: "John Smith" };
    mockState.pdfFieldLabelsRef.current = {};

    render(
      <AcroFormPreview
        data={{ name: "John Smith" }}
        templateUrl="/template.pdf"
        activeField="name"
        fieldLabels={{ name: "Full name" }}
        fieldLabelSource="pdf-first"
        highlightAllFields
        onFieldClick={() => {}}
      />,
    );

    expect(screen.getByRole("status").textContent).toBe("Field Full name is active and currently filled.");
    expect(screen.getByRole("button", { name: /active field: full name\./i })).toBeTruthy();
  });

  it("marks non-interactive overlays as hidden from assistive tech", () => {
    render(
      <AcroFormPreview
        data={{}}
        templateUrl="/template.pdf"
        highlightAllFields
      />,
    );

    expect(screen.queryByRole("button")).toBeNull();
    expect(document.querySelector("[aria-hidden='true']")).toBeTruthy();
  });
});
