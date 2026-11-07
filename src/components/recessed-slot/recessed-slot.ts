export interface RecessedSlotOptions {
  /** The slot is decorative; its child owns any interactive behavior. */
  content?: Node;
  label?: string;
}

/** A recessed container for puzzle tiles, icons, or other project content. */
export function createRecessedSlot(options: RecessedSlotOptions = {}): HTMLDivElement {
  const slot = document.createElement('div');
  slot.className = 'nl-recessed-slot';
  if (options.label) {
    slot.setAttribute('role', 'group');
    slot.setAttribute('aria-label', options.label);
  }
  if (options.content) slot.append(options.content);
  return slot;
}
