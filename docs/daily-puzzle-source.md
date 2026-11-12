# Daily Draw with an app-owned puzzle

The approved `V4 / DailyDraw / Ritual` renderer previously required a monthly
artwork manifest and always advertised a restoration piece. A consumer with a
real daily puzzle but no monthly artwork could not use it honestly.

`createRitualDraw` now accepts exactly one source: the existing `manifest`, or
`puzzle: { title, action }`. Supported puzzle actions are `Begin`, `Resume`,
`Replay`, and `unavailable`. `onOpenPuzzle` activates the app's route without
emitting a monthly identity or restoration event. Omitting that callback also
makes the action unavailable. The unavailable panel remains visible and focusable
with `aria-disabled="true"`, an explicit Unavailable label, and no chevron.

Puzzle mode uses the same approved panel, card-back artwork, typography, spacing,
Moonlit Oxblood colors, approximate moon, and motion infrastructure. It does not
flip to invented artwork, show restoration pieces or streaks, or award anything.
The app supplies real title/action data; the library never picks a puzzle or
reads progress. Use `unplayed` for Begin/Replay and `in-progress` for Resume.
Monthly manifest mode and its existing callbacks remain unchanged.

```ts
createRitualDraw({
  enabled: true,
  puzzle: { title: '8 × 8 Trees & Tents', action: 'Resume' },
  state: 'in-progress',
  onOpenPuzzle: () => openExistingDailyPuzzle(),
  onDayChange: () => refreshFromLocalCalendar(),
});
```

Storybook: `Projects/Grim & Glimmer/V4/DailyDraw/DailyPuzzle` covers Begin,
Resume, Replay, Unavailable, and light/dark comparison using the exported API.
The original Ritual stories remain the monthly visual reference. Public exports
and CSS entry points are unchanged.
