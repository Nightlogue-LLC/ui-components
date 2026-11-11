import { createIconButton } from '../../components/icon-button/index.js';
import { deckStar as star, deckElement as el } from './deck-dom.js';
import {
  createTarotDeckCard,
  updateTarotDeckCard,
  type TarotCard,
  type TarotCardState,
} from './tarot-card.js';
import {
  DECK_MOTION,
  fan,
  dragPoses,
  mix,
  transform,
  dismisses,
  springDisplacement,
  type Pose,
} from './deck-model.js';
export interface TarotDeckOptions {
  cards: readonly [TarotCard, TarotCard, TarotCard];
  initialCardId?: string;
  reducedMotion?: boolean;
  animations?: boolean;
  firstVisit?: boolean;
  launch?: 'cold' | 'return';
  haptics?: boolean;
  tick?: () => void;
  onCardChange?: (id: string) => void;
  onActivate: (id: string) => void;
  onLocked?: (id: string) => void;
}
export interface TarotDeckState {
  cards: readonly TarotCardState[];
  selectedId?: string;
  haptics?: boolean;
  reducedMotion?: boolean;
  animations?: boolean;
  active?: boolean;
}
/** Pointer-owned, finite three-card deck; no document gesture listeners or physics runtime. */
export function createTarotDeck(options: TarotDeckOptions) {
  if (options.cards.length !== 3 || new Set(options.cards.map((card) => card.id)).size !== 3)
    throw new Error('Provide exactly three unique tarot cards');
  let data = options.cards.map((card) => ({ ...card }));
  const initial =
    options.initialCardId === undefined
      ? 0
      : data.findIndex((card) => card.id === options.initialCardId);
  if (initial < 0) throw new Error('Unknown initial card identity');
  let haptics = options.haptics === true,
    animations = options.animations !== false,
    explicitReduced = options.reducedMotion === true,
    active = true,
    disposed = false;
  const root = el('section', { className: 'nl-grim-glimmer-v4 gg-v4-deck gg-v4-scope' });
  root.setAttribute('role', 'group');
  root.setAttribute('aria-roledescription', 'deck');
  root.setAttribute('aria-label', 'Puzzle deck');
  const stage = el('div', { className: 'gg-v4-deck-stage' });
  const live = el('span', { className: 'nl-grim-glimmer-visually-hidden' });
  live.setAttribute('role', 'status');
  live.setAttribute('aria-live', 'polite');
  live.setAttribute('aria-atomic', 'true');
  const indicators = el('div', { className: 'gg-v4-deck-indicators' });
  indicators.setAttribute('role', 'group');
  indicators.setAttribute('aria-label', 'Choose a card');
  const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const reduced = () => !animations || explicitReduced || media?.matches === true;
  let selected = initial,
    mounted = false,
    busy = false,
    version = 0,
    nudge: ReturnType<typeof setTimeout> | undefined,
    nudged = false,
    interacted = false;
  let drag:
    | {
        id: number;
        x: number;
        y: number;
        lastX: number;
        lastT: number;
        dx: number;
        velocity: number;
        armed: boolean;
        horizontal: boolean;
        max: number;
        target: HTMLElement;
      }
    | undefined;
  let suppressClick = false;
  const jobs = new Map<HTMLElement, Animation>();
  const cards = data.map((card, index) =>
    createTarotDeckCard({
      ...card,
      onActivate: () => activate(index),
      onLocked: () => activate(index),
    }),
  );
  const buttons = cards.map((card) => card.querySelector<HTMLButtonElement>('.gg-v4-deck-hit')!);
  const dots = cards.map((_, index) =>
    createIconButton({
      label: `Show card ${index + 1}`,
      icon: star(),
      onClick: () => {
        if (!available()) return;
        interact();
        void cycle(index, index === selected ? 1 : Math.sign(index - selected), false);
      },
    }),
  );
  indicators.append(...dots);
  const ground = el('span', { className: 'gg-v4-deck-ground-shadow' });
  ground.setAttribute('aria-hidden', 'true');
  stage.append(ground, ...cards);
  const sources = new Set(
    data.map((card) => card.preloadSrc).filter((src): src is string => Boolean(src)),
  );
  for (const source of sources) {
    const preload = document.createElement('link');
    preload.rel = 'preload';
    preload.as = 'image';
    preload.href = source;
    root.append(preload);
  }
  root.append(stage, indicators, live);
  const tick = () => {
    if (haptics && available()) options.tick?.();
  };
  const width = () => cards[selected]!.getBoundingClientRect().width || 250;
  const order = () => [selected, (selected + 1) % 3, (selected + 2) % 3];
  function stop(node: HTMLElement) {
    jobs.get(node)?.cancel();
    jobs.delete(node);
  }
  function stopAll() {
    for (const node of [...jobs.keys()]) stop(node);
  }
  function animate(
    node: HTMLElement,
    frames: Keyframe[],
    duration: number,
    extra: KeyframeAnimationOptions = {},
  ) {
    stop(node);
    if (!animations || !available() || typeof node.animate !== 'function') return undefined;
    const job = node.animate(frames, { duration, easing: 'ease-out', fill: 'both', ...extra });
    jobs.set(node, job);
    void job.finished.then(
      () => {
        if (jobs.get(node) === job) {
          jobs.delete(node);
          job.cancel();
        }
      },
      () => {
        if (jobs.get(node) === job) jobs.delete(node);
      },
    );
    return job;
  }
  function frame(pose: Pose): Keyframe {
    return { transform: transform(pose), opacity: pose.opacity };
  }
  function set(node: HTMLElement, pose: Pose) {
    node.style.transform = transform(pose);
    node.style.opacity = String(pose.opacity);
  }
  function paint() {
    root.dataset.reducedMotion = String(reduced());
    order().forEach((index, depth) => {
      const card = cards[index]!;
      set(card, fan(depth, reduced()));
      card.style.zIndex = String(3 - depth);
      card.dataset.top = String(depth === 0);
      delete card.dataset.dragging;
      card.inert = depth !== 0;
      card.setAttribute('aria-hidden', String(depth !== 0));
      buttons[index]!.tabIndex = depth === 0 ? 0 : -1;
    });
    dots.forEach((button, index) =>
      button.setAttribute('aria-pressed', String(index === selected)),
    );
    const card = data[selected]!;
    live.textContent = `Card ${selected + 1} of 3: ${card.title}, ${card.locked ? 'locked puzzle' : card.inProgress ? 'continue' : 'playable'}`;
    root.inert = !active;
  }
  function available() {
    return mounted && !disposed && active && root.isConnected && !document.hidden;
  }
  function interact() {
    release();
    interacted = true;
    clearTimeout(nudge);
    stopAll();
    if (busy) {
      version++;
      busy = false;
    }
    paint();
  }
  function release() {
    const current = drag;
    drag = undefined;
    if (current?.target.hasPointerCapture?.(current.id))
      current.target.releasePointerCapture(current.id);
  }
  async function wait(job: Animation | undefined) {
    if (job) await job.finished.catch(() => undefined);
  }
  async function cycle(target = (selected + 1) % 3, direction = 1, focus = false, dx = 0) {
    if (!Number.isInteger(target) || target < 0 || target >= 3)
      throw new Error('Unknown card index');
    if (!available() || busy || target === selected) return;
    clearTimeout(nudge);
    const token = ++version;
    busy = true;
    const old = selected,
      oldOrder = order(),
      w = width(),
      positions = dragPoses(dx, w, reduced());
    stopAll();
    if (reduced()) {
      cards
        .filter((_, index) => index !== old && index !== target)
        .forEach((card) => {
          card.style.opacity = '0';
        });
      const incoming = cards[target]!;
      incoming.style.zIndex = '4';
      incoming.style.opacity = '1';
      animate(cards[old]!, [{ opacity: 1 }, { opacity: 0 }], DECK_MOTION.fade);
      await wait(animate(incoming, [{ opacity: 0 }, { opacity: 1 }], DECK_MOTION.fade));
      if (!available() || version !== token) return;
      selected = target;
      paint();
    } else {
      const outgoing = cards[old]!;
      set(outgoing, {
        ...positions[0]!,
        x: direction * w * 2,
        rotation: direction * 28,
        opacity: 0,
      });
      const flight = animate(
        outgoing,
        [
          frame(positions[0]!),
          frame({ ...positions[0]!, x: direction * w * 2, rotation: direction * 28, opacity: 0 }),
        ],
        DECK_MOTION.fly,
      );
      oldOrder.slice(1).forEach((index, i) => {
        const depth = (index - target + 3) % 3;
        set(cards[index]!, fan(depth));
        animate(cards[index]!, [frame(positions[i + 1]!), frame(fan(depth))], DECK_MOTION.fly);
      });
      await wait(flight);
      if (!available() || version !== token) return;
      selected = target;
      paint();
      const depth = (old - selected + 3) % 3;
      await wait(
        animate(
          outgoing,
          [frame({ ...fan(depth), scale: fan(depth).scale * 0.94, opacity: 0 }), frame(fan(depth))],
          DECK_MOTION.reenter,
        ),
      );
    }
    if (!available() || version !== token) return;
    busy = false;
    paint();
    tick();
    options.onCardChange?.(data[selected]!.id);
    if (focus) buttons[selected]!.focus({ preventScroll: true });
  }
  function activate(index: number) {
    if (!available()) return;
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    if (index !== selected || busy) return;
    interact();
    const card = data[index]!;
    if (!card.locked) options.onActivate(card.id);
    else {
      tick();
      options.onLocked?.(card.id);
      if (!reduced())
        animate(
          cards[index]!,
          [frame(fan(0)), frame({ ...fan(0), x: -3 }), frame({ ...fan(0), x: 3 }), frame(fan(0))],
          200,
        );
    }
  }
  function down(event: PointerEvent) {
    if (!available() || event.button !== 0 || busy || drag || event.isPrimary === false) return;
    interact();
    suppressClick = false;
    const target = event.currentTarget as HTMLElement;
    drag = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      lastX: event.clientX,
      lastT: event.timeStamp,
      dx: 0,
      velocity: 0,
      armed: true,
      horizontal: false,
      max: 0,
      target,
    };
    if (event.isTrusted) target.setPointerCapture?.(event.pointerId);
  }
  function move(event: PointerEvent) {
    if (drag?.id !== event.pointerId) return;
    const dx = event.clientX - drag.x,
      dy = event.clientY - drag.y;
    if (!drag.horizontal) {
      if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) {
        suppressClick = true;
        release();
        paint();
        return;
      }
      if (Math.abs(dx) < 8) return;
      drag.horizontal = true;
      if (event.isTrusted) drag.target.setPointerCapture?.(drag.id);
    }
    event.preventDefault();
    const elapsed = event.timeStamp - drag.lastT;
    if (elapsed > 0) {
      drag.velocity = ((event.clientX - drag.lastX) / elapsed) * 1000;
      drag.lastT = event.timeStamp;
      drag.lastX = event.clientX;
    }
    drag.dx = dx;
    drag.max = Math.max(drag.max, Math.abs(dx));
    const crossed = dismisses(dx, width(), drag.velocity);
    if (crossed && drag.armed) {
      tick();
      drag.armed = false;
    } else if (Math.abs(dx) <= 0.3 * width() && Math.abs(drag.velocity) <= 500) drag.armed = true;
    order().forEach((index, depth) => {
      cards[index]!.dataset.dragging = 'true';
      set(cards[index]!, dragPoses(dx, width(), reduced())[depth]!);
    });
  }
  function snap(dx: number) {
    const poses = dragPoses(dx, width(), reduced());
    paint();
    if (reduced()) return;
    order().forEach((index, depth) => {
      const frames = Array.from({ length: 31 }, (_, i) =>
        frame(
          mix(
            fan(depth),
            poses[depth]!,
            springDisplacement((i * DECK_MOTION.spring) / 30000),
            false,
          ),
        ),
      );
      animate(cards[index]!, frames, DECK_MOTION.spring, { easing: 'linear' });
    });
  }
  function up(event: PointerEvent) {
    if (drag?.id !== event.pointerId) return;
    const current = drag,
      dx = event.clientX - current.x;
    const velocity = event.timeStamp - current.lastT > 100 ? 0 : current.velocity;
    release();
    if (!current.horizontal || current.max < 8) {
      suppressClick = Math.abs(dx) >= 8;
      paint();
      return;
    }
    suppressClick = true;
    if (dismisses(dx, width(), velocity))
      void cycle((selected + 1) % 3, Math.sign(dx) || 1, false, dx);
    else snap(dx);
  }
  function cancel() {
    if (!drag) return;
    const dx = drag.dx;
    release();
    suppressClick = true;
    snap(dx);
  }
  function keyboard(event: KeyboardEvent) {
    if (!available()) return;
    if (event.key === 'Enter' || event.key === ' ') {
      suppressClick = false;
      return;
    }

    if (!['ArrowLeft', 'ArrowRight'].includes(event.key) || !stage.contains(event.target as Node))
      return;
    event.preventDefault();
    if (busy) return;
    interact();
    void cycle(
      (selected + (event.key === 'ArrowRight' ? 1 : 2)) % 3,
      event.key === 'ArrowRight' ? -1 : 1,
      true,
    );
  }
  function idle() {
    if (
      !mounted ||
      interacted ||
      nudged ||
      reduced() ||
      document.hidden ||
      options.firstVisit !== true
    )
      return;
    nudged = true;
    const top = cards[selected]!;
    animate(top, [frame(fan(0)), frame({ ...fan(0), x: 14, rotation: 2 }), frame(fan(0))], 650);
  }
  function deal() {
    if (!available() || options.launch === 'return') return;
    if (reduced()) {
      animate(stage, [{ opacity: 0 }, { opacity: 1 }], 150);
      return;
    }
    order().forEach((index, depth) =>
      animate(cards[index]!, [frame(fan(0)), frame(fan(depth))], DECK_MOTION.deal, {
        delay: depth * DECK_MOTION.stagger,
      }),
    );
    const sheen = cards[selected]!.querySelector<HTMLElement>('.gg-v4-deck-sheen')!;
    animate(
      sheen,
      [
        { transform: 'translateX(-120%)', opacity: 0 },
        { transform: 'translateX(0)', opacity: 0.6 },
        { transform: 'translateX(120%)', opacity: 0 },
      ],
      900,
      { delay: 700 },
    );
  }
  function changed() {
    if (drag) suppressClick = true;
    version++;
    busy = false;
    release();
    stopAll();
    paint();
  }
  function visibility() {
    if (document.hidden) {
      clearTimeout(nudge);
      changed();
    }
  }
  function click(event: MouseEvent) {
    if (suppressClick) {
      event.preventDefault();
      event.stopImmediatePropagation();
      suppressClick = false;
    }
  }
  const observer = new MutationObserver(() => {
    if (mounted && !root.isConnected) dispose();
  });
  function dispose() {
    if (disposed) return;
    disposed = true;
    root.inert = true;
    mounted = false;
    version++;
    busy = false;
    clearTimeout(nudge);
    release();
    stopAll();
    observer.disconnect();
    buttons.forEach((button) => {
      button.removeEventListener('pointerdown', down);
      button.removeEventListener('pointermove', move);
      button.removeEventListener('pointerup', up);
      button.removeEventListener('pointercancel', cancel);
      button.removeEventListener('lostpointercapture', cancel);
      button.removeEventListener('click', click, true);
    });
    stage.removeEventListener('keydown', keyboard);
    media?.removeEventListener('change', changed);
    document.removeEventListener('visibilitychange', visibility);
  }
  paint();
  return {
    element: root,
    cards,
    selected: () => data[selected]!.id,
    update(state: TarotDeckState) {
      if (disposed) return;
      if (
        state.cards.length !== 3 ||
        state.cards.some((card, i) => card.id !== data[i]!.id || card.label?.trim() === '')
      )
        throw new Error('State must preserve the three card identities and order');
      const next =
        state.selectedId === undefined
          ? selected
          : data.findIndex((card) => card.id === state.selectedId);
      if (next < 0) throw new Error('Unknown selected card identity');
      const transferFocus = next !== selected && cards[selected]!.contains(document.activeElement);
      data = data.map((card, i) => ({
        ...card,
        locked: state.cards[i]!.locked ?? false,
        inProgress: state.cards[i]!.inProgress ?? false,
        label: state.cards[i]!.label,
      }));
      if (state.haptics !== undefined) haptics = state.haptics;
      if (state.reducedMotion !== undefined) explicitReduced = state.reducedMotion;
      if (state.animations !== undefined) animations = state.animations;
      if (state.active !== undefined) active = state.active;
      selected = next;
      clearTimeout(nudge);
      cards.forEach((card, i) => updateTarotDeckCard(card, data[i]!));
      changed();
      if (transferFocus && available()) buttons[selected]!.focus({ preventScroll: true });
    },
    cycle: (id: string) => {
      const index = data.findIndex((card) => card.id === id);
      if (index < 0) throw new Error('Unknown card identity');
      return cycle(index);
    },
    mount() {
      if (mounted || disposed) return;
      if (!root.isConnected) throw new Error('Mount the deck after attaching it to the document');
      mounted = true;
      observer.observe(document.documentElement, { childList: true, subtree: true });
      buttons.forEach((button) => {
        button.addEventListener('pointerdown', down);
        button.addEventListener('pointermove', move);
        button.addEventListener('pointerup', up);
        button.addEventListener('pointercancel', cancel);
        button.addEventListener('lostpointercapture', cancel);
        button.addEventListener('click', click, true);
      });
      stage.addEventListener('keydown', keyboard);
      media?.addEventListener('change', changed);
      document.addEventListener('visibilitychange', visibility);
      deal();
      if (options.firstVisit) nudge = setTimeout(idle, DECK_MOTION.nudgeDelay);
    },
    dispose,
  };
}
