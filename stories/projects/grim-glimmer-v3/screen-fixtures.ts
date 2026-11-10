import { applyTheme } from '../../../src/core/index.js';
import {
  createCluedBoard,
  createPuzzleCollection,
  createPuzzleCollectionCard,
  createCompactGameHeader,
  createGameControls,
  createGameScreen,
  createGameMenu,
  createAppFrameHeader,
  createGameMenuSheet,
  createAppSettings,
  createSuccessSheet,
  type BoardCellState,
} from '../../../src/projects/grim-glimmer/index.js';
import { createIcon } from '../../../src/projects/grim-glimmer-v3/index.js';
import { el } from '../../lib/dom.js';
import { createBottomNav } from '../../../src/components/bottom-nav/index.js';
import './screen-fixtures.css';
export type Screen = 'Home' | 'Game Screen' | 'Game Menu' | 'Settings' | 'Puzzle Complete';
function board(): HTMLElement {
  const cells: BoardCellState[] = Array.from({ length: 36 }, (_, i) =>
    [1, 10, 18, 29].includes(i)
      ? 'fixed'
      : [0, 11, 24].includes(i)
        ? 'placed'
        : i === 27
          ? 'tentative'
          : i === 33
            ? 'excluded'
            : 'empty',
  );
  const node = createCluedBoard({
    label: 'Stars & Spires palette sample',
    size: 6,
    mode: 'readonly',
    cells,
    rowClues: [1, 1, 0, 0, 2, 0],
    columnClues: [2, 0, 0, 1, 0, 1],
    stateLabels: { fixed: 'spire', placed: 'star', tentative: 'maybe star' },
  });
  return node;
}
/** Real library compositions with isolated palette fixtures, not a production game engine. */
export function screen(kind: Screen, theme: string, mode: 'light' | 'dark'): HTMLElement {
  const root = el('div', { className: 'sb-screen-fixture' });
  applyTheme(root, theme, mode);
  if (kind === 'Home') {
    root.append(
      el('h1', {}, [
        'Grim ',
        el('span', { className: 'nl-grim-glimmer-wordmark-accent', text: '&' }),
        ' Glimmer',
      ]),
    );
    root.append(
      createPuzzleCollection(
        ['Stars & Spires', 'Unequal', 'Nonogram'].map((title, i) =>
          createPuzzleCollectionCard({
            title,
            status: i ? 'coming-soon' : 'continue',
            preview: board(),
            onOpen: () => root.replaceWith(screen('Game Screen', theme, mode)),
          }),
        ),
        { label: 'Puzzle collection' },
      ),
    );
    const nav = createBottomNav({
      label: 'Main navigation',
      value: 'Home',
      items: [
        { value: 'Home', label: 'Home', icon: createIcon('home') },
        { value: 'Settings', label: 'Settings', icon: createIcon('settings') },
      ],
      onNavigate: (value) => root.replaceWith(screen(value as Screen, theme, mode)),
    });
    root.append(nav);
  } else if (kind === 'Settings') {
    root.append(
      createAppSettings({
        state: { appearance: mode, sound: true, haptics: true, autoFill: false, animations: true },
      }),
    );
    const hint = root.querySelector('.nl-grim-glimmer-app-settings__row-copy small');
    if (hint) hint.textContent = 'System, Light, or Dark';
  } else {
    const menu = createGameMenu({
      difficulty: 'easy',
      options: [{ value: 'easy', label: 'Easy', size: 6 }],
      onDeal: () => sheet.close(),
      onHelp: () => sheet.close(),
    });
    menu.hidden = kind !== 'Game Menu';

    const header = createCompactGameHeader({
      title: 'Stars & Spires',
      status: 'EASY · 6×6',
      icons: { hint: createIcon('hint'), menu: createIcon('menu') },
    });
    const controls = createGameControls({
      tentLabel: 'Star',
      excludeLabel: 'Exclude',
      showNewGame: false,
    });
    const appHeader = createAppFrameHeader({
      icons: { back: createIcon('back'), settings: createIcon('settings') },
    });
    const game = createGameScreen({ appHeader, header, board: board(), controls });
    const sheet = createGameMenuSheet({
      trigger: header.querySelector<HTMLButtonElement>(
        '.nl-grim-glimmer-game-header__menu-toggle',
      )!,
      content: menu,
      history: false,
    });
    game.append(sheet.element);
    root.append(game);
    if (kind === 'Game Menu')
      queueMicrotask(() => {
        if (game.isConnected) sheet.open();
      });
    if (kind === 'Puzzle Complete') {
      const dialog = createSuccessSheet({
        title: 'Puzzle Complete',
        message: 'Every star is in place. Beautifully done.',
        onNewGame: () => undefined,
        onReturnHome: () => root.replaceWith(screen('Home', theme, mode)),
        onClose: () => undefined,
      });
      dialog.setAttribute('open', '');
      dialog.classList.add('sb-screen-fixture__complete');
      root.append(dialog);
    }
  }
  return root;
}
