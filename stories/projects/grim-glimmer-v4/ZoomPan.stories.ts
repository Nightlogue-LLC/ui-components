import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { createInteractionDemo, type InteractionOptions } from './interaction.js';
import { compareModes } from '../../lib/stage.js';
const meta = {
  title: 'Projects/Grim & Glimmer/V4/Interaction/ZoomPan',
  parameters: { nlTheme: 'moonlit-oxblood', nlStage: 'bleed' },
  args: {
    size: 15,
    axisLock: true,
    haptics: true,
    adapter: { selectionStart: fn(), selectionChanged: fn(), selectionEnd: fn() },
    onTransaction: fn(),
  },
  render: (args) => createInteractionDemo({ ...args, size: 15 }),
} satisfies Meta<InteractionOptions>;
export default meta;
type Story = StoryObj<InteractionOptions>;
export const FitToScreen: Story = {};
export const LightDarkComparison: Story = {
  parameters: { nlStage: 'self' },
  render: (args, context) =>
    compareModes(context, () => createInteractionDemo({ ...args, size: 15 }), {
      theme: 'moonlit-oxblood',
      bleed: true,
    }),
};
export const ZoomReset: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Zoom in' }));
    await expect(canvas.getByText('0 undo entries · 120% zoom')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Reset view' }));
    await expect(canvas.getByText('0 undo entries · 100% zoom')).toBeVisible();
  },
};

export const PinchRollbackAndClues: Story = {
  play: async ({ canvasElement }) => {
    const frame = canvasElement.querySelector<HTMLElement>('.gg-v4-pointer-viewport')!;
    const grid = canvasElement.querySelector<HTMLElement>('.nl-grim-glimmer-board')!;
    const rect = frame.getBoundingClientRect();
    const send = (type: string, pointerId: number, x: number, y: number) =>
      frame.dispatchEvent(
        new PointerEvent(type, {
          pointerId,
          pointerType: 'touch',
          clientX: rect.left + rect.width * x,
          clientY: rect.top + rect.height * y,
          bubbles: true,
        }),
      );
    send('pointerdown', 1, 0.02, 0.02);
    send('pointerdown', 2, 0.5, 0.5);
    await expect(grid.children[0]).toHaveClass('nl-grim-glimmer-board__cell--empty');
    send('pointermove', 2, 0.8, 0.8);
    send('pointerup', 2, 0.8, 0.8);
    send('pointerup', 1, 0.02, 0.02);
    await expect(within(canvasElement).getByRole('button', { name: 'Undo move' })).toBeDisabled();
    const columns = canvasElement.querySelector('.nl-grim-glimmer-clued-board__columns')!;
    const rows = canvasElement.querySelector('.nl-grim-glimmer-clued-board__rows')!;
    const col = columns.children[7]!.getBoundingClientRect();
    const row = rows.children[7]!.getBoundingClientRect();
    const top = grid.children[7]!.getBoundingClientRect();
    const left = grid.children[105]!.getBoundingClientRect();
    await expect(Math.abs(col.left + col.width / 2 - top.left - top.width / 2)).toBeLessThan(1);
    await expect(Math.abs(row.top + row.height / 2 - left.top - left.height / 2)).toBeLessThan(1);
  },
};
