/**
 * Example 2 — Active field tracking
 *
 * Highlight the currently focused form field in blue.
 * Perfect for a side-by-side form + preview layout.
 */

"use client";

import { useState } from "react";
import AcroFormPreview from "react-pdf-form-preview";

export default function ActiveFieldExample() {
  const [activeField, setActiveField] = useState<string | undefined>();
  const [formData, setFormData] = useState({
    buyer_name: "",
    contract_date: "",
    price: "",
  });

  return (
    <div style={{ display: "flex", gap: 24 }}>
      {/* Left: simple form */}
      <form style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
        {(["buyer_name", "contract_date", "price"] as const).map((field) => (
          <input
            key={field}
            placeholder={field}
            value={formData[field]}
            onFocus={() => setActiveField(field)}
            onBlur={() => setActiveField(undefined)}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, [field]: e.target.value }))
            }
          />
        ))}
      </form>

      {/* Right: live PDF preview */}
      <div style={{ flex: 1 }}>
        <AcroFormPreview
          templateUrl="/templates/contract.pdf"
          workerSrc="/pdf.worker.min.mjs"
          data={formData}
          activeField={activeField}
          highlightAllFields
        />
      </div>
    </div>
  );
}
