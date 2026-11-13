import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { createOverlayPreview, type FlowOptions } from './overlay-fixtures.js';
// Retain the old story URL as a migration reference. New Game now lives in GameMenu.
const meta = {
  title: 'Projects/Grim & Glimmer/V4/Sheets/Difficulty',
  parameters: { nlTheme: 'moonlit-oxblood', nlStage: 'bleed' },
  args: { reducedMotion: true, onNewGame: fn() },
  render: (args) => createOverlayPreview(args, 'difficulty'),
} satisfies Meta<FlowOptions>;
export default meta;
type Story = StoryObj<FlowOptions>;
export const Playground: Story = {};
export const SelectAndStart: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Open New Game menu' }));
    await userEvent.click(canvas.getByRole('button', { name: '8×8' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Hard' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Start New Game' }));
    await expect(args.onNewGame).toHaveBeenCalledWith({ size: 8, difficulty: 'hard' });
    await expect(canvasElement.querySelector('dialog')).toBeNull();
  },
};
