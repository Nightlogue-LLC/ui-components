// Grim & Glimmer project-specific compositions. Import from
// '@nightlogue-llc/ui-components/projects/grim-glimmer' (and its .css). Built from shared
// components; contains no game engine, persistence, or final artwork.
export { createBoard, updateBoard } from './board.js';
export type { BoardCellState, BoardMode, BoardOptions, BoardProps } from './board.js';
export { createPuzzleCollectionCard, createPuzzleCollection } from './collection-card.js';
export type { PuzzleCollectionCardOptions, PuzzleStatus } from './collection-card.js';
export {
  createGameHeader,
  createGameControls,
  createGameScreen,
  getGameScreenSlot,
} from './game-screen.js';
export type {
  GameControlsOptions,
  GameHeaderOptions,
  GameScreenParts,
  GameScreenSlot,
} from './game-screen.js';
export {
  createTutorialDialog,
  createSuccessDialog,
  createDiscardConfirmDialog,
} from './dialogs.js';
export type {
  DiscardConfirmDialogOptions,
  SuccessDialogOptions,
  TutorialDialogOptions,
  TutorialOutcome,
} from './dialogs.js';
