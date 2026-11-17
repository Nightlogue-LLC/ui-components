import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createAssistancePanel,
  createAssistanceAnnouncer,
  createBoard,
  updateBoard,
  createCluedBoard,
  updateCluedBoard,
  showAssistanceCue,
  createGameControlRow,
  type AssistancePanelState,
  type RevealPresentation,
} from '../src/projects/grim-glimmer/index.js';

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

const ready: AssistancePanelState = {
  nudge: { status: 'ready' },
  explain: { status: 'ready' },
  reveal: { status: 'ready', allowance: { kind: 'free', remaining: 3, total: 3 } },
};
function setup(state: AssistancePanelState = ready) {
  const callbacks = {
    onNudge: vi.fn(),
    onExplain: vi.fn(),
    onReveal: vi.fn(),
    onGuidanceDone: vi.fn(),
  };
  const panel = createAssistancePanel({ ...state, ...callbacks });
  document.body.append(panel.element);
  const button = (name: string) =>
    [...panel.element.querySelectorAll('button')].find((b) => b.textContent === name)!;
  const tier = (name: string) => panel.element.querySelector<HTMLElement>(`[data-tier="${name}"]`)!;
  const status = panel.element.querySelector('[role="status"]')!;
  const describedText = (b: HTMLElement) =>
    (b.getAttribute('aria-describedby') ?? '')
      .split(' ')
      .filter(Boolean)
      .map((id) => document.getElementById(id)!.textContent)
      .join(' | ');
  return { panel, callbacks, button, tier, status, describedText };
}
const withReveal = (reveal: RevealPresentation): AssistancePanelState => ({ ...ready, reveal });

describe('assistance panel tiers', () => {
  it('renders one labelled section with three distinct tiers and text cost cues', () => {
    const { panel, button, describedText } = setup();
    const heading = panel.element.querySelector('h2')!;
    expect(panel.element.getAttribute('aria-labelledby')).toBe(heading.id);
    expect(heading.textContent).toBe('Hints');
    expect([...panel.element.querySelectorAll('li')].map((li) => li.dataset.tier)).toEqual([
      'nudge',
      'explain',
      'reveal',
    ]);
    expect(describedText(button('Nudge'))).toContain('Free');
    expect(describedText(button('Explain'))).toContain('Free');
    expect(describedText(button('Reveal'))).toContain('3 of 3 free Reveals left for this puzzle');
    expect(describedText(button('Reveal'))).not.toContain('Free |');
  });

  it('reports requests through callbacks only and never mutates its own counts', () => {
    const { callbacks, button, describedText } = setup(
      withReveal({ status: 'ready', allowance: { kind: 'free', remaining: 2, total: 3 } }),
    );
    button('Nudge').click();
    button('Explain').click();
    button('Reveal').click();
    button('Reveal').click();
    expect(callbacks.onNudge).toHaveBeenCalledOnce();
    expect(callbacks.onExplain).toHaveBeenCalledOnce();
    expect(callbacks.onReveal).toHaveBeenCalledTimes(2);
    expect(describedText(button('Reveal'))).toContain('2 of 3 free Reveals left');
  });

  it('shows honest unavailable and loading reasons for free tiers and blocks requests', () => {
    const { callbacks, button, describedText, tier } = setup({
      ...ready,
      nudge: { status: 'unavailable', message: 'The puzzle is already solved.' },
      explain: { status: 'loading' },
    });
    expect(button('Nudge').disabled).toBe(true);
    expect(describedText(button('Nudge'))).toContain('The puzzle is already solved.');
    expect(button('Explain').disabled).toBe(true);
    expect(describedText(button('Explain'))).toContain('Preparing…');
    expect(tier('explain').dataset.state).toBe('loading');
    button('Nudge').click();
    expect(callbacks.onNudge).not.toHaveBeenCalled();
  });

  it('removes stale notes and disabled state on update', () => {
    const { panel, button, describedText } = setup({
      ...ready,
      nudge: { status: 'unavailable', message: 'No next step from these marks.' },
    });
    panel.update(ready);
    expect(button('Nudge').disabled).toBe(false);
    expect(describedText(button('Nudge'))).not.toContain('No next step');
  });

  it('busy disables every tier while the app prepares a request', () => {
    const { panel, button } = setup();
    panel.update({ ...ready, busy: true });
    expect(['Nudge', 'Explain', 'Reveal'].map((n) => button(n).disabled)).toEqual([
      true,
      true,
      true,
    ]);
    expect(panel.element.getAttribute('aria-busy')).toBe('true');
  });

  it('accepts game-specific descriptions without changing tier names', () => {
    const panel = createAssistancePanel({
      ...ready,
      descriptions: { reveal: 'Places one correct tent.' },
      onNudge: vi.fn(),
      onExplain: vi.fn(),
      onReveal: vi.fn(),
      onGuidanceDone: vi.fn(),
    });
    expect(panel.element.querySelector('[data-tier="reveal"]')!.textContent).toContain(
      'Places one correct tent.',
    );
  });
});

