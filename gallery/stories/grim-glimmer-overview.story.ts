import {
  createSegmentedControl,
  updateSegmentedControl,
} from '../../src/components/segmented-control/index.js';
import { applyTheme } from '../../src/core/index.js';
import {
  createBoard,
  createGameControls,
  createGameHeader,
  createGameScreen,
  createPuzzleCollection,
  createPuzzleCollectionCard,
  type BoardCellState,
  type PuzzleStatus,
} from '../../src/projects/grim-glimmer/index.js';
import { el } from '../lib/dom.js';
import { sampleIcon } from '../lib/icons.js';
import { DIFFICULTIES, mockBoard } from '../lib/mock-board.js';
import type { ModeName } from '../lib/theme-tokens.js';
import { defineStory } from './types.js';

const THEME = 'grim-glimmer';

/** A tiny static pattern for card previews: a few given pieces, one placed. Placeholder only. */
function previewCells(generation: number, withPlaced: boolean): BoardCellState[] {
  const cells = mockBoard('easy', generation);
  if (withPlaced) {
    const free = cells.indexOf('empty');
    if (free >= 0) cells[free] = 'placed';
  }
  return cells;
}

function previewBoard(generation: number, withPlaced = false): HTMLElement {
  return createBoard({
    label: 'Preview',
    size: 5,
    mode: 'preview',
    cells: previewCells(generation, withPlaced),
  });
}

function card(
  title: string,
  status: PuzzleStatus,
  generation: number,
  withPlaced = false,
): HTMLElement {
  return createPuzzleCollectionCard({
    title,
    status,
    preview: previewBoard(generation, withPlaced),
    onOpen: () => undefined,
  });
}

/**
 * Home: one column of equally sized landscape cards. The app's wordmark is artwork owned by the
 * app, so the gallery only reserves a labelled slot for it and never typesets it. Only
 * Tents & Trees is playable; Ghosts & Graves and the placeholder are Coming Soon.
 */
function homeScreen(): HTMLElement {
  const wordmark = el('div', {
    className: 'gal-gg-wordmark-slot',
    text: 'Wordmark artwork (app-owned)',
  });
  wordmark.setAttribute('role', 'img');
  wordmark.setAttribute('aria-label', 'Wordmark placeholder');
  return el('section', { className: 'nl-grim-glimmer-screen' }, [
    wordmark,
    el('div', { className: 'gal-gg-heading-group' }, [
      el('p', { className: 'nl-grim-glimmer-eyebrow', text: 'Collection' }),
      el('h2', {
        className: 'nl-grim-glimmer-heading nl-grim-glimmer-heading--lg',
        text: 'Choose a puzzle',
      }),
    ]),
    createPuzzleCollection(
      [
        card('Tents & Trees', 'continue', 1, true),
        card('Ghosts & Graves', 'coming-soon', 4),
        card('Placeholder puzzle', 'coming-soon', 5),
      ],
      { label: 'Puzzles' },
    ),
  ]);
}

/** Game screen: header, separate difficulty control, board, compact New Game. No bottom tabs. */
function gameScreen(): HTMLElement {
  let difficulty = 'easy';
  const props = () => ({ label: 'Difficulty', options: DIFFICULTIES, value: difficulty });
  const control = createSegmentedControl({
    ...props(),
    onChange: (next) => {
      difficulty = next;
      updateSegmentedControl(control, props());
    },
  });
  return createGameScreen({
    header: createGameHeader({
      title: 'Tents & Trees',
      icons: { back: sampleIcon('back'), help: sampleIcon('help') },
    }),
    difficulty: control,
    board: createBoard({
      label: 'Puzzle board',
      size: 5,
      mode: 'interactive',
      cells: mockBoard('easy', 1),
      onCellActivate: () => undefined,
    }),
    controls: createGameControls(),
  });
}

function cardStates(): HTMLElement {
  return el('div', { className: 'gal-gg-states' }, [
    card('Play', 'play', 2),
    card('Continue', 'continue', 3, true),
    card('Coming Soon', 'coming-soon', 6),
  ]);
}

function frame(label: string, content: HTMLElement): HTMLElement {
  return el('div', { className: 'gal-gg-frame' }, [
    el('p', { className: 'gal-gg-note', text: label }),
    el('div', { className: 'gal-gg-screen' }, [content]),
  ]);
}

function panel(mode: ModeName): HTMLElement {
  const root = el('div', { className: 'gal-gg-panel gal-gg-panel--screens' }, [
    el('h3', { className: 'gal-gg-mode', text: mode === 'light' ? 'Light' : 'Dark' }),
    frame('Home', homeScreen()),
    frame('Game', gameScreen()),
    frame('Card statuses', cardStates()),
  ]);
  applyTheme(root, THEME, mode);
  return root;
}

export default defineStory({
  id: 'grim-glimmer-overview',
  title: 'G&G · Overview',
  description:
    'Home and game screens in both themes, same layout and data. Previews are static placeholder boards (generic shapes, no final artwork); only Tents & Trees is a real puzzle, the rest are marked placeholders. Interactive simulation, not a playable game.',
  scope: 'self',
  bleed: true,
  showLog: false,
  controls: [],
  defaults: {},
  render: () => el('div', { className: 'gal-gg-panels' }, [panel('light'), panel('dark')]),
});
