import type { Meta, StoryObj } from '@storybook/html-vite';
import { fn } from 'storybook/test';
import { createSelect } from '../../../src/components/select/index.js';
import { compareModes } from '../../lib/stage.js';

const options = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

interface Args {
  value: string;
  onChange: (value: string) => void;
}

const meta = {
  title: 'Components/Inputs/Select',
  tags: ['autodocs'],
  args: { value: 'system', onChange: fn() },
  argTypes: { value: { control: 'inline-radio', options: options.map((item) => item.value) } },
  render: (args) => createSelect({ label: 'Appearance', options, ...args }),
  parameters: {
    docs: {
      description: {
        component:
          'Themed in-app selection popover. Click or Enter commits a choice. Arrow keys, Home/End and initial-letter search browse options; Escape cancels. No native select or phone picker.',
      },
    },
  },
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<Args>;

export const Playground: Story = {};
export const LightDarkComparison: Story = {
  parameters: { nlStage: 'self' },
  render: (args, context) =>
    compareModes(context, () => createSelect({ label: 'Appearance', options, ...args })),
};
