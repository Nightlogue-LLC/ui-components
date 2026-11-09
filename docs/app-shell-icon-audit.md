# Unified application shell and Phosphor integration

## Audited baseline

- Library main: fca06ccd83c694b14f97da1c25b583e61316188c.
- App main: 743f41b8647b27a3ebe7d529ad0e803485089389.
- The app header slot used surface; the shared header used surface and a compact surface-hover override. Home and Settings used background. The document body painted legacy plum gradients beneath all routes.
- Main contained no Phosphor dependency or assets. Gameplay stories, the V3 icon utility, the main-screen demo and app screens all used separate hand-written SVG placeholders. The user's clarified mapping is the authoritative reference for this migration.

## Exact Storybook references

- Projects / Grim & Glimmer — Editorial V3 / Moonlit Oxblood / Home and Game Screen.
- Projects / Grim & Glimmer / Gameplay / Game Screen and Light Dark Comparison.
- Projects / Grim & Glimmer / App Settings / Gameplay Settings Toggle.
- Projects / Grim & Glimmer / Collection / Home Screen.
- New: Components / Icons / Light Dark Comparison.
- New: Projects / Grim & Glimmer / GameHeader / Closed Light Dark Comparison and Open Light Dark Comparison.

## Shared contract

The canvas, app-header wrapper and persistent app header use --nl-color-bg. The existing
1px divider remains. App-header safe-area padding is owned by the shared component,
removing the app's competing surface fill and top-padding override. Cards, settings
groups, controls and dialogs retain surface tokens. Light/dark palette values are unchanged.

## Icon mapping

All names below exist in @phosphor-icons/core 2.1.1. Default Light, 24px; active nav
uses Fill of the same icon. All UI paths read currentColor. No name substitutions.

| Existing symbol / semantic name          | Phosphor asset                     |
| ---------------------------------------- | ---------------------------------- |
| Back chevron / back                      | arrow-left                         |
| Hamburger / more (menu alias)            | dots-three-vertical                |
| Close and exclude crosses                | x                                  |
| Settings sun/circle/gear placeholders    | gear                               |
| Collection/Home outline                  | house                              |
| Stats (not added to navigation)          | chart-bar                          |
| Hint bulb                                | lightbulb                          |
| Restart                                  | arrow-counter-clockwise            |
| Undo / Redo                              | arrow-u-up-left / arrow-u-up-right |
| Sound / Sound off                        | speaker-high / speaker-slash       |
| Music / Music off                        | music-note / central slash overlay |
| Haptics / Haptics off                    | vibrate / central slash overlay    |
| Clear/trash                              | trash                              |
| Existing Achievements destination        | trophy                             |
| Existing legacy list/play/check controls | list / play / check                |
| Shared select arrow / generic Help       | caret-down / question              |

The custom star/spire SVG assets, paths, view boxes, masks and theme coloring are unchanged.
The marking toggle remains custom star and Phosphor X; no placeable spire tool is introduced.

## Menu behavior

The shared local sheet stays below the header, with a persistent 48px dots/X toggle.
Its label stays Game menu; aria-expanded tracks the sheet and aria-controls names the panel.
Motion is 150ms rotation/cross-fade and is disabled by Animations off or reduced motion.
Scrim click, downward swipe, Escape and browser/Android Back dismiss. Focus enters the
sheet and returns to its opener. Board/controls are inert during the sheet. The sheet adds
one same-URL history entry; close callbacks run after that entry is consumed before routing.
No native system-bar API or Android resource is changed; issue #24 remains separate.
