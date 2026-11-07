import type { Meta, StoryObj } from '@storybook/html-vite';
import { fn } from 'storybook/test';
import {
  BUTTON_SIZES,
  BUTTON_VARIANTS,
  createButton,
  type ButtonProps,
} from '../../../src/components/button/index.js';
import { el } from '../../lib/dom.js';
import { compareModes, stateGrid } from '../../lib/stage.js';

/** Preview aid: a simulated pseudo-state (see story-styles.css). The playground shows real ones. */
type ForcedState = '' | 'hover' | 'pressed' | 'focus';
const FORCED: readonly Exclude<ForcedState, ''>[] = ['hover', 'pressed', 'focus'];

interface Args extends ButtonProps {
  onClick: (event: MouseEvent) => void;
  forceState: ForcedState;
}

function build(args: Args): HTMLButtonElement {
  const { forceState, ...options } = args;
  const button = createButton(options);
  if (forceState) button.classList.add(`sb-force-${forceState}`);
  return button;
}

const base: Args = {
  label: 'Button',
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  onClick: fn(),
  forceState: '',
};

const meta = {
  title: 'Components/Actions/Button',
  tags: ['autodocs'],
  args: base,
  argTypes: {
    label: { control: 'text' },
    variant: { control: 'inline-radio', options: [...BUTTON_VARIANTS] },
    size: { control: 'inline-radio', options: [...BUTTON_SIZES] },
    disabled: { control: 'boolean' },
    loading: {
      control: 'boolean',
      description: 'Shows a spinner. Implemented as `disabled` + `aria-busy`.',
    },
    type: { control: 'inline-radio', options: ['button', 'submit', 'reset'] },
    forceState: { table: { disable: true } },
    onClick: { action: 'click', table: { category: 'events' } },
  },
  render: (args) => build(args),
  parameters: {
    docs: {
      description: {
        component: `
Primary, secondary and ghost buttons in three sizes. \`md\` is at least 44px tall and \`lg\` at least 52px;
\`sm\` is not for touch-critical actions. The CSS classes (\`nl-button\`, \`nl-button--primary\`, ...) are the
contract, so the same markup works in any framework.

\`\`\`ts
import { createButton, updateButton } from '@nightlogue-llc/ui-components';

const save = createButton({ label: 'Save', variant: 'primary', onClick: () => saveDraft() });
container.append(save);
updateButton(save, { label: 'Saving…', loading: true }); // pass the FULL props each time
\`\`\`

Colors, radius and type come from the active theme's tokens. Hover, pressed and focus cells in the
grids are **simulated** for review; Tab to or hover over the playground button for the real states.
`,
      },
    },
  },
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<Args>;

/** Change any prop with the Controls panel. Clicks appear in the Actions panel. */
export const Playground: Story = {};

export const Variants: Story = {
  render: (args) =>
    el(
      'div',
      { className: 'sb-row' },
      BUTTON_VARIANTS.map((variant) => build({ ...args, variant, label: variant })),
    ),
};

export const Sizes: Story = {
  render: (args) =>
    el(
      'div',
      { className: 'sb-row' },
      BUTTON_SIZES.map((size) => build({ ...args, size, label: `Size ${size}` })),
    ),
};

/** Every variant at medium size in each state (default, hover, pressed, focus, disabled, loading). */
export const States: Story = {
  render: (args) =>
    stateGrid(
      BUTTON_VARIANTS.flatMap((variant) => [
        { label: `${variant} · default`, node: build({ ...args, variant }) },
        ...FORCED.map((forceState) => ({
          label: `${variant} · ${forceState} (simulated)`,
          node: build({ ...args, variant, forceState }),
        })),
        { label: `${variant} · disabled`, node: build({ ...args, variant, disabled: true }) },
        { label: `${variant} · loading`, node: build({ ...args, variant, loading: true }) },
      ]),
    ),
};

/** Every variant and size, in each state. */
export const VariantSizeStateMatrix: Story = {
  render: (args) =>
    el(
      'div',
      { className: 'sb-matrix' },
      BUTTON_VARIANTS.flatMap((variant) =>
        BUTTON_SIZES.map((size) =>
          el('div', { className: 'sb-matrix__row' }, [
            el('span', { className: 'sb-cell__label', text: `${variant} · ${size}` }),
            el('div', { className: 'sb-row' }, [
              build({ ...args, variant, size }),
              ...FORCED.map((forceState) => build({ ...args, variant, size, forceState })),
              build({ ...args, variant, size, disabled: true }),
              build({ ...args, variant, size, loading: true }),
            ]),
          ]),
        ),
      ),
    ),
};

/** The same buttons in light and dark, side by side, for the toolbar's theme. */
export const LightDarkComparison: Story = {
  parameters: { nlStage: 'self' },
  render: (args, context) =>
    compareModes(context, () =>
      el(
        'div',
        { className: 'sb-row' },
        BUTTON_VARIANTS.map((variant) => build({ ...args, variant, label: variant })),
      ),
    ),
};
