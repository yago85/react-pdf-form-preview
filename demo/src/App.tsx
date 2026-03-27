import { useEffect, useRef, useState } from "react";
import AcroFormPreview, {
  DataTransformer,
  FormData,
  distributeTextToLines,
} from "react-pdf-form-preview";

import { createMultiPageSamplePdf, createSamplePdf } from "./createSamplePdf";

// Resolve the bundled worker URL — Vite replaces import.meta.url at build time
const WORKER_SRC = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

// ── Types ────────────────────────────────────────────────────────────────────

type ExampleId =
  | "basic"
  | "active-field"
  | "highlight"
  | "download"
  | "inline-edit"
  | "multi-page"
  | "upload";

const EXAMPLES: { id: ExampleId; label: string; description: string }[] = [
  {
    id: "basic",
    label: "1 · Basic",
    description:
      "Fill form fields on the left and see the PDF update in real time on the right. All AcroForm fields are highlighted (yellow = filled, grey = empty).",
  },
  {
    id: "active-field",
    label: "2 · Active field",
    description:
      "Click on an input — the matching PDF field lights up blue. This connects your form to the PDF preview visually.",
  },
  {
    id: "highlight",
    label: "3 · Manual highlight",
    description:
      "Highlight specific fields with custom colors — useful for guiding users.",
  },
  {
    id: "download",
    label: "4 · Download PDF",
    description: "Capture the filled PDF bytes and download the file.",
  },
  {
    id: "inline-edit",
    label: "5 · Inline editing",
    description:
      "Double-click any highlighted field directly in the PDF to edit it in place. No external form needed.",
  },
  {
    id: "multi-page",
    label: "6 · Multi-page",
    description:
      "A 3-page contract with fields on every page. Use page buttons to navigate, or toggle 'Show all pages' to view every page at once. Demonstrates the visiblePages prop.",
  },
  {
    id: "upload",
    label: "7 · Upload your PDF",
    description:
      "Upload any fillable PDF from your device — it stays 100% local, nothing is sent to a server. AcroForm fields are detected automatically and become editable inputs.",
  },
];

// ── Styles ───────────────────────────────────────────────────────────────────

const s = {
  layout: {
    minHeight: "100vh",
    background: "#f0f2f5",
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
  } as React.CSSProperties,
  header: {
    background: "#1a3a5c",
    color: "#fff",
    padding: "20px 40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap" as const,
    gap: 12,
  } as React.CSSProperties,
  h1: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: -0.5,
  } as React.CSSProperties,
  sub: { margin: "4px 0 0", fontSize: 13, opacity: 0.7 } as React.CSSProperties,
  links: { display: "flex", gap: 12 } as React.CSSProperties,
  link: {
    color: "#9ec8ff",
    textDecoration: "none",
    fontSize: 13,
    padding: "4px 10px",
    borderRadius: 6,
    border: "1px solid rgba(158,200,255,0.3)",
  } as React.CSSProperties,
  tabs: {
    background: "#fff",
    borderBottom: "1px solid #dde3ec",
    display: "flex",
    padding: "0 40px",
    overflowX: "auto" as const,
  } as React.CSSProperties,
  tab: (a: boolean): React.CSSProperties => ({
    padding: "14px 20px",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: a ? 600 : 400,
    color: a ? "#1a3a5c" : "#666",
    background: "none",
    border: "none",
    borderBottom: `2px solid ${a ? "#1a3a5c" : "transparent"}`,
    whiteSpace: "nowrap",
    transition: "color .15s",
  }),
  main: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "32px 24px",
    display: "grid",
    gridTemplateColumns: "340px 1fr",
    gap: 24,
    alignItems: "start",
  } as React.CSSProperties,
  mainWide: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "32px 24px",
  } as React.CSSProperties,
  panel: {
    background: "#fff",
    borderRadius: 10,
    border: "1px solid #dde3ec",
    padding: 24,
    boxShadow: "0 1px 4px rgba(0,0,0,.06)",
  } as React.CSSProperties,
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: "#555",
    marginBottom: 4,
    display: "block",
  } as React.CSSProperties,
  input: {
    width: "100%",
    padding: "8px 10px",
    borderRadius: 6,
    border: "1px solid #d0d7e3",
    fontSize: 13,
    outline: "none",
    background: "#fafbfc",
    boxSizing: "border-box" as const,
  },
  inputActive: {
    border: "1px solid #3b82f6",
    boxShadow: "0 0 0 3px rgba(59,130,246,.12)",
    background: "#fff",
  } as React.CSSProperties,
  btn: {
    width: "100%",
    padding: "10px 0",
    background: "#1a3a5c",
    color: "#fff",
    border: "none",
    borderRadius: 7,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 12,
  } as React.CSSProperties,
  badge: {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
    marginRight: 6,
    marginBottom: 6,
  } as React.CSSProperties,
  desc: {
    fontSize: 13,
    color: "#555",
    marginBottom: 20,
    lineHeight: 1.5,
  } as React.CSSProperties,
  hint: {
    fontSize: 12,
    color: "#888",
    marginTop: 6,
    lineHeight: 1.5,
  } as React.CSSProperties,
  fieldRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 0",
    borderBottom: "1px solid #f0f2f5",
    fontSize: 13,
  } as React.CSSProperties,
  fieldName: {
    color: "#888",
    fontSize: 11,
    fontFamily: "monospace",
  } as React.CSSProperties,
  fieldVal: {
    color: "#1a3a5c",
    fontWeight: 500,
    maxWidth: 180,
    textOverflow: "ellipsis",
    overflow: "hidden",
    whiteSpace: "nowrap" as const,
  } as React.CSSProperties,
};

