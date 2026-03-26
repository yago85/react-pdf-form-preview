/**
 * Example 6 — Multi-page PDF
 *
 * Render a multi-page PDF template and control which pages
 * are visible with the `visiblePages` prop.
 */

"use client";

import { useState } from "react";
import AcroFormPreview from "react-pdf-form-preview";

export default function MultiPageExample() {
  // null = show all pages, number = show single page
  const [visiblePage, setVisiblePage] = useState<number | null>(null);

  return (
    <div>
      {/* Page navigation */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button onClick={() => setVisiblePage(null)}>All pages</button>
        <button onClick={() => setVisiblePage(1)}>Page 1</button>
        <button onClick={() => setVisiblePage(2)}>Page 2</button>
        <button onClick={() => setVisiblePage(3)}>Page 3</button>
      </div>

      <AcroFormPreview
        templateUrl="/templates/multi-page-contract.pdf"
        workerSrc="/pdf.worker.min.mjs"
        data={{
          contract_no: "CTR-2025-042",
          contract_date: "15.03.2025",
          party_a: "Global Tech Solutions LLC",
          party_b: "Acme Corporation",
          payment_amount: "$ 25,000",
          sign_a: "Alex Johnson",
          sign_b: "Jane Doe",
        }}
        visiblePages={visiblePage ? [visiblePage] : undefined}
        highlightAllFields
      />
    </div>
  );
}
