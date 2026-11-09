import { createIcon, type IconName } from '../../../src/components/icon/index.js';
import type { Meta, StoryObj } from '@storybook/html-vite';
import { fn } from 'storybook/test';
import { createBottomNav, updateBottomNav } from '../../../src/components/bottom-nav/index.js';
import { compareModes } from '../../lib/stage.js';

interface Args {
  value: string;
  onNavigate: (value: string) => void;
}

function build(args: Args): HTMLElement {
  const items = [
    ['home', 'Home', 'home'],
    ['milestones', 'Milestones', 'achievements'],
    ['preferences', 'Preferences', 'settings'],
  ].map(([value, label, glyph]) => {
    const icon = createIcon(glyph as IconName);
    return { value: value!, label: label!, icon };
  });
  const nav = createBottomNav({
    label: 'Main navigation',
    items,
    value: args.value,
    onNavigate: (next) => {
      args.onNavigate(next);
      updateBottomNav(nav, next);
    },
  });
  return nav;
}

const meta = {
  title: 'Components/Navigation/BottomNav',
  args: { value: 'home', onNavigate: fn() },
  argTypes: { value: { control: 'inline-radio', options: ['home', 'milestones', 'preferences'] } },
  render: build,
  parameters: {
    docs: {
      description: {
        component:
          'Controlled main-destination navigation with app-supplied icons and labels. The preview accepts requests locally; the library performs no routing or storage. Current-page semantics use aria-current. Quiet accent marker, safe-area padding and theme-based tap feedback.',
      },
    },
  },
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<Args>;
export const Playground: Story = {};
export const LightDarkComparison: Story = {
  parameters: { nlStage: 'self' },
  render: (args, context) => compareModes(context, () => build(args)),
};
