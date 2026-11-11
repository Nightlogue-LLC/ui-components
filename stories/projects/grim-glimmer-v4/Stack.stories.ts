import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { compareModes } from '../../lib/stage.js';
import { createStackPreview } from './deck-fixtures.js';
import type { DeckOptions } from './deck.js';
const meta = {
  title: 'Projects/Grim & Glimmer/V4/Home/Stack',
  parameters: { nlTheme: 'moonlit-oxblood', nlStage: 'bleed' },
  args: {
    initialCard: 0,
    dx: 0,
    reducedMotion: false,
    haptics: true,
    firstVisit: true,
    launch: 'cold',
    inProgress: false,
    tick: fn(),
    onPlay: fn(),
    onResume: fn(),
    onNewPuzzle: fn(),
    onLocked: fn(),
    onCard: fn(),
  },
  argTypes: {
    dx: { control: { type: 'range', min: -240, max: 240, step: 1 } },
    initialCard: { control: { type: 'number', min: 0, max: 2, step: 1 } },
    launch: { control: 'select', options: ['cold', 'return'] },
  },
  render: (args) => createStackPreview(args),
} satisfies Meta<DeckOptions>;
export default meta;
type Story = StoryObj<DeckOptions>;
export const Default: Story = {};
export const MidDrag: Story = { args: { dx: 70, launch: 'return', firstVisit: false } };
export const FaceDownOnTop: Story = { args: { initialCard: 1, launch: 'return' } };
export const InProgress: Story = { args: { inProgress: true } };
export const ReducedMotion: Story = { args: { reducedMotion: true } };
export const LightDarkComparison: Story = {
  parameters: { nlStage: 'self' },
  render: (args, context) =>
    compareModes(context, () => createStackPreview(args), {
      theme: 'moonlit-oxblood',
      bleed: true,
    }),
};
export const WrapAround: Story = {
  args: { reducedMotion: true, launch: 'return', firstVisit: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const n of [2, 3, 1]) {
      await userEvent.click(canvas.getByRole('button', { name: `Show card ${n}` }));
      await waitFor(() =>
        expect(canvasElement.querySelector('[role="status"]')).toHaveTextContent(`Card ${n} of 3`),
      );
    }
  },
};
export const KeyboardAndIndicators: Story = {
  args: { reducedMotion: true, launch: 'return', firstVisit: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole('button', { name: 'Play Trees & Tents' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() =>
      expect(canvasElement.querySelector('[role="status"]')).toHaveTextContent(
        'Card 2 of 3: locked puzzle',
      ),
    );
    await expect(canvas.getByRole('button', { name: 'Unrevealed puzzle 2, locked' })).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: 'Play Trees & Tents' })).toHaveFocus(),
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Show card 3' }));
    await waitFor(() =>
      expect(canvasElement.querySelector('[role="status"]')).toHaveTextContent('Card 3 of 3'),
    );
  },
};

export const SwipeCycle: Story = {
  args: { launch: 'return', firstVisit: false },
  play: async ({ canvasElement, args }) => {
    const target = canvasElement.querySelector<HTMLElement>('[data-top="true"] .gg-v4-deck-hit')!;
    const bounds = target.getBoundingClientRect();
    await userEvent.pointer([
      {
        keys: '[TouchA>]',
        target,
        coords: { clientX: bounds.left + bounds.width * 0.7, clientY: bounds.top + 100 },
      },
      {
        pointerName: 'TouchA',
        target,
        coords: { clientX: bounds.left + bounds.width * 0.2, clientY: bounds.top + 100 },
      },
      {
        keys: '[/TouchA]',
        target,
        coords: { clientX: bounds.left + bounds.width * 0.2, clientY: bounds.top + 100 },
      },
    ]);
    await waitFor(
      () => expect(canvasElement.querySelector('[role="status"]')).toHaveTextContent('Card 2 of 3'),
      { timeout: 1500 },
    );
    await expect(args.onPlay).not.toHaveBeenCalled();
  },
};
