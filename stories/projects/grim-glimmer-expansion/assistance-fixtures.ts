import {
  createBottomSheet,
  destroyBottomSheet,
} from '../../../src/components/bottom-sheet/index.js';
import { openDialog, closeDialog, getDialogBody } from '../../../src/components/dialog/index.js';
import {
  createAssistancePanel,
  createAssistanceAnnouncer,
  showAssistanceCue,
  createGameControlRow,
  type AssistanceCue,
  type AssistancePanelState,
  type ExplainGuidance,
  type RevealPresentation,
} from '../../../src/projects/grim-glimmer/index.js';
import { createV4Board } from '../grim-glimmer-v4/board.js';
import { overlayHost } from '../grim-glimmer-v4/overlay-primitives.js';
import { el } from '../../lib/dom.js';
import './assistance.css';

/**
 * Explicit story fixtures. The ledger, target and reasoning below are local review data: they are
 * not a solver, a real allowance, a purchase product or an app adapter.
 */
export type RevealFixture =
  | 'free-3'
  | 'free-1'
  | 'pending'
  | 'success'
  | 'failure'
  | 'exhausted'
  | 'entitlement'
  | 'loading'
  | 'unavailable';
export interface AssistanceFixtureOptions {
  size?: 6 | 8 | 15;
  reducedMotion?: boolean;
  animations?: boolean;
  initiallyOpen?: boolean;
  /** Show the Nudge cue immediately (for static review captures). */
  initialCue?: boolean;
  reveal?: RevealFixture;
  /** The fixture Reveal request ends in this outcome. */
  revealOutcome?: 'success' | 'failure';
  lessonDestination?: boolean;
  freeTiers?: 'ready' | 'unavailable' | 'loading';
  onNudge?: () => void;
  onExplain?: () => void;
  onReveal?: () => void;
  onLesson?: () => void;
}

export const FIXTURE_GUIDANCE: ExplainGuidance = {
  title: 'Fixture: a full row',
  text: 'Fixture reasoning for review only. When a row already holds as many tents as its clue, every other open cell in that row must stay empty.',
};
const FREE_TOTAL = 3;
export function revealFixture(kind: RevealFixture): RevealPresentation {
  const free = (remaining: number) => ({ kind: 'free' as const, remaining, total: FREE_TOTAL });
  switch (kind) {
    case 'free-3':
      return { status: 'ready', allowance: free(3) };
    case 'free-1':
      return { status: 'ready', allowance: free(1) };
    case 'pending':
      return { status: 'pending', allowance: free(2) };
    case 'success':
      return {
        status: 'success',
        allowance: free(1),
        message: 'Fixture: one correct move was placed. Undo is available.',
      };
    case 'failure':
      return {
        status: 'failure',
        allowance: free(2),
        message: 'Fixture: nothing was placed and no Reveal was used. Try again.',
      };
    case 'exhausted':
      return { status: 'exhausted', freeTotal: FREE_TOTAL };
    case 'entitlement':
      return { status: 'ready', allowance: { kind: 'entitlement' } };
    case 'loading':
      return { status: 'loading' };
    case 'unavailable':
      return {
        status: 'unavailable',
        message: 'Fixture: Reveal is not supported for this puzzle yet.',
      };
  }
}
function freeTiers(
  kind: AssistanceFixtureOptions['freeTiers'],
): Pick<AssistancePanelState, 'nudge' | 'explain'> {
  if (kind === 'unavailable')
    return {
      nudge: { status: 'unavailable', message: 'Fixture: the puzzle is already complete.' },
      explain: { status: 'unavailable', message: 'Fixture: no logical step from these marks.' },
    };
  if (kind === 'loading') return { nudge: { status: 'loading' }, explain: { status: 'loading' } };
  return { nudge: { status: 'ready' }, explain: { status: 'ready' } };
}

