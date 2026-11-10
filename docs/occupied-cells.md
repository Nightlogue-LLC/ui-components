# Stars & Spires occupied cells

The owner approved filled cells for spires and stars in both modes. Empty cells
and X exclusions retain the board surface. Tentative stars use the same fill as
confirmed stars, retaining their existing glyph opacity.

| Role                 | Light     | Dark      |
| -------------------- | --------- | --------- |
| Spire cell           | `#E1DAD5` | `#332329` |
| Star cell            | `#EAD8DE` | `#3B202A` |
| Spire glyph          | `#170F12` | `#B87A8C` |
| Confirmed star glyph | `#681F35` | `#F4F0F2` |

Theme tokens own both fills; the shared board owns state mapping. The app's
conflict border must preserve `--nl-grim-glimmer-cell-bg`. Pointer feedback is
transient and returns to that state fill on release. Focus never determines fill.
The shared styles apply to gameplay, tutorials and decorative previews.

No SVG mask, artwork file, primary palette role, mark cycle or engine behavior
changes. Full-opacity glyphs pass 3:1 contrast against their occupied fill in both
modes. Existing tentative opacity remains unchanged; its previously documented
contrast limitation still requires a separate decision.

Review V3 Gameplay / Board Glyphs and Game Screen in light and dark modes.

## Mobile overlay motion

The local game-menu overlay clips its translated panel so entry cannot extend
page scroll bounds. Focus entry, Tab cycling and restoration use preventScroll.
The menu toggle uses the canvas color for idle, hover and press through shared
IconButton ghost-background hooks, preserving its focus-visible ring.

Success content waits for the shared sheet entry to finish before its one-shot
star/copy reveal starts. Motion-off and reduced-motion paths reveal it immediately
without the decorative animation. Tutorial guidance uses an inset pulse, keeping
it inside the cell rather than relying on a faint shadow outside clipped grids.
