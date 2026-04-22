import React, { useEffect, useRef, useState } from "react";
import FieldHighlightOverlay from "./FieldHighlightOverlay";
import { usePdfFill } from "./hooks/usePdfFill";
import { usePdfRender } from "./hooks/usePdfRender";
import { AcroFormPreviewProps, FieldHighlight, FieldLabelSource, FieldLabels } from "./types";

const DEFAULT_FONT_SRC =
  "https://fonts.gstatic.com/s/roboto/v32/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2";

function hasMeaningfulValue(value: unknown): boolean {
  return value !== undefined && value !== null && value !== "";
}

function resolveFieldLabel(
  fieldName: string,
  manualFieldLabels: FieldLabels | undefined,
  pdfFieldLabels: FieldLabels,
  source: FieldLabelSource,
): string {
  // Only human-readable PDF metadata belongs in the PDF label source.
  // Raw field IDs stay the final fallback so pdf-first can still defer to manual labels.
  const manual = manualFieldLabels?.[fieldName]?.trim();
  const pdf = pdfFieldLabels[fieldName]?.trim();

  if (source === "manual-only") return manual || fieldName;
  if (source === "pdf-only") return pdf || fieldName;
  if (source === "pdf-first") return pdf || manual || fieldName;
  return manual || pdf || fieldName;
}

function buildResolvedFieldLabels(
  names: Iterable<string>,
  manualFieldLabels: FieldLabels | undefined,
  pdfFieldLabels: FieldLabels,
  source: FieldLabelSource,
): FieldLabels {
  const resolved: FieldLabels = {};
  for (const name of names) {
    resolved[name] = resolveFieldLabel(name, manualFieldLabels, pdfFieldLabels, source);
  }
  return resolved;
}

