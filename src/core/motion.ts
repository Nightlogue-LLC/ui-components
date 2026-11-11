/** Shared editorial sheet motion. Callers own visibility, focus and dismissal policy. */
export const SHEET_MOTION = { duration: 280, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' } as const;

export function animateSheet(
  element: HTMLElement,
  direction: 'enter' | 'exit',
  options: { animations?: boolean; placement?: 'bottom' | 'responsive' } = {},
): Animation | undefined {
  if (
    options.animations === false ||
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ||
    typeof element.animate !== 'function'
  )
    return;
  const bottom =
    options.placement !== 'responsive' || window.matchMedia?.('(max-width: 47.99rem)').matches;
  const hidden = bottom
    ? { transform: 'translateY(100%)', opacity: 1 }
    : { transform: 'translateY(0.5rem)', opacity: 0 };
  const visible = { transform: 'translateY(0)', opacity: 1 };
  return element.animate(direction === 'enter' ? [hidden, visible] : [visible, hidden], {
    ...SHEET_MOTION,
    fill: 'both',
  });
}

/** Matched popover entry/exit. Uses the same reduced-motion gate as shared sheets. */
export const POPOVER_MOTION = { duration: 160, easing: 'ease-out' } as const;
export function animatePopover(
  element: HTMLElement,
  direction: 'enter' | 'exit',
  options: { animations?: boolean } = {},
): Animation | undefined {
  if (
    options.animations === false ||
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ||
    typeof element.animate !== 'function'
  )
    return;
  const hidden = { transform: 'scale(.92)', opacity: 0 };
  const visible = { transform: 'scale(1)', opacity: 1 };
  return element.animate(direction === 'enter' ? [hidden, visible] : [visible, hidden], {
    ...POPOVER_MOTION,
    fill: 'both',
  });
}