// ── Field definitions ────────────────────────────────────────────────────────

const FORM_FIELDS = [
  { name: "doc_number", label: "Agreement No." },
  { name: "doc_date", label: "Date" },
  { name: "client_name", label: "Client name" },
  { name: "client_address", label: "Client address" },
  { name: "client_phone", label: "Phone" },
  { name: "client_email", label: "Email" },
  { name: "service_desc", label: "Service description" },
  { name: "amount", label: "Amount (USD)" },
  { name: "payment_terms", label: "Payment terms" },
  { name: "provider_name", label: "Provider name" },
  { name: "client_sign", label: "Client signature" },
];

const DEFAULT_DATA: Record<string, string> = {
  doc_number: "AGR-2025-001",
  doc_date: "01.01.2025",
  client_name: "Acme Corporation",
  client_address: "123 Business Ave, New York, NY 10001",
  client_phone: "+1 (555) 000-1234",
  client_email: "legal@acme.com",
  service_desc:
    "Web application development including design, frontend and backend implementation.",
  amount: "$ 12,500",
  payment_terms: "Net 30",
  provider_name: "John Smith",
  client_sign: "Jane Doe",
};

// Derived multiline fields — hidden from highlights/interaction;
// only the primary field (service_desc) is highlighted and editable.
const DERIVED_FIELDS = new Set(["service_desc_2", "service_desc_3"]);

// ── DataTransformer: split service_desc into 3 PDF lines ─────────────────────
// Uses real font metrics (font.widthOfTextAtSize) when available for precise wrapping.

const serviceTransformer: DataTransformer = (data, options) => {
  const text = String(data.service_desc ?? "");
  const lines = distributeTextToLines(
    text,
    3,
    options?.font,
    options?.fontSize ?? 8,
    options?.fieldWidthPt,
  );
  const result: FormData = { ...data };

  delete result.service_desc;
  result.service_desc = lines[0];
  result.service_desc_2 = lines[1];
  result.service_desc_3 = lines[2];

  return result;
};

// ── InlineEditor ─────────────────────────────────────────────────────────────

interface InlineEditorState {
  fieldName: string;
  rect: { left: number; top: number; width: number; height: number };
}

function InlineEditor({
  state,
  value,
  onChange,
  onClose,
}: {
  state: InlineEditorState;
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const id = setTimeout(() => {
      const el = textareaRef.current;

      if (!el) return;
      el.focus();
      // Place cursor at end
      el.setSelectionRange(el.value.length, el.value.length);
    }, 30);

    return () => clearTimeout(id);
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        left: `${state.rect.left}%`,
        top: `${state.rect.top}%`,
        width: `${state.rect.width}%`,
        height: `${state.rect.height}%`,
        zIndex: 10,
      }}
    >
      <textarea
        ref={textareaRef}
        style={{
          width: "100%",
          height: "100%",
          padding: "4px 6px",
          border: "2px solid #3b82f6",
          borderRadius: 2,
          outline: "none",
          fontSize: 11,
          lineHeight: 1.4,
          background: "rgba(255,255,255,0.97)",
          boxShadow: "0 2px 12px rgba(59,130,246,0.25)",
          boxSizing: "border-box",
          resize: "none",
          overflow: "hidden",
          fontFamily: "inherit",
        }}
        value={value}
        onBlur={onClose}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
      />
    </div>
  );
}

