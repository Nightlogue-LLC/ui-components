import {
  BUTTON_SIZES,
  BUTTON_VARIANTS,
  createButton,
  type ButtonSize,
  type ButtonVariant,
} from '../../src/components/button/index.js';
import { el } from '../lib/dom.js';
import { defineStory } from './types.js';

interface ButtonArgs {
  [key: string]: string | boolean;
  label: string;
  variant: ButtonVariant;
  size: ButtonSize;
  disabled: boolean;
  loading: boolean;
  /** Preview aid: '' (real behavior) or a simulated pseudo-state, see gallery.css. */
  forceState: string;
}

const FORCED = ['hover', 'pressed', 'focus'] as const;

function build(args: ButtonArgs, onClick?: () => void): HTMLButtonElement {
  const { forceState, ...props } = args;
  const button = createButton({ ...props, ...(onClick ? { onClick } : {}) });
  if (forceState) button.classList.add(`gal-force-${forceState}`);
  return button;
}

const base: ButtonArgs = {
  label: 'Button',
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  forceState: '',
};

export default defineStory<ButtonArgs>({
  id: 'button',
  title: 'Button',
  description:
    'Primary, secondary and ghost buttons in three sizes. Hover, pressed and focus cells are simulated for review; hover, press and Tab to the playground button to see the real states.',
  controls: [
    { name: 'label', type: 'text' },
    { name: 'variant', type: 'select', options: BUTTON_VARIANTS },
    { name: 'size', type: 'select', options: BUTTON_SIZES },
    { name: 'disabled', type: 'boolean' },
    { name: 'loading', type: 'boolean' },
  ],
  defaults: base,
  render: (args, { log }) => build(args, () => log(`click: ${args.label}`)),
  states: BUTTON_VARIANTS.flatMap((variant) => [
    { label: `${variant} · default`, args: { variant } },
    ...FORCED.map((forceState) => ({
      label: `${variant} · ${forceState} (simulated)`,
      args: { variant, forceState },
    })),
    { label: `${variant} · disabled`, args: { variant, disabled: true } },
    { label: `${variant} · loading`, args: { variant, loading: true } },
  ]),
  sections: [
    {
      title: 'Every variant and size, in each state',
      render: () =>
        el(
          'div',
          { className: 'gal-matrix' },
          BUTTON_VARIANTS.flatMap((variant) =>
            BUTTON_SIZES.map((size) =>
              el('div', { className: 'gal-matrix__row' }, [
                el('span', { className: 'gal-cell__label', text: `${variant} · ${size}` }),
                el('div', { className: 'gal-row' }, [
                  build({ ...base, variant, size }),
                  ...FORCED.map((forceState) => build({ ...base, variant, size, forceState })),
                  build({ ...base, variant, size, disabled: true }),
                  build({ ...base, variant, size, loading: true }),
                ]),
              ]),
            ),
          ),
        ),
    },
  ],
});
