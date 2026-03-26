/**
 * Example 1 — Basic usage
 *
 * Display a filled PDF form from a URL template.
 * Fields are auto-highlighted: yellow = filled, grey = empty.
 */

"use client"; // Next.js: client component required

import AcroFormPreview from "react-pdf-form-preview";

export default function BasicExample() {
  return (
    <AcroFormPreview
      templateUrl="/templates/contract.pdf"
      workerSrc="/pdf.worker.min.mjs"
      data={{
        buyer_name: "John Smith",
        contract_date: "01.01.2025",
        price: "150 000",
        vehicle_vin: "XTA210990Y2764763",
      }}
      highlightAllFields
    />
  );
}
