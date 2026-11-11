# V4 Phase 7 — Home, tarot and supporting states review

Issue #40; epic #33. Audited main `f5b4b159289923e8aa221210eff09ec3e7dd9aab`, including approved Phase 6 PR #46.

This is one Storybook review phase, organized into three sub-deliverables before implementation:

1. Home layout, hero/locked cards, carousel, Daily Draw/status and shared bottom navigation.
2. Cold/return/replay motion, reduced motion and scoped ambient background.
3. Puzzle header, separate constellation path, skeleton and empty state.

Each is a separate Storybook section in one phase PR. Stop for owner review after delivery;
no automatic merge or production adoption. Current V3 and approved Phases 1–6 are unchanged.

## Audit and reuse

| Exact existing source                                            | Reuse, addition and affected dependencies                                                                                                               |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/card/`                                           | Native interactive/static Card factory for hero, locked and Daily Draw containers; existing API/defaults untouched.                                     |
| `src/components/button/`, `icon-button/`                         | New puzzle, current path action, replay, carousel indicators and header actions use shared controls. No alternative button implementation.              |
| `src/components/bottom-nav/`                                     | Actual icon-only navigation and active bar, with local translucent-nav skin. Routes are callbacks only.                                                 |
| `src/components/icon/icon-map.ts`                                | Existing approved Phosphor Home/Trophy/Settings/Back/⋮ map. Do not redraw or simulate a new 1.5px stroke by applying stroke to filled path silhouettes. |
| `stories/projects/grim-glimmer/main-screen-demo.ts`              | Approved wordmark URLs and exact `237 949 1533 247` crop are reused. No artwork bytes or branding changed.                                              |
| `stories/projects/grim-glimmer/assets/wordmark-{light,dark}.png` | Original two theme-specific assets remain shared with V3. They are dependencies, not deprecated copies.                                                 |
| `stories/projects/grim-glimmer/shared.ts` / `previewBoard()`     | Existing supplied 5×5 static illustration and glyphs in the arch. No generated/playable puzzle or replacement artwork.                                  |
| `stories/projects/grim-glimmer-v4/board.ts`, `board.css`         | Previously reviewed isolated roles and read-only board in the header example. No board changes.                                                         |
| `stories/projects/grim-glimmer-v4/motion.ts`                     | Existing transform/opacity hint primitive drives the current constellation ring, with visibility/OS preference handling.                                |
| `src/themes/moonlit-oxblood/moonlit-oxblood.css`                 | All canonical background/surface/text/accent/focus/on-accent roles retained. No production token reassignments.                                         |

New files `home-parts.ts`, `home-carousel.ts`, `home-model.ts`, `home-motion.ts`,
`home-support.ts`, `home.ts`, `home.css` live entirely under the V4 stories folder.
They own composition and proposed patterns, not a competing production library.
`createArchFrame()` is an additive exported story utility; global arch tokens/shared
package promotion need later acceptance. No other existing component gets an arch.

The source mentions React, Framer Motion, spring/layoutId APIs, a Worker and new puzzle
availability. This repo remains plain TS/DOM/CSS with Web Animations, zero new dependencies.
No src/, production tokens, V3, app, puzzle engine, save schema, approved PNG/SVG or
native behavior changes. Tests, documentation and catalog guard are the only edits
outside the new isolated story files.

## Review sections

All under `Projects/Grim & Glimmer/V4`:

| Group                        | Stories / states                                                                                                                                            |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Home/HomeScreen`            | Both themes, default, reduced, in progress, quiet (strips hidden), solved draw, long title, return, separate resume/new actions, font-ready fit play check. |
| `Home/HeroCard`              | Play, in progress, long title, light/dark and reduced motion.                                                                                               |
| `Home/FaceDownCard`          | Locked face, tap feedback demo, both themes and reduced motion.                                                                                             |
| `Home/CardCarousel`          | Three-card carousel, light/dark/reduced, keyboard and settled-feedback play demo.                                                                           |
| `Home/DailyDraw`             | Unplayed, in progress, solved today, hidden, placeholder-only callback demo.                                                                                |
| `Home/StatusLine`            | Full, solved-only, hidden, both themes.                                                                                                                     |
| `Home/EntranceSequence`      | Replay button, cold, return, reduced and both themes. Replay controls sit outside Home and are intentionally not part of its viewport-fit budget.           |
| `Home/BottomNav`             | Shared Home/Trophy/Settings, icon-only, mock navigation.                                                                                                    |
| `Header/PuzzleHeader`        | Read-only board context, partial/zero/full placement progress, theme/reduced variants.                                                                      |
| `Progress/ConstellationPath` | Illustrative solved/current/locked progression, one mock Continue action.                                                                                   |
| `Atmosphere/Background`      | Five edge stars, noise and token-based vignette, light/dark/reduced.                                                                                        |
| `States/Loading`             | Busy labelled region, 5×5 skeleton and 6% accent shimmer.                                                                                                   |
| `States/Empty`               | “No constellations charted yet.”, shared navigation.                                                                                                        |

