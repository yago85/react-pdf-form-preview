import React from "react";
import { FieldHighlight, FormFieldValue } from "./types";

/** Allows only safe CSS color formats: #hex, rgb(), rgba(), hsl(), named colors */
const SAFE_COLOR_RE = /^(#[0-9a-fA-F]{3,8}|rgb\([^)]*\)|rgba\([^)]*\)|hsl\([^)]*\)|hsla\([^)]*\)|[a-zA-Z]{2,30})$/;

function sanitizeColor(color: string, fallback = "#888888"): string {
  return SAFE_COLOR_RE.test(color.trim()) ? color.trim() : fallback;
}

interface Props {
  pageNum: number;
  highlights: FieldHighlight[];
  fieldRects: Map<string, { page: number; rect: number[] }>;
  /** Page size in PDF points (at scale=1) */
  pageSize: { width: number; height: number };
  showLabels?: boolean;
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

      return (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events
        <div
          key={h.fieldName}
          title={h.fieldName}
          style={{
            position: "absolute",
            left: `${leftPct}%`, top: `${topPct}%`,
            width: `${widthPct}%`, height: `${heightPct}%`,
            backgroundColor: bgColor,
            border,
            borderRadius: 2,
            overflow: "hidden",
            cursor: (onFieldClick || onFieldDoubleClick) ? "pointer" : "default",
            pointerEvents: (onFieldClick || onFieldDoubleClick) ? "auto" : "none",
            transition: "background 0.2s, border-color 0.2s",
          }}
          onClick={() => onFieldClick?.(h.fieldName)}
          onDoubleClick={() =>
            onFieldDoubleClick?.(h.fieldName, {
              left: leftPct, top: topPct, width: widthPct, height: heightPct,
            })
          }
        >
          {showLabels && (
            <span style={{
              pointerEvents: "none",
              display: "flex", alignItems: "center",
              height: "100%", padding: "0 4px",
              fontSize: 10, fontWeight: 700, color: "#000",
              overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
            }}>
              {h.fieldName}
            </span>
          )}
        </div>
      );
    })}
  </div>
);

export default FieldHighlightOverlay;