const AcroFormPreview: React.FC<AcroFormPreviewProps> = ({
  templateUrl,
  templateBuffer,
  data,
  dataTransformer,
  fieldMapping,
  className = "",
  onPdfGenerated,
  debounceMs = 200,
  scale = 1.5,
  maxWidth = "810px",
  fieldsRequiringRecalculation,
  highlightFields,
  showLabels,
  onFieldClick,
  onFieldRectsReady,
  visiblePages,
  highlightAllFields = false,
  fieldLabels,
  fieldLabelSource = "manual-first",
  activeField,
  hiddenFields,
  renderPageOverlay,
  onFieldDoubleClick,
  onPageSizesReady,
  workerSrc,
  fontSrc = DEFAULT_FONT_SRC,
  fontSize = 8,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [announcement, setAnnouncement] = useState("");
  const lastFieldAnnouncementRef = useRef<string>("");

  const { pdfDoc, numPages, loading, error, filledDataRef, pdfFieldLabelsRef, fieldRectsRef, pageViewportsRef } =
    usePdfFill({
      templateUrl, templateBuffer, data, dataTransformer, fieldMapping,
      onPdfGenerated, debounceMs, fieldsRequiringRecalculation,
      fontSrc, fontSize, workerSrc, onFieldRectsReady, onPageSizesReady,
    });

  const { activeCanvas, canvasRefsA, canvasRefsB } =
    usePdfRender({ pdfDoc, numPages, scale, loading });

  const resolvedFieldLabels = buildResolvedFieldLabels(
    fieldRectsRef.current.keys(),
    fieldLabels,
    pdfFieldLabelsRef.current,
    fieldLabelSource,
  );

  // Announce transitions to screen readers
  useEffect(() => {
    if (!loading && !error && numPages > 0) {
      setAnnouncement(`PDF loaded, ${numPages} page${numPages !== 1 ? "s" : ""}`);
    }
  }, [loading, error, numPages]);

  useEffect(() => {
    if (loading || error || numPages === 0 || !activeField) return;

    const value = filledDataRef.current[activeField];
    const status = hasMeaningfulValue(value) ? "filled" : "empty";
    const readableName = resolveFieldLabel(
      activeField,
      fieldLabels,
      pdfFieldLabelsRef.current,
      fieldLabelSource,
    );
    const nextAnnouncement = `Field ${readableName} is active and currently ${status}.`;

    if (nextAnnouncement !== lastFieldAnnouncementRef.current) {
      lastFieldAnnouncementRef.current = nextAnnouncement;
      setAnnouncement(nextAnnouncement);
    }
  }, [activeField, data, loading, error, numPages, filledDataRef, fieldLabels, fieldLabelSource, pdfFieldLabelsRef]);

  if (loading) return <Spinner className={className} />;
  if (error)   return <ErrorMsg className={className} message={error} />;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: "relative", margin: "0 auto", overflow: "hidden", width: "100%", maxWidth }}
    >
      {/* Visually hidden ARIA live region for screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }}
      >
        {announcement}
      </div>

      {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => {
        const isVisible = !visiblePages || visiblePages.includes(pageNum);
        const highlights = resolveHighlights(
          pageNum, highlightAllFields, highlightFields, hiddenFields, fieldRectsRef.current,
        );

        return (
          <div
            key={pageNum}
            style={{ position: "relative", marginBottom: isVisible ? 16 : 0, display: isVisible ? undefined : "none" }}
          >
            <canvas
              ref={(el) => { if (el) canvasRefsA.current.set(pageNum, el); }}
              role="img"
              aria-label={`PDF page ${pageNum} of ${numPages}`}
              style={{ width: "100%", display: activeCanvas === "A" ? "block" : "none", borderRadius: 2, boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}
            />
            <canvas
              ref={(el) => { if (el) canvasRefsB.current.set(pageNum, el); }}
              role="img"
              aria-label={`PDF page ${pageNum} of ${numPages}`}
              style={{ width: "100%", display: activeCanvas === "B" ? "block" : "none", borderRadius: 2, boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}
            />

            {highlights.length > 0 && pageViewportsRef.current.has(pageNum) && (
              <FieldHighlightOverlay
                pageNum={pageNum}
                highlights={highlights}
                fieldRects={fieldRectsRef.current}
                pageSize={pageViewportsRef.current.get(pageNum)!}
                showLabels={showLabels}
                fieldLabels={resolvedFieldLabels}
                onFieldClick={onFieldClick}
                filledData={highlightAllFields && !highlightFields?.length ? filledDataRef.current : undefined}
                activeField={highlightAllFields && !highlightFields?.length ? activeField : undefined}
                onFieldDoubleClick={onFieldDoubleClick}
              />
            )}

            {renderPageOverlay?.(pageNum)}
          </div>
        );
      })}
    </div>
  );
};

function resolveHighlights(
  pageNum: number,
  highlightAllFields: boolean,
  highlightFields: FieldHighlight[] | undefined,
  hiddenFields: Set<string> | undefined,
  fieldRects: Map<string, { page: number; rect: number[] }>,
): FieldHighlight[] {
  if (highlightAllFields && !highlightFields?.length) {
    const result: FieldHighlight[] = [];
    fieldRects.forEach((info, name) => {
      if (info.page === pageNum && !hiddenFields?.has(name)) {
        result.push({ fieldName: name, color: "#FBBF24" });
      }
    });
    return result;
  }
  if (highlightFields?.length) {
    return highlightFields.filter((h) => {
      const r = fieldRects.get(h.fieldName);
      return r && r.page === pageNum;
    });
  }
  return [];
}

const Spinner: React.FC<{ className: string }> = ({ className }) => (
  <div role="status" aria-label="Loading PDF" className={className} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
    <div aria-hidden="true" style={{ width: 32, height: 32, marginBottom: 8, borderRadius: "50%", borderWidth: 2, borderStyle: "solid", borderColor: "transparent", borderBottomColor: "#2563eb", animation: "acroform-spin 0.75s linear infinite" }} />
    <style>{`@keyframes acroform-spin{to{transform:rotate(360deg)}}`}</style>
    <div aria-hidden="true" style={{ color: "#6b7280" }}>Loading PDF…</div>
  </div>
);

const ErrorMsg: React.FC<{ className: string; message: string }> = ({ className, message }) => (
  <div role="alert" className={className} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
    <div style={{ color: "#ef4444" }}>{message}</div>
  </div>
);

export default React.memo(AcroFormPreview);