Use the existing 393×852 and 360×780 viewport presets. Settings/navigation, puzzle
play/resume/new, daily and locked feedback are Actions adapters; no route, storage,
audio, engine or analytics is introduced. `onCard` is visual selection only.

## Layout and card structure

- Order: safe area → immutable wordmark/tagline rules → optional status → optional
  Daily Draw → tarot carousel → four-point indicators → compact shared bottom nav.
  No Choose a puzzle heading. The logo region never drops below 96 CSSpx.
- Home uses a bounded `100dvh` flex layout; the carousel shrinks first. At shorter
  heights (≤740px), gaps become 8px and Daily Draw shrinks from 64 to 56px. Below
  the 650px minimum canvas, vertical access is retained rather than hiding content.
- At default 16px root font and zero safe-area insets, the **arithmetic budget** is:

| Viewport | Logo | Hero height | Hero width (5:8) | Neighbor peek after gap |
| -------- | ---- | ----------- | ---------------- | ----------------------- |
| 393×852  | 96px | 420px       | 262.5px          | 37.25px                 |
| 360×780  | 96px | 405px       | 253.125px        | 33.4375px               |

These are not measured screenshots. `homeBudget()` includes both optional strips,
shared 48px nav targets, border/padding, 16px rhythm and 44px indicator targets.
Actual font/safe-area/browser metrics must pass the browser/device checklist.
Hidden strips release space up to the 420px maximum. Extra large text or short
landscape viewports may need scrolling; do not trade accessible text for forced fit.
Long-title and font-ready review stories expose those limits.

- Hero: Roman I, double hairline frame, 20px radius, canonical surface, static warm
  depth/inset highlight, arched window with original 5×5 preview, Cormorant title.
  The press lift is transform-only over 160ms. The source growing shadow is omitted
  under the transform/opacity rule; depth is static.
- Whole hero has a full-card shared native Card button. Visuals are a separate
  aria-hidden sibling. Resume changes the accessible name and detail; New puzzle
  is a separate shared Button sibling, never a nested button/link. Its positioning
  wrapper allows the shared pressed transform without horizontal jumps.
- Source Master becomes **Hard**, matching the current approved game. No new generator
  promise is made. The proposed puzzle header omits source “No. 14”: removed level
  numbers stay removed. No gear/Hint or bottom nav is introduced during puzzle play.
- Face-down II/III use only numeral + UNREVEALED visibly. An accessible locked label
  and aria-disabled state explain availability. Tap shakes ±3px over 200ms and emits
  one gated selection tick; it never routes or opens a dialog. Dark uses a deeper
  accent/background mixture; no deprecated palette. Decorative eight-point pattern
  is distinct from the unchanged gameplay glyph.

## Snap, focus and haptics contract

Exactly three logical cards, plus two inert aria-hidden edge clones. This bounded
clone pair lets Stars & Spires start centered with real peeks on both sides, without
exposing duplicated buttons to keyboard/screen readers. Clones are noninteractive;
reaching one by scroll silently rebases to its original. This is not an unbounded
carousel or an API for arbitrary puzzle counts; expansion needs separate review.

Native horizontal mandatory snap with stop-always owns touch scrolling. Observed
scroll geometry adjusts item scale 1↔.92 and opacity 1↔.7, on one animation frame at
a time. A 140ms quiet window or native scrollend commits the nearest logical card.
Feedback fires once per changed settled selection, not per scroll event or clone
rebase. Arrow/Home/End and labelled four-point indicator buttons offer alternatives
to swiping; native card buttons retain Enter/Space and normal Tab. One live status
announces settled current/total/playable-or-locked. Haptics are injected and gated;
use the established selection tick, not a new stronger native effect.

Resize/font reflow re-centers the selected item without another haptic. Removal
cleans pending settle timers, frame callbacks, observer and listeners. No scroll
handler updates app state or puzzle progress.

## Entrance, atmosphere and motion budget

| From cold mount   | Action / end                                                             |
| ----------------- | ------------------------------------------------------------------------ |
| 0ms               | Logo opacity and centered tagline/rules scale over 400ms.                |
| 200ms             | Daily Draw fade over 280ms, only if visible.                             |
| 250 / 320 / 390ms | Real cards rise 16px and fade over 210ms each. Last ends at **600ms**.   |
| 700ms             | One translated diagonal sheen starts; 900ms duration ends at **1600ms**. |

This resolves “~600ms total” versus the later sheen: **600ms content entrance,
1600ms full embellishment**. Return-to-Home does not replay the cold entrance.
Reduced motion collapses cold entry to one 150ms fade, without lift, shake, sheen,
shimmer or ambient cycling. Static outlines and decoration remain. All newly
animated properties are transform/opacity; inherited generic color/shadow
transitions are restricted only in these new fixture scopes.

