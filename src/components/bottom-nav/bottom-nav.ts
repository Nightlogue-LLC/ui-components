export interface BottomNavItem {
  value: string;
  label: string;
  /** App-owned artwork; cloned and hidden from assistive technology. */
  icon: Node;
}

export interface BottomNavOptions {
  label: string;
  items: readonly BottomNavItem[];
  value: string;
  /** Hide visible labels, retaining accessible destination names. */
  iconOnly?: boolean;
  /** Navigation request only. The consumer accepts with updateBottomNav(). */
  onNavigate: (value: string) => void;
}

const buttons = new WeakMap<HTMLElement, Map<string, HTMLButtonElement>>();

/** Main destinations, not gameplay actions. Native buttons retain normal Tab/Enter behavior. */
export function createBottomNav(options: BottomNavOptions): HTMLElement {
  if (
    !options.items.length ||
    new Set(options.items.map((item) => item.value)).size !== options.items.length
  ) {
    throw new Error('createBottomNav: provide a nonempty list of unique destinations');
  }
  if (!options.items.some((item) => item.value === options.value)) {
    throw new Error('createBottomNav: selected value must match a destination');
  }
  const nav = document.createElement('nav');
  nav.className = 'nl-bottom-nav';
  if (options.iconOnly) nav.classList.add('nl-bottom-nav--icon-only');
  nav.setAttribute('aria-label', options.label);
  nav.style.setProperty('--nl-bottom-nav-count', String(options.items.length));
  const entries = new Map<string, HTMLButtonElement>();
  for (const item of options.items) {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', item.label);
    if (options.iconOnly) button.title = item.label;
    button.className = 'nl-bottom-nav__item';
    const icon = document.createElement('span');
    icon.className = 'nl-bottom-nav__icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.append(item.icon.cloneNode(true));
    const label = document.createElement('span');
    label.className = 'nl-bottom-nav__label';
    label.textContent = item.label;
    button.append(icon, label);
    button.addEventListener('click', () => {
      if (button.getAttribute('aria-current') !== 'page') options.onNavigate(item.value);
    });
    entries.set(item.value, button);
    nav.append(button);
  }
  buttons.set(nav, entries);
  updateBottomNav(nav, options.value);
  return nav;
}

/** Updates selection in place without replacing buttons or moving keyboard focus. */
export function updateBottomNav(nav: HTMLElement, value: string): void {
  const entries = buttons.get(nav);
  if (!entries?.has(value)) throw new Error('updateBottomNav: unknown navigation or destination');
  for (const [destination, button] of entries) {
    if (destination === value) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  }
}
