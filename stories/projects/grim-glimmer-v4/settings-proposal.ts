import {
  createSegmentedControl,
  updateSegmentedControl,
} from '../../../src/components/segmented-control/index.js';
import { applyTheme } from '../../../src/core/theme.js';
import { createBottomNav } from '../../../src/components/bottom-nav/index.js';
import { createIcon } from '../../../src/components/icon/index.js';
import { createSwitch, overlayHost } from './overlay-primitives.js';
import { el } from '../../lib/dom.js';
export interface PreferenceState {
  appearance: 'system' | 'light' | 'dark';
  sound: boolean;
  music: boolean;
  haptics: boolean;
  autoFill: boolean;
  animations: boolean;
}
export const DEFAULT_PREFERENCES: PreferenceState = {
  appearance: 'system',
  sound: true,
  music: false,
  haptics: true,
  autoFill: true,
  animations: true,
};
export interface OverlayOptions {
  reducedMotion?: boolean;
  state?: PreferenceState;
  onChange?: (state: PreferenceState) => void;
  tick?: () => void;
  onNavigate?: (destination: string) => void;
}
export function createSettingsContent(
  options: OverlayOptions,
  scope: HTMLElement,
  initial = options.state ?? DEFAULT_PREFERENCES,
) {
  const state = { ...initial };
  const system = window.matchMedia?.('(prefers-color-scheme: dark)');
  const root = el('section', { className: 'gg-v4-settings-content' });
  root.setAttribute('aria-label', 'Application settings');
  const modes = [
    { value: 'system', label: 'System' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
  ];
  function paintTheme() {
    applyTheme(
      scope,
      'moonlit-oxblood',
      state.appearance === 'system' ? (system?.matches ? 'dark' : 'light') : state.appearance,
    );
    scope.dataset.reducedMotion = String(options.reducedMotion === true || !state.animations);
  }
  function emit() {
    paintTheme();
    if (state.haptics) options.tick?.();
    options.onChange?.({ ...state });
  }
  const theme = createSegmentedControl({
    label: 'Color theme',
    options: modes,
    value: state.appearance,
    onChange: (next) => {
      state.appearance = next as PreferenceState['appearance'];
      updateSegmentedControl(theme, { label: 'Color theme', options: modes, value: next });
      emit();
    },
  });
  root.append(el('h2', { text: 'Appearance' }), theme, el('h2', { text: 'Gameplay & feedback' }));
  const labels = {
    sound: 'Sound effects',
    music: 'Music',
    haptics: 'Haptic feedback',
    autoFill: 'Auto-fill assistance',
    animations: 'Animations',
  } as const;
  for (const key of ['sound', 'music', 'haptics', 'autoFill', 'animations'] as const)
    root.append(
      createSwitch(labels[key], state[key], (checked) => {
        state[key] = checked;
        emit();
      }),
    );
  const changed = () => {
    if (state.appearance === 'system') paintTheme();
  };
  system?.addEventListener('change', changed);
  paintTheme();
  return {
    element: root,
    destroy: () => system?.removeEventListener('change', changed),
    state: () => ({ ...state }),
  };
}
export function createSettingsPreview(options: OverlayOptions = {}) {
  const root = overlayHost();
  root.classList.add('gg-v4-settings-preview');
  const content = createSettingsContent(options, root);
  root.append(
    el('h1', { text: 'Settings' }),
    content.element,
    createBottomNav({
      label: 'Main navigation',
      iconOnly: true,
      value: 'settings',
      items: [
        { value: 'home', label: 'Home', icon: createIcon('home') },
        { value: 'achievements', label: 'Achievements', icon: createIcon('achievements') },
        { value: 'settings', label: 'Settings', icon: createIcon('settings') },
      ],
      onNavigate: (value) => options.onNavigate?.(value),
    }),
  );
  root.cleanup = content.destroy;
  return root;
}
