export interface Pose {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
}
export const DECK_MOTION = {
  fly: 220,
  reenter: 160,
  fade: 150,
  deal: 450,
  stagger: 70,
  nudgeDelay: 1200,
  spring: 600,
} as const;
export function fan(index: number, reduced = false): Pose {
  return {
    x: reduced ? 0 : index === 1 ? -8 : index === 2 ? 8 : 0,
    y: reduced ? 0 : index * 12,
    scale: reduced ? 1 : 1 - index * 0.05,
    rotation: reduced ? 0 : index === 1 ? -4 : index === 2 ? 4 : 0,
    opacity: 1,
  };
}
export function mix(from: Pose, to: Pose, p: number, bounded = true): Pose {
  const n = bounded ? Math.min(1, Math.max(0, p)) : p;
  return {
    x: from.x + (to.x - from.x) * n,
    y: from.y + (to.y - from.y) * n,
    scale: from.scale + (to.scale - from.scale) * n,
    rotation: from.rotation + (to.rotation - from.rotation) * n,
    opacity: from.opacity + (to.opacity - from.opacity) * n,
  };
}
export function transform(pose: Pose) {
  return `translate(${pose.x}px, ${pose.y}px) rotate(${pose.rotation}deg) scale(${pose.scale})`;
}
export function dragPoses(dx: number, width: number, reduced = false): Pose[] {
  if (reduced) return [0, 1, 2].map((index) => fan(index, true));
  const progress = Math.min(Math.abs(dx) / (0.5 * Math.max(width, 1)), 1);
  return [
    { ...fan(0), x: dx, rotation: (dx / Math.max(width, 1)) * 14 },
    mix(fan(1), fan(0), progress),
    mix(fan(2), fan(1), progress),
  ];
}
export function dismisses(dx: number, width: number, velocity: number) {
  return Math.abs(dx) >= 8 && (Math.abs(dx) > 0.3 * width || Math.abs(velocity) > 500);
}
/** Unit mass, stiffness 400, damping 30. Closed-form underdamped displacement. */
export function springDisplacement(time: number) {
  const omega = Math.sqrt(400 - 15 * 15);
  return Math.exp(-15 * time) * (Math.cos(omega * time) + (15 / omega) * Math.sin(omega * time));
}
