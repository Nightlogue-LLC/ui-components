import type { Meta, StoryObj } from '@storybook/html-vite';
import { compareModes } from '../../lib/stage.js';
import { screen } from '../grim-glimmer-v3/screen-fixtures.js';
const meta = {
  title: 'Projects/Grim & Glimmer/GameHeader',
  parameters: { nlStage: 'self' },
} satisfies Meta;
export default meta;
export const ClosedLightDarkComparison: StoryObj = {
  render: (_, context) =>
    compareModes(context, (mode) => screen('Game Screen', 'moonlit-oxblood', mode), {
      theme: 'moonlit-oxblood',
    }),
};
export const OpenLightDarkComparison: StoryObj = {
  render: (_, context) =>
    compareModes(context, (mode) => screen('Game Menu', 'moonlit-oxblood', mode), {
      theme: 'moonlit-oxblood',
    }),
};
