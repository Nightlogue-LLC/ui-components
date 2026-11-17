import { createButton, updateButton } from '../../components/button/index.js';
import { uniqueId } from '../../core/id.js';
import { createGameplayMotion } from './gameplay-motion.js';

/**
 * Shared Nudge / Explain / Reveal presentation. The app owns solving, allowance accounting,
 * entitlement, history and board changes; this module only renders app-provided state and
 * reports requests. It never decrements a count, applies a move or invents a purchase offer.
 */
export type AssistanceTier = 'nudge' | 'explain' | 'reveal';

/** Free-tier readiness. `message` is app-owned plain text (never markup). */
export interface AssistanceTierAvailability {
  status: 'ready' | 'loading' | 'unavailable';
  message?: string;
}

/** Contextual reasoning for the current board, supplied by the game's Explain adapter. */
export interface ExplainGuidance {
  /** Plain-text heading, normally the deduction technique's player-facing name. */
  title: string;
  /** Plain-text reasoning. Rendered as text, never HTML. */
  text: string;
  /** Supply only when a real Logic Library destination exists; omitted means no link is shown. */
  lesson?: { label?: string; onOpen: () => void };
}

/** Where the next Reveal would be paid from, as reported by the app's ledger. */
export type RevealAllowance =
  { kind: 'free'; remaining: number; total: number } | { kind: 'entitlement'; remaining?: number };

export type RevealPresentation =
  | { status: 'loading'; message?: string }
  | { status: 'unavailable'; message: string }
  | { status: 'ready'; allowance: RevealAllowance }
  | { status: 'pending'; allowance: RevealAllowance }
  | { status: 'success'; allowance: RevealAllowance; message: string }
  | { status: 'failure'; allowance: RevealAllowance; message: string }
  /** Free uses for this puzzle are spent and no paid entitlement is active. */
  | { status: 'exhausted'; freeTotal: number; message?: string };

export interface AssistancePanelState {
  nudge: AssistanceTierAvailability;
  explain: AssistanceTierAvailability;
  /** Present only while an Explain result is shown. Clearing it returns to the tier list. */
  guidance?: ExplainGuidance;
  reveal: RevealPresentation;
  /** Disables every request while the app prepares one (for example, a solver lookup). */
  busy?: boolean;
}

export interface AssistancePanelOptions extends AssistancePanelState {
  /** Section heading. Default "Hints". */
  title?: string;
  /** False omits the visible heading (for a host that already shows it) and names the section. */
  showTitle?: boolean;
  /** Game-specific plain-text tier descriptions, e.g. "Places one correct tent." */
  descriptions?: Partial<Record<AssistanceTier, string>>;
  /** Request a Nudge. The app closes the host overlay and shows the cue; no confirmation step. */
  onNudge: () => void;
  /** Request an Explain. The app answers by supplying `guidance` through `update()`. */
  onExplain: () => void;
  /** Request a Reveal. The app answers with pending, then success/failure and real counts. */
  onReveal: () => void;
  /** Player finished reading guidance. The app clears `guidance`. */
  onGuidanceDone: () => void;
}

export interface AssistancePanel {
  element: HTMLElement;
  /** Pass the complete app-owned state every time. */
  update(state: AssistancePanelState): void;
}

export const ASSISTANCE_DEFAULT_DESCRIPTIONS: Readonly<Record<AssistanceTier, string>> = {
  nudge: 'Highlights one cell worth a closer look. Nothing is placed.',
  explain: 'Walks through the reasoning behind a next step. Nothing is placed.',
  reveal: 'Places one correct move on the board for you.',
};
const EXHAUSTED_MESSAGE =
  'More Reveals need Reveal access, which is not available yet. Nudge and Explain stay free.';

function count(value: number, label: string, min: number) {
  if (!Number.isSafeInteger(value) || value < min)
    throw new RangeError(`${label} must be an integer of at least ${min}`);
}
function validate(reveal: RevealPresentation) {
  if (reveal.status === 'exhausted') return count(reveal.freeTotal, 'freeTotal', 1);
  if (!('allowance' in reveal)) return;
  const { allowance } = reveal;
  if (allowance.kind === 'free') {
    count(allowance.total, 'Free Reveal total', 1);
    count(allowance.remaining, 'Free Reveals remaining', 0);
    if (allowance.remaining > allowance.total)
      throw new RangeError('Free Reveals remaining cannot exceed the total');
  } else if (allowance.remaining !== undefined) {
    count(allowance.remaining, 'Entitled Reveals remaining', 0);
  }
  // A ready Reveal with nothing left would be a dishonest enabled state: report exhausted.
  if (reveal.status === 'ready' && allowance.remaining === 0)
    throw new RangeError('A ready Reveal needs a remaining allowance; use status "exhausted"');
}
function allowanceText(allowance: RevealAllowance) {
  if (allowance.kind === 'free')
    return `${allowance.remaining} of ${allowance.total} free Reveals left for this puzzle`;
  if (allowance.remaining === undefined) return 'Reveal access active';
  return `${allowance.remaining} Reveal${allowance.remaining === 1 ? '' : 's'} left`;
}
function text(tag: 'p' | 'span' | 'h2' | 'h3', className: string, value = '') {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = value;
  return node;
}

