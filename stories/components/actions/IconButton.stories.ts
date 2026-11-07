import type { Meta, StoryObj } from '@storybook/html-vite';
import { fn } from 'storybook/test';
import {
  createIconButton,
  ICON_BUTTON_VARIANTS,
  type IconButtonProps,
} from '../../../src/components/icon-button/index.js';
import { el } from '../../lib/dom.js';
import { sampleIcon, sampleIconNames, type SampleIconName } from '../../lib/icons.js';
import { compareModes, stateGrid } from '../../lib/stage.js';

type ForcedState = '' | 'hover' | 'pressed' | 'focus';

interface Args extends IconButtonProps {
  icon: SampleIconName;
  onClick: (event: MouseEvent) => void;
  forceState: ForcedState;
}

function build(args: Args): HTMLButtonElement {
  const { forceState, icon, ...props } = args;
  // A blank label is rejected by the component; keep the playground usable while typing.
  const label = props.label.trim() === '' ? '(label required)' : props.label;
  const button = createIconButton({ ...props, label, icon: sampleIcon(icon) });
  if (forceState) button.classList.add(`sb-force-${forceState}`);
  return button;
}

const meta = {
  title: 'Components/Actions/IconButton',
  tags: ['autodocs'],
  args: {
    label: 'Back',
    icon: 'back',
    variant: 'ghost',
    disabled: false,
    onClick: fn(),
    forceState: '',
  },
  argTypes: {
    label: { control: 'text', description: 'Accessible name (required, must not be blank).' },
    icon: {
      control: 'select',
      options: sampleIconNames,
      description: 'Gallery sample glyph only.',
    },
    variant: { control: 'inline-radio', options: [...ICON_BUTTON_VARIANTS] },
    disabled: { control: 'boolean' },
    forceState: { table: { disable: true } },
    onClick: { action: 'click', table: { category: 'events' } },
  },
  render: (args) => build(args),
  parameters: {
    docs: {
      description: {
        component: `
Icon-only button with a 44×44px minimum target and a **required accessible name**. The artwork is supplied
by the consuming app as a DOM node, which is cloned; markup strings are never accepted. The glyphs in these
stories are generic samples, not library artwork.

\`\`\`ts
import { createIconButton } from '@nightlogue-llc/ui-components';

const back = createIconButton({ label: 'Back', icon: backSvgElement, onClick: goBack });
\`\`\`

Raise the size with the \`--nl-icon-button-size\` hook (the Grim & Glimmer header uses 48px).
`,
      },
    },
  },
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<Args>;

export const Playground: Story = {};

export const States: Story = {
  render: (args) =>
    stateGrid(
      ICON_BUTTON_VARIANTS.flatMap((variant) => [
        { label: `${variant} · default`, node: build({ ...args, variant }) },
        {
          label: `${variant} · hover (simulated)`,
          node: build({ ...args, variant, forceState: 'hover' }),
        },
        {
          label: `${variant} · pressed (simulated)`,
          node: build({ ...args, variant, forceState: 'pressed' }),
        },
        {
          label: `${variant} · focus (simulated)`,
          node: build({ ...args, variant, forceState: 'focus' }),
        },
        { label: `${variant} · disabled`, node: build({ ...args, variant, disabled: true }) },
      ]),
    ),
};

export const Glyphs: Story = {
  render: (args) =>
    el(
      'div',
      { className: 'sb-row' },
      sampleIconNames.map((icon) => build({ ...args, icon, label: icon })),
    ),
};

export const LightDarkComparison: Story = {
  parameters: { nlStage: 'self' },
  render: (args, context) =>
    compareModes(context, () =>
      el(
        'div',
        { className: 'sb-row' },
        ICON_BUTTON_VARIANTS.map((variant) => build({ ...args, variant })),
      ),
    ),
};