Five scoped edge stars cycle opacity .25↔.8 independently at 4.0–5.6s. Their positions
are absolute within the fixed-height preview, rather than viewport-fixed globally,
so comparison panes cannot leak stars into each other. No text/card-center star.
`createLoopMotion()` owns all new continuous-loop visibility and reduced-motion
listeners (ambient and loading); the path ring reuses the approved Phase 4 primitive.
Ambient loops pause in background and resume on return. A backgrounded cold entrance
is canceled rather than replayed. OS preference changes cancel work immediately.
Unmount cancels jobs and removes listeners. Repeated locked taps replace the previous
shake on that node, bounding simultaneous animations.

Peak Home budget is five ambient jobs + seven finite cold jobs = **12 animation
objects**; after entry/sheen only five remain. There is one sheen and no timer-driven
live noise or filter animation. This bound is not Android frame-rate evidence.

The vignette uses canonical surface/background roles rather than the source's
unapproved #1B1115/#0F0B0D. A deterministic baked **128×128 one-bit PNG** (seed 40)
is embedded as an inline tile, 4.5% opacity, overlay blend, pointer-events none.
No external request, live feTurbulence or artwork replacement. Static nav blur16px /
saturate1.2 is confined to navigation; no board or sheet blur is added. Existing
Phosphor light/fill weights remain intact; an exact new 1.5px icon system is deferred.

## Daily Draw and future app wiring

`home-model.ts` exports `DAILY_DRAW_ENABLED = false`; the factory defaults off,
Storybook opts in. `getDailySeed(YYYY-MM-DD)` validates the entire real canonical
calendar date and applies a versioned deterministic hash. No Date.now, locale parse,
local timezone, random call, storage, generator or network is involved. The callback
contains `{date, seed, puzzle: null, status: 'placeholder'}`.

The SVG moon is an eight-phase decorative approximation based on the supplied date,
not an astronomical ephemeris. Solved today uses a filled moon and DRAWN. The fixture
date is fixed for reproducible review. The host must still decide calendar policy:
UTC rollover, local midnight or an agreed service timezone, including travel/DST
and puzzle-version rules. Seed identity alone does not define those policies.

Before any real Daily Draw or loading adoption:

- Decide that calendar policy and actual feature-flag integration.
- Supply a verified puzzle catalog/generator and version/availability contract.
- Implement daily resume/completion persistence and migration tests separately.
- Design a separate app task for any 15×15 Worker generator/cancellation/performance
  change. This phase only documents it; the skeleton is a presentation state.
- Connect actual routing, saves, native haptics and approved navigation policy through
  the installed package after shared API promotion; no local dependency patch.

Status counts/streaks, path states, time and placement totals are mocked props.
The path is an illustrative standalone screen, not a level-selection engine. Header
progress counts confirmed placements, not validated correctness. No rule changes.

## Verification and remaining review

Focused tests cover valid/invalid daily dates, determinism and off default, separate
resume/new targets, locked behavior, hidden status, arithmetic viewport budget,
logical/cloned carousel semantics, keyboard controls, settled feedback deduplication,
clone rebase, unmount, choreography timing/properties, background/reduced-motion
changes, rapid-tap bounds, loading/progress/empty states and no storage writes.

Story play demos add routing, keyboard/snap, locked feedback, placeholder calls and
font-ready layout assertions. They compile but are **not claimed executed here**.
Run full `npm run check` and record final counts in the PR. The library/package and
Storybook builds apply; an application build does not apply to this isolated change.

Browser capture was attempted: bundled Playwright browser was absent and installed
system Chromium exited during launch. No browser screenshots or measured Android
frame-drop results are available. No protected signed-in preview was accessed.
These items remain pending rather than reported as passing:

- [ ] Capture comparable full Home, resume, quiet, locked selection and Daily states
      in both modes at 393×852 and 360×780.
- [ ] Confirm font-ready/long-title fit, no vertical page scroll at default settings,
      no horizontal page overflow, stable logo and correct safe-area spacing.
- [ ] Swipe both directions through edge clones; inspect peeks, snap, scale/opacity,
      one tick per settled card, keyboard focus, live announcements and large text.
- [ ] Review cold/replay/return/reduced entry and single sheen; background/resume.
- [ ] Inspect header progress, path, busy skeleton and empty state; no unwanted routes.
- [ ] Measure frame drops on a mid-range Android WebView; twelve peak objects is not
      proof of 60fps. Review ambient contrast and count before promotion.
- [ ] Owner accepts the three-card boundary, per-viewport card-size compromise,
      scoped five-star placement, unchanged icon map and additive arch utility.

Stop for review. Phase 7 implementation does not itself authorize production adoption.
