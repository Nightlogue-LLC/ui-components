import type { Meta, StoryObj } from '@storybook/html-vite';
import { createButton } from '../../../src/components/button/index.js';
import { createStreakGlow, replayStreakGlow } from '../../../src/components/streak-glow/index.js';
import { el } from '../../lib/dom.js';
import { compareModes } from '../../lib/stage.js';

interface Args {
  direction: 'diagonal' | 'horizontal';
  durationMs: number;
}

function sample(args: Args): HTMLElement {
  const icon = el('span', { text: '✦' });
  icon.style.cssText = 'font-size: 3rem; line-height: 1; color: var(--nl-color-accent)';
  icon.setAttribute('aria-hidden', 'true');
  const glow = createStreakGlow({ content: icon, ...args });
  const host = el('div', { className: 'sb-row' }, [
    glow,
    createButton({
      label: 'Replay streak',
      variant: 'secondary',
      onClick: () => replayStreakGlow(glow),
    }),
  ]);
  host.style.alignItems = 'center';
  return host;
}

const meta = {
  title: 'Components/Feedback/StreakGlow',
  tags: ['autodocs'],
  args: { direction: 'diagonal', durationMs: 2200 },
  argTypes: {
    direction: { control: 'inline-radio', options: ['diagonal', 'horizontal'] },
    durationMs: { control: { type: 'range', min: 500, max: 5000, step: 100 } },
  },
  render: sample,
  parameters: {
    docs: {
      description: {
        component:
          'One-pass decorative light sweep. Uses the theme accent or --nl-streak-glow-color. Disabled for reduced motion. Artwork belongs to the consumer.',
      },
    },
  },
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<Args>;

export const Playground: Story = {};

export const LightDarkComparison: Story = {
  parameters: { nlStage: 'self' },
  render: (args, context) => compareModes(context, () => sample(args)),
};
