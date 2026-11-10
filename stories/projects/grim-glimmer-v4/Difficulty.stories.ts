import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { createOverlayPreview, type FlowOptions } from './overlay-fixtures.js';
import { compareModes } from '../../lib/stage.js';
const meta = {
  title: 'Projects/Grim & Glimmer/V4/Sheets/Difficulty',
  parameters: { nlTheme: 'moonlit-oxblood', nlStage: 'bleed' },
  args: {
    reducedMotion: false,
    difficulty: 'easy',
    initialLesson: 0,
    longContent: false,
    tick: fn(),
    onChange: fn(),
    onNavigate: fn(),
    onNewGame: fn(),
    onTutorial: fn(),
  },
  argTypes: {
    reducedMotion: { control: 'boolean' },
    difficulty: { control: 'select', options: ['easy', 'medium', 'hard'] },
    initialLesson: { control: { type: 'number', min: 0, max: 8, step: 1 } },
    longContent: { control: 'boolean' },
  },
  render: (args) => createOverlayPreview(args, 'difficulty'),
} satisfies Meta<FlowOptions>;
export default meta;
type Story = StoryObj<FlowOptions>;
export const Playground: Story = {};
export const ReducedMotion: Story = { args: { reducedMotion: true } };
export const LightDarkComparison: Story = {
  parameters: { nlStage: 'self' },
  render: (args, context) =>
    compareModes(context, () => createOverlayPreview(args, 'difficulty'), {
      theme: 'moonlit-oxblood',
      bleed: true,
    }),
};
export const TallContent: Story = { args: { longContent: true } };
export const SelectAndStart: Story = {
  args: { reducedMotion: true },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Open difficulty sheet' }));
    await userEvent.click(canvas.getByRole('radio', { name: 'Hard' }));
    await expect(canvas.getByRole('radio', { name: 'Hard' })).toBeChecked();
    await userEvent.click(canvas.getByRole('button', { name: 'New Game' }));
    await waitFor(() => expect(args.onNewGame).toHaveBeenCalledWith('hard'));
    await expect(canvas.getByRole('button', { name: 'Open difficulty sheet' })).toHaveFocus();
  },
};

export const HelpAndDragDismissal: Story = {
  args: { reducedMotion: true, difficulty: 'hard' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Open difficulty sheet' }));
    await userEvent.click(canvas.getByRole('button', { name: 'How to Play' }));
    await waitFor(() => expect(canvasElement.querySelector('.gg-v4-howto[open]')).not.toBeNull());
    await userEvent.click(canvas.getByRole('button', { name: 'Skip' }));
    await waitFor(() => expect(canvas.getByRole('radio', { name: 'Hard' })).toBeChecked());
    const handle = canvasElement.querySelector<HTMLElement>('.nl-bottom-sheet__handle')!;
    await userEvent.pointer([
      { keys: '[TouchA>]', target: handle, coords: { clientY: 0 } },
      { pointerName: 'TouchA', target: handle, coords: { clientY: 150 } },
      { keys: '[/TouchA]', target: handle, coords: { clientY: 150 } },
    ]);
    await waitFor(() => expect(canvasElement.querySelector('dialog[open]')).toBeNull());
  },
};
