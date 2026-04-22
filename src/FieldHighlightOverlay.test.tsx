import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import FieldHighlightOverlay from "./FieldHighlightOverlay";

const pageSize = { width: 612, height: 792 };

const fieldRects = new Map([
  ["name", { page: 1, rect: [72, 700, 300, 720] }],
  ["email", { page: 1, rect: [72, 660, 300, 680] }],
  ["other", { page: 2, rect: [72, 700, 300, 720] }],
]);

describe("FieldHighlightOverlay", () => {
  it("renders highlight boxes for fields on the given page", () => {
    const { container } = render(
      <FieldHighlightOverlay
        pageNum={1}
        highlights={[
          { fieldName: "name", color: "#ff0000" },
          { fieldName: "email", color: "#00ff00" },
        ]}
        fieldRects={fieldRects}
        pageSize={pageSize}
      />,
    );
    const boxes = container.querySelectorAll("[aria-hidden='true']");
    expect(boxes).toHaveLength(2);
  });

  it("does not render fields from other pages", () => {
    const { container } = render(
      <FieldHighlightOverlay
        pageNum={1}
        highlights={[{ fieldName: "other", color: "#ff0000" }]}
        fieldRects={fieldRects}
        pageSize={pageSize}
      />,
    );
    const boxes = container.querySelectorAll("[aria-hidden='true']");
    expect(boxes).toHaveLength(0);
  });

  it("calls onFieldClick when a field box is clicked", () => {
    const onClick = vi.fn();
    const { getByRole } = render(
      <FieldHighlightOverlay
        pageNum={1}
        highlights={[{ fieldName: "name", color: "#ff0000" }]}
        fieldRects={fieldRects}
        pageSize={pageSize}
        onFieldClick={onClick}
      />,
    );
    const box = getByRole("button", { name: /field: name/i });
    fireEvent.click(box);
    expect(onClick).toHaveBeenCalledWith("name");
  });

  it("calls onFieldDoubleClick with field rect percentages", () => {
    const onDblClick = vi.fn();
    const { getByRole } = render(
      <FieldHighlightOverlay
        pageNum={1}
        highlights={[{ fieldName: "name", color: "#ff0000" }]}
        fieldRects={fieldRects}
        pageSize={pageSize}
        onFieldDoubleClick={onDblClick}
      />,
    );
    const box = getByRole("button", { name: /field: name/i });
    fireEvent.doubleClick(box);
    expect(onDblClick).toHaveBeenCalledWith("name", expect.objectContaining({
      left: expect.any(Number),
      top: expect.any(Number),
      width: expect.any(Number),
      height: expect.any(Number),
    }));
  });

  it("shows labels when showLabels is true", () => {
    const { getByText } = render(
      <FieldHighlightOverlay
        pageNum={1}
        highlights={[{ fieldName: "name", color: "#ff0000" }]}
        fieldRects={fieldRects}
        pageSize={pageSize}
        showLabels
        fieldLabels={{ name: "Full name" }}
      />,
    );
    expect(getByText("Full name")).toBeTruthy();
  });

  it("highlights active field differently from filled/empty", () => {
    const filledData = { name: "John", email: "" };
    const { getByRole } = render(
      <FieldHighlightOverlay
        pageNum={1}
        highlights={[
          { fieldName: "name", color: "#FBBF24" },
          { fieldName: "email", color: "#FBBF24" },
        ]}
        fieldRects={fieldRects}
        pageSize={pageSize}
        filledData={filledData}
        activeField="name"
        onFieldClick={() => {}}
      />,
    );
    const nameBox = getByRole("button", { name: /active field: name/i }) as HTMLElement;
    const emailBox = getByRole("button", { name: /empty field: email/i }) as HTMLElement;
    // Active field should have blue background
    expect(nameBox.style.backgroundColor).toContain("59");
    expect(nameBox.style.backgroundColor).toContain("130");
    expect(nameBox.style.backgroundColor).toContain("246");
    // Empty field should have gray background
    expect(emailBox.style.backgroundColor).toContain("156");
    expect(emailBox.style.backgroundColor).toContain("163");
  });

  it("sanitizes unsafe color values", () => {
    const { container } = render(
      <FieldHighlightOverlay
        pageNum={1}
        highlights={[{ fieldName: "name", color: "javascript:alert(1)" }]}
        fieldRects={fieldRects}
        pageSize={pageSize}
      />,
    );
    const box = container.querySelector("[aria-hidden='true']") as HTMLElement;
    // Should fall back to #888888, not use the malicious value
    expect(box.style.backgroundColor).not.toContain("javascript");
  });

  it("exposes keyboard support for select and edit actions", () => {
    const onClick = vi.fn();
    const onDblClick = vi.fn();
    const { getByRole } = render(
      <FieldHighlightOverlay
        pageNum={1}
        highlights={[{ fieldName: "name", color: "#ff0000" }]}
        fieldRects={fieldRects}
        pageSize={pageSize}
        onFieldClick={onClick}
        onFieldDoubleClick={onDblClick}
      />,
    );
    const box = getByRole("button", { name: /press enter or space to select\. press f2 to edit\./i });

    fireEvent.keyDown(box, { key: "Enter" });
    fireEvent.keyDown(box, { key: " " });
    fireEvent.keyDown(box, { key: "F2" });

    expect(onClick).toHaveBeenCalledTimes(2);
    expect(onDblClick).toHaveBeenCalledWith("name", expect.objectContaining({
      left: expect.any(Number),
      top: expect.any(Number),
      width: expect.any(Number),
      height: expect.any(Number),
    }));
  });

  it("uses human-readable field labels for accessible names", () => {
    const { getByRole } = render(
      <FieldHighlightOverlay
        pageNum={1}
        highlights={[{ fieldName: "name", color: "#ff0000" }]}
        fieldRects={fieldRects}
        pageSize={pageSize}
        fieldLabels={{ name: "Full name" }}
        onFieldClick={() => {}}
      />,
    );

    expect(getByRole("button", { name: /field: full name\./i })).toBeTruthy();
  });
});
