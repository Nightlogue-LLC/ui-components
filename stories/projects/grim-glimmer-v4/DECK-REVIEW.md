# Phase 7 revision — Trees & Tents deck

This revision adds a separate pointer-driven Stack and StackHome under V4. The prior
HomeScreen, CardCarousel, HeroCard and original Phase 7 stories remain unchanged for
comparison. Trees & Tents is the new deck's playable title; historical comparison and
V3/production names are not silently migrated. All edits in this revision are inside
`stories/projects/grim-glimmer-v4/`. No src/, dependencies, production tokens, app,
engine, saves, original carousel, old glyphs or approved branding changes.

## Review entry points

`Projects/Grim & Glimmer/V4/Home/Stack`: Default, Mid Drag (dx slider), Face Down On
Top, In Progress, Wrap Around, Reduced Motion, Keyboard And Indicators, Swipe Cycle,
Light Dark Comparison. `Home/StackHome`: default, explicit 393×852 and 360×780 viewport
stories, in progress, return, reduced and theme comparison.

The new `createCardFrame()` in `deck-card.ts` owns the three physical-card surfaces,
art layer, numeral/title/epithet/status plate and sibling shared Card/Button targets.
`deck-model.ts` owns poses, thresholds, size budget and analytic spring. `deck.ts`
owns pointers, animation lifecycle, accessibility and mock adapters. Fixtures reuse
Home logo, status, Daily Draw, shared navigation and ambient controller. The existing
carousel is not patched into a stack or given conflicting gesture handling.

## Artwork and frame decision

The owner selected the later complete raster image and accepted preserving it with
a dark editorial section underneath. This supersedes the earlier separate SVG/frame
asset plan. The supplied 10102.png is copied byte-for-byte to
`assets/trees-tents-card.png`. No recolor, crop, redraw, compression, replacement or
SVG tracing. There is no SVGO fill stripping on a raster image.

To preserve the whole 5:8 illustration AND fit live text inside a total 5:8 card, the
art is **contained**, not full-width cropped. It occupies a 74% high area with dark
side breathing room; resume uses 68% to keep a full 44px New puzzle target. The live
numeral shares the title row in the bottom plate, followed by epithet/status. Nothing
is painted over the tree, tent, moon or ornamental border. This means the visible
illustration is smaller than the whole card; review mobile legibility before merge.

The physical body and lines are scoped local roles with exactly the two approved
literal colors: `--deck-body: #1C1417`, `--deck-line: #B87A8C`. Both themes show the
same dark card. Nested shared controls use the existing dark Moonlit scope. Theme
switching affects the surrounding Home and indicators, not the artwork or card.

Face-downs reuse CardFrame body/plate/inset hairline chrome with a centered eight-point
SVG emblem image/mask based on the existing V4 decorative star. It is a provisional
back design, not a claimed extraction of the floral border from the complete PNG.
No separate frame SVG or dedicated face-down emblem was supplied. Visible face-down
copy stays numeral + Unrevealed; the locked state is announced accessibly. The full
floral frame cannot be token-recolored independently from the flattened illustration.

### Asset budget

- Original front PNG: **961×1536**, **562,113 bytes** (~549 KiB). Decoded RGBA estimate
  ~5.63 MiB; actual GPU/cache memory is not measured.
- Back emblem: small inline geometric SVG, one shared data URL reused for both backs.
- Two unique image sources for three cards. Local image preload hints plus eager,
  async-decoding image elements; no external art request. Original asset bytes remain
  untouched. No new animation/framework package.

## Stack and motion contract

Three real card nodes only, no clones. Top: identity. Second: x -8, y12, scale .95,
rotate -4°. Third: x+8, y24, scale .90, rotate +4°. Only `[data-top=true]` receives
`will-change: transform`. Behind-card poses interpolate by
`min(abs(dx)/(0.5*width),1)`. Top rotation is dx/width*14°. No stamps, color washes,
filters or animated shadow.

Horizontal pointer gesture on the shared Card target, `touch-action: pan-y`.
Vertical intent releases without preventing scroll. Primary pointer only; pointer
capture on press, with visual drag after 8px horizontal intent. Under 8px remains a normal native tap. A larger
pointer gesture suppresses the subsequent click, whether it dismisses or snaps back.
Cancel/lost capture releases and returns the existing card, without changing selection.
The separate New puzzle button is not a drag handle and is never nested in a button.

Dismiss if displacement >30% of width OR absolute recent velocity >500 CSSpx/s,
with at least 8px displacement. Velocity uses consecutive movement samples; a pause

