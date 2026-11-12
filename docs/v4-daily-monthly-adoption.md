# Daily Draw and monthly library adoption

Final phase 8 library slice, following merged PRs #60–62. The production app remains disabled until its separate adapters and activation work are approved. This library exports presentation and calendar geometry, not a daily puzzle generator, progress store or reward ledger.

## Supported imports

All exports are under `@nightlogue-llc/ui-components/projects/grim-glimmer`; load the normal shared/theme/project CSS.

- `createRitualDraw`, `RitualDrawOptions`, `DailyDrawIdentity`, `DRAW_STATES`
- `createMonthArt`, `createMonthCard`, `MonthCardOptions`, `createMonthCollection`
- `MonthManifest`, `MonthProgress`, `monthLayout`, `shardForDate`, calendar/date/seeded geometry helpers

Daily Draw requires a caller-supplied manifest. It defaults disabled. Enable it explicitly, supply a live local clock, restored dates and real progress/streak inputs as available. No default artwork, sample streak, 40% progress, `puzzle:null` payload or mocked storage is imported. `DailyDrawIdentity` contains date/month/title/piece metadata only. Actual puzzle identity and navigation belong to the app closure supplied as `onBegin`.

Unplayed activation reveals the supplied monthly image with the accepted 500 ms flip or 150 ms reduced-motion fade. Begin/Continue requires an `onBegin` action. When absent, the revealed control announces Draw revealed and is unavailable for navigation. A supplied callback is still not proof of a valid puzzle: the app must resolve a real daily catalog record before exposing it.

Local date is checked on activation and again after asynchronous reveal/Begin effects. Minute/visibility updates announce rollover once and disable stale navigation. Removal clears clocks, finite effects and ambient loops; reconnection cannot restart a disposed draw. Reduced motion, visibility and preference-gated haptic/sound callbacks retain their existing boundaries. The 88px panel plus 10px pop-out and accepted float/flip presentation are preserved.

## Monthly card and archive

Supply a manifest and restored-date snapshot. `restore()` is an explicit visual request after an app-owned restoration decision. It does not validate a puzzle solve. The app owns authoritative save/reward persistence; `onStorage` remains a supplied snapshot callback. Preview replay is opt-in and used only by Storybook. Save/Share buttons require provided actions and do not pretend to export a file.

Pass a live `clock` alongside the card's `localDate` snapshot. Day activation and restoration reject a changed date; rebuild the card with fresh app data after rollover. Without a clock, the card is a deterministic snapshot appropriate for explicit previews, not a live daily routing adapter.

Archive progress is matched by version, month key and artwork seed, then filtered to real dates in that month. Wrong-seed or foreign-date rows cannot fabricate a nonempty archive. Thumbnails have no navigation when `onOpen` is absent, and detached thumbnails do not dispatch old callbacks. The six-column piece grid retains 44px targets, arrow/Home/End navigation, state labels and filled/hollow restoration pips.

## Fixture boundary

The Storybook wrapper alone supplies sample manifests, a fixed preview clock and legacy placeholder callback payloads for existing stories/tests. Production imports have no dependency on `stories/`. No production flag is switched on by importing these factories. Re-exporting fixture data from the library is prohibited.

## App follow-up and activation

Pin the reviewed merge commit in the app and update its lockfile. Keep the existing production feature flag OFF; use explicit development fixtures for visual review. Before enabling production, provide a real stable daily puzzle catalog, versioned restoration saves/migration, solve-to-piece mapping, replay policy, final monthly artwork manifests, travel/timezone policy, real streak data and honest audio/save/share integrations. The app adapter must revalidate the date and resolved puzzle before routing, and retain existing core game saves.

Core V4 can finish with these features disabled. Physical Android frame timing, both-theme visual parity, safe areas, accessibility and real device interruption remain acceptance work; unit/build checks are not hardware evidence.
