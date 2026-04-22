import React from "react";
import { FieldHighlight, FieldLabels, FormFieldValue } from "./types";

/** Allows only safe CSS color formats: #hex, rgb(), rgba(), hsl(), named colors */
const SAFE_COLOR_RE = /^(#[0-9a-fA-F]{3,8}|rgb\([^)]*\)|rgba\([^)]*\)|hsl\([^)]*\)|hsla\([^)]*\)|[a-zA-Z]{2,30})$/;

function sanitizeColor(color: string, fallback = "#888888"): string {
  return SAFE_COLOR_RE.test(color.trim()) ? color.trim() : fallback;
}

function hasMeaningfulValue(value: FormFieldValue): boolean {
  return value !== undefined && value !== null && value !== "";
}

interface Props {
  pageNum: number;
  highlights: FieldHighlight[];
  fieldRects: Map<string, { page: number; rect: number[] }>;
  /** Page size in PDF points (at scale=1) */
  pageSize: { width: number; height: number };
  showLabels?: boolean;
  fieldLabels?: FieldLabels;
  onFieldClick?: (fieldName: string) => void;
  /** Auto-mode: derive highlight style from fill status */
  filledData?: Record<string, FormFieldValue>;
  activeField?: string;
  onFieldDoubleClick?: (
    fieldName: string,
    rect: { left: number; top: number; width: number; height: number },
  ) => void;
}

const FieldHighlightOverlay: React.FC<Props> = ({
  pageNum,
  highlights,
  fieldRects,
  pageSize,
  showLabels,
  fieldLabels,
  onFieldClick,
  filledData,
  activeField,
  onFieldDoubleClick,
}) => (
  <div style={{ pointerEvents: "none", position: "absolute", inset: 0, width: "100%", height: "100%" }}>
    {highlights.map((h) => {
      const rectInfo = fieldRects.get(h.fieldName);
      if (!rectInfo || rectInfo.page !== pageNum) return null;

      const [x1, , x2, y2] = rectInfo.rect;
      const [, y1] = rectInfo.rect;

      // PDF origin = bottom-left (pts) → CSS origin = top-left (%)
      const leftPct   = (x1 / pageSize.width) * 100;
      const topPct    = ((pageSize.height - y2) / pageSize.height) * 100;
      const widthPct  = ((x2 - x1) / pageSize.width) * 100;
      const heightPct = ((y2 - y1) / pageSize.height) * 100;

      let bgColor: string;
      let border: string;

      if (filledData) {
        const isActive = activeField === h.fieldName;
        const val = filledData[h.fieldName];
        const isFilled = val !== undefined && val !== null && val !== "";

        if (isActive) {
          bgColor = "rgba(59,130,246,0.18)";
          border  = "2px solid rgba(59,130,246,0.6)";
        } else if (isFilled) {
          bgColor = "rgba(250,204,21,0.18)";
          border  = "1.5px solid rgba(250,204,21,0.45)";
        } else {
          bgColor = "rgba(156,163,175,0.07)";
          border  = "1.5px dashed rgba(156,163,175,0.5)";
        }
      } else {
        const safeColor = sanitizeColor(h.color);
        bgColor = safeColor + "4D"; // ~30% opacity
        border  = `2px solid ${safeColor}`;
      }

      const isInteractive = !!(onFieldClick || onFieldDoubleClick);
      const isActive = activeField === h.fieldName;
      const isFilled = filledData ? hasMeaningfulValue(filledData[h.fieldName]) : undefined;
      const readableName = fieldLabels?.[h.fieldName] ?? h.fieldName;
      const statusText = isActive ? "Active field" : isFilled === undefined ? "Field" : isFilled ? "Filled field" : "Empty field";
      const actionText = !isInteractive
        ? ""
        : onFieldClick && onFieldDoubleClick
          ? " Press Enter or Space to select. Press F2 to edit."
          : onFieldDoubleClick
            ? " Press F2 to edit."
            : " Press Enter or Space to select.";

      return (
        <div
          key={h.fieldName}
          role={isInteractive ? "button" : undefined}
          tabIndex={isInteractive ? 0 : undefined}
          aria-hidden={isInteractive ? undefined : true}
          aria-label={isInteractive ? `${statusText}: ${readableName}.${actionText}` : undefined}
          aria-keyshortcuts={isInteractive ? onFieldDoubleClick ? "Enter Space F2" : "Enter Space" : undefined}
          style={{
            position: "absolute",
            left: `${leftPct}%`, top: `${topPct}%`,
            width: `${widthPct}%`, height: `${heightPct}%`,
            backgroundColor: bgColor,
            border,
            borderRadius: 2,
            overflow: "hidden",
            cursor: isInteractive ? "pointer" : "default",
            pointerEvents: isInteractive ? "auto" : "none",
            transition: "background 0.2s, border-color 0.2s",
          }}
          onClick={() => onFieldClick?.(h.fieldName)}
          onDoubleClick={() =>
            onFieldDoubleClick?.(h.fieldName, {
              left: leftPct, top: topPct, width: widthPct, height: heightPct,
            })
          }
          onKeyDown={(e) => {
            if (onFieldDoubleClick && e.key === "F2") {
              e.preventDefault();
              onFieldDoubleClick(h.fieldName, {
                left: leftPct, top: topPct, width: widthPct, height: heightPct,
              });
              return;
            }
            if ((e.key === "Enter" || e.key === " ") && onFieldClick) {
              e.preventDefault();
              onFieldClick(h.fieldName);
            }
          }}
        >
          {showLabels && (
            <span aria-hidden="true" style={{
              pointerEvents: "none",
              display: "flex", alignItems: "center",
              height: "100%", padding: "0 4px",
              fontSize: 10, fontWeight: 700, color: "#000",
              overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
            }}>
              {readableName}
            </span>
          )}
        </div>
      );
    })}
  </div>
);

export default FieldHighlightOverlay;