> 100ms before release discards the stale flick. Both swipe directions advance to the
> next card; fly-off follows the displacement direction. ArrowLeft cycles backward,
> ArrowRight forward; indicators jump directly. This ordering policy is explicit.

Insufficient drag returns with the unit-mass stiffness400/damping30 closed-form
underdamped spring, sampled over 600ms. No spring library. Fly-off is 220ms ease-out,
then 160ms fade/scale re-entry. Normal forward cycling moves the dismissed card to
the back; backward/jump navigation restores circular logical order. Each cycle emits
one settled callback. Repeated indicators cancel stale animation completions.

Haptics use the injected existing selection-tick adapter, gated by `haptics`; no native
plugin import or stronger effect. One tick on entering the dismiss-qualified region;
re-arm after returning below both displacement/velocity thresholds. One tick after
successful cycle settle. Locked top tap: ±3px /200ms shake + one gated tick, no route.
Playable tap: injected play/resume callback. The body retains a 160ms press lift.

Reduced motion removes all fan displacement/tilt, shake, nudge and fly-off. Cycling
uses a simultaneous **150ms opacity-only crossfade**. Static cards remain stacked at
the same center; only the top is interactive/announced. OS changes cancel pending
movement and restore stable poses immediately.

Cold entrance deals from one centered pile to fan poses over 450ms, 70ms stagger
(590ms last finish). Only the top gets the one-time sheen. First-visit prop enables
one idle +14px/2° nudge at 1200ms, then back. Any interaction cancels it; reduced motion
skips it. There is no storage write or new first-visit persistence. Return fixtures
pass `firstVisit:false` and skip the cold deal. Backgrounding cancels pending entrance,
gesture/cycle/nudge work; unmount removes jobs, listeners, capture and callbacks.

## Accessibility and layout

Deck is a labelled role=group, aria-roledescription=deck. One labelled native top
button; lower cards inert/aria-hidden/tabindex -1. Three 44px indicator buttons with
pressed state. Live region: `Card 2 of 3: locked puzzle`. Keyboard cycles return focus
to the new top; indicator jumps retain indicator focus. All presentation text remains
live HTML; artwork is decorative and does not carry the accessible button name.

Both optional strips visible, default16px root font, zero safe-area insets:

| Viewport | Whole hero    | Fan reserve | Contained illustration (74%) |
| -------- | ------------- | ----------- | ---------------------------- |
| 393×852  | 262.5×420px   | 40px        | about 194.5×310.8px          |
| 360×780  | 228.125×365px | 40px        | about 169×270.1px            |

These are arithmetic budgets, not browser measurements. The 96px logo region and
existing shared nav targets stay intact. No intentional page scroll at these default
sizes. Browser font loading, safe areas, long epithets and accessibility text scaling
still need device review; do not hide overflow to fake acceptance.

## Validation and pending review

The focused tests live inside V4 to honor the revision boundary. The repository's
normal Vitest include does not collect story-local tests. Run them with an ephemeral
config using root=<repository>, environment=jsdom,
include=[stories/projects/grim-glimmer-v4/deck.test.ts]. No repository test/config
change is included. Also run the full unchanged `npm run check` suite.

Tests cover tap/sliding suppression, distance/velocity boundaries, threshold re-arm,
vertical/cancel gestures, spring, three-cycle wrap, navigation gating, stale callback
cancellation, keyboard/focus/live state, reduced/OS/background changes, deal, nudge,
fixed dark scope and unchanged image reference. Story play demos are included for
browser execution. Passing unit tests does not imply browser play passed.

Browser launch was attempted. System Chromium aborts at process_singleton_posix
with socket() Operation not permitted; no screenshot or frame-drop evidence can be
collected here. Mid-range Android WebView hardware measurements remain pending.

Owner/device checkpoint:

- [ ] Both Home viewports/themes, actual art/text legibility, no page overflow.
- [ ] Left/right swipe wrap, re-arm, short flick, snap-back, pointer cancel and pan-y.
- [ ] Tap versus swipe: no accidental play/resume; locked shake/tick; New puzzle target.
- [ ] Keyboard/indicators/live announcements and only one exposed card.
- [ ] One deal, top-only sheen/tilt, one nudge, return/reduced/background behavior.
- [ ] Capture comparable screenshots and measure dropped frames on Android.
- [ ] Accept the contained-art size and provisional back chrome/emblem before merge.

Stop for review. No automatic merge or app adoption.
