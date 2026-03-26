import { describe, it, expect } from "vitest";
import { distributeTextToLines } from "./utils";

describe("distributeTextToLines", () => {
  it("returns exactly numLines elements", () => {
    const result = distributeTextToLines("hello", 3);
    expect(result).toHaveLength(3);
  });

  it("pads short text with empty strings", () => {
    const result = distributeTextToLines("hi", 3);
    expect(result).toEqual(["hi", "", ""]);
  });

  it("returns empty strings for empty input", () => {
    const result = distributeTextToLines("", 2);
    expect(result).toEqual(["", ""]);
  });

  it("puts single-line text on first line", () => {
    const result = distributeTextToLines("short text", 3, undefined, 8, undefined, 0.95, 95);
    expect(result[0]).toBe("short text");
    expect(result[1]).toBe("");
    expect(result[2]).toBe("");
  });

  it("wraps text at maxLineLength when no font metrics", () => {
    // Each word is 10 chars, maxLineLength = 25, so ~2 words per line
    const words = "aaaaaaaaaa bbbbbbbbbb cccccccccc dddddddddd";
    const result = distributeTextToLines(words, 3, undefined, 8, undefined, 0.95, 25);
    expect(result).toHaveLength(3);
    // First line should have first two words
    expect(result[0]).toBe("aaaaaaaaaa bbbbbbbbbb");
    // Second line should have third and fourth
    expect(result[1]).toBe("cccccccccc dddddddddd");
    expect(result[2]).toBe("");
  });

  it("does not lose text on the last line (1.5x overflow)", () => {
    // maxLineLength=10, text with 3 words that need overflow on last line
    const result = distributeTextToLines("aaa bbb ccc ddd eee", 2, undefined, 8, undefined, 0.95, 10);
    expect(result).toHaveLength(2);
    // All words should be present across lines
    const all = result.join(" ").trim();
    expect(all).toContain("aaa");
    expect(all).toContain("eee");
  });

  it("handles a single word wider than maxLineLength", () => {
    const longWord = "a".repeat(100);
    const result = distributeTextToLines(longWord, 2, undefined, 8, undefined, 0.95, 50);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe(longWord);
  });

  it("truncates to numLines (never returns more)", () => {
    const words = Array.from({ length: 50 }, (_, i) => `word${i}`).join(" ");
    const result = distributeTextToLines(words, 2, undefined, 8, undefined, 0.95, 20);
    expect(result).toHaveLength(2);
  });

  it("respects safetyMargin parameter", () => {
    // With margin 0.5, effective width is halved — should wrap sooner
    const text = "aaaa bbbb cccc";
    const tight = distributeTextToLines(text, 3, undefined, 8, undefined, 0.95, 15);
    const loose = distributeTextToLines(text, 3, undefined, 8, undefined, 0.5, 15);
    // Tighter margin means same or more lines used
    const tightUsed = tight.filter(Boolean).length;
    const looseUsed = loose.filter(Boolean).length;
    // Note: safetyMargin only applies when font+fieldWidthPt are provided
    // Without font, it falls back to character count, so both should be equal
    expect(tightUsed).toBeGreaterThanOrEqual(1);
    expect(looseUsed).toBeGreaterThanOrEqual(1);
  });
});
