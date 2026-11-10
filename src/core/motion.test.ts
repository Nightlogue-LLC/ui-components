import { afterEach, expect, it, vi } from 'vitest';
import { animateSheet, SHEET_MOTION } from './motion.js';
import { createBottomSheet } from '../components/bottom-sheet/index.js';
import { openDialog, closeDialog } from '../components/dialog/index.js';

afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});
it('uses the same reversible curve and skips motion for user or system preferences', () => {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('max-width') }));
  const node = document.createElement('div');
  const animate = vi.fn<(frames: Keyframe[], options: KeyframeAnimationOptions) => Animation>();
  node.animate = animate;
  animateSheet(node, 'enter');
  animateSheet(node, 'exit');
  expect(animate.mock.calls[0]![0]).toEqual([...animate.mock.calls[1]![0]].reverse());
  expect(animate.mock.calls[0]![1]).toEqual({ ...SHEET_MOTION, fill: 'both' });
  animate.mockClear();
  animateSheet(node, 'enter', { animations: false });
  vi.stubGlobal('matchMedia', () => ({ matches: true }));
  animateSheet(node, 'enter');
  expect(animate).not.toHaveBeenCalled();
});
it('keeps a sheet modal until exit finishes and reports a repeated close once', async () => {
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
  const onClose = vi.fn();
  const sheet = createBottomSheet({ title: 'Completion', onClose });
  let resolve!: () => void;
  const finished = new Promise<void>((done) => {
    resolve = done;
  });
  const cancel = vi.fn();
  sheet.animate = vi.fn().mockReturnValue({ finished, cancel });
  document.body.append(sheet);
  openDialog(sheet);
  closeDialog(sheet);
  closeDialog(sheet);
  expect(sheet.hasAttribute('open')).toBe(true);
  expect(onClose).not.toHaveBeenCalled();
  resolve();
  await finished;
  await new Promise((done) => setTimeout(done, 0));
  expect(sheet.hasAttribute('open')).toBe(false);
  expect(onClose).toHaveBeenCalledTimes(1);
});
it('consumes its Back entry before invoking a navigation callback', async () => {
  const onClose = vi.fn();
  const sheet = createBottomSheet({ title: 'Completion', animations: false, onClose });
  document.body.append(sheet);
  const before = window.history.state as unknown;
  openDialog(sheet, { history: true });
  expect(window.history.state).toHaveProperty('nlModal');
  closeDialog(sheet);
  await vi.waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  expect(window.history.state).toEqual(before);
});
