import type { Meta, StoryObj } from '@storybook/html-vite';
import { fn } from 'storybook/test';
import {
  createSegmentedControl,
  updateSegmentedControl,
} from '../../../src/components/segmented-control/index.js';
import { el } from '../../lib/dom.js';
import { compareModes, stateGrid } from '../../lib/stage.js';

// Sample values for the catalog only; the component itself has no built-in options.
const OPTIONS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
] as const;

interface Args {
  value: string;
  rejectChange: boolean;
  /** Called with each requested value; shows up in the Actions panel. */
  onChange: (next: string) => void;
}

/** A controlled demo: the "app" accepts or declines each request, as a real app would. */
function build(args: Args): HTMLElement {
  let value = args.value;
  const props = () => ({ label: 'Difficulty', options: OPTIONS, value });
  const control = createSegmentedControl({
    ...props(),
    onChange: (next) => {
      args.onChange(next);
      if (args.rejectChange) return; // the app declines: the control stays put
      value = next;
      updateSegmentedControl(control, props());
    },
  });
  return control;
}

const meta = {
  title: 'Components/Inputs/SegmentedControl',
  tags: ['autodocs'],
  args: { value: 'easy', rejectChange: false, onChange: fn() },
  argTypes: {
    value: { control: 'inline-radio', options: OPTIONS.map((o) => o.value) },
    rejectChange: {
      control: 'boolean',
      description:
        'Simulates an app that declines the request (for example while a confirmation is open).',
    },
    onChange: { action: 'requested', table: { category: 'events' } },
  },
  render: (args) => build(args),
  parameters: {
    docs: {
      description: {
        component: `
Single select on **native radio inputs** in a labelled \`radiogroup\`. Tab enters on the selected option, arrow
keys move and select, Space selects. Options need full text labels.

The control is **controlled**: a pick snaps back to the current value and is reported through \`onChange(next)\`.
The app accepts by calling \`updateSegmentedControl\`, or declines by doing nothing, which is how an app can ask
for confirmation first. Tick \`rejectChange\` to see a declined request.

\`\`\`ts
import { createSegmentedControl, updateSegmentedControl } from '@nightlogue-llc/ui-components';

const control = createSegmentedControl({
  label: 'Difficulty', options, value,
  onChange: (next) => { value = next; updateSegmentedControl(control, { label: 'Difficulty', options, value }); },
});
\`\`\`
`,
      },
    },
  },
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<Args>;

export const Playground: Story = {};

export const SelectedStates: Story = {
  render: (args) =>
    stateGrid(
      OPTIONS.map((o) => ({
        label: `selected: ${o.label}`,
        node: build({ ...args, value: o.value }),
      })),
    ),
};

export const DeclinedChange: Story = {
  args: { rejectChange: true },
  parameters: {
    docs: {
      description: {
        story:
          'The app declines every request, so the control never moves. Check the Actions panel.',
      },
    },
  },
};

export const LightDarkComparison: Story = {
  parameters: { nlStage: 'self' },
  render: (args, context) => compareModes(context, () => el('div', {}, [build(args)])),
};
