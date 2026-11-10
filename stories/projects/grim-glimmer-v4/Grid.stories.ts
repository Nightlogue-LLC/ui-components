import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { boardStage, SIZES, type BoardOptions } from './board.js';
import { compareModes } from '../../lib/stage.js';

const meta = {
  title: 'Projects/Grim & Glimmer/V4/Board/Grid',
  parameters: {
    nlTheme: 'moonlit-oxblood',
    nlStage: 'bleed',
    docs: {
      description: {
        component:
          'V4 board review only. Fit sizing yields approximately 22.47px cells at 393px / 20.27px at 360px for 15×15; a 23px dense cell with this frame requires 401px width. These are calculated budgets, not physical-device measurements. All board states and clue reports are visual fixtures, not game rules.',
      },
    },
  },
  args: {
    size: 6,
    palette: 'current',
    glow: true,
    framed: false,
    guides: true,
    interactive: true,
    conflict: true,
    hint: true,
    onCellActivate: fn(),
  },
  argTypes: {
    size: { control: 'select', options: SIZES },
    palette: { control: 'select', options: ['current', 'proposal'] },
    glow: { control: 'boolean' },
    framed: {
      control: 'boolean',
      description: 'Restore card for 5×5–8×8 only; dense remains frameless.',
    },
    guides: { control: 'boolean' },
    interactive: { control: 'boolean' },
    conflict: { control: 'boolean' },
    hint: { control: 'boolean' },
    onCellActivate: { action: 'visual cell activated' },
  },
  render: (args) => boardStage(args),
} satisfies Meta<BoardOptions>;
export default meta;
type Story = StoryObj<BoardOptions>;
export const Grid5x5: Story = { args: { size: 5 } };
export const Grid6x6: Story = { args: { size: 6 } };
export const Grid8x8: Story = { args: { size: 8 } };
export const Grid15x15: Story = { args: { size: 15 } };
export const ProposedPalette: Story = { args: { palette: 'proposal' } };
export const LightDarkComparison: Story = {
  parameters: { nlStage: 'self' },
  render: (args, context) =>
    compareModes(context, () => boardStage(args), { theme: 'moonlit-oxblood', bleed: true }),
};
export const InteractionDemo: Story = {
  play: async ({ canvasElement, args }) => {
    if (args.interactive === false) return;
    const canvas = within(canvasElement);
    const cell = canvas.getByRole('button', { name: /Row 1, column 1:/ });
    await userEvent.click(cell);
    await expect(cell).toHaveAccessibleName(/tentative star/);
    await userEvent.click(cell);
    await expect(cell).toHaveAccessibleName(/: star/);
    await userEvent.click(cell);
    await expect(cell).toHaveAccessibleName(/: empty/);
  },
};
export const AllSizesLightDark: Story = {
  parameters: { nlStage: 'self' },
  render: (args, context) =>
    compareModes(
      context,
      () => {
        const host = document.createElement('div');
        for (const size of SIZES) host.append(boardStage({ ...args, size }));
        return host;
      },
      { theme: 'moonlit-oxblood', bleed: true },
    ),
};

export const FramedSmallBoard: Story = { args: { size: 6, framed: true } };
