import { describe, expect, it, vi } from 'vitest';
import { createCard } from './card.js';

describe('createCard', () => {
  it('is a static div by default, with no interactive styling class', () => {
    const card = createCard();
    expect(card.tagName).toBe('DIV');
    expect(card.classList.contains('nl-card')).toBe(true);
    expect(card.classList.contains('nl-card--interactive')).toBe(false);
    expect(card.hasAttribute('tabindex')).toBe(false);
  });

  it('is a native non-submitting button when interactive', () => {
    const card = createCard({ interactive: true });
    expect(card.tagName).toBe('BUTTON');
    expect((card as HTMLButtonElement).type).toBe('button');
    expect(card.classList.contains('nl-card--interactive')).toBe(true);
  });

  it('becomes interactive when only onClick is given, and fires it', () => {
    const onClick = vi.fn();
    const card = createCard({ onClick });
    expect(card.tagName).toBe('BUTTON');
    card.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('ignores onClick when explicitly static', () => {
    const onClick = vi.fn();
    const card = createCard({ interactive: false, onClick });
    expect(card.tagName).toBe('DIV');
    card.click();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('names an interactive card through label or through visible child text', () => {
    expect(createCard({ interactive: true, label: 'Open puzzle' }).getAttribute('aria-label')).toBe(
      'Open puzzle',
    );
    const card = createCard({ interactive: true });
    const text = document.createElement('span');
    text.textContent = 'Tents & Trees';
    card.append(text);
    expect(card.hasAttribute('aria-label')).toBe(false);
    expect(card.textContent).toBe('Tents & Trees'); // accessible name comes from content
  });

  it('exposes a labelled static card as a group', () => {
    const card = createCard({ label: 'Puzzle collection' });
    expect(card.getAttribute('role')).toBe('group');
    expect(card.getAttribute('aria-label')).toBe('Puzzle collection');
  });

  it('holds user-composed children', () => {
    const card = createCard();
    const child = document.createElement('p');
    card.append(child);
    expect(card.firstElementChild).toBe(child);
  });
});
