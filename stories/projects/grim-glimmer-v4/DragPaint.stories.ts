import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { createInteractionDemo, type InteractionOptions } from './interaction.js';
import { compareModes } from '../../lib/stage.js';
const meta = {
  title: 'Projects/Grim & Glimmer/V4/Interaction/DragPaint',
  parameters: { nlTheme: 'moonlit-oxblood', nlStage: 'bleed' },
  args: {
    size: 6,
    axisLock: true,
    haptics: true,
    tool: 'star',
    reducedMotion: false,
    adapter: { selectionStart: fn(), selectionChanged: fn(), selectionEnd: fn() },
    onTransaction: fn(),
  },
  argTypes: {
    size: { control: 'select', options: [5, 6, 8, 15] },
    axisLock: { control: 'boolean' },
    haptics: { control: 'boolean' },
    tool: { control: 'select', options: ['star', 'exclude'] },
    reducedMotion: { control: 'boolean' },
  },
  render: (args) => createInteractionDemo(args),
} satisfies Meta<InteractionOptions>;
export default meta;
type Story = StoryObj<InteractionOptions>;
export const Playground: Story = {};
export const FreeStroke: Story = { args: { axisLock: false } };
export const HapticsOff: Story = { args: { haptics: false } };
export const ReducedMotion: Story = { args: { reducedMotion: true } };
export const LightDarkComparison: Story = {
  parameters: { nlStage: 'self' },
  render: (args, context) =>
    compareModes(context, () => createInteractionDemo(args), {
      theme: 'moonlit-oxblood',
      bleed: true,
    }),
};
export const StrokeContractDemo: Story = {
  args: { size: 6, tool: 'star' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const viewport = canvasElement.querySelector<HTMLElement>('.gg-v4-pointer-viewport')!;
    const cells = canvasElement.querySelectorAll<HTMLElement>('[data-index]');
    const center = (index: number) => {
      const rect = cells[index]!.getBoundingClientRect();
      return { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 };
    };
    const stroke = (start: number, end: number) => {
      viewport.dispatchEvent(
        new PointerEvent('pointerdown', {
          ...center(start),
          pointerId: 1,
          pointerType: 'touch',
          bubbles: true,
        }),
      );
      viewport.dispatchEvent(
        new PointerEvent('pointermove', {
          ...center(end),
          pointerId: 1,
          pointerType: 'touch',
          bubbles: true,
        }),
      );
      viewport.dispatchEvent(
        new PointerEvent('pointerup', {
          ...center(end),
          pointerId: 1,
          pointerType: 'touch',
          bubbles: true,
        }),
      );
    };
    // One endpoint jump traverses the intervening cells through interpolation.
    stroke(0, 4);
    await expect(cells[0]).toHaveClass('nl-grim-glimmer-board__cell--placed');
    await expect(cells[1]).toHaveClass('nl-grim-glimmer-board__cell--fixed');
    await expect(cells[2]).toHaveClass('nl-grim-glimmer-board__cell--placed');
    await expect(cells[4]).toHaveClass('nl-grim-glimmer-board__cell--placed');
    await userEvent.click(canvas.getByRole('button', { name: 'Undo move' }));
    await expect(cells[0]).toHaveClass('nl-grim-glimmer-board__cell--empty');
    await expect(cells[2]).toHaveClass('nl-grim-glimmer-board__cell--empty');
    await expect(cells[4]).toHaveClass('nl-grim-glimmer-board__cell--empty');
    stroke(0, 4);
    stroke(0, 4);
    await expect(cells[3]).toHaveClass('nl-grim-glimmer-board__cell--empty');
    await userEvent.click(canvas.getByRole('button', { name: 'Undo move' }));
    await expect(cells[3]).toHaveClass('nl-grim-glimmer-board__cell--placed');
    await userEvent.click(canvas.getByRole('button', { name: 'Exclude cell' }));
    stroke(5, 0); // Different tentative glyph cannot start an exclusion stroke.
    await expect(cells[5]).toHaveClass('nl-grim-glimmer-board__cell--tentative');
    await expect(cells[0]).toHaveClass('nl-grim-glimmer-board__cell--placed');
  },
};
