/**
 * Example 4 — ArrayBuffer template + download filled PDF
 *
 * Load the template once, pass it as a buffer (skips repeated fetches),
 * and capture the filled PDF bytes for download.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import AcroFormPreview from "react-pdf-form-preview";

export default function BufferAndDownloadExample() {
  const [templateBuffer, setTemplateBuffer] = useState<ArrayBuffer | undefined>();
  const filledBytesRef = useRef<Uint8Array | null>(null);

  // Load template once on mount
  useEffect(() => {
    fetch("/templates/contract.pdf")
      .then((r) => r.arrayBuffer())
      .then(setTemplateBuffer);
  }, []);

  const handleDownload = () => {
    if (!filledBytesRef.current) return;
    const blob = new Blob([filledBytesRef.current], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contract-filled.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!templateBuffer) return <div>Loading template…</div>;

  return (
    <div>
      <button onClick={handleDownload} style={{ marginBottom: 16 }}>
        Download filled PDF
      </button>

      <AcroFormPreview
        templateBuffer={templateBuffer}
        workerSrc="/pdf.worker.min.mjs"
        data={{
          buyer_name: "Jane Doe",
          contract_date: "15.06.2025",
          price: "250 000",
        }}
        onPdfGenerated={(bytes) => {
          filledBytesRef.current = bytes;
        }}
        highlightAllFields
      />
    </div>
  );
}
