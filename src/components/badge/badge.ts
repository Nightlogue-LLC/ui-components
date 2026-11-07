export const BADGE_TONES = ['neutral', 'accent', 'muted'] as const;
export type BadgeTone = (typeof BADGE_TONES)[number];

export interface BadgeProps {
  /** Status text. It always carries the meaning; tone is only emphasis. */
  label: string;
  /** Defaults to 'neutral'. */
  tone?: BadgeTone;
}

/** Creates a compact, non-interactive status label. Do not put interactive elements inside it. */
export function createBadge(props: BadgeProps): HTMLSpanElement {
  const badge = document.createElement('span');
  badge.classList.add('nl-badge');
  updateBadge(badge, props);
  return badge;
}

/** Applies the full props to a badge made by `createBadge`. */
export function updateBadge(badge: HTMLElement, props: BadgeProps): void {
  const { label, tone = 'neutral' } = props;
  for (const t of BADGE_TONES) badge.classList.toggle(`nl-badge--${t}`, t === tone);
  badge.textContent = label;
}
