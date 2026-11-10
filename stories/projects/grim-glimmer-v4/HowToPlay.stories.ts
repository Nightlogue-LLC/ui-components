import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { createOverlayPreview, type FlowOptions } from './overlay-fixtures.js';
import { compareModes } from '../../lib/stage.js';
const meta = {
  title: 'Projects/Grim & Glimmer/V4/HowToPlay/Modal',
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
  render: (args) => createOverlayPreview(args, 'howto'),
} satisfies Meta<FlowOptions>;
export default meta;
type Story = StoryObj<FlowOptions>;
export const Playground: Story = {};
export const ReducedMotion: Story = { args: { reducedMotion: true } };
export const LightDarkComparison: Story = {
  parameters: { nlStage: 'self' },
  render: (args, context) =>
    compareModes(context, () => createOverlayPreview(args, 'howto'), {
      theme: 'moonlit-oxblood',
      bleed: true,
    }),
};
export const ZoomGuidance: Story = { args: { initialLesson: 7 } };
export const PracticeGate: Story = {
  args: { reducedMotion: true, initialLesson: 1 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Open guided tutorial' }));
    const next = canvas.getByRole('button', { name: 'Next' });
    await expect(next).toBeDisabled();
    for (let i = 0; i < 3; i++)
      await userEvent.click(
        canvasElement.querySelector<HTMLButtonElement>('dialog .nl-grim-glimmer-board__cell')!,
      );
    await expect(next).toBeEnabled();
    await userEvent.click(next);
    await expect(canvasElement.querySelector('.gg-v4-step-dots')).toHaveTextContent('Step 3 of 9');
  },
};
