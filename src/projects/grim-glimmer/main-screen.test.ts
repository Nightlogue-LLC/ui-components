import { describe, expect, it } from 'vitest';
import { createMainScreen, updateMainScreen, type MainPage } from './main-screen.js';
import { createAppSettings } from './app-settings.js';
import { createGameScreen } from './game-screen.js';

describe('main screen navigation', () => {
  it('switches all three destinations, retaining controls and page nodes', () => {
    const settings = createAppSettings({
      state: {
        appearance: 'system',
        haptics: true,
        sound: false,
        autoFill: false,
        animations: true,
      },
    });
    const collection = document.createElement('div');
    const achievements = document.createElement('div');
    const icon = document.createElement('span');
    const screen = createMainScreen({
      pages: { collection, achievements, settings },
      icons: { collection: icon, achievements: icon, settings: icon },
      onNavigate: (page) => updateMainScreen(screen, page),
    });
    document.body.append(screen);
    const buttons = [...screen.querySelectorAll<HTMLButtonElement>('.nl-bottom-nav__item')];
    expect(buttons.map((button) => button.textContent)).toEqual([
      'Collection',
      'Achievements',
      'Settings',
    ]);
    const visible = () =>
      [...screen.querySelectorAll<HTMLElement>('[data-page]')]
        .filter((panel) => !panel.hidden)
        .map((panel) => panel.dataset.page);
    expect(visible()).toEqual(['collection']);
    buttons[2]!.click();
    expect(visible()).toEqual(['settings']);
    const haptics = settings.querySelector<HTMLInputElement>('input')!;
    haptics.click();
    expect(haptics.checked).toBe(false);
    buttons[1]!.click();
    expect(visible()).toEqual(['achievements']);
    buttons[0]!.click();
    expect(visible()).toEqual(['collection']);
    expect(screen.querySelector('[data-page="collection"]')?.firstChild).toBe(collection);
    buttons[2]!.click();
    expect(settings.querySelector('input')).toBe(haptics);
    expect(haptics.checked).toBe(false);
    expect(() => updateMainScreen(screen, 'journal' as MainPage)).toThrow();
    screen.remove();
  });

  it('keeps gameplay independent of main navigation', () => {
    const node = () => document.createElement('div');
    const game = createGameScreen({ header: node(), board: node(), controls: node() });
    expect(game.querySelector('.nl-bottom-nav')).toBeNull();
  });
});