describe('Reveal lifecycle states', () => {
  it('pending is busy, announced and not re-requestable', () => {
    const { panel, button, status, callbacks } = setup();
    panel.update(
      withReveal({ status: 'pending', allowance: { kind: 'free', remaining: 3, total: 3 } }),
    );
    expect(button('Reveal').disabled).toBe(true);
    expect(button('Reveal').getAttribute('aria-busy')).toBe('true');
    expect(status.textContent).toBe('Revealing…');
    button('Reveal').click();
    expect(callbacks.onReveal).not.toHaveBeenCalled();
  });

  it('success shows the app message and the app-provided count after commit', () => {
    const { panel, button, status, describedText } = setup();
    panel.update(
      withReveal({
        status: 'success',
        allowance: { kind: 'free', remaining: 2, total: 3 },
        message: 'A tent was placed in row 2, column 4.',
      }),
    );
    expect(status.textContent).toBe('A tent was placed in row 2, column 4.');
    expect(describedText(button('Reveal'))).toContain('2 of 3 free');
    expect(button('Reveal').disabled).toBe(false);
  });

  it('success that used the last free Reveal disables further requests', () => {
    const { panel, button } = setup();
    panel.update(
      withReveal({
        status: 'success',
        allowance: { kind: 'free', remaining: 0, total: 3 },
        message: 'Tent placed.',
      }),
    );
    expect(button('Reveal').disabled).toBe(true);
  });

  it('failure keeps the unchanged count, shows the reason and allows a fresh request', () => {
    const { panel, button, status, describedText, panel: p } = setup();
    panel.update(
      withReveal({
        status: 'failure',
        allowance: { kind: 'free', remaining: 3, total: 3 },
        message: 'Nothing was placed and no Reveal was used.',
      }),
    );
    expect(status.textContent).toBe('Nothing was placed and no Reveal was used.');
    expect(p.element.dataset.reveal).toBe('failure');
    expect(describedText(button('Reveal'))).toContain('3 of 3 free');
    expect(button('Reveal').disabled).toBe(false);
  });

  it('exhausted shows a disabled Reveal with no purchase action or price', () => {
    const { panel, button, describedText } = setup(
      withReveal({ status: 'exhausted', freeTotal: 3 }),
    );
    expect(button('Reveal').disabled).toBe(true);
    expect(describedText(button('Reveal'))).toContain('All 3 free Reveals used for this puzzle');
    expect(describedText(button('Reveal'))).toContain('not available yet');
    expect(panel.element.textContent).not.toMatch(/buy|purchase|\$|price/i);
    expect(panel.element.querySelectorAll('button')).toHaveLength(5); // 3 tiers + hidden guidance actions
    expect(button('Nudge').disabled).toBe(false);
  });

  it('supports a real entitlement allowance with and without a count', () => {
    const { panel, button, describedText } = setup(
      withReveal({ status: 'ready', allowance: { kind: 'entitlement', remaining: 1 } }),
    );
    expect(describedText(button('Reveal'))).toContain('1 Reveal left');
    panel.update(withReveal({ status: 'ready', allowance: { kind: 'entitlement' } }));
    expect(describedText(button('Reveal'))).toContain('Reveal access active');
  });

  it('loading and unavailable states block Reveal with their reason', () => {
    const { panel, button, describedText } = setup(withReveal({ status: 'loading' }));
    expect(button('Reveal').disabled).toBe(true);
    expect(describedText(button('Reveal'))).toContain('Checking Reveal access…');
    panel.update(withReveal({ status: 'unavailable', message: 'Reveal is not supported here.' }));
    expect(describedText(button('Reveal'))).toContain('Reveal is not supported here.');
  });

  it.each([
    { status: 'ready', allowance: { kind: 'free', remaining: 0, total: 3 } },
    { status: 'ready', allowance: { kind: 'entitlement', remaining: 0 } },
    { status: 'ready', allowance: { kind: 'free', remaining: 4, total: 3 } },
    { status: 'ready', allowance: { kind: 'free', remaining: 1.5, total: 3 } },
    { status: 'pending', allowance: { kind: 'free', remaining: -1, total: 3 } },
    { status: 'exhausted', freeTotal: 0 },
  ] as RevealPresentation[])('rejects dishonest Reveal state %o', (reveal) => {
    expect(() => setup(withReveal(reveal))).toThrow(RangeError);
  });
});

