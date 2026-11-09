import { applyTheme } from '../../../src/core/index.js';
import { createButton } from '../../../src/components/button/index.js';
import {
  createCluedBoard,
  createPuzzleCollection,
  createPuzzleCollectionCard,
  createCompactGameHeader,
  createGameControls,
  createGameScreen,
  createGameMenu,
  createAppSettings,
  createSuccessDialog,
  type BoardCellState,
} from '../../../src/projects/grim-glimmer/index.js';
import { createIcon } from '../../../src/projects/grim-glimmer-v3/index.js';
import { el } from '../../lib/dom.js';
import './onyx.css';
export type Screen = 'Home' | 'Game Screen' | 'Game Menu' | 'Settings' | 'Puzzle Complete';
export const variants = [
  { label: 'Light', theme: 'onyx-crimson', mode: 'light' },
  { label: 'Dark A', theme: 'onyx-crimson', mode: 'dark' },
  { label: 'Dark B · Deep Blue', theme: 'onyx-crimson-blue', mode: 'dark' },
] as const;
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
  node.querySelector('.nl-grim-glimmer-clued-board__clue')?.classList.add('sb-onyx-error');
  return node;
}
/** Real library compositions with isolated palette fixtures, not a production game engine. */
export function screen(kind: Screen, theme: string, mode: 'light' | 'dark'): HTMLElement {
  const root = el('div', { className: 'sb-onyx-screen' });
  applyTheme(root, theme, mode);
  if (theme.startsWith('onyx')) root.classList.add('sb-onyx');
  root.style.setProperty(
    '--sb-onyx-star',
    `url("${new URL('../grim-glimmer/assets/glyph-star.png', import.meta.url).href}")`,
  );
  root.style.setProperty(
    '--sb-onyx-spire',
    `url("${new URL('../grim-glimmer/assets/glyph-spire-light.png', import.meta.url).href}")`,
  );
  if (kind === 'Home') {
    root.append(
      el('h1', {}, ['Grim ', el('span', { className: 'sb-onyx-amp', text: '&' }), ' Glimmer']),
    );
    root.append(
      createPuzzleCollection(
        ['Stars & Spires', 'Unequal', 'Nonogram'].map((title, i) =>
          createPuzzleCollectionCard({
            title,
            status: i ? 'coming-soon' : 'continue',
            preview: board(),
            onOpen: () => root.replaceChildren(screen('Game Screen', theme, mode)),
          }),
        ),
        { label: 'Puzzle collection' },
      ),
    );
    const nav = el('nav', { className: 'sb-onyx-nav' });
    for (const name of ['Home', 'Settings'] as const) {
      const button = createButton({
        label: name,
        variant: 'ghost',
        onClick: () => root.replaceChildren(screen(name, theme, mode)),
      });
      if (name === 'Home') button.setAttribute('aria-current', 'page');
      nav.append(button);
    }
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
      onDeal: () => undefined,
      onHelp: () => undefined,
    });
    menu.hidden = kind !== 'Game Menu';
    menu.classList.add('sb-onyx-sheet');
    const header = createCompactGameHeader({
      title: 'Stars & Spires',
      status: 'EASY · 6×6',
      icons: { hint: createIcon('hint'), menu: createIcon('menu') },
      onMenu: () => {
        menu.hidden = !menu.hidden;
      },
    });
    const controls = createGameControls({
      tentLabel: 'Star',
      excludeLabel: 'Exclude',
      showNewGame: false,
    });
    root.append(createGameScreen({ header, board: board(), controls, menu }));
    if (kind === 'Puzzle Complete') {
      const dialog = createSuccessDialog({
        title: 'Puzzle Complete',
        message: 'The sky is set.',
        labels: { playAgain: 'New game', close: 'View board' },
        onPlayAgain: () => undefined,
        onClose: () => undefined,
      });
      dialog.setAttribute('open', '');
      dialog.classList.add('sb-onyx-complete');
      root.append(dialog);
    }
  }
  return root;
}
export function comparison(kind: Screen, old = false): HTMLElement {
  const items: { label: string; theme: string; mode: 'light' | 'dark' }[] = [...variants];
  if (old)
    items.push(
      { label: 'Moonlit Oxblood · Light', theme: 'moonlit-oxblood', mode: 'light' },
      { label: 'Moonlit Oxblood · Dark', theme: 'moonlit-oxblood', mode: 'dark' },
      { label: 'Plum / Cream · Light', theme: 'grim-glimmer', mode: 'light' },
      { label: 'Plum / Cream · Dark', theme: 'grim-glimmer', mode: 'dark' },
    );
  return el(
    'div',
    { className: 'sb-onyx-comparison' },
    items.map((v) =>
      el('section', {}, [el('h2', { text: v.label }), screen(kind, v.theme, v.mode)]),
    ),
  );
}
