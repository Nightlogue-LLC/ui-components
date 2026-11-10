import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { createControlsDemo, type DemoOptions } from './controls.js';
import { compareModes } from '../../lib/stage.js';
const meta = {
  title: 'Projects/Grim & Glimmer/V4/Controls/ControlRow',
  parameters: { nlTheme: 'moonlit-oxblood', nlStage: 'bleed' },
  args: {
    tool: 'star',
    canUndo: true,
    hint: 'available',
    disabled: false,
    haptics: true,
    tick: fn(),
    onTool: fn(),
    onUndo: fn(),
    onHint: fn(),
    onRestart: fn(),
    onTransaction: fn(),
  },
  argTypes: {
    tool: { control: 'select', options: ['star', 'exclude'] },
    hint: { control: 'select', options: ['available', 'idle', 'disabled'] },
    canUndo: { control: 'boolean' },
    disabled: { control: 'boolean' },
    haptics: { control: 'boolean' },
  },
  render: (args) => createControlsDemo(args),
} satisfies Meta<DemoOptions>;
export default meta;
type Story = StoryObj<DemoOptions>;
export const Playground: Story = {};
export const NoUndo: Story = { args: { canUndo: false } };
export const HintDisabled: Story = { args: { hint: 'disabled' } };
export const HintIdle: Story = { args: { hint: 'idle' } };
export const Disabled: Story = { args: { disabled: true } };
export const HapticsOff: Story = { args: { haptics: false } };
export const LightDarkComparison: Story = {
  parameters: { nlStage: 'self' },
  render: (args, context) =>
    compareModes(context, () => createControlsDemo(args), {
      theme: 'moonlit-oxblood',
      bleed: true,
    }),
};
export const InteractionDemo: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Exclude cell' }));
    await expect(canvas.getByRole('button', { name: 'Exclude cell' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Hint available' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Restart board' }));
    await expect(canvas.getByText('Board cleared')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: /^Undo$/ }));
    await expect(canvas.queryByText('Board cleared')).not.toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Exclude cell' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  },
};

export const ReducedMotion: Story = { args: { reducedMotion: true } };
