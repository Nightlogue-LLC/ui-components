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

export { createBoardInteractions } from './board-interactions.js';
export type { BoardStrokeAdapter, BoardInteractionOptions } from './board-interactions.js';
export type { View as BoardView } from './board-view.js';

export { createCompletionSheet } from './completion-sheet.js';
export type { CompletionSheetOptions, CompletionStatistic } from './completion-sheet.js';
export { createCompletionSequence, COMPLETION_TIMING } from './completion-sequence.js';
export type { CompletionSequenceOptions } from './completion-sequence.js';

export * from './month-calendar.js';
export * from './month-geometry.js';

export { createMonthArt } from './month-art.js';
export { createMonthCollection } from './month-collection.js';

export { createMonthCard } from './month-card.js';
export type { MonthCardOptions } from './month-card.js';

export { createRitualDraw, DRAW_STATES } from './ritual-draw.js';
export type { RitualDrawOptions, DailyDrawIdentity, DrawState } from './ritual-draw.js';

export { createGameplayMenuHeader } from './gameplay-menu-header.js';
export type { GameplayMenuHeaderOptions } from './gameplay-menu-header.js';

export {
  createGameMenuContent,
  GAME_MENU_SIZES,
  GAME_MENU_DIFFICULTIES,
} from './game-menu-content.js';
export type {
  GameMenuContent,
  GameMenuContentOptions,
  GameMenuSelection,
  GameMenuAvailability,
} from './game-menu-content.js';
