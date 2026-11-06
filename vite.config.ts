import { defineConfig } from 'vite';

// Vite serves and builds the component gallery only (gallery/).
// The library itself is built with tsc (see scripts/build.mjs).
export default defineConfig({
  root: 'gallery',
  // Relative asset paths so the built gallery works from any sub-path or file host.
  base: './',
  server: { host: true },
  build: {
    outDir: '../gallery-dist',
    emptyOutDir: true,
    // Matches the browser floor we document for Capacitor Android WebView.
    target: ['chrome90', 'es2020'],
  },
});
