# Editorial V3 production cleanup

Moonlit Oxblood is the sole product theme, with explicit light and dark mode blocks in `src/themes/moonlit-oxblood/moonlit-oxblood.css`. Neutral remains a library example. Retired G&G themes and palette mock galleries were removed.

All screens use shipped components and SVG glyph masks. Home uses the compact icon-only BottomNav with accessible destination names. Story CSS controls layout only. Fonts retain their original licenses and hashes under the Moonlit theme.

Clues render an aria-hidden visible numeral and a visually hidden full description, including localized row/column callbacks. The application updates that description as counts change.

The separate game repository pins this library change, activates Moonlit by default, and removes its PNG glyph overrides. Native platform behavior and puzzle/save logic are unchanged.

Current authority and migration decisions: [V3 consolidation audit](v3-consolidation-audit.md).
