export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectOptions {
  label: string;
  value: string;
  options: readonly SelectOption[];
  onChange?: (value: string) => void;
}

let nextId = 0;

/** In-app single-choice popover. Navigation previews an option; Enter/click commits it. */
export function createSelect(options: SelectOptions): HTMLElement {
  const choices = options.options.map((option) => ({ ...option }));
  let selected = choices.findIndex((option) => option.value === options.value);
  if (selected < 0 || new Set(choices.map((option) => option.value)).size !== choices.length) {
    throw new Error('createSelect: provide unique options and a matching value');
  }
  let active = selected;
  let stopWatching: (() => void) | undefined;
  const root = document.createElement('div');
  root.className = 'nl-select';
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'nl-select__trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  const value = document.createElement('span');
  const arrow = document.createElement('span');
  arrow.className = 'nl-select__arrow';
  arrow.setAttribute('aria-hidden', 'true');
  arrow.textContent = '⌄';
  trigger.append(value, arrow);
  const list = document.createElement('div');
  list.className = 'nl-select__list';
  list.id = `nl-select-${++nextId}`;
  list.hidden = true;
  list.setAttribute('role', 'listbox');
  list.setAttribute('aria-label', options.label);
  trigger.setAttribute('aria-controls', list.id);
  const nodes = choices.map((option, index) => {
    const node = document.createElement('div');
    node.className = 'nl-select__option';
    node.setAttribute('role', 'option');
    node.tabIndex = -1;
    node.textContent = option.label;
    node.addEventListener('click', () => commit(index));
    list.append(node);
    return node;
  });
  root.append(trigger, list);

  function paint(): void {
    value.textContent = choices[selected]!.label;
    trigger.setAttribute('aria-label', `${options.label}: ${choices[selected]!.label}`);
    nodes.forEach((node, index) => {
      node.setAttribute('aria-selected', String(index === selected));
      node.tabIndex = !list.hidden && index === active ? 0 : -1;
    });
  }
  function close(restoreFocus = false): void {
    list.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    stopWatching?.();
    stopWatching = undefined;
    paint();
    if (restoreFocus) trigger.focus();
  }
  function focus(index: number): void {
    active = (index + nodes.length) % nodes.length;
    paint();
    nodes[active]!.focus();
  }
  function open(index = selected): void {
    if (!list.hidden) return;
    list.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    const rect = trigger.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom - 12;
    const above = rect.top - 12;
    const opensAbove = below < Math.min(list.scrollHeight, 240) && above > below;
    list.classList.toggle('nl-select__list--above', opensAbove);
    list.style.maxHeight = `${Math.max(44, opensAbove ? above : below)}px`;
    focus(index);
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.contains(event.target)) close();
    };
    document.addEventListener('pointerdown', outside);
    // A screen can be hidden or removed without closing its active selection first.
    const observer = new MutationObserver(() => {
      if (!root.isConnected || root.closest('[hidden]')) close();
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['hidden'],
    });
    stopWatching = () => {
      document.removeEventListener('pointerdown', outside);
      observer.disconnect();
    };
  }
  function commit(index: number): void {
    const changed = selected !== index;
    selected = index;
    close(true);
    if (changed) options.onChange?.(choices[selected]!.value);
  }
  trigger.addEventListener('click', () => (list.hidden ? open() : close()));
  trigger.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      open(event.key === 'ArrowUp' ? choices.length - 1 : selected);
    }
  });
  root.addEventListener('focusout', (event) => {
    if (!(event.relatedTarget instanceof Node) || !root.contains(event.relatedTarget)) close();
  });
  list.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
      // Start the normal Tab traversal from the trigger before hiding the focused option.
      close(true);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close(true);
      return;
    }
    const navigation: Record<string, number> = {
      ArrowDown: active + 1,
      ArrowUp: active - 1,
      Home: 0,
      End: nodes.length - 1,
    };
    const next = navigation[event.key];
    if (next !== undefined) {
      event.preventDefault();
      focus(next);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      commit(active);
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const match = choices.findIndex((_, offset) => {
        const index = (active + offset + 1) % choices.length;
        return choices[index]!.label.toLocaleLowerCase().startsWith(event.key.toLocaleLowerCase());
      });
      if (match >= 0) {
        event.preventDefault();
        focus(active + match + 1);
      }
    }
  });
  paint();
  return root;
}
