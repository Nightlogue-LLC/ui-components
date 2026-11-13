import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { createOverlayPreview, type FlowOptions } from './menu-fixtures.js';
import { compareModes } from '../../lib/stage.js';
const meta = {
  title: 'Projects/Grim & Glimmer/Feature Expansion/GameMenu',
  parameters: { nlTheme: 'moonlit-oxblood', nlStage: 'bleed' },
  args: {
    reducedMotion: false,
    difficulty: 'easy',
    size: 6,
    initiallyOpen: false,
    availability: 'ready',
    longContent: false,
    tick: fn(),
    onNavigate: fn(),
    onNewGame: fn(),
    onSurprise: fn(),
  },
  argTypes: {
    difficulty: { control: 'select', options: ['easy', 'medium', 'hard'] },
    size: { control: 'select', options: [6, 8, 10, 12, 15] },
    availability: { control: 'select', options: ['ready', 'loading', 'unavailable'] },
  },
  render: (args) => createOverlayPreview(args, 'menu'),
} satisfies Meta<FlowOptions>;
export default meta;
type Story = StoryObj<FlowOptions>;
export const Playground: Story = {};
export const Open: Story = { args: { initiallyOpen: true } };
export const ReducedMotion: Story = { args: { initiallyOpen: true, reducedMotion: true } };
export const LightDarkComparison: Story = {
  parameters: { nlStage: 'self' },
  args: { initiallyOpen: true },
  render: (args, context) =>
    compareModes(context, () => createOverlayPreview(args, 'menu'), {
      theme: 'moonlit-oxblood',
      bleed: true,
    }),
};
export const Loading: Story = { args: { initiallyOpen: true, availability: 'loading' } };
export const Unavailable: Story = {
  args: { initiallyOpen: true, availability: 'unavailable', size: 15, difficulty: 'hard' },
};
export const TallContent: Story = { args: { initiallyOpen: true, longContent: true } };
export const Mobile360: Story = {
  args: { initiallyOpen: true },
  render: (args) => {
    const root = createOverlayPreview(args);
    root.style.maxWidth = '360px';
    return root;
  },
};
export const Mobile390: Story = {
  args: { initiallyOpen: true },
  render: (args) => {
    const root = createOverlayPreview(args);
    root.style.maxWidth = '390px';
    return root;
  },
};
export const OpenCloseReopen: Story = {
  args: { reducedMotion: true },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Game menu' });
    await userEvent.click(trigger);
    await expect(canvas.getByRole('radio', { name: '6×6' })).toHaveFocus();
    const hard = canvas.getByRole('radio', { name: 'Hard' });
    await userEvent.click(hard);
    await expect(hard).toBeChecked();
    await expect(args.onNewGame).not.toHaveBeenCalled();
    await userEvent.click(trigger);
    await expect(trigger).toHaveFocus();
    await userEvent.click(trigger);
    await expect(hard).not.toBeChecked();
    await userEvent.keyboard('{Escape}');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  },
};

export const StartAndSurprise: Story = {
  args: { reducedMotion: true },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Game menu' });
    await userEvent.click(trigger);
    await userEvent.click(canvas.getByRole('radio', { name: '8×8' }));
    await userEvent.click(canvas.getByRole('radio', { name: 'Hard' }));
    await userEvent.click(canvas.getByRole('button', { name: 'New Game' }));
    await expect(args.onNewGame).toHaveBeenCalledWith({ size: 8, difficulty: 'hard' });
    await userEvent.click(trigger);
    await userEvent.click(canvas.getByRole('button', { name: 'Surprise Me' }));
    await expect(args.onSurprise).toHaveBeenCalledOnce();
    await userEvent.click(trigger);
    await expect(canvas.getByRole('radio', { name: 'Hard' })).toBeChecked();
  },
};

export const SelectedPoolUnavailable: Story = {
  args: {
    initiallyOpen: true,
    availability: 'unavailable',
    surpriseAvailability: 'ready',
    size: 15,
    difficulty: 'hard',
  },
};

export const GameSettingsUnavailable: Story = {
  args: { initiallyOpen: true, gameSettingsUnavailable: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const action = canvas.getByRole('button', { name: 'Game Settings' });
    await expect(action).toBeDisabled();
    await expect(action).toHaveAccessibleDescription('Not available yet');
  },
};
