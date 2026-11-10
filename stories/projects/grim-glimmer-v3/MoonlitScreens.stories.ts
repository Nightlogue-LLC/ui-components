import type { Meta, StoryObj } from '@storybook/html-vite';
import { screen, type Screen } from './screen-fixtures.js';
import { el } from '../../lib/dom.js';
const meta = {
  title: 'Projects/Grim & Glimmer/V3/Moonlit Oxblood',
  parameters: { nlStage: 'self' },
  args: { screen: 'Home' as Screen },
  argTypes: {
    screen: {
      control: 'select',
      options: ['Home', 'Game Screen', 'Game Menu', 'Settings', 'Puzzle Complete'],
    },
  },
  render: (args: { screen: Screen }) =>
    el(
      'div',
      { className: 'sb-screen-comparison' },
      (['light', 'dark'] as const).map((mode) =>
        el('section', {}, [
          el('h2', { text: 'Moonlit Oxblood · ' + mode }),
          screen(args.screen, 'moonlit-oxblood', mode),
        ]),
      ),
    ),
} satisfies Meta<{ screen: Screen }>;
export default meta;
type Story = StoryObj<{ screen: Screen }>;
export const LightDarkComparison: Story = {};
export const Home: Story = { args: { screen: 'Home' } };
export const GameScreen: Story = { args: { screen: 'Game Screen' } };
export const GameMenuSheet: Story = { args: { screen: 'Game Menu' } };
export const Settings: Story = { args: { screen: 'Settings' } };
export const PuzzleComplete: Story = { args: { screen: 'Puzzle Complete' } };
