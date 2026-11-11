import { createGameplayMotion } from '../../../src/projects/grim-glimmer/gameplay-motion.js';
export {
  GAMEPLAY_MOTION as V4_MOTION,
  dissolveTiming,
} from '../../../src/projects/grim-glimmer/gameplay-motion.js';
import './motion.css';
export function createMotionSystem(
  options: { reducedMotion?: boolean; hint?: HTMLElement; reviewSpeed?: 0.25 | 0.5 | 1 } = {},
) {
  return createGameplayMotion({
    ...options,
    get playbackRate() {
      return options.reviewSpeed;
    },
  });
}
