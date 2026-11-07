import { defineConfig } from 'vite';

// Vite settings used only by Storybook. The library itself is built with tsc (scripts/build.mjs).
export default defineConfig({
  build: {
    // The browser floor we document for Capacitor Android WebView; the preview bundle matches it
    // so catalog behavior is representative.
    target: ['chrome90', 'es2020'],
  },
});
