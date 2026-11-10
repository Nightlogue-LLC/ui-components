# Moonlit Oxblood

The sole Grim & Glimmer product theme. The neutral library example remains for shared-component development.

Import `themes/moonlit-oxblood.css` and set `data-nl-theme="moonlit-oxblood"` plus an explicit `data-nl-mode="light"` or `dark`. All palette values, glyph colors (`--star`, `--spire`) and opacity roles live in that theme entry. There are no story palette overrides. Fonts ship with the theme.

Board cells, marker controls, thumbnails and success accents share the SVG masks shipped with the project stylesheet. Their silhouettes were traced from the approved artwork without changing the source view boxes. No PNG glyphs or filter recoloring remain.

Review Editorial V3 → Moonlit Oxblood → Light Dark Comparison. These stories use the shipped board, collection cards, settings, success dialog and real BottomNav. The Home nav is compact and icon-only with accessible destination names. Story CSS sets preview positioning only.

The 54-pair audit still reports the supplied alpha contrast gaps: 50% light tentative/exclusion marks and decorative hairlines. Those values remain unchanged pending visual review.

Current authority and migration decisions: [V3 consolidation audit](v3-consolidation-audit.md).
