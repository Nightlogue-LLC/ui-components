import type { Meta, StoryObj } from '@storybook/html-vite';
import { fn } from 'storybook/test';
import { createCard } from '../../../src/components/card/index.js';
import { el } from '../../lib/dom.js';
import { compareModes, stateGrid } from '../../lib/stage.js';

interface Args {
  interactive: boolean;
  title: string;
  body: string;
  onClick: (event: MouseEvent) => void;
}

function build(args: Args): HTMLElement {
  const card = createCard({ interactive: args.interactive, onClick: args.onClick });
  card.append(
    el('span', { className: 'sb-card-title', text: args.title }),
    el('span', { className: 'sb-card-body', text: args.body }),
  );
  return card;
}

const meta = {
  title: 'Components/Surfaces/Card',
  tags: ['autodocs'],
  args: {
    interactive: false,
    title: 'Card title',
    body: 'Cards carry no art, titles or status of their own.',
    onClick: fn(),
  },
  argTypes: {
    interactive: {
      control: 'boolean',
      description: 'Renders a native `<button>` when true, otherwise a `<div>`.',
    },
    title: { control: 'text' },
    body: { control: 'text' },
    onClick: { action: 'open', table: { category: 'events' } },
  },
  render: (args) => build(args),
  parameters: {
    docs: {
      description: {
        component: `
Neutral surface container. **Interactive** cards are native buttons (keyboard and screen-reader ready) with
hover, pressed and focus states; **static** cards deliberately have none. Compose the content yourself.

\`\`\`ts
import { createCard } from '@nightlogue-llc/ui-components';

const card = createCard({ onClick: open }); // interactive because onClick is given
card.append(titleSpan, bodySpan);          // an interactive card takes phrasing content (spans)
\`\`\`

Give an interactive card an accessible name through \`label\` or visible text. Elevation uses the optional
\`--nl-shadow-card\` theme hook.
`,
      },
    },
  },
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<Args>;

export const Playground: Story = {};

export const Static: Story = { args: { interactive: false } };

export const Interactive: Story = { args: { interactive: true } };

export const LongText: Story = {
  args: {
    interactive: true,
    title: 'A considerably longer card title that has to wrap onto several lines',
    body: 'Supporting copy that is long enough to wrap as well, to check padding and overflow at narrow widths.',
  },
};

export const StaticVsInteractive: Story = {
  render: (args) =>
    stateGrid([
      { label: 'static', node: build({ ...args, interactive: false }) },
      { label: 'interactive', node: build({ ...args, interactive: true }) },
    ]),
};

export const LightDarkComparison: Story = {
  parameters: { nlStage: 'self' },
  render: (args, context) =>
    compareModes(context, () =>
      el('div', { className: 'sb-matrix' }, [
        build({ ...args, interactive: false }),
        build({ ...args, interactive: true }),
      ]),
    ),
};
