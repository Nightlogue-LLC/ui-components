import type { Meta, StoryObj } from '@storybook/html-vite';
import { BADGE_TONES, createBadge, type BadgeProps } from '../../../src/components/badge/index.js';
import { el } from '../../lib/dom.js';
import { compareModes, stateGrid } from '../../lib/stage.js';

const meta = {
  title: 'Components/Feedback/Badge',
  tags: ['autodocs'],
  args: { label: 'Continue', tone: 'accent' },
  argTypes: {
    label: {
      control: 'text',
      description: 'The text carries the meaning; tone only adds emphasis.',
    },
    tone: { control: 'inline-radio', options: [...BADGE_TONES] },
  },
  render: (args) => createBadge(args),
  parameters: {
    docs: {
      description: {
        component: `
Compact, non-interactive status label, set in the theme's **editorial label** typography role (a theme that
does not define it falls back to the regular UI font). Never put interactive elements inside it.

\`\`\`ts
import { createBadge } from '@nightlogue-llc/ui-components';

row.append(createBadge({ label: 'Coming Soon', tone: 'muted' }));
\`\`\`
`,
      },
    },
  },
} satisfies Meta<BadgeProps>;

export default meta;
type Story = StoryObj<BadgeProps>;

export const Playground: Story = {};

export const Tones: Story = {
  render: () =>
    stateGrid(
      BADGE_TONES.map((tone) => ({ label: tone, node: createBadge({ label: 'Play', tone }) })),
    ),
};

export const StatusExamples: Story = {
  render: () =>
    stateGrid([
      { label: 'accent · Play', node: createBadge({ label: 'Play', tone: 'accent' }) },
      { label: 'neutral · Continue', node: createBadge({ label: 'Continue', tone: 'neutral' }) },
      {
        label: 'neutral · Coming Soon',
        node: createBadge({ label: 'Coming Soon', tone: 'neutral' }),
      },
      { label: 'muted · Coming Soon', node: createBadge({ label: 'Coming Soon', tone: 'muted' }) },
    ]),
};

export const LightDarkComparison: Story = {
  parameters: { nlStage: 'self' },
  render: (_args, context) =>
    compareModes(context, () =>
      el(
        'div',
        { className: 'sb-row' },
        BADGE_TONES.map((tone) => createBadge({ label: tone, tone })),
      ),
    ),
};
