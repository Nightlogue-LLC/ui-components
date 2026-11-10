import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import {
  createSettingsPreview,
  DEFAULT_PREFERENCES,
  type OverlayOptions,
} from './settings-proposal.js';
import { compareModes } from '../../lib/stage.js';
const meta = {
  title: 'Projects/Grim & Glimmer/V4/Settings/Settings',
  parameters: { nlTheme: 'moonlit-oxblood', nlStage: 'bleed' },
  args: {
    reducedMotion: false,
    state: DEFAULT_PREFERENCES,
    tick: fn(),
    onChange: fn(),
    onNavigate: fn(),
  },
  argTypes: { reducedMotion: { control: 'boolean' }, state: { control: 'object' } },
  render: (args) => createSettingsPreview(args),
} satisfies Meta<OverlayOptions>;
export default meta;
type Story = StoryObj<OverlayOptions>;
export const Playground: Story = {};
export const ReducedMotion: Story = { args: { reducedMotion: true } };
export const LightDarkComparison: Story = {
  parameters: { nlStage: 'self' },
  render: (args, context) =>
    compareModes(
      context,
      (mode) =>
        createSettingsPreview({
          ...args,
          state: { ...DEFAULT_PREFERENCES, ...args.state, appearance: mode },
        }),
      { theme: 'moonlit-oxblood', bleed: true },
    ),
};
export const ThemeAndSwitches: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('radio', { name: 'Dark' }));
    await expect(canvasElement.querySelector('.gg-v4-settings-preview')).toHaveAttribute(
      'data-nl-mode',
      'dark',
    );
    await userEvent.click(canvas.getByRole('switch', { name: 'Music' }));
    await expect(canvas.getByRole('switch', { name: 'Music' })).toBeChecked();
    await userEvent.click(canvas.getByRole('radio', { name: 'System' }));
    await expect(canvas.getByRole('radio', { name: 'System' })).toBeChecked();
  },
};
