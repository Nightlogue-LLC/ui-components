# Moonlit Oxblood — palette review

A separate, opt-in theme. The current default and plum/cream references remain available.
Find Moonlit Oxblood and the side-by-side comparisons under Reference Gallery and both
Grim & Glimmer Foundations groups. Foundations includes the full 54-pair contrast audit.

Requested RGB and alpha values are preserved. Light surface-high was unspecified;
it uses the light surface (#F8F5F1). The theme reuses bundled fonts, standard color
tokens and V3 label/hairline/error hooks. Four new roles are surface-high, muted text,
star and spire. Approved glyph images are used as masks, preserving their silhouettes.

Primary buttons use text fill and background-colored text, with a matching border.
The ampersand and selected states use accent; editorial labels use label.
Errors are transparent with a 2px underline. All Moonlit preview surfaces are flat.
Old gold/plum tokens remain confined to the old variants until approval.

## Calculated contrast

All text, muted text and label pairs pass 4.5:1 on background, surface and surface-high.
Solid accent, star, spire and error underline pairs pass 3:1 on all three surfaces.
Primary text/background colors pass 4.5:1 in both modes.

The audit composites translucent colors over each surface before calculating WCAG ratios.
The following supplied values fail the requested 3:1 graphics threshold:

| Mode / role                | Background | Surface | Surface-high | Minimum opacity proposal                       |
| -------------------------- | ---------- | ------- | ------------ | ---------------------------------------------- |
| Light maybe/exclusion, 50% | 2.72       | 2.80    | 2.80         | 55% across all surfaces (53% on surface alone) |
| Light hairline, 28%        | 1.87       | 1.87    | 1.87         | 46%                                            |
| Dark hairline, 22%         | 1.80       | 1.87    | 1.90         | 37%                                            |

Proposals retain the supplied RGB and change only opacity, searched in 1% increments.
These proposals are not applied: review the exact requested palette first.
Decorative dividers need not meet the non-text contrast criterion, but any hairline that
communicates a required boundary should use the proposed stronger opacity.

## Review boundary

This update is part of Phase 1 in PR #25. No default swap or app change.
The gallery retains its existing mock layout; this is a palette comparison, not completed
navigation or gameplay work. Native behavior and later visual phases remain separate.
