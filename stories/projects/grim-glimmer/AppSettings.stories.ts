import { createIcon } from '../../../src/components/icon/index.js';
import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  createAppFrameHeader,
  updateAppFrameSettingsOpen,
  createAppSettings,
  type AppSettingsState,
} from '../../../src/projects/grim-glimmer/index.js';
import { sampleIcon } from '../../lib/icons.js';
import { compareModes } from '../../lib/stage.js';
import { THEME } from './shared.js';
import { mainScreenDemo } from './main-screen-demo.js';

function settingsScreen(): HTMLElement {
  const host = document.createElement('div');
  host.className = 'sb-grim-gameplay-host';
  host.style.maxWidth = '32rem';
  const initial: AppSettingsState = {
    appearance: 'system',
    haptics: true,
    sound: true,
    autoFill: false,
    animations: true,
  };
  let open = true;
  const navigation = createAppFrameHeader({
    icons: { back: sampleIcon('back'), settings: createIcon('settings') },
    settingsOpen: true,
    hideBack: true,
    onSettings: () => {
      open = !open;
      updateAppFrameSettingsOpen(navigation, open);
      settings.hidden = !open;
      closedHint.hidden = open;
    },
  });
  const closedHint = document.createElement('p');
  closedHint.className = 'nl-grim-glimmer-app-settings__intro';
  closedHint.textContent = 'Settings closed. Tap the settings icon to reopen.';
  closedHint.hidden = true;
  const settings = createAppSettings({
    state: initial,
    onChange: (value) => {
      // Visual controls update locally. Persistence and platform integrations are app-owned.
      host.dataset.appearance = value.appearance;
    },
  });
  host.append(navigation, settings, closedHint);
  return host;
}

const meta = {
  title: 'Projects/Grim & Glimmer/V3/App Settings',
  tags: ['autodocs'],
  parameters: {
    nlTheme: THEME,
    nlStage: 'self',
    docs: {
      description: {
        component:
          'Mock app-wide settings for appearance, haptics, sound, auto-fill assistance and animations. The controls are interactive, but nothing is persisted or connected to platform APIs. Appearance opens a themed in-app list; no phone-native picker is used. The settings icon stays in its fixed header position when toggled. The same top app bar is used by gameplay.',
      },
    },
  },
  render: () => settingsScreen(),
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const SettingsScreen: Story = {
  render: (_args, context) =>
    compareModes(context, () => mainScreenDemo('settings'), { theme: THEME, bleed: true }),
};

/** The separate gameplay overlay still uses its persistent rotating Settings icon. */
export const GameplaySettingsToggle: Story = {
  render: (_args, context) => compareModes(context, settingsScreen, { theme: THEME, bleed: true }),
};
