export { createPuzzleGlyph } from './glyphs.js';
// Grim & Glimmer project-specific compositions. Import from
// '@nightlogue-llc/ui-components/projects/grim-glimmer' (and its .css). Built from shared
// components; contains no game engine, persistence, or final artwork.
export { createBoard, updateBoard, createCluedBoard, updateCluedBoard } from './board.js';
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
export { createGuidedTutorialDialog, destroyGuidedTutorialDialog } from './guided-tutorial.js';
export type { GuidedTutorialOptions, TutorialLesson } from './guided-tutorial.js';

export { createAppSettings } from './app-settings.js';
export type { AppAppearance, AppSettingsState, AppSettingsOptions } from './app-settings.js';

export { createMainScreen, updateMainScreen } from './main-screen.js';
export type { MainPage, MainScreenOptions } from './main-screen.js';

export { createGameMenuSheet } from './menu-sheet.js';
export type { GameMenuSheet, GameMenuSheetOptions } from './menu-sheet.js';
export { createSuccessSheet, createSuccessMessagePicker } from './success-sheet.js';
export type { SuccessSheetOptions } from './success-sheet.js';

export { createTarotGameplayHeader } from './tarot-header.js';
export type { TarotHeaderOptions } from './tarot-header.js';
export type {
  ClueStatus,
  ClueFeedback,
  CluedBoardFeedback,
  CluedBoardUpdate,
} from './board-presentation.js';
export {
  createGameToolToggle,
  updateGameToolToggle,
  createGameControlRow,
  updateGameControlRow,
} from './editorial-controls.js';
export type { GameControlState, EditorialControlsOptions } from './editorial-controls.js';

export { createGameplayMotion, GAMEPLAY_MOTION, dissolveTiming } from './gameplay-motion.js';
export type { GameplayMotionOptions } from './gameplay-motion.js';

export { createTarotDeckCard, updateTarotDeckCard } from './tarot-card.js';
export type { TarotCard, TarotCardState, TarotDeckCardOptions } from './tarot-card.js';
export { createTarotDeck } from './tarot-deck.js';
export type { TarotDeckOptions, TarotDeckState } from './tarot-deck.js';
export { createTarotHome } from './tarot-home.js';
export type { TarotHomeOptions, TarotHomeState } from './tarot-home.js';
