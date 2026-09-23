# cdd-T29 — class `scale`

Status: **Round 1 complete for the write-set as specified (row 175's
finding); round 2 (stop-1 extension, journal rows 177-180) closed the
finding by threading `scaleK` through the class renderer tree — see
"Round 2" below.** `npm test` green (801 files on disk == 800 passed + 1
pre-existing skip; 22339 tests), typecheck (both tsconfigs)/lint/build
clean, DOT parity unchanged (711/711 non-oracle-blind).

## Round 1 (original write-set)

## Before/after (render-diff.mts, structural+numeric first-diff)

| fixture | before | after |
|---|---|---|
| cagace-55-libu760 (`scale max 50 width`) | 6+92 | 6+83 |
| corine-48-pemu761 (`scale .5`) | 30+308 | 16+242 |
| jiramo-39-xuze087 (`scale 2.0`) | 8+50 | 4+32 |
| kujiji-68-cujo036 (`scale 900 width`) | 70+902 | 70+886 |
| nadaba-37-zaku242 (`scale max 50 height`) | 12+180 | 12+178 |
| koxoco-29-moke425 (`scale 0.8`) | 8+94 | 4+74 |
| vebini-34-gapu710 (`scale 2`) | 30+308 | 16+244 |

Every remaining "S" (structural, no-tolerance) diff on all 7 fixtures is one
of exactly three mechanisms, all in journal row 175 — none is a bug in this
task's geometry-scaling mechanism, all are render-time constants outside
this task's write-set. The remaining "N" (numeric, has a delta) diffs are
overwhelmingly pre-existing UNSCALED-geometry residuals (this port's DOT/svek
layout vs the jar's, unrelated to `scale`) amplified by the resolved factor
— e.g. cagace's `scale max 50 width` resolves `k` from `geo.totalWidth`,
so a sub-pixel pre-existing width residual becomes a proportional `k`
residual that appears on every scaled attribute.

## Observation: `row.fontSize` must be materialized, not left to the renderer's theme fallback

- **Context**: implementing `scaleClassGeometry` and manually probing
  `renderSync('@startuml\nclass foo\nscale .5\n@enduml')` before/after.
- **Finding**: `renderer-classifier-rows.ts#renderRowText` reads
  `row.fontSize ?? theme.fontSize` directly at render time.
  `index.ts`'s `render(geo, theme)` passes the SAME unscaled `theme`
  object this task's write-set cannot change (index.ts is read-only per
  the task spec — "renderClass needs no change"). Without materializing
  the fallback, a classifier's header row (any fixture with no
  `skinparam class{AttributeFontSize}` override — 6 of the 7 named
  fixtures) rendered `font-size` at the UNSCALED default while its `x`/`y`/
  `textLength` scaled correctly: a visibly broken, internally inconsistent
  diagram.
- **Fix**: `scaleRow` (`class-scale-geo-row.ts`) sets `row.fontSize =
  (row.fontSize ?? themeFontSize) * k` unconditionally — safe because
  `scaleClassGeometry` never calls `scaleRow` at all when `k === 1` (the
  identity short-circuit), so the unscaled case (the overwhelming common
  one) is byte-for-byte unchanged.
- **Impact**: this was THE fix that took the mechanism from "does nothing"
  (before the write-set-location bug below was caught) to "font-size scales
  correctly for every row without an explicit override".
- **Confidence**: High — jar-verified mechanism (D4/`SvgGraphics.java:695`
  scales every emitted font-size) + before/after `renderSync` probe.

## Observation: several class-render primitives have no `ClassGeometry` field to scale at all

- **Context**: after the `row.fontSize` fix, `render-diff.mts` still showed
  a `stroke-width` mismatch on EVERY fixture (`exp=0.25 | act=0.5` for
  `corine-48-pemu761`, `scale .5` — i.e. completely unscaled).