type Host = HTMLElement & { cleanup?: () => void };
/** Board, the single approved Hint control and the editorial sheet hosting the shared panel. */
export function createAssistancePreview(options: AssistanceFixtureOptions = {}): Host {
  const root = overlayHost() as Host;
  root.classList.add('gg-v4-game-overlay-preview');
  root.dataset.reducedMotion = String(options.reducedMotion ?? false);
  const animations = options.animations !== false && options.reducedMotion !== true;
  let disposed = false;
  let cue: AssistanceCue | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const note = el('p', {
    className: 'gg-v4-overlay-note',
    text: 'Assistance preview · fixture target, reasoning and ledger only',
  });
  const announcer = createAssistanceAnnouncer();
  const board = createV4Board({
    size: options.size ?? 6,
    interactive: false,
    hint: false,
    conflict: false,
  });
  board.dataset.slot = 'board';
  const grid = board.querySelector<HTMLElement>('.nl-grim-glimmer-board')!;
  const size = options.size ?? 6;
  // Fixture target: the first empty cell in the lower half of the fixture board.
  const targetIndex = [...grid.children].findIndex(
    (cell, index) =>
      index >= Math.floor(size / 2) * size &&
      cell.classList.contains('nl-grim-glimmer-board__cell--empty'),
  );
  const target = grid.children[Math.max(0, targetIndex)] as HTMLElement;
  const row = Math.floor(Math.max(0, targetIndex) / size) + 1;
  const column = (Math.max(0, targetIndex) % size) + 1;

  let state: AssistancePanelState = {
    ...freeTiers(options.freeTiers),
    reveal: revealFixture(options.reveal ?? 'free-3'),
  };
  const sheet = createBottomSheet({
    title: 'Hints',
    presentation: 'editorial',
    animations,
    onClose: () => {
      if (state.guidance) update({ ...state, guidance: undefined });
    },
  });
  function update(next: AssistancePanelState) {
    state = next;
    panel.update(state);
  }
  function showCue() {
    cue?.dispose();
    cue = showAssistanceCue({
      cell: target,
      reducedMotion: options.reducedMotion === true,
      animations,
    });
    announcer.announce(`Fixture nudge: look at row ${row}, column ${column}.`);
  }
  const panel = createAssistancePanel({
    ...state,
    showTitle: false,
    descriptions: { reveal: 'Places one correct tent for you.' },
    onNudge: () => {
      options.onNudge?.();
      // No confirmation: close the host and show the approved hint-circle.
      closeDialog(sheet);
      showCue();
    },
    onExplain: () => {
      options.onExplain?.();
      cue?.dispose();
      cue = undefined;
      update({
        ...state,
        guidance: {
          ...FIXTURE_GUIDANCE,
          lesson: options.lessonDestination
            ? { label: 'Fixture lesson: Full rows', onOpen: () => options.onLesson?.() }
            : undefined,
        },
      });
    },
    onReveal: () => {
      options.onReveal?.();
      const current = state.reveal;
      if (!('allowance' in current)) return;
      update({ ...state, reveal: { status: 'pending', allowance: current.allowance } });
      timer = setTimeout(() => {
        if (disposed) return;
        const before = current.allowance;
        if (options.revealOutcome === 'failure') {
          update({
            ...state,
            reveal: {
              status: 'failure',
              allowance: before,
              message: 'Fixture: nothing was placed and no Reveal was used. Try again.',
            },
          });
          return;
        }
        // Fixture ledger stands in for the app's committed count; the panel never decrements.
        const after =
          before.kind === 'free'
            ? { ...before, remaining: before.remaining - 1 }
            : before.remaining === undefined
              ? before
              : { ...before, remaining: before.remaining - 1 };
        update({
          ...state,
          reveal: {
            status: 'success',
            allowance: after,
            message: 'Fixture: one correct tent would be placed now. Undo is available.',
          },
        });
      }, 600);
    },
    onGuidanceDone: () => update({ ...state, guidance: undefined }),
  });
  getDialogBody(sheet).append(panel.element);

  const controls = createGameControlRow({
    mode: 'tent',
    canUndo: false,
    hint: 'available',
    reducedMotion: options.reducedMotion === true,
    onModeChange: () => undefined,
    onHint: () => {
      cue?.dispose();
      cue = undefined;
      openDialog(sheet);
    },
  });
  controls.dataset.slot = 'controls';
  root.append(note, board, controls, announcer.element, sheet);
  queueMicrotask(() => {
    if (disposed || !root.isConnected) return;
    if (options.initialCue) showCue();
    if (options.initiallyOpen) openDialog(sheet);
  });
  root.cleanup = () => {
    disposed = true;
    if (timer) clearTimeout(timer);
    cue?.dispose();
    announcer.clear();
    destroyBottomSheet(sheet);
  };
  return root;
}

/** Inline gallery of every panel state for light/dark and 360/390px review captures. */
export function createAssistanceStates(): HTMLElement {
  const cases: [string, AssistancePanelState][] = [
    ['Ready · 3 of 3 free', { ...freeTiers('ready'), reveal: revealFixture('free-3') }],
    ['Ready · last free Reveal', { ...freeTiers('ready'), reveal: revealFixture('free-1') }],
    ['Reveal pending', { ...freeTiers('ready'), reveal: revealFixture('pending') }],
    ['Reveal success', { ...freeTiers('ready'), reveal: revealFixture('success') }],
    ['Reveal failure', { ...freeTiers('ready'), reveal: revealFixture('failure') }],
    ['Free Reveals exhausted', { ...freeTiers('ready'), reveal: revealFixture('exhausted') }],
    ['Reveal entitlement active', { ...freeTiers('ready'), reveal: revealFixture('entitlement') }],
    ['Reveal loading', { ...freeTiers('ready'), reveal: revealFixture('loading') }],
    ['Reveal unavailable', { ...freeTiers('ready'), reveal: revealFixture('unavailable') }],
    ['Free tiers loading', { ...freeTiers('loading'), reveal: revealFixture('free-3') }],
    ['Free tiers unavailable', { ...freeTiers('unavailable'), reveal: revealFixture('free-3') }],
    [
      'Explain guidance · no lesson',
      { ...freeTiers('ready'), reveal: revealFixture('free-3'), guidance: FIXTURE_GUIDANCE },
    ],
    [
      'Explain guidance · lesson destination',
      {
        ...freeTiers('ready'),
        reveal: revealFixture('free-3'),
        guidance: {
          ...FIXTURE_GUIDANCE,
          lesson: { label: 'Fixture lesson: Full rows', onOpen: () => undefined },
        },
      },
    ],
  ];
  const root = el('div', { className: 'gg-v4-scope nl-grim-glimmer-v4 gg-assistance-states' });
  for (const [label, state] of cases) {
    const panel = createAssistancePanel({
      ...state,
      title: label,
      onNudge: () => undefined,
      onExplain: () => undefined,
      onReveal: () => undefined,
      onGuidanceDone: () => undefined,
    });
    // Built detached, so a guidance state does not move focus while the gallery renders.
    root.append(el('div', { className: 'gg-assistance-states__card' }, [panel.element]));
  }
  return root;
}