/** Content for an existing overlay host (the editorial bottom sheet), not a dialog of its own. */
export function createAssistancePanel(options: AssistancePanelOptions): AssistancePanel {
  const descriptions = { ...ASSISTANCE_DEFAULT_DESCRIPTIONS, ...options.descriptions };
  const root = document.createElement('section');
  root.className = 'nl-grim-glimmer-assistance';
  const heading = text('h2', 'nl-grim-glimmer-assistance__title', options.title ?? 'Hints');
  heading.id = uniqueId('nl-assistance-title');
  if (options.showTitle === false) root.setAttribute('aria-label', heading.textContent ?? 'Hints');
  else root.setAttribute('aria-labelledby', heading.id);

  const list = document.createElement('ul');
  list.className = 'nl-grim-glimmer-assistance__tiers';
  const handlers: Record<AssistanceTier, () => void> = {
    nudge: options.onNudge,
    explain: options.onExplain,
    reveal: options.onReveal,
  };
  const labels: Record<AssistanceTier, string> = {
    nudge: 'Nudge',
    explain: 'Explain',
    reveal: 'Reveal',
  };
  const tiers = (['nudge', 'explain', 'reveal'] as const).map((tier) => {
    const item = document.createElement('li');
    item.className = 'nl-grim-glimmer-assistance__tier';
    item.dataset.tier = tier;
    const button = createButton({
      label: labels[tier],
      variant: tier === 'reveal' ? 'secondary' : 'primary',
      onClick: () => {
        if (!button.disabled) handlers[tier]();
      },
    });
    button.classList.add('nl-grim-glimmer-assistance__action');
    const copy = document.createElement('div');
    copy.className = 'nl-grim-glimmer-assistance__copy';
    const description = text('p', 'nl-grim-glimmer-assistance__description', descriptions[tier]);
    description.id = uniqueId(`nl-assistance-${tier}-description`);
    // Cost is text, not color: "Free" or the app's real Reveal count.
    const meta = text('p', 'nl-grim-glimmer-assistance__meta');
    meta.id = uniqueId(`nl-assistance-${tier}-meta`);
    const note = text('p', 'nl-grim-glimmer-assistance__note');
    note.id = uniqueId(`nl-assistance-${tier}-note`);
    copy.append(description, meta, note);
    item.append(button, copy);
    list.append(item);
    return { tier, item, button, meta, note, describedBy: [description.id, meta.id, note.id] };
  });
  const status = text('p', 'nl-grim-glimmer-assistance__status');
  status.setAttribute('role', 'status');

  const guidance = document.createElement('section');
  guidance.className = 'nl-grim-glimmer-assistance__guidance';
  guidance.hidden = true;
  const guidanceTitle = text('h3', 'nl-grim-glimmer-assistance__guidance-title');
  guidanceTitle.id = uniqueId('nl-assistance-guidance');
  guidanceTitle.tabIndex = -1;
  guidance.setAttribute('aria-labelledby', guidanceTitle.id);
  const guidanceText = text('p', 'nl-grim-glimmer-assistance__guidance-text');
  const guidanceActions = document.createElement('div');
  guidanceActions.className = 'nl-grim-glimmer-assistance__guidance-actions';
  let lessonOpen: (() => void) | undefined;
  const lesson = createButton({
    label: 'Open in Logic Library',
    variant: 'ghost',
    onClick: () => lessonOpen?.(),
  });
  const done = createButton({
    label: 'Done',
    variant: 'secondary',
    onClick: () => options.onGuidanceDone(),
  });
  guidanceActions.append(lesson, done);
  guidance.append(guidanceTitle, guidanceText, guidanceActions);
  root.append(...(options.showTitle === false ? [] : [heading]), list, guidance, status);

  let showingGuidance = false;
  function paint(state: AssistancePanelState) {
    validate(state.reveal);
    const busy = state.busy === true;
    const reveal = state.reveal;
    root.dataset.busy = String(busy);
    root.setAttribute('aria-busy', String(busy || reveal.status === 'pending'));
    for (const { tier, item, button, meta, note, describedBy } of tiers) {
      let disabled = busy;
      let loading = false;
      let noteText = '';
      let metaText = 'Free';
      if (tier === 'reveal') {
        item.dataset.state = reveal.status;
        if (reveal.status === 'exhausted') {
          disabled = true;
          metaText = `All ${reveal.freeTotal} free Reveals used for this puzzle`;
          noteText = reveal.message ?? EXHAUSTED_MESSAGE;
        } else if (reveal.status === 'loading') {
          disabled = true;
          metaText = '';
          noteText = reveal.message ?? 'Checking Reveal access…';
        } else if (reveal.status === 'unavailable') {
          disabled = true;
          metaText = '';
          noteText = reveal.message;
        } else {
          metaText = allowanceText(reveal.allowance);
          loading = reveal.status === 'pending';
          disabled ||= reveal.allowance.remaining === 0;
        }
      } else {
        const availability = state[tier];
        item.dataset.state = availability.status;
        if (availability.status !== 'ready') {
          disabled = true;
          noteText =
            availability.message ??
            (availability.status === 'loading' ? 'Preparing…' : 'Not available right now');
        }
      }
      updateButton(button, {
        label: labels[tier],
        variant: tier === 'reveal' ? 'secondary' : 'primary',
        disabled,
        loading,
      });
      meta.textContent = metaText;
      meta.hidden = metaText === '';
      note.textContent = noteText;
      note.hidden = noteText === '';
      button.setAttribute(
        'aria-describedby',
        describedBy.filter((id) => !root.querySelector<HTMLElement>(`#${id}`)?.hidden).join(' '),
      );
    }
    const statusText =
      reveal.status === 'pending'
        ? 'Revealing…'
        : reveal.status === 'success' || reveal.status === 'failure'
          ? reveal.message
          : '';
    if (status.textContent !== statusText) status.textContent = statusText;
    root.dataset.reveal = reveal.status;

    const next = state.guidance;
    const wasShowing = showingGuidance;
    showingGuidance = next !== undefined;
    const focusWasInside = guidance.contains(document.activeElement);
    guidance.hidden = !next;
    list.hidden = Boolean(next);
    if (next) {
      guidanceTitle.textContent = next.title;
      guidanceText.textContent = next.text;
      lessonOpen = next.lesson?.onOpen;
      lesson.hidden = !next.lesson;
      updateButton(lesson, {
        label: next.lesson?.label ?? 'Open in Logic Library',
        variant: 'ghost',
      });
      if (!wasShowing) guidanceTitle.focus({ preventScroll: true });
    } else {
      lessonOpen = undefined;
      if (wasShowing && (focusWasInside || document.activeElement === document.body))
        tiers[1]!.button.focus({ preventScroll: true });
    }
  }
  paint(options);
  return { element: root, update: paint };
}

