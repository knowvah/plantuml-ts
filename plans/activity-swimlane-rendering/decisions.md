# Architecture decisions — `activity-swimlane-rendering`

Confirmed 2026-09-09 before decomposition. Treat every one as **locked**.
If a task discovers a conflicting constraint, amend the decision here and
halt for review — do not silently override it.

## D1 — Derive lane extents from our own geometry, in two phases

**Context.** Upstream sizes lanes by *measure-by-drawing*:
`Swimlanes#computeDrawingWidths` (`ftile/Swimlanes.java:379-395`) intercepts
a real `drawU` through `UGraphicInterceptorAllSwimlanes`, collects a
`LimitFinder` min/max per lane, then calls `swimlane.setMinMax(...)`. Our
engine is single-pass with self-sizing `Gtile`s.

**Decision.** Do **not** mirror the interception. `assignCoordinates`
already holds every node and every edge point; bucket that geometry by lane
and take min/max directly. Upstream intercepts a draw because its ftiles do
not expose geometry — a constraint this port does not have.

**Amended at decomposition (2026-09-09):** the work is inherently
**two-phase**, and the tasks are split along that seam:
1. measure per-lane content extents in lane-LOCAL coordinates (T4)
2. compute widths, assign lane origins, then place nodes (T5)

Placement cannot precede width assignment, because a lane's x depends on
the cumulative widths of the lanes before it. That ordering is the real
reason upstream has a separate pass, and it survives the divergence.

**Consequences.** A structural divergence from upstream, recorded
deliberately. CLAUDE.md's "upstream architecture is authoritative" governs
engine boundaries, dispatch and parser seams — not a measurement technique
whose reason for existing is absent here. Record it in `DIVERGENCES.md` at
close-out.

## D2 — The title band height is MEASURED, not the FontSize constant

**Context.** `Swimlanes#getTitlesHeight` (`:309-315`) returns the `max` over
lanes of each title's own `calculateDimension(stringBounder).getHeight()`.
In the goldens that value is 18, which equals the resolved swimlane
`FontSize`.

**Decision.** Port `getTitlesHeight` literally. Do not write 18, and do not
substitute `swimlaneFontSize(theme)`.

**Consequences.** The two coincide today only because
`StringBounderFromWidthTable.java:71` returns `size` unconditionally — the
same fact the 1.0x line advance rests on. Hardcoding the coincidence breaks
the moment a title wraps to two lines, which `getWrap()`
(`Swimlanes.java:296`) makes reachable.

## D3 — Emit the transparent title-band rect

**Context.** `Swimlanes#drawTitlesBackground` (`:357-367`) draws a
`URectangle` when `PName.BackGroundColor` is non-null.
`plantuml.skin:310` sets `BackGroundColor transparent` — a colour, not
null — so the jar emits `<rect … fill="none" style="stroke:none;"/>`.

**Decision.** Emit it.

**Consequences.** It is upstream's element and it counts toward
`svg/g[][childCount]`, 47.4% of the current residual weight. Skipping an
invisible element to keep the output tidy is the incidental "improvement"
CLAUDE.md rules out.

## D4 — Un-alias `SwimlaneBorderColor` from the header background

**Context.** `skinparam-key-handlers-table-b.ts:259-261` maps
`swimlanebordercolor` and `swimlaneheaderbackgroundcolor` to the SAME
accumulator field, `acc.swimlaneBorder`, which reaches the theme and is
then read by nobody.

**Decision.** Split them: `SwimlaneBorderColor` drives the divider stroke
(`PName.LineColor` on the swimlane signature);
`SwimlaneHeaderBackgroundColor` drives the band fill
(`PName.BackGroundColor`). Both are real, distinct upstream properties on
the same StyleSignature.

**Consequences.** A latent bug, fixed. Nothing observable regresses: no
corpus fixture exercises either key and the field is currently unread. T1
must still assert that no other engine's resolved theme moves.

## D5 — Titles are drawn LAST

**Context.** `Swimlanes#drawU` calls the divider loop before `drawTitles`
(`:369-377`). Our renderer draws the band and titles first.

**Decision.** Dividers and band first, titles last.

**Consequences.** Not cosmetic. `compareSvg` pairs sibling elements
POSITIONALLY, so our header-first order is what currently pairs our lane
title against the jar's action label — a mispairing that inflated the cost
of eight fixtures during `activity-style-defaults` T5/T6. Pinned as a
decision so a later refactor does not quietly reorder it.
