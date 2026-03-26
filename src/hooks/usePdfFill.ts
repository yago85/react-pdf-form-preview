import { PDFFont } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import { useEffect, useRef, useState } from "react";
import { DataTransformer, PdfFormData } from "../types";

function hasRecalculationFieldsChanged(
  current: PdfFormData,
  previous: PdfFormData,
  fields?: string[],
): boolean {
  if (!fields || fields.length === 0) return true;
  return fields.some((f) => current[f] !== previous[f]);
}

/** Keep a ref always pointing at the latest value (avoids stale closures). */
function useLatest<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

interface Options {
  templateUrl?: string;
  templateBuffer?: ArrayBuffer;
  data: PdfFormData;
  dataTransformer?: DataTransformer;
  fieldMapping?: Record<string, string>;
  onPdfGenerated?: (pdfBytes: Uint8Array) => void;
  debounceMs: number;
  fieldsRequiringRecalculation?: string[];
  fontSrc: string;
  fontSize: number;
  workerSrc?: string;
  onFieldRectsReady?: (rects: Map<string, { page: number; rect: number[] }>) => void;
  onPageSizesReady?: (sizes: Map<number, { width: number; height: number }>) => void;
}

export interface PdfFillResult {
  pdfDoc: pdfjsLib.PDFDocumentProxy | null;
  numPages: number;
  loading: boolean;
  error: string | null;
  filledDataRef: React.MutableRefObject<PdfFormData>;
  fieldRectsRef: React.MutableRefObject<Map<string, { page: number; rect: number[] }>>;
  pageViewportsRef: React.MutableRefObject<Map<number, { width: number; height: number }>>;
}

