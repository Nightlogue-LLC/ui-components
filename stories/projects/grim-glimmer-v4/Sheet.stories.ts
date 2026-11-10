import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { createVictoryPreview, createVictoryComparison, type VictoryOptions } from './victory.js';
import { compareModes } from '../../lib/stage.js';
const meta = {
  title: 'Projects/Grim & Glimmer/V4/Victory/Sheet',
  parameters: { nlTheme: 'moonlit-oxblood', nlStage: 'bleed' },
  args: {
    size: 6,
    message: 'Every star is in place.',
    messageMode: 'fixed',
    showStats: true,
    time: '02:14',
    hints: 0,
    mistakes: 1,
    tryMedium: false,
    reducedMotion: false,
    haptics: true,
    success: fn(),
    onHome: fn(),
    onNext: fn(),
    onMedium: fn(),
    onDismiss: fn(),
  },
  argTypes: {
    messageMode: { control: 'select', options: ['fixed', 'bank'] },
    showStats: { control: 'boolean' },
    tryMedium: { control: 'boolean' },
    reducedMotion: { control: 'boolean' },
    size: { control: 'select', options: [6, 15] },
  },
  render: (args) => createVictoryPreview(args, 'sheet'),
} satisfies Meta<VictoryOptions>;
export default meta;
type Story = StoryObj<VictoryOptions>;
export const Playground: Story = {};
export const MessageBank: Story = { args: { messageMode: 'bank' } };
export const StatsHidden: Story = { args: { showStats: false } };
export const TryMedium: Story = { args: { tryMedium: true } };
export const LongMessage: Story = {
  args: {
    message:
      'With patience and a little starlight, every piece has found its place beneath the evening sky.',
  },
};
export const ReducedMotion: Story = { args: { reducedMotion: true } };
export const LightDarkComparison: Story = {
  parameters: { nlStage: 'self' },
  render: (args, context) =>
    compareModes(context, () => createVictoryComparison(args), {
      theme: 'moonlit-oxblood',
      bleed: true,
    }),
};
export const DismissalDemo: Story = {
  args: { reducedMotion: true },
  play: async ({ canvasElement }) => {
    const open = canvasElement.querySelector<HTMLButtonElement>(
      '.gg-v4-victory-review-actions button',
    )!;
    await userEvent.click(open);
    const sheet = canvasElement.querySelector<HTMLDialogElement>('dialog')!;
    await expect(sheet).toHaveAttribute('open');
    await userEvent.click(sheet.querySelector<HTMLButtonElement>('.nl-dialog__close')!);
    await expect(sheet).not.toHaveAttribute('open');
    await expect(canvasElement.querySelector('.gg-v4-solved-chip')).toBeVisible();
    await expect(open).toHaveFocus();
  },
};
