# T1b — text through the klimt driver; `strictuml` arrowheads (D1, D4)

Agent: typescript-pro, worktree `add1-T1b`. Commit:
`fix(activity): emit text via DriverTextSvg; ArrowsTriangle under strictuml`.

## Context
Every activity `<text>` lacks `textLength` (jar: `textLength="19.275"` on
`rarodo`) and sits at `rect.y + 20` where the jar draws `rect.y + 19.333`
(10 padding + the deterministic 12 px ascent 9.333) — `fixtures.md`'s
`3.333`/`2.333` y-shift entries are this −0.667 beside T1a's +4/+3. The
renderer hand-emits via `core/svg.ts#text` (`activity-renderer-shapes.ts:103,
123,144,278,308`, `renderer.ts`); mindmap (137/142 conformant) draws
`UText` through `UGraphicSvg` (`src/diagrams/mindmap/index.ts:129`,
`core/klimt/drawing/svg/driver-text-svg.ts:97-130` emits `textLength:
dim.width` and the ascent baseline). `rarodo` also declares `skinparam style
strictuml`: `SkinParam.java:1306-1309` returns `ArrowsTriangle` (3-point
polygons, `ArrowsTriangle.java:40-80`); ours always draws `ArrowsRegular`
(`arrows-regular.ts`).

## Task
1. NEW `activity-renderer-text.ts` (shapes.ts is at 473): one function that
   takes `(x, y, lines, FontConfiguration-ish style, measurer)` and draws
   each line as a `UText` through a `UGraphicSvg` fragment (the state/class
   precedent: `state/renderer-arrowhead.ts`, `class/renderer-group.ts`),
   returning the `<text>` markup. Baseline comes from the driver, not a
   constant; per-line x stays `activity-text-placement.ts#boxLineX`/
   `centeredLineX`. Replace every `text(` site in `activity-renderer-shapes
   .ts` and `renderer.ts` (edge labels) with it; delete the +20 constant.
2. `arrows-regular.ts`: add `ArrowsTriangle`'s four polygons 1:1 and
   `arrowHeadPointsFor(theme)` selecting on `theme.strictUml` (`SkinParam.java:
   1306-1309`); `renderer.ts#arrowTip` uses it.
3. Unit tests: `renderer-shapes.test.ts` / `activity-text-placement.test.ts`
   assert `textLength` and `y = rect.y + 19.333` relative to the rect for a
   12 px line (quote `driver-text-svg.ts` and the jar's `rarodo`); `arrows-
   regular.test.ts` pins both polygon sets by direction; `renderer.test.ts`
   covers the strictuml selection.
4. Re-pin `text-baseline.json`; diff before/after; every ROSE row journaled.
5. If, after T1a's merge at the b1 close, `polygon` still carries attribute-
   form diffs (not positional), route `arrowTip` through `DriverPolygonSvg`
   (push-forward, D1) — journal, do not pre-empt.

## Write-set
`src/diagrams/activity/{renderer,activity-renderer-shapes,activity-renderer-
text (NEW),activity-text-placement,arrows-regular}.ts`,
`tests/unit/activity/{renderer,renderer-shapes,activity-text-placement,
arrows-regular}.test.ts`, `oracle/goldens/svg-activity/text-baseline.json`,
`docs/catalog.md` (new module).

## Read-set
`decisions.md#D1`, `#D4`, `#D9`; `src/core/klimt/drawing/svg/driver-text-svg.ts`
(whole), `u-graphic-svg.ts` (build + fragment API), `src/diagrams/mindmap/index
.ts:40-140`, `src/diagrams/state/renderer-arrowhead.ts` (fragment precedent);
`activity-renderer-shapes.ts:90-150,270-320`; `activity-text-placement.ts:1-80`;
`arrows-regular.ts` (whole); `core/theme.ts:105-115`; Java `ArrowsTriangle.java
:40-80`, `SkinParam.java:1300-1312`, `klimt/drawing/svg/SvgGraphics.java`
(`text(` method).

## Acceptance
- Given `rarodo-65-fudu505`, when rendered, then `<text>` carries
  `textLength="19.275"`, `y = rect.y + 19.333`, and the arrowhead is
  `ArrowsTriangle#asToDown` (3 points).
- Given a fixture without strictuml, then the `ArrowsRegular` polygon is
  byte-identical to before.
- Given the 311 rows at b1, then `text/@textLength` diffs = 0 and every
  `text/@y` residual equals T1a's shift.
- Given `git diff` under `src/core/klimt/`, then empty (stop 8).

Quality bar: targeted vitest (`tests/unit/activity/**`, the four activity
baseline tests) + typecheck + eslint. Boundaries: `core/klimt/**` and
`core/svg*.ts` read-only; layout files are T1a's. Observability: N/A.
Rollback: Reversible.