export interface AssistanceCueOptions {
  /** The rendered board cell to highlight. The cue never changes its state or marks. */
  cell: HTMLElement;
  /** Nonvisual equivalent linked with aria-describedby. Default "Nudge target". */
  description?: string;
  reducedMotion?: boolean;
  /** False honors the app's Animations OFF preference. */
  animations?: boolean;
}
export interface AssistanceCue {
  readonly element: HTMLElement;
  dispose(): void;
}

/**
 * The approved V4 hint-circle on one cell, using the shared gameplay pulse. Reduced motion keeps
 * a static ring. Labels survive `updateBoard` because the cue uses aria-describedby, not the
 * cell's aria-label. Requires an `.nl-grim-glimmer-v4` ancestor for its styles.
 */
export function showAssistanceCue(options: AssistanceCueOptions): AssistanceCue {
  const { cell } = options;
  const ring = document.createElement('span');
  ring.className = 'gg-v4-hint gg-v4-assistance-cue';
  ring.setAttribute('aria-hidden', 'true');
  const label = document.createElement('span');
  label.id = uniqueId('nl-assistance-cue');
  label.hidden = true;
  label.textContent = options.description ?? 'Nudge target';
  cell.append(ring, label);
  cell.dataset.assistanceCue = 'nudge';
  const describedBy = (cell.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
  cell.setAttribute('aria-describedby', [...describedBy, label.id].join(' '));
  const motion = createGameplayMotion({
    hint: ring,
    reducedMotion: options.reducedMotion === true,
    animations: options.animations !== false,
  });
  motion.mount();
  let disposed = false;
  return {
    element: ring,
    dispose() {
      if (disposed) return;
      disposed = true;
      motion.dispose();
      ring.remove();
      label.remove();
      delete cell.dataset.assistanceCue;
      const remaining = (cell.getAttribute('aria-describedby') ?? '')
        .split(/\s+/)
        .filter((id) => id && id !== label.id);
      if (remaining.length) cell.setAttribute('aria-describedby', remaining.join(' '));
      else cell.removeAttribute('aria-describedby');
    },
  };
}

export interface AssistanceAnnouncer {
  /** Visually hidden polite live region; mount it once near the board. */
  readonly element: HTMLElement;
  /** Announce the app's plain-text cue/result equivalent. Repeated text is re-announced. */
  announce(message: string): void;
  clear(): void;
}
export function createAssistanceAnnouncer(): AssistanceAnnouncer {
  const element = document.createElement('p');
  element.className = 'nl-grim-glimmer-visually-hidden';
  element.setAttribute('role', 'status');
  element.setAttribute('aria-live', 'polite');
  let timer: ReturnType<typeof setTimeout> | undefined;
  const clear = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    element.textContent = '';
  };
  return {
    element,
    announce(message) {
      clear();
      // Emptying first lets readers announce an identical consecutive message.
      timer = setTimeout(() => {
        timer = undefined;
        element.textContent = message;
      }, 50);
    },
    clear,
  };
}
