import * as pdfjsLib from "pdfjs-dist";
import { useEffect, useRef, useState } from "react";

interface Options {
  pdfDoc: pdfjsLib.PDFDocumentProxy | null;
  numPages: number;
  scale: number;
  loading: boolean;
}

export interface PdfRenderResult {
  /** Currently visible buffer ("A" or "B") */
  activeCanvas: "A" | "B";
  canvasRefsA: React.MutableRefObject<Map<number, HTMLCanvasElement>>;
  canvasRefsB: React.MutableRefObject<Map<number, HTMLCanvasElement>>;
}

/**
 * Double-buffered PDF canvas rendering.
 *
 * Renders all pages to an off-screen canvas set, then copies them to the
 * visible canvases in a single requestAnimationFrame — no blank frames.
 */
export function usePdfRender({ pdfDoc, numPages, scale, loading }: Options): PdfRenderResult {
  const [activeCanvas, setActiveCanvas] = useState<"A" | "B">("A");
  const activeCanvasRef = useRef<"A" | "B">("A");

  const canvasRefsA    = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const canvasRefsB    = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const renderFrameRef = useRef<number | null>(null);

  const pixelRatio = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

  useEffect(() => {
    if (!pdfDoc || loading) return;

    let cancelled = false;

    const renderPages = async () => {
      const target     = activeCanvasRef.current === "A" ? "B" : "A";
      const canvasRefs = target === "A" ? canvasRefsA : canvasRefsB;

      const offscreens = new Map<number, HTMLCanvasElement>();

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        if (cancelled) break;
        try {
          const page     = await pdfDoc.getPage(pageNum);
          const canvas   = canvasRefs.current.get(pageNum);
          if (!canvas) continue;

          const viewport       = page.getViewport({ scale });
          const off            = document.createElement("canvas");
          // Math.round prevents sub-pixel canvas dimensions on some screens
          off.width            = Math.round(viewport.width  * pixelRatio);
          off.height           = Math.round(viewport.height * pixelRatio);

          const ctx = off.getContext("2d", { alpha: false, willReadFrequently: false });
          if (!ctx) {
            console.error(`react-pdf-form-preview: could not get 2D context for page ${pageNum}`);
            continue;
          }

          ctx.scale(pixelRatio, pixelRatio);
          ctx.imageSmoothingEnabled  = true;
          ctx.imageSmoothingQuality  = "high";

          await page.render({ canvas: off, canvasContext: ctx, viewport }).promise;

          if (!cancelled) offscreens.set(pageNum, off);
        } catch (err: unknown) {
          if (err instanceof Error && err.name === "RenderingCancelledException") continue;
          if (!cancelled) console.error(`react-pdf-form-preview: error rendering page ${pageNum}:`, err);
        }
      }

      if (renderFrameRef.current) cancelAnimationFrame(renderFrameRef.current);

      renderFrameRef.current = requestAnimationFrame(() => {
        // Copy all off-screen canvases to visible canvases in one pass
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          const canvas = canvasRefs.current.get(pageNum);
          const off    = offscreens.get(pageNum);
          if (!canvas || !off) continue;

          const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
          if (!ctx) continue;

          canvas.width  = off.width;
          canvas.height = off.height;
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(off, 0, 0);
        }

        // Sync physical size on the inactive buffer too (avoids layout shift on swap)
        const other     = target === "A" ? "B" : "A";
        const otherRefs = other  === "A" ? canvasRefsA : canvasRefsB;
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          const canvas = otherRefs.current.get(pageNum);
          const off    = offscreens.get(pageNum);
          if (canvas && off) { canvas.width = off.width; canvas.height = off.height; }
        }

        renderFrameRef.current = null;
      });

      // Swap visible buffer
      activeCanvasRef.current = target;
      setActiveCanvas(target);
    };

    renderPages();

    return () => {
      cancelled = true;
      if (renderFrameRef.current) {
        cancelAnimationFrame(renderFrameRef.current);
        renderFrameRef.current = null;
      }
    };
  }, [pdfDoc, numPages, scale, loading, pixelRatio]);

  return { activeCanvas, canvasRefsA, canvasRefsB };
}
