# Daily Draw ritual and Phase 9 monthly artwork

Storybook review proposal based on merged main `96c6c66683aef9a10a562e8b61ff6edcf84e4710` (PR #47). All changes live under `stories/projects/grim-glimmer-v4/`. No production components, tokens, dependencies, app, saves, puzzle rules, artwork bytes or branding changed. No merge or app adoption is implied.

## Authority and decisions

The owner's Phase 9 supersedes the earlier list of 22 daily names. A month has one title; the daily text is **Piece N of M**. The local calendar date still selects `getDailySeed(date)` independently of the monthly geometry seed. There is no extra randomly named daily card.

The owner previously replaced the separate art/frame assembly with complete illustrated SVGs. Those SVGs remain intact. Three existing illustrations stand in for the forthcoming monthly 5:8 WebPs. The small face-down back uses provisional double hairlines and a moon/ray emblem, rather than reviving the discarded floral overlay or inventing a replacement artwork asset. The final supplied back/frame can replace this provisional back after review.

The original carousel and Home comparison remain. The older strip is clearly labelled **Home / DailyDraw / Legacy strip comparison**; **DailyDraw / Ritual** is the current monthly proposal used by **Home / StackHome**.

## Reused and added

| Area                   | Reused                                                                                                    | Added / changed                                                                                                 |
| ---------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Daily button           | `src/components/card/` native interactive Card, `src/core/theme.ts` through `applyTheme`, V4 `homeHost()` | `ritual-draw.ts`: single-button state machine, moon emblem, countdown, local-date guard, callbacks              |
| Actions and navigation | `src/components/button/`, `src/components/bottom-nav/` including selection API                            | Replay, grid, archive, Save/Share previews; no new generic button implementation                                |
| Monthly geometry       | Existing `home-model.ts` canonical date validation and daily seed                                         | `month-model.ts`, `month-geometry.ts`: manifest, calendar/archive, deterministic clipped polygons, cache        |
| Artwork                | Existing Camper / Arbiter / Architect SVG URLs                                                            | `month-art.ts`: one image definition, one mask, two image uses, static lead paths and today's outline           |
| Motion                 | V4 `home-motion.ts` loop lifecycle and Web Animations                                                     | `ritual-motion.ts`: interruptible finite jobs; V4 loops now consume expected cancellation rejections            |
| Completion             | Shared BottomSheet/Dialog via V4 `overlay-primitives.ts`                                                  | `month-card.ts`: restore sequence, progress announcement, final-pulse completion sheet                          |
| Trophy/archive         | Existing V4 shell and compact navigation                                                                  | `month-fixtures.ts`, `month-collection.ts`: trophy preview, past thumbnails and empty state                     |
| Home                   | Existing deck, logo, navigation and floating shadows                                                      | `deck-fixtures.ts` uses the new ritual; `deck-model.ts` accepts an explicit daily height in budget calculations |

## Presentation and states

The fixed night panel is **88 CSS px** high, plus a **10px** top allowance for the **44×70px** mini card, for a **98px** layout slot. Panel radius is 18px; the rose border is 40%, the fixed star pattern 6%. The mini rotates -4 degrees and lifts on press. The panel stays dark on either page theme.

| Default-font viewport, zero extra safe-area insets | Hero art envelope | Trade-off                                                                   |
| -------------------------------------------------- | ----------------- | --------------------------------------------------------------------------- |
| 393×852                                            | 280×420px         | Hero retains its maximum size                                               |
| 360×780                                            | 243.33×365px      | Hero gives 34px of height to the taller ritual versus the merged 64px strip |

These are arithmetic budgets, not measured browser bounds. The layout still reserves 96px for the wordmark and 40px below the art for the fan/ground shadow, plus indicators and navigation. The duplicate tagline and stats remain absent. Safe-area insets reduce available hero space. Font loading, enlarged text and device screenshots remain review items.

Daily stories cover unplayed, revealing (Controls scrub), revealed/unstarted, in-progress, solved with and without a streak, hidden, flip replay, reduced motion and 360/393 presets. Both page themes are rendered. No ISO date is printed in the new ritual. The entire panel is one native button; non-actionable states have no chevron and ignore activation. Solved countdown announces only a changed minute. Streak text appears only at two nights or more.

Monthly stories cover day-one empty, 40%, 90%, complete, fragmentary/expired past, grace period, today's restore replay, final-piece replay, 28/31-day examples, reduced motion, keyboard grid, trophy tab and both mobile presets. Collection stories include fragmentary thumbnails and **No pieces restored yet**. The accessible six-column grid has 44px minimum targets, roving arrow/Home/End focus, explicit day/state labels and filled/hollow pips. Restored dates remain replayable during their availability window.

## Determinism and geometry

- One site per calendar day: 28, 29, 30 or 31. Leap February is covered by tests.
- Seeded Poisson-disc dart throwing with deterministic radius relaxation if the target count needs more space; three Lloyd centroid iterations.
- Voronoi polygons are clipped to the 500×800 art window. Insets are 1.5 **author-space** units, scaling with the artwork. Constant 1px lead strokes remain via non-scaling stroke. There are no per-shard image nodes.
- Seeded distance-plus-noise ranking places outer pieces earlier. The closest 15% are held to the end; the closest focal piece is last. No angle/spiral ordering.
- A bounded cache retains up to 12 immutable month layouts, keyed by monthKey and checked against seed/focal-point changes. Image/title changes do not alter geometry.
- Restored pieces show the full-color image through the mask. Unrestored glass uses a static desaturated 8% image ghost over canonical night surface. The lead layer stays mounted for every piece.

## Timing and interruption

| Interaction              | Default                                                         | Reduced motion                                      |
| ------------------------ | --------------------------------------------------------------- | --------------------------------------------------- |
| Idle mini/halo           | 4s breathing; halo .25–.5                                       | Off                                                 |
| Sparkle                  | One crossing per 8s                                             | Off                                                 |
| Press                    | -4px lift / straighten, 160ms                                   | No movement                                         |
| Flip                     | 500ms, 800px perspective, face swap at 90 degrees               | 150ms crossfade                                     |
| Deal into puzzle adapter | 350ms fade/scale fallback                                       | 150ms fade                                          |
| Piece restoration        | 700ms opacity + static edge bloom                               | 150ms opacity                                       |
| Last piece               | 900ms lead brightening / cream sweep, then 350ms tilt and sheen | No sweep/tilt; completion follows the 150ms restore |

Only opacity and transform are animated. The ghost desaturation and edge drop-shadow are static. No audio asset or extra dependency was added.

Expected loop cancellation rejections are handled in the existing V4 loop helper. Unmount, backgrounding and OS motion-preference changes cancel finite jobs. An interrupted restoration rolls back its preview mask without a storage or settle callback. Completed restoration sends one progress announcement and one mocked storage payload. Interrupted completion embellishments do not open a stale sheet. Replay is an explicit review control.

Haptics are adapter calls gated by the haptics option: Light on draw press / restoration start, Medium on flip landing / restoration settle, Success on month completion. The flip SFX callback is separately gated by `sound`. Browser previews do not vibrate a phone without a native adapter.

## Tokens

All page colors use canonical Moonlit Oxblood roles. The panel gets an existing dark theme scope for readable text in either page mode. Two V4-only fixed physical-object aliases map to canonical dark surface **#1C1417** and dark accent **#B87A8C**. They keep the night glass/leading stable across page themes; they are not new production token definitions. Opacity, color-mix and warm shadows derive from these roles. Restoration cream uses light `on-accent` or dark `text`. No alternate palette is proposed.

## Data and wiring left

`MonthManifest`: `{monthKey, title, imageUrl, altText, focalPoint:{x,y}, seed}`.

`MonthProgress`: `{version:1, monthKey, seed, restoredDates:string[]}`. Dates are canonical local calendar strings. The seed is recorded so future migrations can detect changed manifests; a published month's seed/focal point must stay stable for all players.

`storageStub()` performs no writes. The daily contract returns `puzzle:null`. Production adoption still needs approved manifests/real WebPs, local-midnight manifest selection, a stable daily puzzle catalog/generator contract, save migration/storage, solve-to-restore wiring, the native haptics/SFX setting adapter, real navigation, streak input, and real Save/Share behavior. The feature constant defaults **off**; stories opt in.

Moon phase uses the supplied 2000-01-06T18:14Z epoch and 29.530588853-day cycle with eight nearest-phase buckets. It is an **approximation**, not an astronomical ephemeris.

Archive availability is a pure function of `(localDate, restoredDates, monthKey)`. Past days in the current month are available; the first three local calendar days of the following month are inclusive grace. Example: November pieces remain available through December 3, expiring December 4. Future days never play. No persistence or anti-cheat clock policy is introduced.

A running preview checks the clock on activation, visibility changes and minute intervals. Crossing local midnight blocks stale seed activation and emits `onDayChange`; the consuming host must select the correct manifest and rebuild. Calendar arithmetic uses date fields rather than 24-hour timers, including DST.

## Assets and performance evidence

| Reused temporary source | Raw bytes |
| ----------------------- | --------: |
| `assets/camper.svg`     |   153,669 |
| `assets/arbiter.svg`    |   110,267 |
| `assets/architect.svg`  |    61,816 |
| Total                   |   325,752 |

No new image/audio files. The star field is a fixed ten-point inline SVG. Each MonthArt has one `<image>` definition and one restoration mask, referenced twice for ghost/color; each mask contains only 28–31 vector paths. The same asset URL can be browser-cached across surfaces. Restore jobs update opacity; the geometry is generated once per cache signature.

**Measured Android frame rate / frame drops: pending.** No physical mid-range Android WebView is connected. Local Chromium screenshot execution was attempted and aborts with `socket() failed: Operation not permitted`; no screenshots or browser-layout claims are substituted. SVG opacity masks still need device profiling; transform/opacity properties alone do not establish compositor performance.

## Checks and review

Local checks: TypeScript, ESLint, Prettier, **529 existing tests**, **57 V4 tests** (23 deck + 34 new calendar/geometry/ritual tests), library build, package-consumer smoke check and Storybook build (**342 entries**). Focused tests were run under `TZ=America/Denver`, covering spring/autumn DST boundaries. All test/config additions remain within V4; the temporary Vitest runner config is outside the repository, with include patterns for V4 month/ritual/deck tests and jsdom. Normal repository test includes remain unchanged.

Before merge/adoption:

- [ ] Review Ritual / FlipReplay / RevealingScrub and all state copy in both themes.
- [ ] Review MonthCard / RestoringToday and FinalPieceReplay, including completion sheet close/focus behavior.
- [ ] Check Home / StackHome at 393×852 and 360×780 with real Android safe areas, font loading and enlarged text; capture comparable screenshots.
- [ ] Review keyboard grid and a screen reader; verify a single restoration announcement and minute-only countdown speech.
- [ ] Measure restore/deal on a mid-range Android WebView: record device/OS/WebView version, frame duration and dropped frames.
- [ ] Supply real monthly 5:8 WebPs and the final card-back/frame treatment if the provisional back needs replacement.

Open product questions for later integration: keep the three-day grace period after device review; should completed images be downloadable/shareable, and with what title/branding; should travel/timezone changes permit replay or only change the next local unlock? Current preview honors the requested three local days and local midnight, with no UTC/server-day conversion or clock-tamper enforcement.