- **Finding**: `renderer-classifier-colors.ts#classBorderStrokeWidth:323`
  computes the box/divider border's `stroke-width` FRESH at render time
  from `theme.colors.graph.classBorderThickness ?? 0.5` (or a per-
  stereotype/inline-color override) — there is no `ClassifierGeo` field
  carrying a resolved stroke-width at all, unlike `EdgeGeo.strokeWidth`
  (an OPTIONAL override this task DOES scale, `class-scale-geo-edge.ts`).
  Same story for the kind-badge ellipse's `rx`/`ry`
  (`class-badge.ts:48`, `BADGE_RADIUS = 11`, a module constant consumed
  directly by `renderer-classifier-badge-tag.ts`) and `roundCorner`
  (`renderer-classifier-box.ts:231-233`,
  `resolveClassTagCascadeEntry(...)?.roundCorner ?? <default>`).
- **Why this task doesn't fix it**: unlike `row.fontSize`, there is no
  EXISTING optional geo-side field to materialize a value into — fixing
  this needs `renderer-classifier-box.ts`/`-colors.ts`/`-badge-tag.ts`
  (and by the same pattern, `renderer-arrowhead.ts`'s
  `MIDDLE_RADIUS_INNER`/`_OUTER`/`MIDDLE_STROKE_WIDTH` for `middleDecor`
  circles, `renderer-bullet-atom.ts`, `renderer-usymbol-entity.ts`,
  `renderer-note.ts`/`renderer-note-lines.ts`) to thread a `scaleK` the way
  `sequence/renderer.ts`/`renderer-arrowhead.ts` already do for their OWN
  local pixel-literal constants (`sequence/scale-geo.ts`'s own header names
  this exact split explicitly). All of those files are outside T29's
  write-set AND outside T30's (T30 widens `resolveScaleFactor` itself and
  wires `json/renderer.ts`/`description/renderer.ts`/`sequence/renderer.ts`
  — not class's box/badge/arrowhead renderers).
- **Impact**: acceptance criterion "every numeric attribute is exactly Nx"
  is NOT met by this task alone for any of the 7 fixtures — every one still
  shows unscaled `stroke-width` (and, where reached, badge `rx`/`ry`/
  `roundCorner`) diffs. Filed as journal row 175; a follow-on task
  (sibling to T30, "class-render-scale-literals" or similar) is needed to
  close this fully.
- **Confidence**: High — read the exact call sites, confirmed by direct
  jar-comparison diffs on all 7 fixtures (100% consistent: every remaining
  "S" diff is one of these three mechanisms).

## Observation: a subagent write-path mistake, caught before any commit

- **Context**: mid-task, `render-diff.mts` showed ZERO change before/after
  despite the implementation looking correct on read-through.
- **Finding**: all edits had landed under
  `/Users/scottseely/git/knowvah/plantuml-ts/src/...` (the MAIN checkout)
  instead of `/Users/scottseely/git/knowvah/plantuml-ts/.claude/worktrees/
  cdd-t29/src/...` (the required worktree) — `typecheck`/`render-diff.mts`
  were being run FROM the worktree directory but operating on the
  worktree's own (untouched) source, so both silently "passed" against
  unmodified code. Caught by the render-diff tool showing byte-identical
  output before/after a `scale .5` change that should have altered it —
  the SAME class of leak `plans/class-divergence-drive/decision-journal.md`
  rows 150/157/160 already recorded for three OTHER subagents this mission
  (B7FU-R1/R2/R3), all via Serena's edit tools specifically. This one was
  via `Edit`/`Write` with a wrong absolute path, not Serena — a distinct
  variant of the same hazard class.
- **Fix**: reverted the main checkout via `git checkout -- <3 modified
  files>` + `rm` for the untracked new files (verified `git diff --cached`
  showed nothing staged first, so the revert was safe against the OTHER
  pending work already in the main checkout's `feat/class-divergence-drive`
  branch), then redid every edit under the correct worktree path.
- **Impact**: no commit was ever made from the wrong location; the main
  checkout's pre-existing pending state (staged oracle goldens, other batch
  files) was undisturbed.
- **Confidence**: High — `git status --short` on the main checkout, both
  before the revert (showed the 9 stray paths) and after (clean).

## Round 2 (stop-1 extension: `scaleK` threaded through the class renderer tree)

### Before/after (render-diff.mts, structural+numeric)