export function usePdfFill({
  templateUrl,
  templateBuffer: templateBufferProp,
  data,
  dataTransformer,
  fieldMapping,
  onPdfGenerated,
  debounceMs,
  fieldsRequiringRecalculation,
  fontSrc,
  fontSize,
  workerSrc,
  onFieldRectsReady,
  onPageSizesReady,
}: Options): PdfFillResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);

  // Stabilize callbacks — consumers don't need useCallback
  const onPdfGeneratedRef   = useLatest(onPdfGenerated);
  const onFieldRectsReadyRef = useLatest(onFieldRectsReady);
  const onPageSizesReadyRef = useLatest(onPageSizesReady);
  const dataTransformerRef  = useLatest(dataTransformer);
  const fieldMappingRef     = useLatest(fieldMapping);

  const isInitialLoadRef     = useRef(true);
  const filledDataRef        = useRef<PdfFormData>({});
  const previousDataRef      = useRef<PdfFormData>({});
  const previousFormDataRef  = useRef<PdfFormData>({});
  const fieldRectsRef        = useRef<Map<string, { page: number; rect: number[] }>>(new Map());
  const pageViewportsRef     = useRef<Map<number, { width: number; height: number }>>(new Map());
  const recalculationCache   = useRef<{ fieldWidthPt?: number; font?: PDFFont }>({});
  const templateBytesCache   = useRef<{ key: string; bytes: ArrayBuffer } | null>(null);
  const fontBytesCache       = useRef<{ key: string; bytes: ArrayBuffer } | null>(null);

  // Set worker only if explicitly provided via prop.
  // If workerSrc is omitted, the caller is responsible for configuring
  // pdfjsLib.GlobalWorkerOptions.workerSrc globally before mounting.
  useEffect(() => {
    if (typeof window === "undefined" || !workerSrc) return;
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
  }, [workerSrc]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const isInitialLoad = isInitialLoadRef.current;
      if (isInitialLoad) setLoading(true);
      setError(null);

      try {
        const pdfLib = await import("pdf-lib");
        const { PDFDocument, PDFTextField, PDFCheckBox, PDFDropdown } = pdfLib;
        const fontkit = (await import("@pdf-lib/fontkit")).default;

        // Cache template and font bytes to avoid re-fetching on every data change
        const tplKey = templateBufferProp ? "buffer" : templateUrl!;
        let templateBytes: ArrayBuffer;
        if (templateBufferProp) {
          templateBytes = templateBufferProp;
        } else if (templateBytesCache.current?.key === tplKey) {
          templateBytes = templateBytesCache.current.bytes;
        } else {
          const tplRes = await fetch(templateUrl!);
          if (!tplRes.ok) throw new Error(`Failed to load template: ${tplRes.statusText}`);
          templateBytes = await tplRes.arrayBuffer();
          templateBytesCache.current = { key: tplKey, bytes: templateBytes };
        }

        let fontBytes: ArrayBuffer;
        if (fontBytesCache.current?.key === fontSrc) {
          fontBytes = fontBytesCache.current.bytes;
        } else {
          const fontRes = await fetch(fontSrc);
          if (!fontRes.ok) throw new Error(`Failed to load font: ${fontRes.statusText}`);
          fontBytes = await fontRes.arrayBuffer();
          fontBytesCache.current = { key: fontSrc, bytes: fontBytes };
        }

        const pdfLibDoc = await PDFDocument.load(templateBytes);
        pdfLibDoc.registerFontkit(fontkit);
        const customFont = await pdfLibDoc.embedFont(fontBytes);
        const form = pdfLibDoc.getForm();

        // Selective recalculation
        const needsRecalc = hasRecalculationFieldsChanged(
          data, previousFormDataRef.current, fieldsRequiringRecalculation,
        );

        let fieldWidthPt: number | undefined;
        let fontForCalc: PDFFont | undefined;

        if (needsRecalc || !recalculationCache.current.fieldWidthPt) {
          try {
            // Use the widest text field as the reference width.
            // This avoids using a narrow field (e.g. doc_number) as the
            // reference for multiline wrapping calculations.
            let maxWidth = 0;
            for (const f of form.getFields()) {
              if (!(f instanceof PDFTextField)) continue;
              for (const w of f.acroField.getWidgets()) {
                const w_width = w.getRectangle().width;
                if (w_width > maxWidth) maxWidth = w_width;
              }
            }
            if (maxWidth > 0) {
              fieldWidthPt = maxWidth;
              recalculationCache.current = { fieldWidthPt, font: customFont };
              fontForCalc = customFont;
            }
          } catch (e) {
            console.warn("Could not get field width:", e);
          }
        } else {
          fieldWidthPt = recalculationCache.current.fieldWidthPt;
          fontForCalc  = recalculationCache.current.font;
        }

        previousFormDataRef.current = { ...data };

        // Transform data (read from ref — always latest, no dep needed)
        const transformer = dataTransformerRef.current;
        const mapping     = fieldMappingRef.current;
        let transformed: PdfFormData;
        if (transformer) {
          transformed = transformer(data, {
            font: fontForCalc ?? customFont,
            fontSize,
            fieldWidthPt,
            forceRecalculation: needsRecalc,
          });
        } else if (mapping) {
          transformed = {};
          for (const [k, v] of Object.entries(data)) {
            transformed[mapping[k] ?? k] = v;
          }
        } else {
          transformed = data;
        }

        // Fill fields
        for (const [name, value] of Object.entries(transformed)) {
          if (value === undefined || value === null || value === "") continue;
          try {
            const field = form.getField(name);
            if (field instanceof PDFTextField) {
              field.setText(String(value));
              field.setFontSize(fontSize);
              field.updateAppearances(customFont);
            } else if (field instanceof PDFCheckBox) {
              value === "true" || value === "1" || value === 1 || value === true
                ? field.check() : field.uncheck();
            } else if (field instanceof PDFDropdown) {
              field.select(String(value));
            }
          } catch (err) {
            console.warn(`Could not fill field "${name}":`, err);
          }
        }

        filledDataRef.current    = transformed;
        previousDataRef.current  = { ...transformed };

        if (cancelled) return;

        // Update appearances for all text fields (so empty fields render correctly)
        for (const field of form.getFields()) {
          if (field instanceof PDFTextField) {
            try { field.updateAppearances(customFont); } catch { /* ignore */ }
          }
        }

        form.acroForm.dict.set(
          pdfLibDoc.context.obj("NeedAppearances"),
          pdfLibDoc.context.obj(false),
        );

        const pdfBytes = await pdfLibDoc.save({ useObjectStreams: false });
        onPdfGeneratedRef.current?.(pdfBytes);

        if (cancelled) return;

        // Give pdfjs a copy so it can transfer the ArrayBuffer to its worker
        // without detaching the pdfBytes buffer (which onPdfGenerated holds onto).
        const loadingTask = pdfjsLib.getDocument({ data: pdfBytes.slice() });
        const doc = await loadingTask.promise;

        if (cancelled) { doc.destroy(); return; }

        setPdfDoc(doc);
        setNumPages(doc.numPages);

        // Extract field rects and page sizes on first load only
        if (isInitialLoad) {
          for (let p = 1; p <= doc.numPages; p++) {
            const page = await doc.getPage(p);
            const vp   = page.getViewport({ scale: 1 });
            pageViewportsRef.current.set(p, { width: vp.width, height: vp.height });

            for (const ann of await page.getAnnotations()) {
              if (ann.subtype === "Widget" && ann.fieldName) {
                fieldRectsRef.current.set(ann.fieldName, { page: p, rect: ann.rect });
              }
            }
          }
          onFieldRectsReadyRef.current?.(new Map(fieldRectsRef.current));
          onPageSizesReadyRef.current?.(new Map(pageViewportsRef.current));
          isInitialLoadRef.current = false;
          setLoading(false);
        }
      } catch (err) {
        if (cancelled) return;
        console.error("react-pdf-form-preview error:", err);
        const msg = err instanceof Error ? err.message : String(err);
        setError(`Failed to process PDF: ${msg}`);
        if (isInitialLoadRef.current) setLoading(false);
      }
    };

    const id = setTimeout(run, debounceMs);
    return () => { cancelled = true; clearTimeout(id); };
    // Callbacks are accessed via stable refs — not in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateUrl, templateBufferProp, data, debounceMs, fontSrc, fontSize, fieldsRequiringRecalculation]);

  // Destroy pdfjs document on unmount
  useEffect(() => () => { pdfDoc?.destroy(); }, [pdfDoc]);

  return { pdfDoc, numPages, loading, error, filledDataRef, fieldRectsRef, pageViewportsRef };
}
