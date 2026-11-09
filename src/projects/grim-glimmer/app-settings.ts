import { createSelect } from '../../components/select/index.js';

/** App-wide visual preferences. Persistence and device feature integrations stay app-owned. */
export type AppAppearance = 'system' | 'light' | 'dark';
export interface AppSettingsState {
  appearance: AppAppearance;
  haptics: boolean;
  sound: boolean;
  autoFill: boolean;
  animations: boolean;
}
export interface AppSettingsOptions {
  state: AppSettingsState;
  onChange?: (next: AppSettingsState) => void;
}
export function createAppSettings(options: AppSettingsOptions): HTMLElement {
  const screen = document.createElement('section');
  screen.className = 'nl-grim-glimmer-app-settings';
  screen.setAttribute('aria-label', 'Application settings');
  const heading = document.createElement('h1');
  heading.className = 'nl-grim-glimmer-app-settings__title';
  heading.textContent = 'Settings';
  const intro = document.createElement('p');
  intro.className = 'nl-grim-glimmer-app-settings__intro';
  intro.textContent = 'Make your puzzle time feel like yours.';
  screen.append(heading, intro);

  let state = { ...options.state };
  const emit = (next: AppSettingsState) => {
    state = next;
    options.onChange?.({ ...next });
  };
  const section = (name: string) => {
    const group = document.createElement('section');
    group.className = 'nl-grim-glimmer-app-settings__section';
    const title = document.createElement('h2');
    title.textContent = name;
    group.append(title);
    screen.append(group);
    return group;
  };

  const appearance = section('Appearance');
  const appearanceRow = document.createElement('div');
  appearanceRow.className = 'nl-grim-glimmer-app-settings__row';
  const appearanceLabel = document.createElement('span');
  appearanceLabel.className = 'nl-grim-glimmer-app-settings__row-copy';
  const appearanceTitle = document.createElement('strong');
  appearanceTitle.textContent = 'Color theme';
  const appearanceHint = document.createElement('small');
  appearanceHint.textContent = 'System, Light, or Dark';
  appearanceLabel.append(appearanceTitle, appearanceHint);
  const select = createSelect({
    label: 'Color theme',
    value: state.appearance,
    options: [
      { value: 'system', label: 'System' },
      { value: 'light', label: 'Light' },
      { value: 'dark', label: 'Dark' },
    ],
    onChange: (appearance) => emit({ ...state, appearance: appearance as AppAppearance }),
  });
  appearanceRow.append(appearanceLabel, select);
  appearance.append(appearanceRow);

  const preferences = section('Gameplay & feedback');
  const items: {
    key: 'haptics' | 'sound' | 'autoFill' | 'animations';
    label: string;
    description: string;
  }[] = [
    {
      key: 'haptics',
      label: 'Haptic feedback',
      description: 'Feel a subtle tap when making marks',
    },
    {
      key: 'sound',
      label: 'Sound effects',
      description: 'Sounds for interactions and puzzle progress',
    },
    {
      key: 'autoFill',
      label: 'Auto-fill assistance',
      description: 'Mark obvious exclusions automatically when supported',
    },
    {
      key: 'animations',
      label: 'Animations',
      description: 'Gentle transitions and tactile motion',
    },
  ];
  for (const item of items) {
    const row = document.createElement('label');
    row.className = 'nl-grim-glimmer-app-settings__row';
    const copy = document.createElement('span');
    copy.className = 'nl-grim-glimmer-app-settings__row-copy';
    const title = document.createElement('strong');
    title.textContent = item.label;
    const hint = document.createElement('small');
    hint.textContent = item.description;
    copy.append(title, hint);
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.className = 'nl-grim-glimmer-app-settings__toggle';
    input.checked = state[item.key];
    input.addEventListener('change', () => emit({ ...state, [item.key]: input.checked }));
    row.append(copy, input);
    preferences.append(row);
  }
  return screen;
}
