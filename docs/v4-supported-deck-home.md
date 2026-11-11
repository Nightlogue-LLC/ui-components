# V4 tarot deck and Home APIs — third slice of #51

Based on merged library main `38972748ffdb7c37e91098438cad73d681e5f6ed` (PR #53). This promotes the accepted three-card deck and logo-free Home composition. Current Stack/StackHome stories consume the shared implementations. App routing, first-play/resume selection, puzzle engines, storage, artwork files and Daily Draw readiness remain app responsibilities.

## Imports

```ts
import '@nightlogue-llc/ui-components/styles.css';
import '@nightlogue-llc/ui-components/themes/moonlit-oxblood.css';
import '@nightlogue-llc/ui-components/projects/grim-glimmer.css';
import {
  createTarotDeckCard,
  updateTarotDeckCard,
  createTarotDeck,
  createTarotHome,
  type TarotCard,
  type TarotCardState,
  type TarotDeckOptions,
  type TarotDeckState,
  type TarotHomeOptions,
  type TarotHomeState,
} from '@nightlogue-llc/ui-components/projects/grim-glimmer';
```

The existing project CSS entry includes deck and Home styles. No new dependency, CSS subpath or story import is required. Core `createLoopMotion` supplies the shared ambient lifecycle; old comparison previews consume that implementation too.

## Artwork and identity contract

| Field        | Consumer contract                                                                                                                                                                                                            |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`         | Stable nonempty UI identity supplied by the app. It is not an engine/save ID.                                                                                                                                                |
| `title`      | Nonempty accessible card title; no hardcoded Camper/Arbiter/Architect mapping exists in the factory.                                                                                                                         |
| `artwork`    | Trusted app-owned SVG DOM. The library clones it, namespaces root/descendant IDs and local attribute references, and preserves its geometry, numeral, title and scene colors. No markup string is parsed by production code. |
| `preloadSrc` | Optional matching image URL for eager local preload. No default illustration URL is bundled.                                                                                                                                 |
| `locked`     | Coming-soon state. Activation requests locked feedback only; it never invokes onActivate.                                                                                                                                    |
| `inProgress` | Accessible Play/Continue state, supplied from real app progress. No save lookup occurs in the library.                                                                                                                       |
| `label`      | Optional localized accessible-name override; a blank label is rejected.                                                                                                                                                      |

The app can mark the supplied SVG's outer paper path with `data-art-part="canvas"` before passing its DOM clone. Only that role receives the accepted 46% accent/surface paper treatment. The library does not guess which path is the canvas. Approved inner artwork and the original file bytes remain unchanged. Architect retains an opaque outer backing and natural contained aspect ratio. No new title plate, frame or duplicate HTML title is added.

`createTarotDeckCard` is a standalone renderer; `updateTarotDeckCard(root,state)` applies lock/resume/label state without replacing its native button or artwork. Interactive deck behavior belongs to `createTarotDeck`.

## Three-card controller

`createTarotDeck({cards,initialCardId?,onActivate,onLocked?,onCardChange?,tick?,haptics?,animations?,reducedMotion?,firstVisit?,launch?})` accepts exactly three distinct supplied cards. This matches the reviewed finite stack; it is not an unreviewed variable-length carousel. Playability is independent of card order. Unknown IDs are rejected instead of being coerced into a route.

The return value exposes `element`, `cards`, `selected()`, `cycle(id)`, `update(state)`, `mount()` and `dispose()`.

| Operation       | Contract                                                                                                                                                                                                                                                                                                               |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mount()`       | Call after attaching the deck to the document. Installs local pointer/keyboard handling and visibility/reduced-motion observation.                                                                                                                                                                                     |
| `selected()`    | Returns the selected app-supplied card ID.                                                                                                                                                                                                                                                                             |
| `cycle(id)`     | Requests the existing animated selection behavior and emits one settled onCardChange(id). No hash/history/storage mutation.                                                                                                                                                                                            |
| `update(state)` | Full card-state array in the original ID order, plus optional selectedId/haptics/animations/reducedMotion/active. Applies accepted external state without callbacks or a new artwork/button instance. Omitted card lock/resume fields mean false; omitted optional controller preferences retain their current values. |
| `dispose()`     | Terminal cancellation of pointer capture, jobs, idle timer, observer and listeners. Future activation/settlement/remount cannot emit outcomes. Removal from the document triggers the same cleanup.                                                                                                                    |

The app handles `onActivate(id)` using its real first-play/resume policy. The callback receives identity, not a mock puzzle, null result or suggested route. `onLocked(id)` is feedback only. A first-position locked card and a third-position playable card work without special cases. Live selection announcements now include the actual supplied title for locked cards too.

Preserved mechanics: three real nodes, no clones; both swipe directions advance; ArrowLeft goes backward and ArrowRight forward; three 44px indicators jump directly. A drag starts after 8px horizontal intent and keeps vertical pan available. Dismissal uses 30% distance or 500px/s recent velocity, with the accepted tilt, interpolation and analytic spring return. Threshold and settled ticks use the injected preference-gated adapter; no Capacitor or vibration strength is chosen here.

Normal motion remains 220ms flight, 160ms wrap re-entry, 450ms cold deal with 70ms staggering, top-only sheen, and a once-per-first-visit nudge after 1200ms. OS/explicit reduced motion removes fan/tilt/shake/nudge and retains the accepted 150ms opacity selection. Turning animations off skips effects immediately. Background, preference/state changes, cancellation and removal invalidate stale work. Interrupted pointer gestures suppress their compatibility click. An external selection transfers existing card focus only when the previous card owned focus.

## Logo-free Home composition

`createTarotHome({deck,navigation,ambient?,dailyEnabled?,daily?})` composes the shared deck, accepted atmosphere, static ground shadow and compact icon-only BottomNav. Navigation uses the existing BottomNav options and controlled acceptance model. The app supplies destinations/icons/value/onNavigate and handles page routing. The source factory includes no logo, duplicate tagline, stats row, placeholder achievements or fake settings data.

The return value exposes `element`, `deck`, `mount()`, `update(state)` and `dispose()`. Home state extends the full deck state with optional navigationValue/dailyEnabled/daily. Accept navigation with an update containing navigationValue; clicking a destination only requests it. Set active:false when keeping the view mounted behind another page. This makes it inert and stops decorative work. Use dispose on final unmount; Home removal automatically releases its owned ambient/deck resources.

Daily Draw is **OFF by default**. No strip, blank reserved slot, date, seed, streak, image, Begin/Continue button or provider callback is created in that state. Enabling the slot requires a supplied app-owned HTMLElement; a missing widget throws before any state update. The slot preserves the reviewed 98px budget (88px panel plus 10px pop-out allowance). Readiness and the widget's own lifecycle remain with its adapter. The library contains no daily catalog, restore store, solve-to-piece mapping or monthly activation logic.

The app must keep the production flag off until the separate Daily/monthly activation gate is satisfied. Existing Storybook samples opt in explicitly with their labelled fixture widget; their sample clock and artwork stay in stories. `StackHome / DailyDisabled` provides an explicit flag-off review target.

Ambient opacity loops use the shared visibility/reduced-motion lifecycle. They pause when hidden, respect app motion/active state, and are disposed on removal. Ordinary card-state updates do not restart those loops. There is no continuous deck bobbing or animated shadow/filter. All theme and typography roles remain the current Moonlit Oxblood contract.

## App adoption and review

This is the main export prerequisite for app #46. After merge, pin the actual reviewed library commit in package.json and package-lock.json. The app's card mapping remains I/The Camper/Trees & Tents → current `tents` engine and existing saved puzzle IDs; II/Unequal and III/Shikaku stay locked. No save migration follows from a visual card ID. Home selection must continue the existing first tutorial/Easy 6×6/resume/catalog policies through its app adapter.

Tests cover app-owned artwork clones and clip IDs, state/focus preservation, non-first playability, locks, controlled selection, invalid IDs/order, inactive/disposed activation, removal during flight, Daily off/on guards and navigation without storage/history writes. Existing pointer, wrap, keyboard, nudge, timing and reduced-motion fixture tests remain active. Package consumer checks compile all new APIs under NodeNext/Bundler, resolve the JS exports and bundle both-theme/neutral CSS.

Comparable browser/device screenshots remain pending. Chromium was attempted again and aborts at `process_singleton_posix.cc:297` with `socket() failed: Operation not permitted (1)`. Static Storybook uses the external build-only empty-network-interface preload; it is not committed. No static build or unit test establishes measured 393×852 / 360×780 fit, physical safe areas, TalkBack or Android frame drops. Review Stack/StackHome including DailyDisabled, cold/return, resume, wrap, keyboard, locked top card, reduced motion and large text before app adoption.

Issue #51 remains open for the remaining promotion work, including reviewed supplied tentative-tent glyphs, completion/tutorial composition and flagged monthly presentation. This PR does not merge or release an app change.
