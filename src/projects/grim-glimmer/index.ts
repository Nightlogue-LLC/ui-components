// Grim & Glimmer project-specific compositions. Import from
// '@nightlogue-llc/ui-components/projects/grim-glimmer' (and its .css). Built from shared
// components; contains no game engine, persistence, or final artwork.
export { createBoard, updateBoard, createCluedBoard } from './board.js';
export type {
  BoardCellState,
  BoardMode,
  BoardOptions,
  BoardProps,
  CluedBoardOptions,
} from './board.js';
export { createPuzzleCollectionCard, createPuzzleCollection } from './collection-card.js';
export type { PuzzleCollectionCardOptions, PuzzleStatus } from './collection-card.js';
export {
  createGameHeader,
  createAppFrameHeader,
  createCompactGameHeader,
  createGameMenu,
  toggleGameMenu,
  closeGameMenu,
  createGameDifficulty,
  createGameControls,
  createGameScreen,
  getGameScreenSlot,
} from './game-screen.js';
export type {
  GameControlsOptions,
  AppFrameHeaderOptions,
  CompactGameHeaderOptions,
  GameMenuOptions,
  GameMarkMode,
  GameDifficultyOption,
  GameDifficultyOptions,
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

export { createAppSettings } from './app-settings.js';
export type { AppAppearance, AppSettingsState, AppSettingsOptions } from './app-settings.js';
