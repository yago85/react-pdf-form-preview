import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves from /react-pdf-form-preview/
  base: "/react-pdf-form-preview/",

  optimizeDeps: {
    exclude: ["pdfjs-dist"],
    esbuildOptions: {
      target: "esnext",
    },
  },

  build: {
    target: "esnext",
    outDir: "dist",
    rollupOptions: {
      output: {
        manualChunks: {
          pdfjs: ["pdfjs-dist"],
          pdflib: ["pdf-lib", "@pdf-lib/fontkit"],
        },
      },
    },
  },
});
