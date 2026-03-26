import { PDFFont } from "pdf-lib";

export type FormFieldValue = string | number | boolean | null | undefined;

export type PdfFormData = Record<string, FormFieldValue>;

/** @deprecated Use `PdfFormData` instead — avoids conflict with native `FormData`. */
export type FormData = PdfFormData;

export type DataTransformerOptions = {
  font?: PDFFont;
  fontSize?: number;
  fieldWidthPt?: number;
  forceRecalculation?: boolean;
};

export type DataTransformer = (
  data: PdfFormData,
  options?: DataTransformerOptions,
) => PdfFormData;

export interface FieldHighlight {
  fieldName: string;
  color: string;
}

export interface AcroFormPreviewProps {
  /** URL to fetch the PDF template */
  templateUrl?: string;
  /** Direct ArrayBuffer of the PDF template — avoids an extra fetch */
  templateBuffer?: ArrayBuffer;
  /** Form field values */
  data: PdfFormData;
  /** Optional transformer applied to data before filling PDF fields */
  dataTransformer?: DataTransformer;
  /** Simple 1-to-1 mapping: formFieldName → pdfFieldName */
  fieldMapping?: Record<string, string>;
  /** Extra className for the outer container */
  className?: string;
  /** Called with the filled PDF bytes after every render */
  onPdfGenerated?: (pdfBytes: Uint8Array) => void;
  /** Debounce delay in ms before re-rendering (default: 200) */
  debounceMs?: number;
  /** Canvas render scale (default: 1.5) */
  scale?: number;
  /** CSS max-width of the container (default: "810px") */
  maxWidth?: string;
  /**
   * Fields whose changes require recalculating multiline field widths.
   * If omitted, recalculation happens on every change (safe but slower).
   */
  fieldsRequiringRecalculation?: string[];
  /** Manual field highlight overlays */
  highlightFields?: FieldHighlight[];
  /** Show field names inside highlight boxes */
  showLabels?: boolean;
  /** Click handler for field overlays */
  onFieldClick?: (fieldName: string) => void;
  /** Callback with all field coordinates once extracted */
  onFieldRectsReady?: (
    rects: Map<string, { page: number; rect: number[] }>,
  ) => void;
  /** Callback with page sizes in PDF points (at scale=1) once extracted */
  onPageSizesReady?: (sizes: Map<number, { width: number; height: number }>) => void;
  /** Only render these pages (1-based). Default: all pages */
  visiblePages?: number[];
  /** Auto-highlight all AcroForm fields (filled / empty / active) */
  highlightAllFields?: boolean;
  /** Name of the currently focused field (highlighted blue) */
  activeField?: string;
  /** Field names to exclude from auto-highlighting */
  hiddenFields?: Set<string>;
  /** Render an arbitrary overlay on each page (annotations, comments, etc.) */
  renderPageOverlay?: (pageNum: number) => React.ReactNode;
  /** Double-click handler for field overlays (e.g. inline editor) */
  onFieldDoubleClick?: (
    fieldName: string,
    rect: { left: number; top: number; width: number; height: number },
  ) => void;
  /**
   * URL or path to the pdf.js worker script.
   *
   * If provided, sets pdfjsLib.GlobalWorkerOptions.workerSrc automatically.
   * If omitted, you must configure the worker yourself before mounting:
   *
   *   import * as pdfjsLib from "pdfjs-dist";
   *   pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
   *     "pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url
   *   ).toString();
   *
   * For Next.js: copy pdf.worker.min.mjs to public/ and pass workerSrc="/pdf.worker.min.mjs"
   */
  workerSrc?: string;
  /**
   * URL or path to the font file for filling text fields.
   * Must cover the character set used in your PDFs (Cyrillic, CJK, etc.).
   * Default: Roboto from Google Fonts CDN.
   */
  fontSrc?: string;
  /** Font size for filled text fields in pt (default: 8) */
  fontSize?: number;
}
