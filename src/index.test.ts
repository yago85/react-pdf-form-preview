import { describe, it, expect, vi } from "vitest";

// Mock pdfjs-dist to avoid DOMMatrix requirement in jsdom
vi.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: { workerSrc: "" },
  getDocument: vi.fn(),
}));

import AcroFormPreview, {
  AcroFormPreview as NamedExport,
  distributeTextToLines,
} from "./index";

describe("package exports", () => {
  it("exports AcroFormPreview as default", () => {
    expect(AcroFormPreview).toBeDefined();
    expect(typeof AcroFormPreview).toBe("object"); // React.memo wraps into object
  });

  it("exports AcroFormPreview as named export", () => {
    expect(NamedExport).toBeDefined();
    expect(NamedExport).toBe(AcroFormPreview);
  });

  it("exports distributeTextToLines utility", () => {
    expect(typeof distributeTextToLines).toBe("function");
  });
});
