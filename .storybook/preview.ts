import type { Preview } from '@storybook/html-vite';
import { AUTO_THEME } from '../stories/lib/theme-choice.js';
import { withThemeStage } from './decorators.js';
import { modes, themeNames } from './themes.js';
import './preview.css';
// Story content styles (specimens, grids, simulations). Not part of the library.
import '../stories/story-styles.css';

const preview: Preview = {
  decorators: [withThemeStage],

  // Toolbar: Theme and Mode drive the stage theme through the library's applyTheme().
  globalTypes: {
    theme: {
      description: 'Theme applied to the stage (scoped to the stage only)',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: AUTO_THEME, title: 'Auto (story default)' },
          ...themeNames.map((name) => ({ value: name, title: name })),
        ],
        dynamicTitle: true,
      },
    },
    mode: {
      description: 'Color mode of the stage ([data-nl-mode])',
      toolbar: {
        title: 'Mode',
        icon: 'contrast',
        items: modes.map((m) => ({ value: m, title: m })),
        dynamicTitle: true,
      },
    },
  },
  // Auto = each story's own default: `neutral` for shared components, and the project theme on
  // project stories (they set `parameters.nlTheme`). Picking a theme in the toolbar overrides that
  // everywhere, e.g. to see how a project component behaves under a theme that does not define
  // its optional hooks.
  initialGlobals: { theme: AUTO_THEME, mode: 'light' },

  parameters: {
    layout: 'fullscreen',
    controls: { matchers: {}, sort: 'requiredFirst' },
    options: {
      storySort: {
        order: ['Introduction', 'Foundations', 'Components', 'Projects'],
        method: 'alphabetical',
      },
    },
    // Real viewport sizes (the preview iframe is resized, so @media rules also apply).
    viewport: {
      options: {
        mobile393: {
          name: 'V4 mobile 393 × 852',
          styles: { width: '393px', height: '852px' },
          type: 'mobile',
        },
        mobile360: {
          name: 'V4 mobile 360 × 780',
          styles: { width: '360px', height: '780px' },
          type: 'mobile',
        },
        mobile320: {
          name: 'Mobile 320 (small phone)',
          styles: { width: '320px', height: '568px' },
          type: 'mobile',
        },
        mobile375: {
          name: 'Mobile 375 (typical phone)',
          styles: { width: '375px', height: '667px' },
          type: 'mobile',
        },
        mobile430: {
          name: 'Mobile 430 (large phone)',
          styles: { width: '430px', height: '932px' },
          type: 'mobile',
        },
        tablet: {
          name: 'Tablet 768',
          styles: { width: '768px', height: '1024px' },
          type: 'tablet',
        },
        desktop: {
          name: 'Desktop 1280',
          styles: { width: '1280px', height: '800px' },
          type: 'desktop',
        },
      },
    },
    docs: {
      toc: true,
      source: {
        // Show the component markup (the CSS classes are the library's contract) without the
        // stage element this catalog wraps every story in.
        transform: (code: string) =>
          code.replace(/^\s*<div class="sb-stage[^"]*"[^>]*>([\s\S]*)<\/div>\s*$/, '$1').trim(),
      },
    },
    a11y: { test: 'todo' },
  },

  tags: ['autodocs'],
};

export default preview;
