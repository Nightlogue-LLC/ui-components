import type { Meta, StoryObj } from '@storybook/html-vite';
import { fn } from 'storybook/test';
import { compareModes } from '../../lib/stage.js';
import { el } from '../../lib/dom.js';
import {
  createTarotHeaderPreview,
  createGlyphSpecimens,
  type TarotPreviewOptions,
} from './tarot-header-fixtures.js';
import { PUZZLE_IDENTITIES, createTarotGameplayHeader } from './tarot-header.js';
const meta = {
  title: 'Projects/Grim & Glimmer/V4/Header/TarotGameplayHeader',
  parameters: {
    nlTheme: 'moonlit-oxblood',
    nlStage: 'bleed',
    docs: {
      description: {
        component:
          'Current tarot identity proposal. Separate numeral, archetype, puzzle title, difficulty and dimensions. Uses the existing app navigation and compact Hint/Menu header. Static glyph review only: no engine, tutorial or saved-state changes. The original header story remains a historical comparison.',
      },
    },
  },
  args: {
    ...PUZZLE_IDENTITIES.camper,
    size: 6,
    difficulty: 'Easy',
    columns: 6,
    rows: 6,
    glyphs: 'supplied',
    showIdentity: true,
    onHint: fn(),
    onMenu: fn(),
    onBack: fn(),
    onSettings: fn(),
  },
  argTypes: {
    glyphs: { control: 'select', options: ['existing', 'supplied'] },
    size: { control: 'select', options: [5, 6, 8, 15] },
    difficulty: { control: 'select', options: ['Easy', 'Medium', 'Hard'] },
    columns: { control: { type: 'number', min: 1, max: 15 } },
    rows: { control: { type: 'number', min: 1, max: 15 } },
  },
  render: (args) => createTarotHeaderPreview(args),
} satisfies Meta<TarotPreviewOptions>;
export default meta;
type Story = StoryObj<TarotPreviewOptions>;
export const Camper: Story = {};
export const LightDarkComparison: Story = {
  parameters: { nlStage: 'self' },
  render: (args, context) =>
    compareModes(context, () => createTarotHeaderPreview(args), {
      theme: 'moonlit-oxblood',
      bleed: true,
    }),
};
export const Mobile393: Story = { globals: { viewport: { value: 'mobile393', isRotated: false } } };
export const Mobile360: Story = { globals: { viewport: { value: 'mobile360', isRotated: false } } };
export const Dense15: Story = { args: { size: 15, columns: 15, rows: 15, difficulty: 'Hard' } };
export const ExistingGlyphComparison: Story = { args: { glyphs: 'existing' } };
export const SuppliedGlyphSpecimens: Story = {
  parameters: { nlStage: 'self' },
  render: (_args, context) =>
    compareModes(context, () => createGlyphSpecimens(), { theme: 'moonlit-oxblood' }),
};
export const CollectionHeaders: Story = {
  parameters: { nlStage: 'self' },
  render: (args, context) =>
    compareModes(
      context,
      () =>
        el(
          'section',
          { className: 'gg-v4-scope' },
          Object.values(PUZZLE_IDENTITIES).map((identity, i) =>
            createTarotGameplayHeader({
              ...identity,
              difficulty: i === 0 ? 'Easy' : 'Medium',
              columns: i === 0 ? 6 : 8,
              rows: i === 0 ? 6 : 8,
              onHint: args.onHint,
              onMenu: args.onMenu,
            }),
          ),
        ),
      { theme: 'moonlit-oxblood' },
    ),
};
export const BeforeAfterLayout: Story = {
  parameters: { nlStage: 'self' },
  render: (args, context) =>
    compareModes(
      context,
      () =>
        el('section', {}, [
          el('p', { text: 'Two-line reference — identical board and screen slots' }),
          createTarotHeaderPreview({ ...args, showIdentity: false }),
          el('p', { text: 'Three-line tarot identity — identical board and screen slots' }),
          createTarotHeaderPreview(args),
        ]),
      { theme: 'moonlit-oxblood', bleed: true },
    ),
};
export const Arbiter: Story = {
  args: { ...PUZZLE_IDENTITIES.arbiter, difficulty: 'Medium', columns: 8, rows: 8 },
  render: (args) =>
    createTarotGameplayHeader({
      ...PUZZLE_IDENTITIES.arbiter,
      ...args,
      difficulty: args.difficulty ?? 'Medium',
      columns: args.columns ?? 8,
      rows: args.rows ?? 8,
    }),
};
export const Architect: Story = {
  args: { ...PUZZLE_IDENTITIES.architect, difficulty: 'Medium', columns: 8, rows: 8 },
  render: (args) =>
    createTarotGameplayHeader({
      ...PUZZLE_IDENTITIES.architect,
      ...args,
      difficulty: args.difficulty ?? 'Medium',
      columns: args.columns ?? 8,
      rows: args.rows ?? 8,
    }),
};
