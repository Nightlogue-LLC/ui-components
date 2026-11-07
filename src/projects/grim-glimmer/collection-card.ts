import { createBadge, type BadgeTone } from '../../components/badge/index.js';
import { createCard } from '../../components/card/index.js';

export type PuzzleStatus = 'play' | 'continue' | 'coming-soon';

export interface PuzzleCollectionCardOptions {
  title: string;
  status: PuzzleStatus;
  /**
   * Static preview of the puzzle's pieces or board, supplied by the app (for example a
   * `createBoard({ mode: 'preview' })`). It is appended as given (not cloned) and hidden from
   * assistive technology, so it must not carry information the title does not.
   */
  preview: Node;
  /** Visible status words. Provide translations as needed. */
  statusLabels?: Partial<Record<PuzzleStatus, string>>;
  /** Called when an available card is opened. Ignored for `coming-soon`. */
  onOpen?: (event: MouseEvent) => void;
}

const DEFAULT_STATUS_LABELS: Record<PuzzleStatus, string> = {
  play: 'Play',
  continue: 'Continue',
  'coming-soon': 'Coming Soon',
};

const STATUS_TONES: Record<PuzzleStatus, BadgeTone> = {
  play: 'accent',
  continue: 'neutral',
  'coming-soon': 'muted',
};

/**
 * Full-width landscape card for the home collection: preview on the left (~40%), editorial title
 * and a small status on the right. Available puzzles are native buttons. `coming-soon` renders as
 * a static, visibly unavailable card: no button, no hover, no activation, and its status text
 * ("Coming Soon") is what assistive technology reads after the title.
 */
export function createPuzzleCollectionCard(options: PuzzleCollectionCardOptions): HTMLElement {
  const { title, status, preview, onOpen } = options;
  const available = status !== 'coming-soon';
  const labels = { ...DEFAULT_STATUS_LABELS, ...options.statusLabels };

  const card = createCard({
    interactive: available,
    ...(available && onOpen ? { onClick: onOpen } : {}),
  });
  card.classList.add('nl-grim-glimmer-collection-card');
  card.classList.toggle('nl-grim-glimmer-collection-card--unavailable', !available);

  const previewBox = document.createElement('span');
  previewBox.className = 'nl-grim-glimmer-collection-card__preview';
  previewBox.setAttribute('aria-hidden', 'true');
  previewBox.append(preview);

  const heading = document.createElement('span');
  heading.className = 'nl-grim-glimmer-collection-card__title';
  heading.textContent = title;

  const statusBox = document.createElement('span');
  statusBox.className = 'nl-grim-glimmer-collection-card__status';
  statusBox.append(createBadge({ label: labels[status], tone: STATUS_TONES[status] }));

  const content = document.createElement('span');
  content.className = 'nl-grim-glimmer-collection-card__content';
  content.append(heading, statusBox);

  card.append(previewBox, content);
  return card;
}

/** One-column list of equally sized cards (a real list, so assistive tech announces its size). */
export function createPuzzleCollection(
  cards: readonly HTMLElement[],
  options: { label: string },
): HTMLElement {
  const list = document.createElement('ul');
  list.className = 'nl-grim-glimmer-collection';
  list.setAttribute('aria-label', options.label);
  for (const card of cards) {
    const item = document.createElement('li');
    item.className = 'nl-grim-glimmer-collection__item';
    item.append(card);
    list.append(item);
  }
  return list;
}
