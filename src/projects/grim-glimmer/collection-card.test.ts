import { describe, expect, it, vi } from 'vitest';
import { createBoard } from './board.js';
import { createPuzzleCollection, createPuzzleCollectionCard } from './collection-card.js';

const preview = () =>
  createBoard({
    label: 'p',
    size: 2,
    mode: 'preview',
    cells: ['empty', 'fixed', 'placed', 'marked'],
  });
const text = (el: Element, sel: string) => el.querySelector(sel)?.textContent;

describe('createPuzzleCollectionCard', () => {
  it.each([
    ['play', 'Play', 'accent'],
    ['continue', 'Continue', 'neutral'],
  ] as const)(
    '%s: an available, native-button card with a visible status',
    (status, label, tone) => {
      const onOpen = vi.fn();
      const card = createPuzzleCollectionCard({
        title: 'Tents & Trees',
        status,
        preview: preview(),
        onOpen,
      });
      expect(card.tagName).toBe('BUTTON');
      expect(card.classList.contains('nl-card')).toBe(true);
      expect(card.classList.contains('nl-grim-glimmer-collection-card--unavailable')).toBe(false);
      expect(text(card, '.nl-grim-glimmer-collection-card__title')).toBe('Tents & Trees');
      expect(text(card, '.nl-badge')).toBe(label);
      expect(card.querySelector('.nl-badge')!.classList.contains(`nl-badge--${tone}`)).toBe(true);
      card.click();
      expect(onOpen).toHaveBeenCalledTimes(1);
    },
  );

  it('coming soon is static, visibly unavailable and not actionable', () => {
    const onOpen = vi.fn();
    const card = createPuzzleCollectionCard({
      title: 'Placeholder',
      status: 'coming-soon',
      preview: preview(),
      onOpen,
    });
    expect(card.tagName).toBe('DIV');
    expect(card.querySelector('button')).toBeNull();
    expect(card.classList.contains('nl-card--interactive')).toBe(false);
    expect(card.classList.contains('nl-grim-glimmer-collection-card--unavailable')).toBe(true);
    expect(text(card, '.nl-badge')).toBe('Coming Soon'); // the status is real text, not color
    card.click();
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('hides the preview from assistive tech so the name is title + status', () => {
    const card = createPuzzleCollectionCard({
      title: 'Tents & Trees',
      status: 'play',
      preview: preview(),
    });
    expect(
      card.querySelector('.nl-grim-glimmer-collection-card__preview')!.getAttribute('aria-hidden'),
    ).toBe('true');
    expect(card.querySelector('[aria-label]')).toBeNull();
  });

  it('supports translated status words', () => {
    const card = createPuzzleCollectionCard({
      title: 'x',
      status: 'continue',
      preview: preview(),
      statusLabels: { continue: 'Fortsetzen' },
    });
    expect(text(card, '.nl-badge')).toBe('Fortsetzen');
  });

  it('sets the title as text, never HTML', () => {
    const card = createPuzzleCollectionCard({
      title: '<img src=x onerror=alert(1)>',
      status: 'play',
      preview: preview(),
    });
    expect(card.querySelector('img')).toBeNull();
    expect(text(card, '.nl-grim-glimmer-collection-card__title')).toBe(
      '<img src=x onerror=alert(1)>',
    );
  });

  it('contains only phrasing content, so it is valid inside a button', () => {
    const card = createPuzzleCollectionCard({ title: 't', status: 'play', preview: preview() });
    const inner = card.querySelectorAll(
      '.nl-grim-glimmer-collection-card__preview, .nl-grim-glimmer-collection-card__content, .nl-grim-glimmer-collection-card__title, .nl-grim-glimmer-collection-card__status',
    );
    expect([...inner].every((e) => e.tagName === 'SPAN')).toBe(true);
  });
});

describe('createPuzzleCollection', () => {
  it('is a labelled one-column list with one item per card', () => {
    const cards = [1, 2, 3].map((n) =>
      createPuzzleCollectionCard({ title: `T${n}`, status: 'play', preview: preview() }),
    );
    const list = createPuzzleCollection(cards, { label: 'Puzzles' });
    expect(list.tagName).toBe('UL');
    expect(list.getAttribute('aria-label')).toBe('Puzzles');
    expect(list.querySelectorAll(':scope > li')).toHaveLength(3);
    expect(list.querySelector('li')!.firstElementChild).toBe(cards[0]);
  });
});
