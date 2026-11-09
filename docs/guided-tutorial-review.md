# Stars & Spires guided tutorial concept

Review under **Projects → Grim & Glimmer → Dialogs → Guided tutorial**.
The story opens the existing shared modal automatically. This is the review surface for
[app issue #18](https://github.com/Nightlogue-LLC/gothic-cozy-puzzles/issues/18), pending visual acceptance.

## Flow

1. A single row introduces two fixed spires, outlined in gold immediately.
2. The same row highlights one empty cell. Three taps show tentative → confirmed → empty,
   with an instruction after each tap. Next stays disabled until the cell is cleared.
3. Full-board examples demonstrate adjacency, one-to-one pairing, stars touching diagonally,
   row counts and column counts. Red outlines identify each error, including the affected count.
4. A valid completed example introduces X exclusions and the game-menu rules reminder. Begin
   reports completion to the story's callback.

Back keeps completed practice progress within that dialog. Skip, X, Escape and backdrop dismiss
the tutorial. Reopening starts a fresh practice session. No app storage or real puzzle state is used.

## Iteration controls

- **glowDelay**: 0–1500ms pause before the glow begins (default 1000ms).
- **initialLesson**: 0–7, for opening a particular lesson without repeating practice.
- **Mode** toolbar: light or dark, with the approved story-only star/spire assets.
- **Viewport** toolbar: 320, 375 and 430px phone widths.
- Highlight outlines appear immediately; a gentle 2.6-second glow starts one second later. Gold guidance and
  red error outlines stay legible throughout; the grid and glyphs stay stationary.
- Reduced motion: static outlines appear immediately, with no fade or pulse.

The new `createGuidedTutorialDialog` composition accepts caller-authored lessons and keeps
practice progress local. Stars & Spires copy and example data live in the Storybook source,
not in the presentation component. The existing tutorial API and modal-flow simulation remain
available as the integration baseline. The puzzles repository has no changes in this PR.

## Acceptance

Walk through the story on a phone in both themes. Review pacing, wording, outlines and modal
spacing before app integration. This concept does not close app issue #18.