| fixture | round-1 after | round-2 after |
|---|---|---|
| cagace-55-libu760 (`scale max 50 width`) | 6+83 | 3+37 (residual: pre-existing width) |
| corine-48-pemu761 (`scale .5`) | 16+242 | **0+0 (exact)** |
| jiramo-39-xuze087 (`scale 2.0`) | 4+32 | **0+0 (exact)** |
| kujiji-68-cujo036 (`scale 900 width`) | 70+886 | 49+824 (residual: pre-existing width) |
| nadaba-37-zaku242 (`scale max 50 height`) | 12+178 | 12+178 (residual: pre-existing height) |
| koxoco-29-moke425 (`scale 0.8`) | 4+74 | **0+0 (exact)** |
| vebini-34-gapu710 (`scale 2`) | 16+244 | 0+7 (residual: tiny arrowhead rounding) |

3 of 7 fixtures reach exact-scaled parity; the other 4 have a residual that
is EITHER a pre-existing (unrelated-to-scale) layout width/height
computation divergence amplified by a dimension-dependent scale form
(`max width`/`max height`/`N width`), or (vebini only) a sub-0.02px
arrowhead rounding artifact. None is an unfixed render-time constant —
every remaining "S" diff category from round 1 (box/divider/badge
stroke-width, badge radius+glyph, roundCorner, edge default stroke-width,
arrowhead geometry, 1px divider inset) is gone from all 7 fixtures.

### Mechanism: `ScaledTheme` (mirrors `sequence/scale-geo.ts:35-47,302-320`)

