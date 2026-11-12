import { applyTheme } from '../../core/index.js';
import { createCard } from '../../components/card/index.js';
function el(
  tag: string,
  options: { className?: string; text?: string } = {},
  children: Node[] = [],
) {
  const node = document.createElement(tag);
  if (options.className) node.className = options.className;
  if (options.text) node.textContent = options.text;
  node.append(...children);
  return node;
}
interface DrawHost extends HTMLElement {
  start?: () => void;
  cleanup?: () => void;
}
function homeHost(name: string) {
  if (!customElements.get('nl-ritual-draw')) {
    class Host extends HTMLElement implements DrawHost {
      start?: () => void;
      cleanup?: () => void;
      connectedCallback() {
        this.start?.();
      }
      disconnectedCallback() {
        this.cleanup?.();
      }
    }
    customElements.define('nl-ritual-draw', Host);
  }
  const node = document.createElement('nl-ritual-draw') as DrawHost;
  node.className = `nl-grim-glimmer-v4 gg-v4-scope ${name}`;
  return node;
}
function star() {
  const svg = svgNode('svg', { viewBox: '0 0 32 32', 'aria-hidden': 'true', focusable: 'false' });
  const vertices = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * Math.PI) / 4 - Math.PI / 2,
      r = i % 2 ? 5 : 15;
    return `${16 + Math.cos(angle) * r},${16 + Math.sin(angle) * r}`;
  }).join(' ');
  svg.append(svgNode('polygon', { points: vertices }));
  return svg;
}

import { createLoopMotion } from '../../core/loop-motion.js';
import { createMonthArt, svgNode } from './month-art.js';
import {
  approximateMoon,
  countdown,
  daysInMonth,
  localDateKey,
  type MonthManifest,
} from './month-calendar.js';
import { ritualMotion } from './ritual-motion.js';

