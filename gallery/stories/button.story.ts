import {
  BUTTON_SIZES,
  BUTTON_VARIANTS,
  createButton,
  type ButtonSize,
  type ButtonVariant,
} from '../../src/components/button/index.js';
import { defineStory } from './types.js';

interface ButtonArgs {
  [key: string]: string | boolean;
  label: string;
  variant: ButtonVariant;
  size: ButtonSize;
  disabled: boolean;
  loading: boolean;
}

export default defineStory<ButtonArgs>({
  id: 'button',
  title: 'Button',
  description:
    'Primary, secondary and ghost buttons in three sizes, with disabled and loading states.',
  controls: [
    { name: 'label', type: 'text' },
    { name: 'variant', type: 'select', options: BUTTON_VARIANTS },
    { name: 'size', type: 'select', options: BUTTON_SIZES },
    { name: 'disabled', type: 'boolean' },
    { name: 'loading', type: 'boolean' },
  ],
  defaults: { label: 'Button', variant: 'primary', size: 'md', disabled: false, loading: false },
  render: (args, { log }) => createButton({ ...args, onClick: () => log(`click: ${args.label}`) }),
  states: BUTTON_VARIANTS.flatMap((variant) => [
    { label: `${variant}`, args: { variant } },
    { label: `${variant} · disabled`, args: { variant, disabled: true } },
    { label: `${variant} · loading`, args: { variant, loading: true } },
  ]),
});