`class-scale-geo.ts` gained `ScaledTheme extends Theme { scaleK: number }`
+ `scaleClassTheme(theme, k)` (scales `theme.fontSize` too, for the two
render-time Y-offset formulas that read it directly -- `renderer-
classifier-rows.ts`'s bullet/image atom offsets, `renderer-openiconic.ts`).
`ClassGeometry` gained `scaleK?: number`, stamped by `scaleClassGeometry`
(round 1's own function) whenever `k !== 1` -- the ONLY channel from
`layoutClass` to `renderClass(geo, theme)`, since `index.ts`'s call site
(outside the write-set) still passes the plain unscaled `theme`.
`renderer.ts#renderClass` derives `const theme = scaleClassTheme(rawTheme,
geo.scaleK ?? 1)` and SHADOWS the parameter name, so every pre-existing
read below it (colors, `monochrome`, `shadowing`, every internal call)
picks up the scaled theme with no other code change -- most of the class
renderer tree needed ZERO retyping: TypeScript's structural subtyping
lets a `ScaledTheme` value flow into any function still declared
`theme: Theme` (it has every property `Theme` requires, plus `scaleK`).
Only functions that read `.scaleK`/`.fontSize` directly for a LOCAL
pixel-literal constant needed retyping to `ScaledTheme`:
`renderer-classifier-colors.ts#classBorderStrokeWidth`/
`classBorderStrokeDasharray`, `renderer-classifier-box.ts` (roundCorner,
`MAP_JSON_DIVIDER_STROKE_WIDTH`, the 1px divider inset), `renderer-
classifier-badge-tag.ts#renderBadge`/`renderGenericTag`/
`renderBadgeSpriteImage`, `class-badge.ts#badgeGlyphPath` (new 9th `k`
param), `renderer-body-enhanced.ts` (tree-connector bullet/stroke
literals), `renderer-edge.ts#renderEdge`/`resolveEdgeStrokeWidth`.

### Mechanism: arrowhead double-scaling trap (the one place `ScaledTheme` alone was NOT enough)

- **Context**: `renderer-arrowhead.ts#drawExtremityMarkup` draws through
  `core/klimt`'s `UGraphicSvg`+`basicSvgOption()` -- the SAME
  already-scale-aware pipeline `scale-command.ts`'s own header cites as
  jar-verified for component (`SvgGraphicsCore#format` multiplies EVERY
  emitted numeral by `SvgOption.scale`).
- **Finding**: `place(name, point, angle, backgroundColor)`
  (`core/svek/svek-edge-extremity.ts`) BAKES `point` into the returned
  drawable's own local coordinate space
  (`factory.createUDrawable(point, angle, null)`). `point` here is
  `edge.points[...]`, which round 1 ALREADY scaled by `k`
  (`class-scale-geo-edge.ts`). Naively setting `basicSvgOption({ scale:
  k })` would have made `format()` multiply that ALREADY-scaled position
  by `k` AGAIN -- caught by reasoning through the mechanism before
  writing the fix (not by a failing test), then confirmed by measurement
  (structural diffs on every arrowhead disappeared only after the divide
  step was added).
- **Fix**: `buildEdgeArrowheads`/`placeAndDrawExtremity` UNSCALE the
  placement point and `resolvedStrokeWidth` (divide by `k`) before
  calling `place()`/`drawExtremityMarkup`, then let `SvgOption.scale = k`
  re-scale both the (now-unscaled) position AND the extremity's own
  local shape geometry (`ARROW_SIZE`-class constants inside `core/svek/
  extremity/*.ts`, never touched directly) uniformly, matching upstream's
  real single-`format()`-pass behavior. `placed.trim` (from `decorTrim`,
  a FIXED unscaled offset) is separately multiplied BACK UP by `k` before
  return, since `applyDecorTrim` composes it onto the ALREADY-scaled
  `edge.points`.
- **Impact**: this was the fix that took corine/jiramo/koxoco from
  "everything else exact, arrowhead stroke-width/shape still 2x/0.5x off"
  to fully exact. `core/svek/extremity/*.ts` itself was never modified
  (shared by other engines; confirmed class-only via `renderer-
  arrowhead.ts` itself, `grep`-verified no other engine imports it).
- **Confidence**: High -- mechanism reasoned through from the `place()`/
  `UGraphicSvg` source before coding, then measurement-confirmed via
  `render-diff.mts` on all 7 fixtures.

### Residual 1: pre-existing width/height computation divergence, amplified by `max`/`N width` forms

- **Context**: cagace (`scale max 50 width`), nadaba (`scale max 50
  height`), kujiji (`scale 900 width`) still show small proportional
  deltas (e.g. cagace `font-size` exp=8.44 act=8.434) after round 2;
  corine/jiramo/koxoco/vebini (all SIMPLE `scale N` factors, independent
  of `totalWidth`/`totalHeight`) do not.
- **Finding**: `k = target / totalDimension` is maximally sensitive to
  the EXACT value of `totalDimension` -- ANY pre-existing (unrelated to
  scale) sub-pixel divergence between this port's unscaled layout and
  jar's real one gets amplified into a proportional `k` error that then
  shows on EVERY scaled attribute. Measured directly (`layoutClass` on
  the unscaled source): nadaba's two-stacked-`Foo1`/`Foo2` diagram
  computes `totalHeight = 70` (a suspiciously round number); jar's own
  factor (`10.145/14 = 0.7246`) implies its real unscaled height is
  `50/0.7246 ≈ 69.0` -- a ~1px pre-existing vertical-spacing divergence
  between two stacked classifier boxes. cagace similarly implies jar's
  unscaled `totalWidth ≈ 82.94` against this port's `83` -- a ~0.06px
  pre-existing width residual.
- **Why this task doesn't fix it**: the root cause is a PRE-EXISTING
  class-layout width/height computation divergence, unrelated to `scale`
  entirely (it would be invisible without a dimension-dependent scale
  form to amplify it into observability) -- fixing it is a class-layout
  task, not a scale-application one, and genuinely out of T29's write-set
  (touches `class-dot-graph.ts`/layout-ink-extent/DOT-node-sizing, not
  any file this task owns).
- **Confidence**: High for the mechanism (measured, not guessed); the
  EXACT upstream cause of the ~1px/~0.06px pre-existing residual itself
  is NOT diagnosed here (would require its own diagnosis-mode pass on
  the unscaled layout engine) -- named, not chased, per this task's scope
  boundary.

### Residual 2: vebini's tiny arrowhead rounding artifact (~0.01-0.02px, `scale 2` only)

- **Context**: vebini (`scale 2`) and corine (`scale .5`) are the SAME
  PlantUML source with different scale factors; corine is exact, vebini
  has 7 numeric-only diffs, ALL inside the two edges' arrowhead
  `<path>`/`<polygon>` points (box/badge/rows are exact on both).
- **Finding**: the residual is isolated to the unscale-then-klimt-
  rescale round trip (`buildEdgeArrowheads`) and only appears at `k=2`
  (grow), not `k=0.5` (shrink), in this A/B pair -- suggests an
  intermediate-rounding-order asymmetry inside the shared klimt `format`/
  `formatDecimal` pipeline (rounds at `DEFAULT_SVG_DECIMALS` somewhere
  between the divide and the re-multiply) rather than a logic error in
  this task's own divide/multiply arithmetic, which is otherwise exact
  (position and shape both verified structurally correct — this is a
  sub-0.02px LAST-DIGIT residual, not a placement or shape mismatch).
- **Why not chased further**: magnitude is below any visual significance
  and isolated to 2 fixtures' fractional digits; the underlying klimt
  rounding-order question would need its own instrumented pass through
  `SvgGraphicsCore#format`, out of this round's time budget.
- **Confidence**: Medium — mechanism is a reasoned hypothesis from the
  measured asymmetry (present at k=2, absent at k=0.5 on an identical
  source), not confirmed by instrumenting the klimt pipeline directly.

### New/changed files (round 2)

- `class-scale-geo.ts` — `ScaledTheme`, `scaleClassTheme` (new)
- `class-geo-geometry-types.ts` — `ClassGeometry.scaleK?: number` (new field)
- `class-badge.ts` — `badgeGlyphPath` gained a 9th `k` param (scales the
  glyph outline's own coordinates, not just its translate)
- `renderer.ts` — `renderClass` derives+shadows `theme` as `ScaledTheme`
- `renderer-assoc-lollipop.ts` (new, split from `renderer.ts` for the
  500-line cap) — `renderAssocPoint`/`renderLollipop`, scaled
- `renderer-classifier-map-dividers.ts` (new, split from `renderer-
  classifier-box.ts`) — `mapColumnDividerEntries`, scaled
- `renderer-arrowhead-ink.ts` (new, split from `renderer-arrowhead.ts`)
  — `edgeExtremityInk` (pure move, layout-time, no `k` — ink is computed
  on UNSCALED geometry, before `class-scale-geo.ts` ever runs)
- `renderer-arrowhead.ts` — `EdgeArrowheadOptions` (new, bundles
  `resolvedStrokeWidth`/`k` to stay under the param-count cap),
  `placeAndDrawExtremity`/`drawTailExtremity`/`drawHeadExtremity`/
  `ExtremityDrawCtx` (new, NLOC-cap split), the unscale/rescale fix
- `renderer-classifier-colors.ts`, `renderer-classifier-box.ts`,
  `renderer-classifier-badge-tag.ts`, `renderer-body-enhanced.ts`,
  `renderer-edge.ts` — literal constants scaled by `theme.scaleK`
- `class-ink-box.ts` — import path updated for the `renderer-arrowhead-
  ink.ts` split (pure move, unaffected by `k`)

### Not reached by the 7 fixtures (named, not chased this round)

Per the coordinator's own audit instruction, these render-time constants
were IDENTIFIED but not fixed (no fixture in this task's read-set
exercises them, so no measurement can confirm a fix): `renderer-edge-
extras.ts` (visibility-icon/note-on-link/constraint-line literals),
`renderer-note-connector.ts`'s `strokeWidth: 1, strokeDasharray: '7,7'`,
`renderer-bullet-atom.ts`, `renderer-usymbol-entity.ts`, `renderer-
note.ts`/`renderer-note-lines.ts`, `core/usymbol-shapes.ts` (technically
`core/`, but class-only in practice — verified no other engine imports
it), `renderer-arrowhead.ts#drawMiddleDecorShape`'s `MIDDLE_RADIUS_INNER/
OUTER`/`MIDDLE_STROKE_WIDTH` (middleDecor circles, `-0)-` etc — same
unscale/rescale pattern as the main extremity fix would apply here too),
`renderer-classifier-map-dividers.ts`'s `MAP_CELL_MARGIN_X`-derived
divider-X position (map-kind only). Filed as a follow-on alongside
Residual 1/2 above.
