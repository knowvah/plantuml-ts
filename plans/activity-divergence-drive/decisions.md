# Architecture decisions: add1 (approved 2026-09-30, "approve all")

Scope answers (planning Phase 2, "looks good"): text/arrowheads are re-mirrored
through the klimt drivers (D1); the filed childCount/draw-order follow-ons are
in scope only as a cohort row's next mechanism (D6).

## D1: activity `<text>` is emitted by the klimt `DriverTextSvg`, not `core/svg.ts#text`
The geometry pipeline (`tiles/` → `ActivityGeometry`) is unchanged; only
emission moves. `renderer.ts` / `activity-renderer-shapes.ts` build a `UText`
with the node's `FontConfiguration` and draw it through `UGraphicSvg`
(`core/klimt/drawing/svg/u-graphic-svg.ts`, as `mindmap/index.ts:129` and
`state/renderer-arrowhead.ts` do), so `textLength` and the ascent-based baseline
come from the driver that mindmap already verified against the jar
(`SvgGraphics.java` `text()` path). No second text path: `activity-text-
placement.ts`'s +20 baseline constant is deleted, and its per-line x stays (it
is `SheetBlock1#initMap`'s arithmetic, already Java-cited). Arrowheads keep
`arrows-regular.ts`; they go through `DriverPolygonSvg` only if an attribute-
form diff on `polygon` survives T1a (push-forward).

## D2: canvas origin/margin is diagnosed and ported, never retuned
Upstream's document margin is `ClockwiseTopRightBottomLeft.same(10)`
(`TitledDiagram.java:275`), yet the goldens put ink at 16/15 (and 20/25,
17.5) — the difference is what the root ftile's `calculateDimension` includes
beyond ink (planning memory `activity-canvas-margin-premise-was-false`). T1a
quotes `UgDiagram.java:145`'s `.margin(...)` target, `TitledDiagram
#getDefaultMargins`, and the ftile bounds (`FtileFactoryDelegator*`,
`Swimlanes.java:455-487` `getMinMax`, `TextBlockUtils.java:138-141`) BEFORE any
edit, then ports the bounds model into `assign-coordinates-full.ts
#computeBounds`. `LAYOUT_MARGIN = 12` (`activity-layout-constants.ts`) is
deleted; its four consumers take the ported value. Stop 12 guards the budget.

## D3: stop/end circles are `FtileCircleStop` / `FtileCircleEndCross` 1:1
`FtileCircleStop.java:55` `SIZE = 22` (outer r 11, inner r per the Java,
stroke from `circle { stop { LineColor } }`); `FtileCircleEndCross` (r 10, cross).
`activity-renderer-shapes.ts:206-207`'s `innerR = outerR * 0.55` is a fitted
ratio and is deleted. Tile size in `tiles/gtile-spot.ts` follows the same
constants.

## D4: `skinparam style strictuml` selects `ArrowsTriangle`
`SkinParam.java:1306-1309`: `strictUmlStyle() ? new ArrowsTriangle() : new
ArrowsRegular()`. `Theme.strictUml` already exists (`core/theme.ts:113`,
accumulator `skinparam-accumulator.ts:50`); `arrows-regular.ts` gains the
`ArrowsTriangle` polygons (`ArrowsTriangle.java:40-80`, 3 points each) and a
selector keyed on the theme. No new theme field.

## D5: a byte-freeze golden ratchet for activity, pinned at closes only
T0b creates `tests/oracle/svg-conformance/activity.golden.ratchet.test.ts`
from `mindmap.golden.ratchet.test.ts` (no DOT condition, no `unknown` tree;
render via `renderFixtureActivity` + `DeterministicMeasurer`), and
`$T/pin-goldens.mts` (from `plans/class-divergence-drive/tools/pin-goldens.mts`,
single tree, writes `oracle/goldens/svg-activity/<slug>/{golden.svg,in.puml}`
+ a `ratchet.json` entry). A pinned slug's `diff-baseline.json` row becomes
`status: "pinned"` (the diff-baseline test, `repin-activity-baselines.ts`
and `repin-activity-promote.ts` accept it and skip the row) so each fixture is
gated by exactly one test. Pinning is orchestrator-only, at closes.

## D6: batch 2/3 are per-fixture drive rounds on the closest cohort
The cohort is every un-pinned `baseline` row with ws ≤ 100 at the latest
close (75 at planning, `fixtures.md`). Each round, the orchestrator reads the
cohort's diff families, names each row's next mechanism (`--dump`, `--align`,
the Java), and assigns it to a family task. A filed `planning/next-missions.md`
follow-on is built only when it IS a cohort row's next mechanism — and then
fully, for every fixture it governs, not for the one row. Families with no
cohort row are dropped; new ones are added as T2x/T3x (push-forward).

## D7: `weightedScore` is gated; movers are measured on every engine
`weightedScore` over un-pinned `baseline` rows (D2 of `activity-oracle-
harness`); `diffCount` is informational. The exit bar is zero UNEXPLAINED
rises (memory `weightedscore-can-rise-on-a-correct-fix`). D1 consumes a
shared driver, so every close surveys all engines into `measurements/bN-eng/`
and diffs verdicts against the previous close; any edit under `core/klimt/**`
is stop 8 — the activity code is what changes. T0a commits the planning
classifier as `scripts/activity-probe-classify.ts` so "which rows are
position-only now" is reproducible at each close.

## D8: `error` / `jar-error` rows are out of scope; no acceptances
The 39 `error` rows (our parser refuses) and 23 `jar-error` rows are not in
the cohort. An `error` row that starts rendering is reported and promoted via
`repin-activity-promote.ts` (stop 15 forbids counting it silently). Nothing is
written to `oracle/accepted-divergences.json` (stop 10).

## D9: one style path
Colours, thicknesses and fonts are read through `activity-style-defaults.ts`
(`plantuml.skin` + `<style>`), never a parallel skinparam-only path. Helper
splits forced by the 500-line hook are push-forwards, journaled with the new
file name.

## D10: exit bar
- Every `fixtures.md` row has a `final` ∈ `pinned (<commit>)`, `open -> add2
  (<mechanism>)`.
- Four gates green, collected = on-disk; `activity.golden.ratchet` green.
- 0 conformant losses in any engine (b0 → final); 0 unexplained rises.
- Target **≥ 30 activity fixtures pinned**; Σ weightedScore over un-pinned
  rows below b0's. A miss is acceptable when every short row is mechanised.

## D11: execution rules carried from cdd7 verbatim
Worktree per parallel task (`measurements/mkwt.sh`); agents run targeted tests
only; no Serena edit tools and no `git stash` in agents; orchestrator checks
`git diff HEAD` on main before every merge; catalog regen after a new module;
full gates with `--maxWorkers=6`; never push; dot-engine and the plantuml fork
are read-only; no public API change; merge commit at close.
