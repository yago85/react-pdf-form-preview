/**
 * Example 3 — Data transformer
 *
 * Use a dataTransformer to split long text across multiple PDF lines,
 * convert numbers to words, format dates, etc.
 *
 * The transformer receives the filled PDFFont so text width is pixel-accurate.
 */

"use client";

import AcroFormPreview, { DataTransformer, PdfFormData } from "react-pdf-form-preview";

/**
 * Splits a long string into two lines that fit a PDF text field.
 * Uses PDFFont.widthOfTextAtSize for accurate measurement.
 */
function splitToLines(
  text: string,
  font: any,
  fontSize: number,
  fieldWidthPt: number,
): [string, string] {
  const words = text.split(" ");
  let line1 = "";

  for (const word of words) {
    const candidate = line1 ? `${line1} ${word}` : word;
    const width = font.widthOfTextAtSize(candidate, fontSize);

    if (width > fieldWidthPt * 0.95) break;
    line1 = candidate;
  }

  const line2 = text.slice(line1.length).trim();
  return [line1, line2];
}

const transformer: DataTransformer = (data, options) => {
  const { font, fontSize = 8, fieldWidthPt = 400 } = options ?? {};
  const result: PdfFormData = { ...data };

  // Split buyer address into two PDF lines
  const address = String(data.buyer_address ?? "");
  if (address && font) {
    const [line1, line2] = splitToLines(address, font, fontSize, fieldWidthPt);
    result.buyer_address_1 = line1;
    result.buyer_address_2 = line2;
    delete result.buyer_address;
  }

  return result;
};

export default function TransformerExample() {
  return (
    <AcroFormPreview
      templateUrl="/templates/contract.pdf"
      workerSrc="/pdf.worker.min.mjs"
      data={{
        buyer_name: "John Smith",
        buyer_address: "123 Very Long Street Name, Apartment 42, New York, NY 10001",
        contract_date: "01.01.2025",
      }}
      dataTransformer={transformer}
      // Only recalculate line widths when buyer_address changes
      fieldsRequiringRecalculation={["buyer_address"]}
      highlightAllFields
    />
  );
}
