import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import {
  createAssistancePreview,
  createAssistanceStates,
  type AssistanceFixtureOptions,
} from './assistance-fixtures.js';
import { compareModes } from '../../lib/stage.js';

const meta = {
  title: 'Projects/Grim & Glimmer/Feature Expansion/Assistance',
  parameters: { nlTheme: 'moonlit-oxblood', nlStage: 'bleed' },
  args: {
    size: 6,
    reducedMotion: false,
    animations: true,
    initiallyOpen: false,
    initialCue: false,
    reveal: 'free-3',
    revealOutcome: 'success',
    lessonDestination: false,
    freeTiers: 'ready',
    onNudge: fn(),
    onExplain: fn(),
    onReveal: fn(),
    onLesson: fn(),
  },
  argTypes: {
    size: { control: 'select', options: [6, 8, 15] },
    reveal: {
      control: 'select',
      options: [
        'free-3',
        'free-1',
        'pending',
        'success',
        'failure',
        'exhausted',
        'entitlement',
        'loading',
        'unavailable',
      ],
    },
    revealOutcome: { control: 'inline-radio', options: ['success', 'failure'] },
    freeTiers: { control: 'inline-radio', options: ['ready', 'loading', 'unavailable'] },
  },
  render: (args) => createAssistancePreview(args),
} satisfies Meta<AssistanceFixtureOptions>;
export default meta;
type Story = StoryObj<AssistanceFixtureOptions>;

const openHints = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole('button', { name: /^Hint/ }));
  return within(canvasElement.querySelector('dialog')!);
};

export const Playground: Story = {};
export const Open: Story = { args: { initiallyOpen: true } };
export const AllStates: Story = { render: () => createAssistanceStates() };

export const NudgeCue: Story = {
  args: { reducedMotion: true },
  play: async ({ canvasElement, args }) => {
    const sheet = await openHints(canvasElement);
    await userEvent.click(sheet.getByRole('button', { name: 'Nudge' }));
    await expect(args.onNudge).toHaveBeenCalledOnce();
    await waitFor(() => expect(canvasElement.querySelector('dialog')).not.toHaveAttribute('open'));
    const cell = canvasElement.querySelector<HTMLElement>('[data-assistance-cue="nudge"]')!;
    await expect(cell.querySelector('.gg-v4-hint')).not.toBeNull();
    await expect(cell).toHaveAccessibleDescription('Nudge target');
    // No mark placement: the cell keeps its empty state.
    await expect(cell).toHaveClass('nl-grim-glimmer-board__cell--empty');
    await waitFor(() =>
      expect(
        within(canvasElement)
          .getAllByRole('status')
          .some((s) => (s.textContent ?? '').includes('Fixture nudge')),
      ).toBe(true),
    );
  },
};
export const NudgeCuePulse: Story = { args: { initialCue: true } };
export const NudgeCueReducedMotion: Story = { args: { initialCue: true, reducedMotion: true } };
export const NudgeCueAnimationsOff: Story = { args: { initialCue: true, animations: false } };
export const NudgeCueDenseBoard: Story = { args: { initialCue: true, size: 15 } };

export const ExplainGuidance: Story = {
  args: { reducedMotion: true },
  play: async ({ canvasElement, args }) => {
    const sheet = await openHints(canvasElement);
    await userEvent.click(sheet.getByRole('button', { name: 'Explain' }));
    await expect(args.onExplain).toHaveBeenCalledOnce();
    await expect(sheet.getByRole('heading', { name: 'Fixture: a full row' })).toHaveFocus();
    // Guidance replaces the tier list in the rendered layout, not just in the DOM.
    await expect(sheet.queryByRole('button', { name: 'Nudge' })).toBeNull();
    await expect(sheet.queryByRole('button', { name: /lesson|Logic Library/ })).toBeNull();
    await userEvent.click(sheet.getByRole('button', { name: 'Done' }));
    await expect(sheet.getByRole('button', { name: 'Explain' })).toHaveFocus();
  },
};
export const ExplainWithLesson: Story = {
  args: { reducedMotion: true, lessonDestination: true },
  play: async ({ canvasElement, args }) => {
    const sheet = await openHints(canvasElement);
    await userEvent.click(sheet.getByRole('button', { name: 'Explain' }));
    await userEvent.click(sheet.getByRole('button', { name: 'Fixture lesson: Full rows' }));
    await expect(args.onLesson).toHaveBeenCalledOnce();
  },
};

export const RevealLifecycle: Story = {
  args: { reducedMotion: true },
  play: async ({ canvasElement, args }) => {
    const sheet = await openHints(canvasElement);
    const reveal = sheet.getByRole('button', { name: 'Reveal' });
    await expect(reveal).toHaveAccessibleDescription(/3 of 3 free Reveals left/);
    await userEvent.click(reveal);
    await expect(args.onReveal).toHaveBeenCalledOnce();
    await expect(reveal).toHaveAttribute('aria-busy', 'true');
    await waitFor(() => expect(reveal).toHaveAccessibleDescription(/2 of 3 free Reveals left/));
  },
};
export const RevealFailure: Story = {
  args: { reducedMotion: true, revealOutcome: 'failure' },
  play: async ({ canvasElement }) => {
    const sheet = await openHints(canvasElement);
    const reveal = sheet.getByRole('button', { name: 'Reveal' });
    await userEvent.click(reveal);
    await waitFor(() => expect(sheet.getByRole('status')).toHaveTextContent(/no Reveal was used/));
    await expect(reveal).toHaveAccessibleDescription(/3 of 3 free Reveals left/);
  },
};
export const RevealPending: Story = { args: { initiallyOpen: true, reveal: 'pending' } };
export const RevealSuccess: Story = { args: { initiallyOpen: true, reveal: 'success' } };
export const RevealExhausted: Story = {
  args: { initiallyOpen: true, reveal: 'exhausted', reducedMotion: true },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelector('dialog')).toHaveAttribute('open'));
    const sheet = within(canvasElement.querySelector('dialog')!);
    await expect(sheet.getByRole('button', { name: 'Reveal' })).toBeDisabled();
    await expect(sheet.getByRole('button', { name: 'Nudge' })).toBeEnabled();
    await expect(canvasElement.querySelector('dialog')!.textContent).not.toMatch(
      /buy|purchase|price|\$/i,
    );
  },
};
export const RevealEntitlement: Story = { args: { initiallyOpen: true, reveal: 'entitlement' } };
export const RevealLoading: Story = { args: { initiallyOpen: true, reveal: 'loading' } };
export const RevealUnavailable: Story = { args: { initiallyOpen: true, reveal: 'unavailable' } };
export const FreeTiersUnavailable: Story = {
  args: { initiallyOpen: true, freeTiers: 'unavailable' },
};
export const ReducedMotion: Story = { args: { initiallyOpen: true, reducedMotion: true } };

export const LightDarkComparison: Story = {
  parameters: { nlStage: 'self' },
  args: { initialCue: true },
  render: (args, context) =>
    compareModes(context, () => createAssistancePreview(args), {
      theme: 'moonlit-oxblood',
      bleed: true,
    }),
};
export const StatesLightDark: Story = {
  parameters: { nlStage: 'self' },
  render: (_args, context) =>
    compareModes(context, () => createAssistanceStates(), { theme: 'moonlit-oxblood' }),
};
const phone = (width: number): Story => ({
  args: { initiallyOpen: true },
  render: (args) => {
    const root = createAssistancePreview(args);
    root.style.maxWidth = `${width}px`;
    return root;
  },
});
export const Mobile360 = phone(360);
export const Mobile390 = phone(390);
