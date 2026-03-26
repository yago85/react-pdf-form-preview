import React, { useRef } from "react";
import FieldHighlightOverlay from "./FieldHighlightOverlay";
import { usePdfFill } from "./hooks/usePdfFill";
import { usePdfRender } from "./hooks/usePdfRender";
import { AcroFormPreviewProps, FieldHighlight } from "./types";

const DEFAULT_FONT_SRC =
  "https://fonts.gstatic.com/s/roboto/v32/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2";

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

  const { pdfDoc, numPages, loading, error, filledDataRef, fieldRectsRef, pageViewportsRef } =
    usePdfFill({
      templateUrl, templateBuffer, data, dataTransformer, fieldMapping,
      onPdfGenerated, debounceMs, fieldsRequiringRecalculation,
      fontSrc, fontSize, workerSrc, onFieldRectsReady, onPageSizesReady,
    });

  const { activeCanvas, canvasRefsA, canvasRefsB } =
    usePdfRender({ pdfDoc, numPages, scale, loading });

  if (loading) return <Spinner className={className} />;
  if (error)   return <ErrorMsg className={className} message={error} />;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: "relative", margin: "0 auto", overflow: "hidden", width: "100%", maxWidth }}
    >
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
            {/* Canvas A */}
            <canvas
              ref={(el) => { if (el) canvasRefsA.current.set(pageNum, el); }}
              style={{ width: "100%", display: activeCanvas === "A" ? "block" : "none", borderRadius: 2, boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}
            />
            {/* Canvas B */}
            <canvas
              ref={(el) => { if (el) canvasRefsB.current.set(pageNum, el); }}
              style={{ width: "100%", display: activeCanvas === "B" ? "block" : "none", borderRadius: 2, boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}
            />

            {highlights.length > 0 && pageViewportsRef.current.has(pageNum) && (
              <FieldHighlightOverlay
                pageNum={pageNum}
                highlights={highlights}
                fieldRects={fieldRectsRef.current}
                pageSize={pageViewportsRef.current.get(pageNum)!}
                showLabels={showLabels}
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

// ── Helpers ──────────────────────────────────────────────────────────────────

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

// ── Loading / Error states ───────────────────────────────────────────────────

const Spinner: React.FC<{ className: string }> = ({ className }) => (
  <div className={className} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
    <div style={{ width: 32, height: 32, marginBottom: 8, borderRadius: "50%", borderWidth: 2, borderStyle: "solid", borderColor: "transparent", borderBottomColor: "#2563eb", animation: "acroform-spin 0.75s linear infinite" }} />
    <style>{`@keyframes acroform-spin{to{transform:rotate(360deg)}}`}</style>
    <div style={{ color: "#6b7280" }}>Loading PDF…</div>
  </div>
);

const ErrorMsg: React.FC<{ className: string; message: string }> = ({ className, message }) => (
  <div className={className} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
    <div style={{ color: "#ef4444" }}>{message}</div>
  </div>
);

export default React.memo(AcroFormPreview);
