import type { Meta, StoryObj } from '@storybook/html-vite';
import { comparison, type Screen } from './onyx-screens.js';
const meta = {
  title: 'Projects/Grim & Glimmer — Editorial V3/Onyx & Crimson',
  parameters: { nlStage: 'self' },
  args: { screen: 'Home' as Screen },
  argTypes: {
    screen: {
      control: 'select',
      options: ['Home', 'Game Screen', 'Game Menu', 'Settings', 'Puzzle Complete'],
    },
  },
  render: (args: { screen: Screen }) => comparison(args.screen),
} satisfies Meta<{ screen: Screen }>;
export default meta;
type Story = StoryObj<{ screen: Screen }>;
export const LightDarkComparison: Story = {};
export const Home: Story = { args: { screen: 'Home' } };
export const GameScreen: Story = { args: { screen: 'Game Screen' } };
export const GameMenuSheet: Story = { args: { screen: 'Game Menu' } };
export const Settings: Story = { args: { screen: 'Settings' } };
export const PuzzleComplete: Story = { args: { screen: 'Puzzle Complete' } };
export const AllVariants: Story = { render: (args) => comparison(args.screen, true) };

import onyxCss from '../../../src/themes/onyx-crimson/onyx-crimson.css?raw';
import blueCss from '../../../src/themes/onyx-crimson-blue/onyx-crimson-blue.css?raw';
import { auditOnyx } from './onyx-contrast.js';
export const ContrastAudit: Story = {
  render: () => {
    const table = document.createElement('table');
    for (const row of [
      ['Variant', 'Role', 'Surface', 'Ratio', 'Minimum', 'Result'],
      ...auditOnyx(onyxCss, blueCss).map((r) => [
        r.variant,
        r.role,
        r.surface,
        r.ratio.toFixed(2),
        String(r.minimum),
        r.pass ? 'Pass' : 'FAIL',
      ]),
    ]) {
      const tr = table.insertRow();
      for (const value of row) {
        const cell = tr.insertCell();
        cell.textContent = value;
        cell.style.cssText = 'padding:8px;border:1px solid #888';
      }
    }
    return table;
  },
};