describe('Explain guidance', () => {
  const guidance = {
    title: 'Row is full',
    text: 'Row 3 already has its two tents, so every other cell in it must be grass.',
  };
  it('moves focus into guidance, renders plain text and hides the lesson link without a destination', () => {
    const { panel, button } = setup();
    button('Explain').focus();
    panel.update({ ...ready, guidance: { ...guidance, text: '<b>not markup</b>' } });
    const heading = panel.element.querySelector('h3')!;
    expect(document.activeElement).toBe(heading);
    expect(heading.textContent).toBe('Row is full');
    expect(panel.element.querySelector('b')).toBeNull();
    expect(button('Open in Logic Library').hidden).toBe(true);
    expect(panel.element.querySelector('ul')!.hidden).toBe(true);
  });

  it('shows a lesson link only with a real destination and calls it', () => {
    const onOpen = vi.fn();
    const { panel, button } = setup();
    panel.update({
      ...ready,
      guidance: { ...guidance, lesson: { onOpen, label: 'Learn: Full rows' } },
    });
    const link = button('Learn: Full rows');
    expect(link.hidden).toBe(false);
    link.click();
    expect(onOpen).toHaveBeenCalledOnce();
  });

  it('Done reports to the app; clearing guidance restores focus to Explain', () => {
    const { panel, button, callbacks } = setup();
    panel.update({ ...ready, guidance });
    button('Done').focus();
    button('Done').click();
    expect(callbacks.onGuidanceDone).toHaveBeenCalledOnce();
    panel.update(ready);
    expect(document.activeElement).toBe(button('Explain'));
    expect(panel.element.querySelector('ul')!.hidden).toBe(false);
  });

  it('does not steal focus on unrelated updates while guidance stays open', () => {
    const { panel, button } = setup();
    panel.update({ ...ready, guidance });
    button('Done').focus();
    panel.update({ ...ready, guidance });
    expect(document.activeElement).toBe(button('Done'));
  });
});

describe('Explain focus fallback', () => {
  const guidance = { title: 'Row is full', text: 'Reasoning.' };
  it('falls back to another enabled tier when Explain is disabled as guidance closes', () => {
    const { panel, button } = setup();
    panel.update({ ...ready, guidance });
    button('Done').focus();
    panel.update({ ...ready, explain: { status: 'unavailable', message: 'No step.' } });
    expect(button('Explain').disabled).toBe(true);
    expect(document.activeElement).toBe(button('Nudge'));
  });

  it('falls back to the section when every tier is disabled', () => {
    const { panel, button } = setup();
    panel.update({ ...ready, guidance });
    button('Done').focus();
    panel.update({ ...ready, busy: true });
    expect(document.activeElement).toBe(panel.element);
    expect(panel.element.tabIndex).toBe(-1);
  });
});

describe('Nudge cue', () => {
  function board() {
    const host = document.createElement('div');
    host.className = 'nl-grim-glimmer-v4';
    const grid = createBoard({
      label: 'Test board',
      size: 2,
      mode: 'interactive',
      cells: ['empty', 'fixed', 'empty', 'empty'],
    });
    host.append(grid);
    document.body.append(host);
    return grid;
  }
  it('adds a hidden ring and a describedby equivalent without changing marks', () => {
    const grid = board();
    const cell = grid.children[2] as HTMLElement;
    const classes = cell.className;
    const cue = showAssistanceCue({ cell, reducedMotion: true });
    expect(cue.element.classList.contains('gg-v4-hint')).toBe(true);
    expect(cue.element.getAttribute('aria-hidden')).toBe('true');
    expect(cell.className).toBe(classes);
    const id = cell.getAttribute('aria-describedby')!;
    expect(document.getElementById(id)!.textContent).toBe('Nudge target');
    updateBoard(grid, { cells: ['empty', 'fixed', 'empty', 'empty'] });
    expect(cell.getAttribute('aria-describedby')).toBe(id);
    cue.dispose();
    expect(cell.querySelector('.gg-v4-hint')).toBeNull();
    expect(cell.hasAttribute('aria-describedby')).toBe(false);
    expect(cell.dataset.assistanceCue).toBeUndefined();
  });

  it('preserves existing describedby ids and is idempotent on dispose', () => {
    const grid = board();
    const cell = grid.children[0] as HTMLElement;
    cell.setAttribute('aria-describedby', 'existing');
    const cue = showAssistanceCue({ cell, description: 'Look here', reducedMotion: true });
    expect(cell.getAttribute('aria-describedby')).toMatch(/^existing nl-assistance-cue/);
    cue.dispose();
    cue.dispose();
    expect(cell.getAttribute('aria-describedby')).toBe('existing');
  });

  it('uses the approved pulse when motion is allowed and stays static otherwise', () => {
    const grid = board();
    const animate = vi.fn(() => ({ cancel: vi.fn(), finished: new Promise(() => undefined) }));
    const cell = grid.children[0] as HTMLElement;
    const proto = HTMLElement.prototype as unknown as { animate?: unknown };
    const original = proto.animate;
    proto.animate = animate;
    try {
      const moving = showAssistanceCue({ cell });
      expect(animate).toHaveBeenCalledOnce();
      expect(animate.mock.calls[0]).toEqual([
        expect.any(Array),
        expect.objectContaining({ duration: 1600, iterations: Infinity }),
      ]);
      moving.dispose();
      animate.mockClear();
      showAssistanceCue({ cell, reducedMotion: true }).dispose();
      showAssistanceCue({ cell, animations: false }).dispose();
      expect(animate).not.toHaveBeenCalled();
    } finally {
      proto.animate = original;
    }
  });
});

