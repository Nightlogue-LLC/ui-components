export { createPuzzleGlyph } from './glyphs.js';
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
  updateAppFrameSettingsOpen,
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
export { createGuidedTutorialDialog } from './guided-tutorial.js';
export type { GuidedTutorialOptions, TutorialLesson } from './guided-tutorial.js';

export { createAppSettings } from './app-settings.js';
export type { AppAppearance, AppSettingsState, AppSettingsOptions } from './app-settings.js';

export { createMainScreen, updateMainScreen } from './main-screen.js';
export type { MainPage, MainScreenOptions } from './main-screen.js';