// ── Multi-page field definitions & defaults ─────────────────────────────────

const MP_FORM_FIELDS = [
  { name: "contract_no", label: "Contract No.", page: 1 },
  { name: "contract_date", label: "Date", page: 1 },
  { name: "party_a", label: "Party A (Provider)", page: 1 },
  { name: "party_b", label: "Party B (Client)", page: 1 },
  { name: "subject", label: "Subject", page: 1 },
  { name: "payment_amount", label: "Amount", page: 2 },
  { name: "payment_method", label: "Payment method", page: 2 },
  { name: "deadline", label: "Deadline", page: 2 },
  { name: "penalty", label: "Penalty (%)", page: 2 },
  { name: "sign_a", label: "Party A signature", page: 3 },
  { name: "sign_b", label: "Party B signature", page: 3 },
  { name: "sign_date", label: "Sign date", page: 3 },
];

const MP_DEFAULT_DATA: Record<string, string> = {
  contract_no: "CTR-2025-042",
  contract_date: "15.03.2025",
  party_a: "Global Tech Solutions LLC",
  party_b: "Acme Corporation",
  subject: "Full-stack web application development",
  payment_amount: "$ 25,000",
  payment_method: "Bank transfer",
  deadline: "01.09.2025",
  penalty: "0.5",
  sign_a: "Alex Johnson",
  sign_b: "Jane Doe",
  sign_date: "15.03.2025",
};

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [activeExample, setActiveExample] = useState<ExampleId>("basic");
  const [templateBuffer, setTemplateBuffer] = useState<
    ArrayBuffer | undefined
  >();
  const [formData, setFormData] =
    useState<Record<string, string>>(DEFAULT_DATA);
  const [activeField, setActiveField] = useState<string | undefined>();
  const [downloadReady, setDownloadReady] = useState(false);
  const [inlineEditor, setInlineEditor] = useState<InlineEditorState | null>(
    null,
  );
  // Multi-page state
  const [multiPageBuffer, setMultiPageBuffer] = useState<
    ArrayBuffer | undefined
  >();
  const [multiPageData, setMultiPageData] =
    useState<Record<string, string>>(MP_DEFAULT_DATA);
  const [visiblePage, setVisiblePage] = useState<number | null>(null); // null = show all
  const [mpActiveField, setMpActiveField] = useState<string | undefined>();
  const filledBytesRef = useRef<Uint8Array | null>(null);
  // Upload example state
  const [uploadedBuffer, setUploadedBuffer] = useState<ArrayBuffer | null>(
    null,
  );
  const [uploadedFields, setUploadedFields] = useState<string[]>([]);
  const [uploadedData, setUploadedData] = useState<Record<string, string>>({});
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [uploadDownloadReady, setUploadDownloadReady] = useState(false);
  const [uploadActiveField, setUploadActiveField] = useState<
    string | undefined
  >();
  const [uploadIsDragOver, setUploadIsDragOver] = useState(false);
  const uploadFilledBytesRef = useRef<Uint8Array | null>(null);
  const uploadInitializedRef = useRef(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const fieldRectsRef = useRef<Map<string, { page: number; rect: number[] }>>(
    new Map(),
  );
  const pageSizesRef = useRef<Map<number, { width: number; height: number }>>(
    new Map(),
  );

  useEffect(() => {
    createSamplePdf().then(setTemplateBuffer);
    createMultiPageSamplePdf().then(setMultiPageBuffer);
  }, []);

  const handleChange = (name: string, value: string) =>
    setFormData((prev) => ({ ...prev, [name]: value }));

  const loadPdfFile = (file: File) => {
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const buffer = ev.target?.result as ArrayBuffer;
      uploadInitializedRef.current = false;
      uploadFilledBytesRef.current = null;
      setUploadedBuffer(buffer);
      setUploadedFields([]);
      setUploadedData({});
      setUploadDownloadReady(false);
      setUploadActiveField(undefined);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    loadPdfFile(file);
  };

  const handleUploadDownload = () => {
    if (!uploadFilledBytesRef.current) return;
    const blob = new Blob([uploadFilledBytesRef.current as any], {
      type: "application/pdf",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    document.body.appendChild(a);
    a.href = url;
    a.download = uploadedFileName || "filled.pdf";
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  const handleDownload = () => {
    if (!filledBytesRef.current) return;
    const bytes = filledBytesRef.current;
    const blob = new Blob([bytes as any], { type: "application/pdf" });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.style.display = "none";
    document.body.appendChild(a);
    a.href = url;
    a.download = "service-agreement-filled.pdf";
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  const handleDoubleClick = (
    fieldName: string,
    rect: { left: number; top: number; width: number; height: number },
  ) => {
    // For service_desc, expand the editor to cover all 3 derived PDF lines
    let editorRect = rect;

    if (fieldName === "service_desc") {
      const pageSize = pageSizesRef.current.get(1);
      const r2 = fieldRectsRef.current.get("service_desc_2");
      const r3 = fieldRectsRef.current.get("service_desc_3");

      if (pageSize && r3) {
        const { width: W, height: H } = pageSize;
        // Last derived field's bottom edge in % (PDF y is bottom-left: y1 = bottom)
        const lastRect = r3.rect;
        const bottomPct = ((H - lastRect[1]) / H) * 100;

        editorRect = { ...rect, height: bottomPct - rect.top };
      } else if (r2) {
        // Fallback: at least cover first 2 lines
        editorRect = { ...rect, height: rect.height * 2 };
      }
    }
    setInlineEditor({ fieldName, rect: editorRect });
    setActiveField(fieldName);
  };

  const manualHighlights =
    activeExample === "highlight"
      ? [
          { fieldName: "client_name", color: "#22c55e" },
          { fieldName: "client_address", color: "#22c55e" },
          { fieldName: "client_phone", color: "#f59e0b" },
          { fieldName: "client_email", color: "#f59e0b" },
          { fieldName: "amount", color: "#ef4444" },
          { fieldName: "payment_terms", color: "#ef4444" },
        ]
      : undefined;

  // ── Upload example (no sample PDF needed) ──────────────────────────────
  if (activeExample === "upload") {
    const uploadHandleChange = (name: string, value: string) =>
      setUploadedData((prev) => ({ ...prev, [name]: value }));

    const uploadExample = EXAMPLES.find((e) => e.id === "upload")!;

    return (
      <div style={s.layout}>
        <Header />
        <Tabs
          active={activeExample}
          onSelect={(id) => {
            setActiveExample(id);
            setInlineEditor(null);
            setUploadActiveField(undefined);
          }}
        />
        <main style={s.main}>
          {/* Left: file upload + dynamic fields */}
          <div
            style={{
              ...s.panel,
              maxHeight: "85vh",
              overflowY: "auto",
              position: "sticky" as const,
              top: 16,
            }}
          >
            <p style={s.desc}>{uploadExample.description}</p>

            {/* Drop-zone / file picker */}
            <label
              style={{
                display: "block",
                border: `2px dashed ${
                  uploadIsDragOver
                    ? "#3b82f6"
                    : uploadedBuffer
                      ? "#86efac"
                      : "#d0d7e3"
                }`,
                borderRadius: 8,
                padding: "18px 12px",
                textAlign: "center" as const,
                cursor: "pointer",
                marginBottom: 16,
                background: uploadIsDragOver
                  ? "#eff6ff"
                  : uploadedBuffer
                    ? "#f0fdf4"
                    : "#fafbfc",
                transition: "border-color .15s, background .15s",
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setUploadIsDragOver(true);
              }}
              onDragLeave={() => setUploadIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setUploadIsDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (!file || file.type !== "application/pdf") return;
                loadPdfFile(file);
              }}
            >
              <input
                type="file"
                accept=".pdf,application/pdf"
                style={{ display: "none" }}
                onChange={handleFileUpload}
              />
              {uploadedBuffer ? (
                <>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>✅</div>
                  <div
                    style={{ fontSize: 13, fontWeight: 600, color: "#166534" }}
                  >
                    {uploadedFileName}
                  </div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                    {uploadedFields.length} field(s) detected · click to replace
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>
                    {uploadIsDragOver ? "⬇️" : "📄"}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: uploadIsDragOver ? "#1d4ed8" : "#555",
                    }}
                  >
                    {uploadIsDragOver
                      ? "Drop PDF here"
                      : "Click or drag a PDF here"}
                  </div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                    Only AcroForm PDFs will show fillable fields
                  </div>
                </>
              )}
            </label>

            {/* Dynamic form fields */}
            {uploadedFields.length > 0 && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {uploadedFields.map((name) => {
                  const isActive = uploadActiveField === name;
                  return (
                    <div key={name}>
                      <label style={s.label}>{name}</label>
                      <input
                        placeholder={name}
                        style={{
                          ...s.input,
                          ...(isActive ? s.inputActive : {}),
                        }}
                        value={uploadedData[name] ?? ""}
                        onChange={(e) =>
                          uploadHandleChange(name, e.target.value)
                        }
                        onFocus={() => setUploadActiveField(name)}
                        onBlur={() => setUploadActiveField(undefined)}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {uploadedBuffer && uploadedFields.length === 0 && (
              <div
                style={{
                  ...s.hint,
                  textAlign: "center" as const,
                  padding: 16,
                  background: "#fffbeb",
                  border: "1px solid #fde68a",
                  borderRadius: 8,
                  color: "#92400e",
                }}
              >
                No AcroForm fields detected in this PDF.
              </div>
            )}

            {uploadedFields.length > 0 && (
              <button
                disabled={!uploadDownloadReady}
                style={{ ...s.btn, opacity: uploadDownloadReady ? 1 : 0.5 }}
                onClick={handleUploadDownload}
              >
                {uploadDownloadReady ? "⬇ Download filled PDF" : "Rendering…"}
              </button>
            )}
          </div>

          {/* Right: PDF preview */}
          <div
            style={{
              ...s.panel,
              maxHeight: "85vh",
              overflowY: "auto",
              position: "sticky" as const,
              top: 16,
            }}
          >
            {uploadedBuffer ? (
              <AcroFormPreview
                activeField={uploadActiveField}
                data={uploadedData}
                debounceMs={150}
                fontSrc="/react-pdf-form-preview/fonts/Roboto-Regular.ttf"
                highlightAllFields
                scale={1.6}
                templateBuffer={uploadedBuffer}
                workerSrc={WORKER_SRC}
                onFieldRectsReady={(rects) => {
                  if (!uploadInitializedRef.current) {
                    uploadInitializedRef.current = true;
                    const names = Array.from(rects.keys());
                    setUploadedFields(names);
                    setUploadedData(
                      Object.fromEntries(names.map((n) => [n, ""])),
                    );
                    setUploadDownloadReady(false);
                  }
                }}
                onPdfGenerated={(bytes) => {
                  uploadFilledBytesRef.current = bytes;
                  if (!uploadDownloadReady) setUploadDownloadReady(true);
                }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 300,
                  color: "#bbb",
                }}
              >
                <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                <div style={{ fontSize: 14 }}>
                  Upload a PDF to preview it here
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  if (!templateBuffer) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            borderWidth: 3,
            borderStyle: "solid",
            borderColor: "#e5e7eb",
            borderTopColor: "#1a3a5c",
            animation: "spin .8s linear infinite",
          }}
        />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ color: "#666", fontSize: 14 }}>
          Generating sample PDF…
        </div>
      </div>
    );
  }

  const isInlineEditMode = activeExample === "inline-edit";
  const isMultiPageMode = activeExample === "multi-page";
  const supportsActiveField =
    activeExample !== "basic" &&
    activeExample !== "highlight" &&
    !isMultiPageMode;
  const currentExample = EXAMPLES.find((e) => e.id === activeExample)!;

  // ── Shared PDF preview ──────────────────────────────────────────────────

  const pdfPreview = (
    <div ref={previewRef}>
      <AcroFormPreview
        activeField={supportsActiveField ? activeField : undefined}
        data={formData}
        dataTransformer={serviceTransformer}
        debounceMs={150}
        fieldsRequiringRecalculation={["service_desc"]}
        fontSrc="/react-pdf-form-preview/fonts/Roboto-Regular.ttf"
        hiddenFields={DERIVED_FIELDS}
        highlightAllFields={!manualHighlights}
        highlightFields={manualHighlights}
        renderPageOverlay={(pageNum) => {
          if (!isInlineEditMode || !inlineEditor) return null;
          const fieldPage =
            fieldRectsRef.current.get(inlineEditor.fieldName)?.page ?? 1;

          if (pageNum !== fieldPage) return null;

          return (
            <InlineEditor
              state={inlineEditor}
              value={formData[inlineEditor.fieldName] ?? ""}
              onChange={(v) => handleChange(inlineEditor.fieldName, v)}
              onClose={() => {
                setInlineEditor(null);
                setActiveField(undefined);
              }}
            />
          );
        }}
        scale={1.6}
        templateBuffer={templateBuffer}
        workerSrc={WORKER_SRC}
        onFieldDoubleClick={isInlineEditMode ? handleDoubleClick : undefined}
        onFieldRectsReady={(rects) => {
          fieldRectsRef.current = rects;
        }}
        onPageSizesReady={(sizes) => {
          pageSizesRef.current = sizes;
        }}
        onPdfGenerated={(bytes) => {
          filledBytesRef.current = bytes;
          if (!downloadReady) setDownloadReady(true);
        }}
      />
    </div>
  );

  // ── Multi-page example ──────────────────────────────────────────────────
  if (isMultiPageMode) {
    const mpHandleChange = (name: string, value: string) =>
      setMultiPageData((prev) => ({ ...prev, [name]: value }));

    // Group fields by page
    const pageGroups = [1, 2, 3].map((p) => ({
      page: p,
      label:
        p === 1
          ? "General Info"
          : p === 2
            ? "Terms & Conditions"
            : "Signatures",
      fields: MP_FORM_FIELDS.filter((f) => f.page === p),
    }));

    return (
      <div style={s.layout}>
        <Header />
        <Tabs
          active={activeExample}
          onSelect={(id) => {
            setActiveExample(id);
            setInlineEditor(null);
          }}
        />
        <main style={s.main}>
          {/* Left: form grouped by page */}
          <div
            style={{
              ...s.panel,
              maxHeight: "85vh",
              overflowY: "auto",
              position: "sticky" as const,
              top: 16,
            }}
          >
            <p style={s.desc}>{currentExample.description}</p>

            {/* Page navigation buttons */}
            <div
              style={{
                marginBottom: 16,
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <button
                style={{
                  ...s.btn,
                  width: "auto",
                  padding: "6px 14px",
                  fontSize: 12,
                  marginTop: 0,
                  background: visiblePage === null ? "#1a3a5c" : "#e5e7eb",
                  color: visiblePage === null ? "#fff" : "#333",
                }}
                onClick={() => setVisiblePage(null)}
              >
                All pages
              </button>
              {[1, 2, 3].map((p) => (
                <button
                  key={p}
                  style={{
                    ...s.btn,
                    width: "auto",
                    padding: "6px 14px",
                    fontSize: 12,
                    marginTop: 0,
                    background: visiblePage === p ? "#1a3a5c" : "#e5e7eb",
                    color: visiblePage === p ? "#fff" : "#333",
                  }}
                  onClick={() => setVisiblePage(p)}
                >
                  Page {p}
                </button>
              ))}
            </div>

            {pageGroups.map(({ page, label, fields }) => (
              <div key={page} style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#1a3a5c",
                    marginBottom: 8,
                    paddingBottom: 4,
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  Page {page}: {label}
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {fields.map(({ name, label: fLabel }) => {
                    const isActive = mpActiveField === name;
                    return (
                      <div key={name}>
                        <label style={s.label}>{fLabel}</label>
                        <input
                          placeholder={fLabel}
                          style={{
                            ...s.input,
                            ...(isActive ? s.inputActive : {}),
                          }}
                          value={multiPageData[name] ?? ""}
                          onChange={(e) => mpHandleChange(name, e.target.value)}
                          onFocus={() => setMpActiveField(name)}
                          onBlur={() => setMpActiveField(undefined)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Right: multi-page PDF preview */}
          <div
            style={{
              ...s.panel,
              maxHeight: "85vh",
              overflowY: "auto",
              position: "sticky" as const,
              top: 16,
            }}
          >
            {multiPageBuffer ? (
              <AcroFormPreview
                activeField={mpActiveField}
                data={multiPageData}
                debounceMs={150}
                fontSrc="/react-pdf-form-preview/fonts/Roboto-Regular.ttf"
                highlightAllFields
                scale={1.6}
                templateBuffer={multiPageBuffer}
                visiblePages={visiblePage ? [visiblePage] : undefined}
                workerSrc={WORKER_SRC}
              />
            ) : (
              <div style={{ textAlign: "center", padding: 40, color: "#888" }}>
                Generating multi-page PDF…
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ── Inline-edit example: full-width layout ──────────────────────────────
  if (isInlineEditMode) {
    return (
      <div style={s.layout}>
        <Header />
        <Tabs
          active={activeExample}
          onSelect={(id) => {
            setActiveExample(id);
            setInlineEditor(null);
            setActiveField(undefined);
          }}
        />
        <div style={s.mainWide}>
          <div style={s.panel}>
            <p style={s.desc}>{currentExample.description}</p>
            <div
              style={{
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: 8,
                padding: "10px 14px",
                marginBottom: 20,
                fontSize: 13,
                color: "#92400e",
              }}
            >
              Double-click any highlighted field in the PDF below to edit it
              directly. Press{" "}
              <kbd
                style={{
                  background: "#fff",
                  border: "1px solid #ddd",
                  borderRadius: 3,
                  padding: "1px 5px",
                }}
              >
                Enter
              </kbd>{" "}
              or click outside to confirm.
            </div>

            {/* Current field values — live readout */}
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#555",
                  marginBottom: 8,
                }}
              >
                Current values
              </div>
              {FORM_FIELDS.map(({ name, label }) => (
                <div key={name} style={s.fieldRow}>
                  <span style={s.fieldName}>{label}</span>
                  <span
                    style={{
                      ...s.fieldVal,
                      color: formData[name] ? "#1a3a5c" : "#ccc",
                    }}
                  >
                    {formData[name] || "—"}
                  </span>
                </div>
              ))}
            </div>

            {pdfPreview}
          </div>
        </div>
      </div>
    );
  }

  // ── Standard two-column layout ──────────────────────────────────────────
  return (
    <div style={s.layout}>
      <Header />
      <Tabs
        active={activeExample}
        onSelect={(id) => {
          setActiveExample(id);
          setInlineEditor(null);
        }}
      />
      <main style={s.main}>
        {/* Left: form */}
        <div style={s.panel}>
          <p style={s.desc}>{currentExample.description}</p>

          {activeExample === "highlight" && (
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#555",
                  marginBottom: 8,
                }}
              >
                Legend
              </div>
              {[
                ["#22c55e", "Contact"],
                ["#f59e0b", "Communication"],
                ["#ef4444", "Payment"],
              ].map(([color, label]) => (
                <span
                  key={color}
                  style={{
                    ...s.badge,
                    background: color + "22",
                    color,
                    border: `1px solid ${color}66`,
                  }}
                >
                  {label}
                </span>
              ))}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {FORM_FIELDS.map(({ name, label }) => {
              const isActive = supportsActiveField && activeField === name;

              return (
                <div key={name}>
                  <label style={s.label}>{label}</label>
                  <input
                    placeholder={label}
                    style={{ ...s.input, ...(isActive ? s.inputActive : {}) }}
                    value={formData[name] ?? ""}
                    onBlur={
                      supportsActiveField
                        ? () => setActiveField(undefined)
                        : undefined
                    }
                    onChange={(e) => handleChange(name, e.target.value)}
                    onFocus={
                      supportsActiveField
                        ? () => setActiveField(name)
                        : undefined
                    }
                  />
                </div>
              );
            })}
          </div>

          {activeExample === "download" && (
            <button
              disabled={!downloadReady}
              style={{ ...s.btn, opacity: downloadReady ? 1 : 0.5 }}
              onClick={handleDownload}
            >
              {downloadReady ? "⬇ Download filled PDF" : "Rendering…"}
            </button>
          )}
        </div>

        {/* Right: PDF preview */}
        <div style={s.panel}>{pdfPreview}</div>
      </main>
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function Header() {
  return (
    <header style={s.header}>
      <div>
        <h1 style={s.h1}>react-pdf-form-preview</h1>
        <p style={s.sub}>Fill and preview PDF AcroForm documents in React</p>
      </div>
      <div style={s.links}>
        <a
          href="https://github.com/yago85/react-pdf-form-preview"
          rel="noreferrer"
          style={s.link}
          target="_blank"
        >
          GitHub
        </a>
        <a
          href="https://www.npmjs.com/package/react-pdf-form-preview"
          rel="noreferrer"
          style={s.link}
          target="_blank"
        >
          npm
        </a>
      </div>
    </header>
  );
}

function Tabs({
  active,
  onSelect,
}: {
  active: ExampleId;
  onSelect: (id: ExampleId) => void;
}) {
  return (
    <nav style={s.tabs}>
      {EXAMPLES.map((ex) => (
        <button
          key={ex.id}
          style={s.tab(active === ex.id)}
          onClick={() => onSelect(ex.id)}
        >
          {ex.label}
        </button>
      ))}
    </nav>
  );
}
