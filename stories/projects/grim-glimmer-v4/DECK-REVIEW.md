## Latest StackHome follow-up (PR #49)

The owner removed the logo header to give Daily Draw the top section. StackHome uses 24px top spacing / inter-block gaps and a larger responsive hero: calculated 336×504px at 393×852; 302×453px at 360×780. Device fit remains pending. The carousel comparison retains its original logo and size.

All three outer card papers now use the same 46% canonical accent/surface mix, removing the Arbiter’s stronger tint. Artwork files and the opaque shell backing remain intact. The face-down Daily Draw mini card gains a six-second 4px vertical float; reduced motion and reveal stop it. See `MONTHLY-REVIEW.md` for the current composition; earlier sizes below describe the previous revision.

---

# Phase 7 — illustrated SVG deck revision

Current direction: use the selected supplied illustrations as the entire visual object.
Preserve the built-in title and border. Remove the added HTML title, difficulty/status,
extra numeral, editorial plate and extra frame. Accent-tinted outer canvas and static
shadows now separate the illustrations from the page. The Camper
is the working title of the playable Trees & Tents puzzle. The Arbiter and The Architect
are locked illustrative upcoming entries; this does not choose or implement their engines.

Only V4 story files change. V3, production tokens, src/, dependencies, engine, saves,
app, approved brand assets and existing carousel comparison are untouched. No merge.

## Supplied artwork and authorized edits

| Art                 | Uploaded source                                                          | Edit                                                           |
| ------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------- |
| The Camper / I      | image.svg-1794372317173.svg                                              | I reduced 30%, centered at the same visual anchor.             |
| The Arbiter / II    | image.svg-1794373567423.svg                                              | II matches the new I height/anchor; bird fill becomes #681F35. |
| The Architect / III | tarot-card--the-architect--in-a-flat-handmade-lino.svg-1794373432638.svg | III matches the same numeral height/anchor.                    |

All three numeral groups have a common visible height ~4.8897% of image height and
common normalized center. Widths retain their natural I/II/III proportions. Architect
and Arbiter scaling compensates for the slightly different source numeral sizes instead
of assigning the same multiplier to three visibly different starting heights.

Paths remain vector shapes; no tracing, rasterization, font substitution or global
palette changes. Source uploads remain unchanged. New derived SVGs live in assets/.
XML groups/IDs provide isolated numeral and raven targets. Other artwork, including
the built-in THE CAMPER / THE ARBITER / THE ARCHITECT titles, is retained.

The Arbiter's raven and its perch are one compound source path. A duplicated identical
path with complementary clip regions changes **only the bird** to oxblood, preserving
the cream perch and nearby scale details. Eye/foot detail stays intact. The tall robed
figure remains cream: it is distinct from the raven and was not silently recolored.
This distinction needs owner confirmation if “pillar of cream” meant the figure too.

The earlier raster/plate treatment is superseded. Its now-unused PNG is retired from
the V4 branch; the original upload is not modified. SVGs retain source provenance
metadata. Inkscape renders were inspected for numeral consistency and isolated color.

## Presentation and runtime

`createCardIllustration()` composes trusted local SVG with a shared native Card tap
target. No added visible title/numeral/status/frame. Rounded clipping and outer-canvas color
are presentation styles, not new artwork layers. Accessible labels are Play/Continue
The Camper, The Arbiter locked, The Architect locked. Resume is an accessible outcome;
there is no new puzzle button painted over the artwork. Navigation remains injected.

