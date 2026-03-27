/**
 * Example 7 — Upload a local PDF and fill it
 *
 * The user picks (or drag-and-drops) a PDF from their device.
 * The file is read locally via FileReader — nothing is sent to a server.
 *
 * Key techniques:
 *  - `templateBuffer`    — pass the ArrayBuffer directly to skip any fetch
 *  - `onFieldRectsReady` — discover field names from an unknown PDF at runtime
 *  - `activeField`       — highlight the focused input in the PDF preview (blue)
 *  - `onPdfGenerated`    — capture filled bytes for client-side download
 */

"use client";

import { useRef, useState } from "react";
import AcroFormPreview from "react-pdf-form-preview";

export default function UploadLocalPdfExample() {
  const [templateBuffer, setTemplateBuffer] = useState<ArrayBuffer | null>(
    null,
  );
  const [fileName, setFileName] = useState("");
  const [fields, setFields] = useState<string[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [activeField, setActiveField] = useState<string | undefined>();
  const [isDragOver, setIsDragOver] = useState(false);

  const filledBytesRef = useRef<Uint8Array | null>(null);
  // Guard against re-initializing fields on every re-render
  const initializedRef = useRef(false);

  const loadFile = (file: File) => {
    if (file.type !== "application/pdf") return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      filledBytesRef.current = null;
      initializedRef.current = false;
      setTemplateBuffer(e.target?.result as ArrayBuffer);
      setFields([]);
      setFormData({});
      setActiveField(undefined);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
  };

  const handleDownload = () => {
    if (!filledBytesRef.current) return;
    const blob = new Blob([filledBytesRef.current as unknown as BlobPart], {
      type: "application/pdf",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "filled.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
      {/* Left: file picker + dynamic form */}
      <div
        style={{
          flex: "0 0 280px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* Drop-zone */}
        <label
          style={{
            display: "block",
            border: `2px dashed ${isDragOver ? "#3b82f6" : "#ccc"}`,
            borderRadius: 8,
            padding: 20,
            textAlign: "center",
            cursor: "pointer",
            background: isDragOver ? "#eff6ff" : "#fafafa",
            transition: "border-color .15s, background .15s",
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) loadFile(file);
          }}
        >
          <input
            type="file"
            accept=".pdf,application/pdf"
            style={{ display: "none" }}
            onChange={handleInputChange}
          />
          {templateBuffer
            ? `✅ ${fileName} (${fields.length} fields)`
            : isDragOver
              ? "⬇️ Drop PDF here"
              : "📄 Click or drag a PDF here"}
        </label>

        {/* Auto-generated inputs for every detected field */}
        {fields.map((name) => (
          <input
            key={name}
            placeholder={name}
            value={formData[name] ?? ""}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, [name]: e.target.value }))
            }
            onFocus={() => setActiveField(name)}
            onBlur={() => setActiveField(undefined)}
          />
        ))}

        {fields.length > 0 && (
          <button onClick={handleDownload}>⬇ Download filled PDF</button>
        )}
      </div>

      {/* Right: live PDF preview */}
      <div style={{ flex: 1 }}>
        {templateBuffer ? (
          <AcroFormPreview
            templateBuffer={templateBuffer}
            workerSrc="/pdf.worker.min.mjs"
            data={formData}
            activeField={activeField}
            highlightAllFields
            onFieldRectsReady={(rects) => {
              // Runs once per loaded PDF — extract field names dynamically
              if (initializedRef.current) return;
              initializedRef.current = true;
              const names = Array.from(rects.keys());
              setFields(names);
              setFormData(Object.fromEntries(names.map((n) => [n, ""])));
            }}
            onPdfGenerated={(bytes) => {
              filledBytesRef.current = bytes;
            }}
          />
        ) : (
          <div style={{ color: "#aaa" }}>Upload a PDF to preview it here</div>
        )}
      </div>
    </div>
  );
}