export const DRAW_STATES = [
  'unplayed',
  'revealing',
  'revealed-unstarted',
  'in-progress',
  'solved',
  'hidden',
] as const;
export type DrawState = (typeof DRAW_STATES)[number];
export interface DailyDrawIdentity {
  date: string;
  monthKey: string;
  title: string;
  piece: number;
  total: number;
}
export interface RitualDrawOptions {
  /** Supply exactly one source. Puzzle mode keeps the approved card back and claims no restoration rewards. */
  manifest?: MonthManifest;
  puzzle?: {
    title: string;
    action: 'Begin' | 'Resume' | 'Replay' | 'unavailable';
  };
  state?: DrawState;
  enabled?: boolean;
  clock?: () => Date;
  restoredDates?: readonly string[];
  progress?: number;
  streak?: number;
  revealProgress?: number;
  reducedMotion?: boolean;
  haptics?: boolean;
  sound?: boolean;
  light?: () => void;
  medium?: () => void;
  flipSound?: () => void;
  onReveal?: (daily: DailyDrawIdentity) => void;
  onBegin?: (daily: DailyDrawIdentity) => void;
  /** Puzzle-only activation; monthly identity and rewards are not involved. */
  onOpenPuzzle?: () => void;
  onDayChange?: (date: string) => void;
}
function moonEmblem(bucket: number, progress: number, solved: boolean) {
  const svg = svgNode('svg', {
    viewBox: '0 0 40 50',
    class: 'gg-v4-ritual-emblem',
    'aria-hidden': 'true',
  });
  svg.append(
    svgNode('circle', {
      cx: '20',
      cy: '25',
      r: '15',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '.7',
    }),
  );
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    svg.append(
      svgNode('path', {
        d: `M${20 + Math.cos(a) * 17} ${25 + Math.sin(a) * 17}l${Math.cos(a) * 2} ${Math.sin(a) * 2}`,
        stroke: 'currentColor',
        'stroke-width': '.5',
      }),
    );
  }
  const fraction = bucket < 4 ? bucket : 8 - bucket;
  if (solved || bucket === 4)
    svg.append(svgNode('circle', { cx: '20', cy: '25', r: '10', fill: 'currentColor' }));
  else if (bucket !== 0)
    svg.append(
      svgNode('path', {
        d: `M20 15 A10 10 0 0 1 20 35 ${fraction === 2 ? 'L20 15' : `A${fraction === 1 ? 8 : 6} 10 0 0 ${fraction === 1 ? 0 : 1} 20 15`}`,
        fill: 'currentColor',
        transform: bucket > 4 ? 'translate(40 0) scale(-1 1)' : '',
      }),
    );
  if (progress > 0)
    svg.append(
      svgNode('circle', {
        cx: '20',
        cy: '25',
        r: '15',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2',
        pathLength: '100',
        'stroke-dasharray': `${Math.min(1, Math.max(0, progress)) * 100} 100`,
        transform: 'rotate(-90 20 25)',
      }),
    );
  if (solved)
    svg.append(
      svgNode('path', {
        d: 'M15 25l4 4 7-8',
        fill: 'none',
        stroke: 'var(--gg-v4-night)',
        'stroke-width': '2',
      }),
    );
  return svg;
}
/** Isolated preview: no generator, native bridge, persistence or routes are called here. */
export function createRitualDraw(options: RitualDrawOptions) {
  const manifest = options.manifest;
  const puzzle = options.puzzle;
  if (Boolean(manifest) === Boolean(puzzle))
    throw new Error('Supply exactly one Daily Draw source: manifest or puzzle');
  const clock = options.clock ?? (() => new Date());
  const now = clock();
  const date = localDateKey(now);
  if (manifest && date.slice(0, 7) !== manifest.monthKey)
    throw new Error('Daily clock must match manifest month');
  const daily: DailyDrawIdentity = {
    date,
    monthKey: manifest?.monthKey ?? date.slice(0, 7),
    title: manifest?.title ?? puzzle!.title,
    piece: Number(date.slice(8)),
    total: daysInMonth(date.slice(0, 7)),
  };
  let state: DrawState = (options.enabled ?? false) ? (options.state ?? 'unplayed') : 'hidden';
  let stable: DrawState = state === 'revealing' ? 'unplayed' : state;
  let disposed = false;
  let mounted = false,
    busy = false,
    dateChanged = false;
  let interval: ReturnType<typeof setInterval> | undefined;
  let lastMinutes = countdown(now).minutes;
  const root = homeHost('gg-v4-ritual');
  const button = createCard({
    interactive: true,
    onClick: () => void press(),
  }) as HTMLButtonElement;
  button.classList.add('gg-v4-ritual-panel');
  applyTheme(button, 'moonlit-oxblood', 'dark');
  const live = el('span', { className: 'nl-grim-glimmer-visually-hidden' });
  live.setAttribute('aria-live', 'polite');
  live.setAttribute('aria-atomic', 'true');
  live.setAttribute('role', 'status');
  const halo = el('span', { className: 'gg-v4-ritual-halo' });
  const stars = el('span', { className: 'gg-v4-ritual-stars' });
  const field = svgNode('svg', { viewBox: '0 0 360 88', preserveAspectRatio: 'xMidYMid slice' });
  // Fixed, baked pattern; no random allocation or animated noise.
  for (const [x, y, r] of [
    [9, 23, 1],
    [43, 68, 1],
    [96, 12, 0.7],
    [130, 62, 1],
    [171, 28, 1],
    [205, 77, 0.7],
    [240, 12, 1],
    [279, 54, 1],
    [330, 22, 0.7],
    [354, 72, 1],
  ])
    field.append(svgNode('circle', { cx: String(x), cy: String(y), r: String(r) }));
  stars.append(field);
  const mini = el('span', { className: 'gg-v4-ritual-mini' });
  const rotor = el('span', { className: 'gg-v4-ritual-rotor' });
  const back = el('span', { className: 'gg-v4-ritual-back' });
  const front = el('span', { className: 'gg-v4-ritual-front' });
  if (manifest) {
    const art = createMonthArt(manifest, options.restoredDates, daily.date);
    art.element.setAttribute('aria-hidden', 'true');
    front.append(art.element);
  }
  const float = el('span', { className: 'gg-v4-ritual-float' }, [rotor]);
  rotor.append(back, front);
  mini.append(float);
  const eyebrow = el('span', { className: 'gg-v4-ritual-eyebrow', text: 'TONIGHT’S DRAW' });
  const phase = el('span', { className: 'gg-v4-ritual-phase' });
  const detail = el('span', { className: 'gg-v4-ritual-detail' });
  const streak = el('span', { className: 'gg-v4-ritual-streak' });
  const copy = el('span', { className: 'gg-v4-ritual-copy' }, [eyebrow, phase, detail, streak]);
  const chevron = el('span', { className: 'gg-v4-ritual-chevron', text: '›' });
  const sparkle = el('span', { className: 'gg-v4-ritual-sparkle' }, [star()]);
  [halo, stars, mini, copy, chevron, sparkle].forEach((node) =>
    node.setAttribute('aria-hidden', 'true'),
  );
  button.append(stars, halo, mini, copy, chevron, sparkle);
  root.append(button, live);
  const motion = ritualMotion(options.reducedMotion, () => {
    busy = false;
    state = stable;
    paint();
    refreshLoops();
  });
  const loops = createLoopMotion(
    () =>
      state === 'unplayed' && !busy
        ? [
            {
              node: float,
              frames: [
                { transform: 'translateY(0)' },
                { transform: 'translateY(-4px)' },
                { transform: 'translateY(0)' },
              ],
              duration: 6000,
            },
            {
              node: rotor,
              frames: [
                { transform: 'scale(1)' },
                { transform: 'scale(1.02)' },
                { transform: 'scale(1)' },
              ],
              duration: 4000,
            },
            {
              node: halo,
              frames: [{ opacity: 0.25 }, { opacity: 0.5 }, { opacity: 0.25 }],
              duration: 4000,
            },
            {
              node: sparkle,
              frames: [
                { transform: 'translateX(0)', opacity: 0 },
                { transform: 'translateX(0)', opacity: 0, offset: 0.9 },
                { transform: 'translateX(260px)', opacity: 0.7, offset: 0.95 },
                { transform: 'translateX(300px)', opacity: 0 },
              ],
              duration: 8000,
            },
          ]
        : [],
    options.reducedMotion,
  );
  function refreshLoops() {
    loops.setEnabled(false);
    if (mounted && !dateChanged && state === 'unplayed' && !busy) loops.setEnabled(true);
  }
  function paint() {
    const current = clock(),
      moon = approximateMoon(current),
      time = countdown(current);
    root.hidden = state === 'hidden';
    root.dataset.state = state;
    root.dataset.reducedMotion = String(motion.reduced());
    button.setAttribute(
      'aria-disabled',
      String(
        busy ||
          dateChanged ||
          (puzzle !== undefined &&
            (puzzle.action === 'unavailable' ||
              !(puzzle ? options.onOpenPuzzle : options.onBegin))) ||
          state === 'solved' ||
          state === 'revealing' ||
          state === 'hidden' ||
          (state !== 'unplayed' && !(puzzle ? options.onOpenPuzzle : options.onBegin)),
      ),
    );
    button.setAttribute('aria-busy', String(busy || state === 'revealing'));
    phase.textContent = moon.name;
    const action =
      state === 'unplayed'
        ? 'Tap to draw'
        : state === 'revealing'
          ? 'Revealing…'
          : state === 'in-progress'
            ? 'Continue'
            : state === 'solved'
              ? `NEXT DRAW IN ${time.hours}H ${time.remainder}M`
              : (puzzle ? options.onOpenPuzzle : options.onBegin)
                ? 'Begin'
                : 'Draw revealed';
    detail.textContent = dateChanged
      ? 'A new draw is ready.'
      : state === 'unplayed' || state === 'revealing'
        ? `Piece ${daily.piece} of ${daily.total} · ${action}`
        : `${daily.title} · Piece ${daily.piece} of ${daily.total} · ${action}`;
    if (puzzle)
      detail.textContent = dateChanged
        ? 'A new draw is ready.'
        : `${puzzle.title} · ${puzzle.action === 'unavailable' || !(puzzle ? options.onOpenPuzzle : options.onBegin) ? 'Unavailable' : puzzle.action}`;
    streak.hidden = Boolean(puzzle) || state !== 'solved' || (options.streak ?? 0) < 2;
    streak.textContent = puzzle ? '' : `${Math.trunc(options.streak ?? 0)}-night streak`;
    chevron.hidden =
      dateChanged ||
      (puzzle !== undefined &&
        (puzzle.action === 'unavailable' || !(puzzle ? options.onOpenPuzzle : options.onBegin))) ||
      (state !== 'unplayed' && !(puzzle ? options.onOpenPuzzle : options.onBegin)) ||
      !['unplayed', 'revealed-unstarted', 'in-progress'].includes(state);
    back.replaceChildren(
      moonEmblem(
        moon.bucket,
        state === 'in-progress' ? (options.progress ?? 0) : 0,
        state === 'solved',
      ),
    );
    const frontShowing = !puzzle && !['unplayed', 'hidden'].includes(state);
    const scrub =
      state === 'revealing'
        ? Math.min(1, Math.max(0, options.revealProgress ?? 0.5))
        : frontShowing
          ? 1
          : 0;
    rotor.style.transform = motion.reduced() ? 'none' : `rotateY(${scrub * 180}deg)`;
    back.style.opacity = motion.reduced() ? String(1 - scrub) : '1';
    front.style.opacity = motion.reduced() ? String(scrub) : '1';
    // Progress and solved seals stay visible above the face-up month image.
    front.querySelector('.gg-v4-ritual-emblem')?.remove();
    if (state === 'in-progress' || state === 'solved')
      front.append(moonEmblem(moon.bucket, options.progress ?? 0, state === 'solved'));
    button.setAttribute(
      'aria-label',
      dateChanged
        ? 'A new draw is ready.'
        : state === 'solved'
          ? `Solved. Next draw in ${time.hours} hours ${time.remainder} minutes.`
          : state === 'unplayed'
            ? `Tonight’s draw, ${moon.name}. Tap to draw. Piece ${daily.piece} of ${daily.total}.`
            : state === 'revealing'
              ? `Tonight’s draw, ${moon.name}. Revealing.`
              : `Drawn: ${daily.title}. Piece ${daily.piece} of ${daily.total}. ${action}.`,
    );
    if (puzzle)
      button.setAttribute(
        'aria-label',
        dateChanged
          ? 'A new draw is ready.'
          : `Tonight’s draw, ${moon.name}. ${detail.textContent}.`,
      );
  }
  async function press() {
    if (
      !mounted ||
      (puzzle !== undefined &&
        (puzzle.action === 'unavailable' || !(puzzle ? options.onOpenPuzzle : options.onBegin))) ||
      busy ||
      dateChanged ||
      !['unplayed', 'revealed-unstarted', 'in-progress'].includes(state)
    )
      return;
    // Check at activation too; a tab can sleep across local midnight.
    if (localDateKey(clock()) !== daily.date) {
      updateClock();
      return;
    }
    if (options.haptics) options.light?.();
    if (state === 'unplayed' && !puzzle) {
      busy = true;
      state = 'revealing';
      paint();
      refreshLoops();
      if (options.sound) options.flipSound?.();
      rotor.style.transform = motion.reduced() ? 'none' : 'rotateY(180deg)';
      back.style.opacity = motion.reduced() ? '0' : '1';
      front.style.opacity = '1';
      if (motion.reduced()) void motion.run(back, [{ opacity: 1 }, { opacity: 0 }], 150);
      const finished = await motion.run(
        motion.reduced() ? front : rotor,
        motion.reduced()
          ? [{ opacity: 0 }, { opacity: 1 }]
          : [{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(180deg)' }],
        motion.reduced() ? 150 : 500,
      );
      if (!finished || !mounted || disposed) return;
      if (localDateKey(clock()) !== daily.date) {
        updateClock();
        return;
      }
      busy = false;
      stable = state = 'revealed-unstarted';
      paint();
      if (options.haptics) options.medium?.();
      live.textContent = `Drawn: ${daily.title}. Piece ${daily.piece} of ${daily.total}. Begin.`;
      options.onReveal?.(daily);
    } else {
      if (!(puzzle ? options.onOpenPuzzle : options.onBegin)) return;
      busy = true;
      paint();
      refreshLoops();
      const finished = await motion.run(
        button,
        motion.reduced()
          ? [{ opacity: 1 }, { opacity: 0.1 }]
          : [
              { opacity: 1, transform: 'scale(1)' },
              { opacity: 0, transform: 'scale(1.03)' },
            ],
        motion.reduced() ? 150 : 350,
      );
      busy = false;
      paint();
      if (finished && mounted && !disposed && localDateKey(clock()) === daily.date) {
        if (puzzle) options.onOpenPuzzle?.();
        else options.onBegin?.(daily);
      } else if (mounted) updateClock();
    }
  }
  function updateClock() {
    const current = clock(),
      date = localDateKey(current),
      time = countdown(current);
    if (date !== daily.date && !dateChanged) {
      motion.cancel();
      busy = false;
      dateChanged = true;
      state = stable;
      paint();
      refreshLoops();
      live.textContent = 'A new draw is ready.';
      options.onDayChange?.(date);
      return;
    }
    if (time.minutes !== lastMinutes) {
      lastMinutes = time.minutes;
      paint();
      if (state === 'solved' && !dateChanged)
        live.textContent = `Next draw in ${time.hours} hours ${time.remainder} minutes.`;
    }
  }
  root.start = () => {
    if (mounted || disposed || state === 'hidden') return;
    mounted = true;
    motion.mount();
    paint();
    loops.mount();
    interval = setInterval(updateClock, 60000);
    document.addEventListener('visibilitychange', updateClock);
  };
  root.cleanup = () => {
    disposed = true;
    mounted = false;
    motion.dispose();
    loops.dispose();
    clearInterval(interval);
    document.removeEventListener('visibilitychange', updateClock);
  };
  paint();
  return root;
}
