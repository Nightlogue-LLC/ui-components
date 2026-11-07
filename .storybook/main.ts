import type { StorybookConfig } from '@storybook/html-vite';

/**
 * Storybook (HTML + Vite) is the development and documentation catalog for the components.
 * It is a DEVELOPMENT tool only: nothing here is part of the published package, and the package
 * keeps zero runtime dependencies. Components stay plain TypeScript DOM factories + CSS; the HTML
 * framework renders the DOM nodes our stories return, so no React/Vue/web-component layer is added.
 */
const config: StorybookConfig = {
  // Sidebar structure comes from each story's `title` (see stories/ and docs/storybook.md).
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.ts'],
  // Deliberately small addon set: docs (autodocs + MDX) and accessibility checks.
  // Controls, actions, viewport and interactions are part of Storybook core.
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: {
    name: '@storybook/html-vite',
    // Storybook gets its own Vite config so it never inherits another tool's settings.
    options: { builder: { viteConfigPath: '.storybook/vite.config.ts' } },
  },
  core: {
    // No anonymous usage telemetry, no "what's new" fetches from this internal tool.
    disableTelemetry: true,
    disableWhatsNewNotifications: true,
  },
};

export default config;
