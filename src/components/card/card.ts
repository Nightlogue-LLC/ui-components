export interface CardOptions {
  /**
   * true  -> a native <button> (keyboard and screen-reader activation for free).
   * false -> a plain <div>; `onClick` is ignored.
   * Omitted -> interactive exactly when `onClick` is given.
   */
  interactive?: boolean;
  /**
   * Accessible name. For an interactive card, supply this OR put visible text inside it, so the
   * button has a name. For a static card it becomes a labelled `group`.
   */
  label?: string;
  onClick?: (event: MouseEvent) => void;
}

/**
 * Creates a neutral surface container. Compose its content with `card.append(...)`; it carries no
 * project art, titles or status of its own.
 *
 * Interactive cards are `<button>`s, so keep their children to phrasing content (`span`, `svg`,
 * `img`), and use CSS `display` to lay them out, rather than `div`/headings.
 */
export function createCard(options: CardOptions = {}): HTMLElement {
  const { label, onClick } = options;
  const interactive = options.interactive ?? onClick !== undefined;

  let card: HTMLElement;
  if (interactive) {
    const button = document.createElement('button');
    button.type = 'button';
    if (onClick) button.addEventListener('click', onClick);
    if (label) button.setAttribute('aria-label', label);
    card = button;
  } else {
    card = document.createElement('div');
    if (label) {
      card.setAttribute('role', 'group');
      card.setAttribute('aria-label', label);
    }
  }
  card.classList.add('nl-card');
  card.classList.toggle('nl-card--interactive', interactive);
  return card;
}
