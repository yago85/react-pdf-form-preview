/**
 * Example 5 — Inline editing
 *
 * Double-click any highlighted field directly in the PDF preview to edit it
 * in place — no separate form needed.
 *
 * How it works:
 * - `onFieldDoubleClick` fires with the field name and its position (in %)
 * - An <input> is rendered absolutely over that field
 * - On Enter / blur the input closes and the PDF re-renders with the new value
 */

"use client";

import { useEffect, useRef, useState } from "react";
import AcroFormPreview from "react-pdf-form-preview";

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
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = setTimeout(() => ref.current?.focus(), 30);
    return () => clearTimeout(id);
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        left:   `${state.rect.left}%`,
        top:    `${state.rect.top}%`,
        width:  `${state.rect.width}%`,
        height: `${state.rect.height}%`,
        zIndex: 10,
      }}
    >
      <input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onClose}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === "Escape") onClose();
        }}
        style={{
          width: "100%", height: "100%",
          padding: "0 4px",
          border: "2px solid #3b82f6",
          borderRadius: 2,
          outline: "none",
          fontSize: 11,
          background: "rgba(255,255,255,0.97)",
          boxShadow: "0 2px 12px rgba(59,130,246,0.25)",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

export default function InlineEditingExample() {
  const [formData, setFormData] = useState({
    buyer_name:   "John Smith",
    contract_date:"01.01.2025",
    price:        "$ 12,500",
  });
  const [inlineEditor, setInlineEditor] = useState<InlineEditorState | null>(null);
  const [activeField, setActiveField] = useState<string | undefined>();

  const handleDoubleClick = (
    fieldName: string,
    rect: { left: number; top: number; width: number; height: number },
  ) => {
    setInlineEditor({ fieldName, rect });
    setActiveField(fieldName);
  };

  const handleClose = () => {
    setInlineEditor(null);
    setActiveField(undefined);
  };

  return (
    <div style={{ position: "relative" }}>
      <AcroFormPreview
        templateUrl="/templates/contract.pdf"
        workerSrc="/pdf.worker.min.mjs"
        data={formData}
        activeField={activeField}
        highlightAllFields
        onFieldDoubleClick={handleDoubleClick}
      />

      {inlineEditor && (
        <InlineEditor
          state={inlineEditor}
          value={(formData as any)[inlineEditor.fieldName] ?? ""}
          onChange={(v) =>
            setFormData((prev) => ({ ...prev, [inlineEditor.fieldName]: v }))
          }
          onClose={handleClose}
        />
      )}
    </div>
  );
}
