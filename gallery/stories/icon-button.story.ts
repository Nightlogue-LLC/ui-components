import {
  createIconButton,
  ICON_BUTTON_VARIANTS,
  type IconButtonVariant,
} from '../../src/components/icon-button/index.js';
import { sampleIcon, sampleIconNames, type SampleIconName } from '../lib/icons.js';
import { defineStory } from './types.js';

interface IconButtonArgs {
  [key: string]: string | boolean;
  label: string;
  icon: SampleIconName;
  variant: IconButtonVariant;
  disabled: boolean;
  forceState: string;
}

const base: IconButtonArgs = {
  label: 'Back',
  icon: 'back',
  variant: 'ghost',
  disabled: false,
  forceState: '',
};

export default defineStory<IconButtonArgs>({
  id: 'icon-button',
  title: 'Icon button',
  description:
    'Icon-only 44x44px target with a required accessible name. The glyphs here are generic gallery samples; real artwork is supplied by the consuming app.',
  controls: [
    { name: 'label', type: 'text' },
    { name: 'icon', type: 'select', options: sampleIconNames },
    { name: 'variant', type: 'select', options: ICON_BUTTON_VARIANTS },
    { name: 'disabled', type: 'boolean' },
  ],
  defaults: base,
  render: (args, { log }) => {
    const { forceState, icon, ...props } = args;
    // A blank label is rejected by the component; keep the gallery usable while typing.
    const label = props.label.trim() === '' ? '(label required)' : props.label;
    const button = createIconButton({
      ...props,
      label,
      icon: sampleIcon(icon),
      onClick: () => log(`click: ${label}`),
    });
    if (forceState) button.classList.add(`gal-force-${forceState}`);
    return button;
  },
  states: ICON_BUTTON_VARIANTS.flatMap((variant) => [
    { label: `${variant} · default`, args: { variant } },
    { label: `${variant} · hover (simulated)`, args: { variant, forceState: 'hover' } },
    { label: `${variant} · pressed (simulated)`, args: { variant, forceState: 'pressed' } },
    { label: `${variant} · focus (simulated)`, args: { variant, forceState: 'focus' } },
    { label: `${variant} · disabled`, args: { variant, disabled: true } },
  ]),
});
