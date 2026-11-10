import type { Meta, StoryObj } from '@storybook/html-vite';
import { compareModes } from '../../lib/stage.js';
import { THEME } from './shared.js';
import { mainScreenDemo } from './main-screen-demo.js';

const meta = {
  title: 'Projects/Grim & Glimmer/V3/Achievements',
  parameters: {
    nlTheme: THEME,
    nlStage: 'self',
    docs: {
      description: {
        component:
          'Navigation placeholder only. Achievement artwork, milestones and progress rules are not defined by this preview. Switch to Collection or Settings using the persistent bottom bar. No game data is read or written.',
      },
    },
  },
  render: () => document.createElement('div'),
} satisfies Meta;
export default meta;
type Story = StoryObj;

export const NavigationPlaceholder: Story = {
  render: (_args, context) =>
    compareModes(context, () => mainScreenDemo('achievements'), { theme: THEME, bleed: true }),
};
