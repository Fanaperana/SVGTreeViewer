import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist",
    rollupOptions: {
      input: "src/index.ts", // adjust if your entry point is different
      output: {
        entryFileNames: "svgtreeviewer.js",
        format: "iife", // or 'es', 'cjs' depending on your use case
      },
    },
    minify: "terser", // Explicitly use Terser for minification
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs
        drop_debugger: true, // Remove debugger statements
      },
      format: {
        comments: false, // Remove comments
      },
    },
  },
});
