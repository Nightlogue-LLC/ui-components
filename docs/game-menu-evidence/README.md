# Game Menu selector review

Library issue #66. Baseline: merged main `45639c4` (identical source tree to `66f74db`, the previously built approved Storybook). The after images use this branch's production Storybook build.

| Before: 390px light             | After: 390px light            |
| ------------------------------- | ----------------------------- |
| ![Before](before-light-390.png) | ![After](after-light-390.png) |

| Before: 360px dark             | After: 360px dark            |
| ------------------------------ | ---------------------------- |
| ![Before](before-dark-360.png) | ![After](after-dark-360.png) |

New Game now lives inside the same floating editorial overlay. Five optional grid sizes and three optional difficulties toggle independently; no selection means random. Only Start New Game submits. Closing discards drafts. How to Play and Game Settings follow the selector; duplicated global preferences and the separate difficulty sheet are removed.

All story puzzle requests are explicit fixtures, not a production puzzle adapter. Application integration, real eligible selection, saved progress and navigation remain gothic-cozy-puzzles#38 after library review/merge. The API handoff is documented in [game-menu-new-game.md](../game-menu-new-game.md).

Validation performed before opening the PR:

- `NPM_CONFIG_CACHE=/workspace/.npm-cache npm run check` passed: lint, formatting, typecheck, 650 tests across 54 files, library build, publint, packed-consumer NodeNext/Bundler checks, both theme consumer builds, and static Storybook (363 entries).
- Chromium/Playwright tested 320×568, 360×640 and 390×844 in light/dark with reduced motion and normal motion: 12 combinations. Verified optional/deselected states, Start-only submission, close/reopen rollback, accepted-selection retention, native keyboard activation, focus trap/return, no horizontal overflow, bounded scroll panel, and every menu button at least 44×44px.
- Verified selected foreground/background against theme accent tokens, including hovered selected controls after their transitions finish.
- Axe WCAG 2 A/AA and 2.1 AA checks reported no violations in the tested menu panel for those combinations. This is scoped automated evidence, not a complete accessibility certification.
- Loading, unavailable, tall content, initially open, 360/390 story layouts and the OpenCloseReopen play story were checked; the migrated Difficulty SelectAndStart play story submits `{size: 8, difficulty: 'hard'}` without another dialog.
- `browser-results.json` records viewport/target geometry and accessibility results. State screenshots show the same scrollable panel when lower content is in view.

To review manually, build/serve Storybook, open V4 / Sheets / GameMenu, choose and deselect size/difficulty, close with Escape/trigger/scrim/Back, and reopen. Verify the committed baseline is restored, then Start and reopen to inspect the accepted fixture selection. Check Loading/Unavailable and scroll/focus to Game Settings on short screens. No live puzzle should be launched by this library preview.

Physical Android/WebView review and comparison with an app consuming this new API remain pending. No APK, application state, game logic, artwork or shared theme tokens were changed.
