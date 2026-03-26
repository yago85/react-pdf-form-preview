import { PDFFont } from "pdf-lib";

/**
 * Distributes text across multiple PDF field lines using real font metrics
 * when available, falling back to character-count estimation.
 *
 * @param text        - source text to distribute
 * @param numLines    - number of target PDF fields (lines)
 * @param font        - embedded PDFFont (from DataTransformerOptions)
 * @param fontSize    - font size in pt
 * @param maxWidthPt  - field width in pt (from DataTransformerOptions.fieldWidthPt)
 * @param safetyMargin - fraction of field width to use (default 0.95)
 * @param maxLineLength - fallback max char count when no font metrics (default 95)
 */
export function distributeTextToLines(
  text: string,
  numLines: number,
  font?: PDFFont,
  fontSize: number = 8,
  maxWidthPt?: number,
  safetyMargin: number = 0.95,
  maxLineLength: number = 95,
): string[] {
  const result: string[] = [];
  const words = text.split(" ");
  let currentLine = "";
  let lineIndex = 0;

  const usableWidthPt = maxWidthPt ? maxWidthPt * safetyMargin : undefined;

  const fitsInLine = (testLine: string): boolean => {
    if (font && usableWidthPt) {
      try {
        return font.widthOfTextAtSize(testLine, fontSize) <= usableWidthPt;
      } catch {
        return testLine.length <= maxLineLength;
      }
    }
    return testLine.length <= maxLineLength;
  };

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;

    if (fitsInLine(testLine)) {
      currentLine = testLine;
    } else {
      if (lineIndex < numLines - 1) {
        if (currentLine) {
          result.push(currentLine);
          lineIndex++;
          currentLine = word;
        } else {
          // single word wider than line — push as-is
          result.push(word);
          lineIndex++;
        }
      } else {
        // last line: allow up to 1.5× overflow rather than losing text
        const allowOverflow = font && usableWidthPt
          ? font.widthOfTextAtSize(testLine, fontSize) <= usableWidthPt * 1.5
          : testLine.length <= maxLineLength * 1.5;

        if (allowOverflow) {
          currentLine = testLine;
        } else {
          result.push(currentLine);
          lineIndex++;
          currentLine = word;
        }
      }
    }
  }

  if (currentLine) result.push(currentLine);

  // Pad with empty strings to always return numLines elements
  while (result.length < numLines) result.push("");

  return result.slice(0, numLines);
}