Inline SVG IDs and url(#id) references receive unique per-instance prefixes, so gradient,
clip and numeral IDs cannot collide in repeated/light-dark previews. Source art is
shown with xMidYMid meet, not stretched or cropped. Hidden eager image resources and
local preload hints cover the three SVGs. No external font or art request.

The Camper/Arbiter art is approximately 2:3 and The Architect 0.65. The presentation
follows that supplied art rather than forcing the earlier 5:8 raster/plate layout:

| Default-font viewport | Hero envelope | Fan reserve |
| --------------------- | ------------- | ----------- |
| 393×852               | 280×420px     | 40px        |
| 360×780               | 266×399px     | 40px        |

These are arithmetic budgets, not browser measurements. Architect is contained at
its natural aspect ratio with a little side breathing room. Both Home themes retain
the supplied illustration colors, with only the outer canvas tinted from theme roles.
The 96px logo and shared navigation remain unchanged.

## Soft edges, separation and Home spacing revision

StackHome removes the extra HTML “The Puzzle Collection” line: the approved wordmark
already includes its own subtitle. It removes the solved/streak row and its story
props instead of hiding them behind an empty placeholder. The old Home/Carousel
comparison and standalone StatusLine story retain their original presentation.
`createHomeLogo({tagline:false})` reuses the existing logo without altering PNGs.

The outer card corner radius is 7% horizontally /4.667% vertically: about 20px at
280×420, so its curvature follows the illustrated inner border. Clipping applies
to artwork/sheen and the focus target; the shadow is outside the clip. The shell has the same opaque paper fill as the SVG
canvas, preventing the narrower Architect aspect ratio from revealing lower cards
at its sides; the artwork stays contained, not stretched or cropped. The accent focus ring has a contrasting surface
backing so it stays visible against tinted paper. No SVG path
geometry, numeral, title or figure was edited in this revision.

Only the SVG's first full-canvas background path receives a runtime `canvas` role.
Canvas paper mixes canonical accent/surface roles at 46% (Camper), 60% (Arbiter),
34% (Architect), giving the fanned edges distinct accent-based separation in both
modes. The inner scene and built-in ivory borders/title blocks retain their colors.
Stored SVG bytes are unchanged. This replaces the earlier strict fixed-canvas-color
presentation in response to the owner's request for separation from the dark page.

Each card has static warm depth, with a subtle accent edge in dark mode. A single
aria-hidden, pointer-transparent radial shadow sits below the whole stack, leaving
a visible gap that grounds the floating deck. Shadows/filter colors are not animated;
there is no repeated floating/bobbing effect or live blur animation.

Removing stats releases 34px at 360×780; the hero grows from ~243.33×365 to 266×399px.
At 393×852 it remains 280×420px. These remain default-font arithmetic budgets; safe
areas, browser fonts and real device overflow still need review. Today's Draw retains
its current 64px placeholder strip; its redesign remains a separate owner review.

## Preserved deck behavior

Three real card nodes, no clones; rear y12/scale.95/−4° and y24/scale.90/+4° with x peeks.
Pointer pan-y, 8px tap threshold, dx/width×14° drag rotation, next-card interpolation,
30% distance or 500 CSSpx/s recent-velocity dismissal. Both swipe directions advance;
ArrowLeft goes backward, ArrowRight forward; three 44px indicators jump directly.

220ms fly-off and 160ms wrap re-entry. Insufficient drag uses the unit-mass 400/30
analytic spring. One gated tick on threshold crossing (re-arm below both criteria),
one on successful settle. Locked activation shakes ±3px over 200ms and never routes.
Large drags suppress their click; cancel, vertical intent and lost capture are handled.

Deck group/roledescription, one exposed current native button, inert hidden lower art,
settled live region and keyboard focus return remain. Only the top gets will-change.
Cold deal 450ms/70ms stagger, top-only sheen/press lift, first-visit-prop nudge at1200ms.
Reduced motion removes fan/tilt/shake/nudge and cycles via 150ms opacity crossfade.
Visibility/OS changes and unmount cancel work/listeners. Existing ambient controller
remains shared; no extra looping illustration animation is added in this edit.

## Story and validation guide

V4/Home/Stack: Default, Mid Drag dx slider, Locked Card On Top, Wrap Around, Reduced
Motion, Keyboard And Indicators, Swipe Cycle and theme comparison.
V4/Home/StackHome: default, 393×852, 360×780, return, resume and both modes.
The original HomeScreen/CardCarousel stories remain available for comparison.

The normal `npm run check` validates lint, formatting, TypeScript, 529 existing tests,
library/package build and Storybook. Story-local deck tests use an ephemeral Vitest
config (root=repo, environment=jsdom, include=V4/deck.test.ts); no config change outside
V4. Focused tests include vector-only presentation, namespace/clip references and
existing gestures, focus, cancellation, motion and haptic contracts.

Inkscape previews were rendered and visually inspected. Browser/Android screenshots,
actual viewport fit, screen-reader/device gestures and mid-range WebView frame drops
remain pending. Chromium in this session previously aborts at socket() Operation not
permitted; an SVG render does not establish browser animation/frame-rate acceptance.

Review the I/II/III consistency, dark raven versus cream figure, natural art sizing,
plain illustration presentation, keyboard/swipe/wrap and reduced motion before merge.
Stop for owner review. No automatic merge or production adoption.
