import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { createOverlayPreview, type FlowOptions } from './overlay-fixtures.js';
import { compareModes } from '../../lib/stage.js';
const meta = {
  title: 'Projects/Grim & Glimmer/V4/Sheets/GameMenu',
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
  render: (args) => createOverlayPreview(args, 'menu'),
} satisfies Meta<FlowOptions>;
export default meta;
type Story = StoryObj<FlowOptions>;
export const Playground: Story = {};
export const ReducedMotion: Story = { args: { reducedMotion: true } };
export const LightDarkComparison: Story = {
  parameters: { nlStage: 'self' },
  render: (args, context) =>
    compareModes(context, () => createOverlayPreview(args, 'menu'), {
      theme: 'moonlit-oxblood',
      bleed: true,
    }),
};
export const OpenCloseReopen: Story = {
  args: { reducedMotion: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Game menu' });
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await userEvent.tab();
    await expect(canvas.getByRole('switch', { name: 'Music' })).toHaveFocus();
    const sound = canvas.getByRole('switch', { name: 'Sound effects' });
    await userEvent.click(sound);
    await expect(sound).not.toBeChecked();
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toHaveFocus();
    await userEvent.click(trigger);
    await userEvent.keyboard('{Escape}');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  },
};
