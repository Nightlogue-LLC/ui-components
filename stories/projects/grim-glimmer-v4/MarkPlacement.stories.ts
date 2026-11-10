import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import {
  createMarkPreview,
  createIntegratedMotion,
  type MotionOptions,
} from './motion-fixtures.js';
import { compareModes } from '../../lib/stage.js';
const meta = {
  title: 'Projects/Grim & Glimmer/V4/Motion/MarkPlacement',
  parameters: { nlTheme: 'moonlit-oxblood', nlStage: 'bleed' },
  args: {
    size: 6,
    mark: 'placed',
    reducedMotion: false,
    haptics: true,
    adapter: { selectionStart: fn(), selectionChanged: fn(), selectionEnd: fn() },
    onTransaction: fn(),
  },
  argTypes: {
    size: { control: 'select', options: [5, 6, 8, 15] },
    mark: { control: 'select', options: ['placed', 'excluded', 'erase'] },
    reducedMotion: { control: 'boolean' },
    haptics: { control: 'boolean' },
  },
  render: (args) => createMarkPreview(args),
} satisfies Meta<MotionOptions>;
export default meta;
type Story = StoryObj<MotionOptions>;
export const Star: Story = {};
export const XReveal: Story = { args: { mark: 'excluded' } };
export const Erase: Story = { args: { mark: 'erase' } };
export const ReducedMotion: Story = { args: { reducedMotion: true } };
export const LightDarkComparison: Story = {
  parameters: { nlStage: 'self' },
  render: (args, context) =>
    compareModes(context, () => createMarkPreview(args), { theme: 'moonlit-oxblood', bleed: true }),
};
export const IntegratedPainting: Story = { render: (args) => createIntegratedMotion(args) };
export const ReplayDemo: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Replay mark' }));
    const first = canvasElement.querySelector('[data-index="0"]')!;
    await expect(first).toHaveClass(
      `nl-grim-glimmer-board__cell--${args.mark === 'erase' ? 'empty' : args.mark}`,
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Replay mark' }));
    await expect(canvas.getByText('1 undo entries')).toBeVisible();
  },
};
