export {
  DECK_MOTION,
  fan,
  mix,
  transform,
  dragPoses,
  dismisses,
  springDisplacement,
  type Pose,
} from '../../../src/projects/grim-glimmer/deck-model.js';
export function deckBudget(
  width: number,
  height: number,
  { daily = true, safeTop = 0, safeBottom = 0, dailyHeight = height <= 740 ? 56 : 64 } = {},
) {
  const gap = height <= 740 ? 8 : 16,
    blocks = 3 + Number(daily);
  const fixed =
    Math.max(16, safeTop) +
    96 +
    53 +
    Math.max(4, safeBottom) +
    (blocks - 1) * gap +
    (daily ? dailyHeight : 0) +
    60 +
    40;
  const cardHeight = Math.min(420, Math.max(0, height - fixed));
  return { width: Math.min(width - 56, (cardHeight * 2) / 3), height: cardHeight, reserve: 40 };
}

/** Current logo-free StackHome. Legacy standalone comparison budget above stays available. */
export function stackHomeBudget(
  width: number,
  height: number,
  { daily = true, safeTop = 0, safeBottom = 0 } = {},
) {
  const fixed =
    Math.max(24, safeTop) + 53 + Math.max(4, safeBottom) + (daily ? 48 + 98 : 24) + 60 + 40;
  const cardWidth = Math.max(0, Math.min(336, width - 56, ((height - fixed) * 2) / 3));
  return { width: cardWidth, height: (cardWidth * 3) / 2, reserve: 40 };
}