describe('announcer and control row integration', () => {
  it('announces plain text, re-announces repeats and clears', () => {
    vi.useFakeTimers();
    const announcer = createAssistanceAnnouncer();
    document.body.append(announcer.element);
    expect(announcer.element.getAttribute('role')).toBe('status');
    announcer.announce('Look at row 2, column 4.');
    expect(announcer.element.textContent).toBe('');
    vi.advanceTimersByTime(50);
    expect(announcer.element.textContent).toBe('Look at row 2, column 4.');
    announcer.announce('Look at row 2, column 4.');
    expect(announcer.element.textContent).toBe('');
    vi.advanceTimersByTime(50);
    expect(announcer.element.textContent).toBe('Look at row 2, column 4.');
    announcer.announce('stale');
    announcer.clear();
    vi.advanceTimersByTime(100);
    expect(announcer.element.textContent).toBe('');
  });

  it('the control row keeps exactly one Hint entry point', () => {
    const row = createGameControlRow({
      mode: 'tent',
      canUndo: false,
      hint: 'available',
      onHint: vi.fn(),
    });
    const names = [...row.querySelectorAll('button')].map((b) => b.getAttribute('aria-label'));
    expect(names.filter((n) => /hint/i.test(n ?? ''))).toHaveLength(1);
    expect(names.some((n) => /nudge|explain|reveal/i.test(n ?? ''))).toBe(false);
  });
});

describe('host-titled panel', () => {
  it('omits the visible heading but keeps an accessible section name', () => {
    const panel = createAssistancePanel({
      ...ready,
      showTitle: false,
      onNudge: vi.fn(),
      onExplain: vi.fn(),
      onReveal: vi.fn(),
      onGuidanceDone: vi.fn(),
    });
    expect(panel.element.querySelector('h2')).toBeNull();
    expect(panel.element.getAttribute('aria-label')).toBe('Hints');
  });
});

describe('cue with clued-board feedback', () => {
  it('survives an unchanged-cell updateCluedBoard while feedback rings still repaint', () => {
    const host = document.createElement('div');
    host.className = 'nl-grim-glimmer-v4';
    const options = {
      presentation: 'editorial' as const,
      label: 'Test board',
      size: 2,
      mode: 'interactive' as const,
      cells: ['empty', 'empty', 'empty', 'empty'] as const,
      rowClues: [1, 0],
      columnClues: [1, 0],
    };
    const shell = createCluedBoard({ ...options, cells: [...options.cells], hints: [0] });
    host.append(shell);
    document.body.append(host);
    const grid = shell.querySelector<HTMLElement>('.nl-grim-glimmer-board')!;
    const cell = grid.children[3] as HTMLElement;
    const cue = showAssistanceCue({ cell, reducedMotion: true });
    updateCluedBoard(shell, { cells: [...options.cells], hints: [1] });
    expect(cell.querySelector('.gg-v4-assistance-cue')).toBe(cue.element);
    expect(cell.dataset.assistanceCue).toBe('nudge');
    // Feedback still owns and replaces its own rings.
    expect(grid.children[0]!.querySelector('.gg-v4-hint')).toBeNull();
    expect(grid.children[1]!.querySelector('.gg-v4-hint')).not.toBeNull();
    cue.dispose();
    expect(cell.querySelector('.gg-v4-hint')).toBeNull();
  });
});
