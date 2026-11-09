import { afterEach, describe, expect, it, vi } from 'vitest';
import { openDialog } from '../../components/dialog/index.js';
import { createGuidedTutorialDialog } from './guided-tutorial.js';
import { TUTORIAL_LESSONS } from '../../../stories/projects/grim-glimmer/tutorial-lessons.js';

afterEach(() => document.body.replaceChildren());

function setup(initialLesson = 0) {
  const onDone = vi.fn();
  const dialog = createGuidedTutorialDialog({
    title: 'How to play',
    lessons: TUTORIAL_LESSONS,
    initialLesson,
    onDone,
  });
  document.body.append(dialog);
  openDialog(dialog);
  const actions = [...dialog.querySelectorAll<HTMLButtonElement>('.nl-dialog__actions button')];
  return { dialog, onDone, skip: actions[0]!, back: actions[1]!, next: actions[2]! };
}

describe('guided tutorial', () => {
  it('starts with one visible row and two highlighted spires', () => {
    const { dialog, back } = setup();
    expect(dialog.querySelectorAll('.nl-grim-glimmer-board__cell')).toHaveLength(5);
    expect(dialog.querySelectorAll('[data-highlight-tone="guidance"]')).toHaveLength(2);
    expect(back.hidden).toBe(true);
  });

  it('requires three taps on the target, announces each state and retains completion on Back', () => {
    const { dialog, back, next } = setup();
    next.click();
    const target = dialog.querySelector<HTMLButtonElement>('[data-index="0"]')!;
    const another = dialog.querySelector<HTMLButtonElement>('[data-index="2"]')!;
    expect(next.disabled).toBe(true);
    another.click();
    expect(next.disabled).toBe(true);
    for (const [index, state] of ['tentative', 'placed', 'empty'].entries()) {
      target.click();
      expect(target.classList.contains(`nl-grim-glimmer-board__cell--${state}`)).toBe(true);
      expect(next.disabled).toBe(index < 2);
    }
    expect(document.activeElement).toBe(next);
    expect(dialog.querySelector('[role="status"]')!.textContent).toContain('Cell cleared');
    next.click();
    expect(dialog.querySelectorAll('.nl-grim-glimmer-board__cell')).toHaveLength(25);
    back.click();
    expect(next.disabled).toBe(false);
    expect(dialog.querySelector('[role="status"]')!.textContent).toContain('Cell cleared');
  });

  it('keeps practice local to each instance and leaves lesson data unchanged', () => {
    const original = JSON.stringify(TUTORIAL_LESSONS);
    const first = setup(1);
    first.dialog.querySelector<HTMLButtonElement>('[data-index="0"]')!.click();
    first.skip.click();
    const second = setup(1);
    expect(second.next.disabled).toBe(true);
    expect(second.dialog.querySelector('[data-index="0"]')!.getAttribute('aria-label')).toContain(
      'empty',
    );
    expect(JSON.stringify(TUTORIAL_LESSONS)).toBe(original);
  });

  it('marks the count clue and its whole row/column as an error', () => {
    const row = setup(5);
    expect(row.dialog.querySelectorAll('[data-highlight-tone="error"]')).toHaveLength(6);
    row.skip.click();
    const column = setup(6);
    expect(column.dialog.querySelectorAll('[data-highlight-tone="error"]')).toHaveLength(6);
  });

  it('Begin completes; Escape and Skip dismiss incomplete practice and restore focus', () => {
    const trigger = document.createElement('button');
    document.body.append(trigger);
    trigger.focus();
    const last = setup(7);
    expect(last.next.textContent).toBe('Begin');
    last.next.click();
    expect(last.onDone).toHaveBeenCalledExactlyOnceWith('finish');
    expect(document.activeElement).toBe(trigger);
    const practice = setup(1);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(practice.onDone).toHaveBeenCalledExactlyOnceWith('skip');
    const skipped = setup(1);
    skipped.skip.click();
    expect(skipped.onDone).toHaveBeenCalledExactlyOnceWith('skip');
  });
});
