# Architecture decisions — `activity-style-defaults`

Confirmed 2026-09-08 before decomposition. Treat every one as **locked**.
If a task discovers a conflicting constraint, amend the decision here and
halt for review — do not silently override it.

## D1 — Resolve through the shared seam, not a private lookup

**Context:** `src/diagrams/activity/` reads `ctx.theme.fontSize` /
`theme.fontSize` at 20+ call sites and calls no `resolveElement*` helper.
The description engine already consumes the seam
(`src/diagrams/description/layout.ts:21,362`).
**Decision:** Activity resolves per-element values through
`resolveElementFontSize` / `resolveElementLineThickness`
(`src/core/theme-element-resolve.ts`), never through a new activity-private
theme lookup.
**Consequences:** a user `skinparam DiamondFontSize 40` or `<style>
activityDiagram { activity { FontSize N } }` reaches the same value the
built-in default occupies, which is what closes
`activity-diamond-font-skinparams`.

## D2 — Built-in defaults are activity-LOCAL; only OVERRIDES use the bucket

**Context:** upstream's signature is diagram-scoped —
`StyleSignatureBasic.of(root, element, activityDiagram, arrow)`. Our
`theme.colors.elements` is **flat**: `style-map-element.ts:76-85`
(`resolveElementBucketSelector`) accepts a `<diagramType>.<sname>` selector
spelling but **returns the bare `sname`**, so the bucket key carries no
diagram scope. `arrow`, `note` and `circle` are shared SNames already read
by description, class and state.
**Decision:** Seeding `defaultTheme.colors.elements.arrow.fontSize = 11`
is **forbidden** — it would move every other engine's arrows. Instead:
- **Defaults** live in `src/diagrams/activity/activity-style-defaults.ts`,
  one named constant per value, each carrying its `plantuml.skin:NNN`
  citation.
- **Overrides** come from the bucket. `resolveElementFontSize` returns
  `undefined` when the element declares none — its own doc comment says
  *"caller applies its own default"* — so the activity default is exactly
  that caller default.
**Consequences:** this is the two-tier cascade upstream has, expressed in
the one place our flat bucket can express it. It is a refinement of the
approved "populate SName buckets" direction, not a reversal: the seam is
still the resolution path; only the *default* tier is activity-local
because the bucket cannot hold a diagram-scoped default.

## D3 — Extend `ELEMENT_BUCKET_SNAMES` with activity-EXCLUSIVE SNames only

**Context:** `ELEMENT_BUCKET_SNAMES`
(`src/core/skinparam-element-buckets.ts:26`) currently contains none of
`activity`, `diamond`, `swimlane`, `activityBar`. All four are real members
of upstream's `SName` enum (`net/sourceforge/plantuml/style/SName.java`).
**Decision:** Add exactly those four. Do **not** add `arrow`, `note`,
`circle` or `composite` — the first three are already routed by other
engines, and adding them here would change which selector spellings resolve
for every diagram type.
**Consequences:** bounded blast radius. T1 must assert that no other
engine's resolved theme changes.

## D4 — `RoundCorner N` maps to `rx = ry = N / 2`

**Context:** `activityDiagram { activity { RoundCorner 25 } }`
(`plantuml.skin:361`); the jar emits `rx="12.5" ry="12.5"` on the activity
rect (`bakopu-96-pudu086`), we emit `rx="8"` and no `ry`.
**Decision:** Emit both `rx` and `ry` at half the resolved `RoundCorner`.
**Consequences:** `ElementColors` gains an optional `roundCorner` field
(T1). The current `rx="8"` is an unsourced constant and is deleted, not
adjusted.

## D5 — `#2` / `#5` are palette shorthands, resolved not hardcoded

**Context:** `circle { start, stop, end { LineColor #2; BackgroundColor #2 } }`
and `activityBar { BackgroundColor #5 }`. The jar emits `fill="#222"` and
`stroke:#222` for the start ellipse; we emit `fill="#181818"` and no stroke
at all.
**Decision:** Resolve `#2` through the existing colour machinery
(`klimt/color/HColorSet`), never by writing `'#222'` as a literal.
**Consequences:** if the shorthand does not resolve today, that is a
finding to record in the journal, not a licence to hardcode the observed
golden value. **Fitting a value to a golden is forbidden** — CLAUDE.md.

## D6 — The 1.4x sizer line height is in scope and is deleted

**Context:** `activity-layout-helpers.ts:44,62` computes
`lineHeight = ctx.theme.fontSize * 1.4` — unsourced.
`activity-renderer-shapes.ts:88` uses `lh = theme.fontSize` with a citation
(`StringBounderFromWidthTable.java:71`, added by
`activity-element-granularity` T3).
**Decision:** The sizer adopts the renderer's cited 1.0x advance.
**Consequences:** every multi-line action and note loses ~40% of its
reserved height. This is a large geometric move and must be pinned
separately from the font-size change (T0's histogram makes the two
attributable).

## D7 — Swimlane: wire the FONT, leave the visual model alone

**Context:** `swimlane { FontSize 18 }` (`plantuml.skin:312`) is unwired,
AND our swimlanes draw a boxed table header where the jar draws thin
divider lines with floating titles (`activity-swimlane-rendering`, filed).
**Decision:** wire `FontSize 18`; change nothing structural.
**Consequences:** swimlane fixtures will move but not converge. Expected —
name them in the close-out rather than treating them as failures.

## D8 — `ACTION_HEIGHT = 36` is derived, not adjusted

**Context:** `activity-layout-constants.ts:15`. The jar's activity rects
measure `height="32"` on `bakopu-96-pudu086`; upstream has no such constant
— the height falls out of `FontSize 12` + `Padding 10`
(`plantuml.skin:360-361`).
**Decision:** derive the box height from the resolved font size and
padding. Do not replace `36` with `32`.
**Consequences:** substituting the observed number would be fitting, and
would break the moment a fixture sets `skinparam activity { FontSize }`.

## D9 — The gate is `weightedScore`; `diffCount` is informational

**Context:** inherited from `plans/sequence-root-chrome/decisions.md` D5
and `plans/activity-oracle-harness/decisions.md` D2. `compareNodes`
short-circuits on child-count mismatch charging exactly 1 however large the
skipped subtree, so `diffCount` is **not monotone in wrongness**.
**Decision:** gate on `weightedScore` only. A risen `diffCount` beside a
fallen `weightedScore` is the expected artefact, not a failure.
**Consequences:** never report a `diffCount` fall as evidence of progress.
