import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createGuidedTutorialDialog,
  destroyGuidedTutorialDialog,
  type TutorialLesson,
} from '../src/projects/grim-glimmer/index.js';
import { openDialog, closeDialog } from '../src/components/dialog/index.js';

let original: PropertyDescriptor | undefined;
const motions: {
  cancel: ReturnType<typeof vi.fn>;
  node: HTMLElement;
  timing: KeyframeAnimationOptions;
}[] = [];
beforeEach(() => {
  motions.length = 0;
  vi.stubGlobal('matchMedia', () => Object.assign(new EventTarget(), { matches: false }));
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'animate');
  Object.defineProperty(HTMLElement.prototype, 'animate', {
    configurable: true,
    value: function (this: HTMLElement, _frames: Keyframe[], timing: KeyframeAnimationOptions) {
      const cancel = vi.fn();
      motions.push({ cancel, node: this, timing });
      return { cancel, finished: new Promise<void>(() => undefined) } as unknown as Animation;
    },
  });
});
afterEach(() => {
  document.querySelectorAll<HTMLDialogElement>('dialog').forEach(destroyGuidedTutorialDialog);
  document.body.replaceChildren();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (original) Object.defineProperty(HTMLElement.prototype, 'animate', original);
  else Reflect.deleteProperty(HTMLElement.prototype, 'animate');
});
const lessons: readonly TutorialLesson[] = [
  {
    title: 'Practice',
    instruction: 'Try each state.',
    boardLabel: 'Example row',
    size: 3,
    rowOnly: true,
    cells: ['empty', 'fixed', 'empty'],
    highlights: [0],
    practice: {
      index: 0,
      sequence: [
        { state: 'tentative', instruction: 'Possible tent.' },
        { state: 'placed', instruction: 'Confirmed tent.' },
        { state: 'empty', instruction: 'Cell cleared.' },
      ],
    },
  },
  {
    title: 'Ready',
    instruction: 'Start when ready.',
    boardLabel: 'Static example',
    size: 1,
    cells: ['fixed'],
  },
];
function setup(options: { editorial?: boolean; reducedMotion?: boolean } = {}) {
  const done = vi.fn();
  const dialog = createGuidedTutorialDialog({
    title: 'How to Play',
    lessons,
    presentation: options.editorial === false ? undefined : 'editorial',
    reducedMotion: options.reducedMotion,
    stateLabels: { fixed: 'tree', tentative: 'tentative tent', placed: 'confirmed tent' },
    onDone: done,
  });
  document.body.append(dialog);
  openDialog(dialog);
  return {
    dialog,
    done,
    next: dialog.querySelector<HTMLButtonElement>('.nl-dialog__actions .nl-button:last-child')!,
  };
}

describe('supported editorial guided tutorial', () => {
  it('uses the supplied lesson count, labels and three-tap practice gate', () => {
    const { dialog, next, done } = setup({ reducedMotion: true });
    expect(dialog.querySelector('.gg-v4-step-dots')!.textContent).toBe('Step 1 of 2');
    expect(dialog.querySelectorAll('.gg-v4-step-dot')).toHaveLength(2);
    expect(dialog.querySelector('[data-index="1"]')!.getAttribute('aria-label')).toContain('tree');
    const target = dialog.querySelector<HTMLButtonElement>('[data-index="0"]')!;
    expect(next.disabled).toBe(true);
    dialog.querySelector<HTMLButtonElement>('[data-index="2"]')!.click();
    expect(next.disabled).toBe(true);
    for (const [index, state] of ['tentative', 'placed', 'empty'].entries()) {
      target.click();
      expect(target.classList.contains(`nl-grim-glimmer-board__cell--${state}`)).toBe(true);
      expect(next.disabled).toBe(index < 2);
    }
    expect(document.activeElement).toBe(next);
    next.click();
    expect(dialog.querySelector('.gg-v4-step-dots')!.textContent).toBe('Step 2 of 2');
    expect(dialog.querySelectorAll('.gg-v4-step-dot[data-current="true"]')).toHaveLength(1);
    next.click();
    expect(done).toHaveBeenCalledExactlyOnceWith('finish');
  });
  it('keeps legacy counter presentation available', () => {
    const { dialog } = setup({ editorial: false });
    expect(dialog.querySelector<HTMLElement>('.nl-grim-glimmer-tutorial__step')!.hidden).toBe(
      false,
    );
    expect(dialog.querySelector('.gg-v4-step-dots')).toBeNull();
    expect(dialog.classList.contains('nl-grim-glimmer-guided-tutorial--editorial')).toBe(false);
  });
  it('starts the shared pulse only on open, then cancels it on close and on terminal teardown', () => {
    const done = vi.fn();
    const dialog = createGuidedTutorialDialog({
      title: 'How to Play',
      lessons,
      presentation: 'editorial',
      onDone: done,
    });
    expect(motions).toHaveLength(0);
    document.body.append(dialog);
    openDialog(dialog);
    expect(motions).toHaveLength(1);
    expect(motions[0]!.timing.duration).toBe(1600);
    closeDialog(dialog);
    expect(motions[0]!.cancel).toHaveBeenCalled();
    expect(done).toHaveBeenCalledExactlyOnceWith('skip');
    openDialog(dialog);
    expect(motions).toHaveLength(2);
    destroyGuidedTutorialDialog(dialog);
    expect(motions[1]!.cancel).toHaveBeenCalled();
    expect(done).toHaveBeenCalledOnce();
    expect(dialog.isConnected).toBe(false);
    expect(() => openDialog(dialog)).toThrow();
  });
  it('releases the pulse on removal without recording a skip or finish', async () => {
    const { dialog, done } = setup();
    const active = motions[0]!;
    dialog.remove();
    await Promise.resolve();
    await Promise.resolve();
    expect(active.cancel).toHaveBeenCalled();
    expect(done).not.toHaveBeenCalled();
    dialog.querySelector<HTMLButtonElement>('.nl-dialog__actions .nl-button')!.click();
    expect(done).not.toHaveBeenCalled();
  });
  it('clones an app illustration without injecting a zoom lesson or parsing markup', () => {
    const illustration = document.createElement('figure');
    illustration.textContent = 'App-authored visual';
    const dialog = createGuidedTutorialDialog({
      title: '<How>',
      lessons: [{ ...lessons[1]!, title: '<Example>', illustration }],
      presentation: 'editorial',
      onDone: vi.fn(),
    });
    document.body.append(dialog);
    openDialog(dialog);
    expect(dialog.querySelector('how, example')).toBeNull();
    expect(dialog.querySelector('figure')?.textContent).toBe('App-authored visual');
    expect(dialog.querySelector('figure')).not.toBe(illustration);
    expect(illustration.parentElement).toBeNull();
    expect(dialog.querySelector('.gg-v4-step-dots')!.textContent).toBe('Step 1 of 1');
    expect(dialog.textContent).not.toContain('two fingers');
  });
  it.each([{ reducedMotion: true }, { animations: false }])(
    'renders static guidance with motion disabled by %o',
    (options) => {
      const dialog = createGuidedTutorialDialog({
        title: 'How to Play',
        lessons,
        presentation: 'editorial',
        ...options,
        onDone: vi.fn(),
      });
      document.body.append(dialog);
      openDialog(dialog);
      expect(dialog.querySelector('.nl-grim-glimmer-tutorial-ring')).not.toBeNull();
      expect(motions).toHaveLength(0);
      expect(dialog.dataset.reducedMotion).toBe('true');
    },
  );
});
