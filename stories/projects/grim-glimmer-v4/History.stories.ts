import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { createInteractionDemo, type InteractionOptions } from './interaction.js';
import { compareModes } from '../../lib/stage.js';
const meta = {
  title: 'Projects/Grim & Glimmer/V4/Interaction/History',
  parameters: { nlTheme: 'moonlit-oxblood', nlStage: 'bleed' },
  args: {
    size: 6,
    axisLock: true,
    haptics: true,
    adapter: { selectionStart: fn(), selectionChanged: fn(), selectionEnd: fn() },
    onTransaction: fn(),
  },
  render: (args) => createInteractionDemo(args),
} satisfies Meta<InteractionOptions>;
export default meta;
type Story = StoryObj<InteractionOptions>;
export const Playground: Story = {};
export const LightDarkComparison: Story = {
  parameters: { nlStage: 'self' },
  render: (args, context) =>
    compareModes(context, () => createInteractionDemo(args), {
      theme: 'moonlit-oxblood',
      bleed: true,
    }),
};
export const RestartUndo: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const before = [...canvasElement.querySelectorAll('[data-index]')].map(
      (cell) => cell.className,
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Restart board' }));
    await expect(canvas.getByText('1 undo entries · 100% zoom')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Undo move' }));
    await expect(
      [...canvasElement.querySelectorAll('[data-index]')].map((cell) => cell.className),
    ).toEqual(before);
  },
};
