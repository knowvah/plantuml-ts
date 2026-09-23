# cdd-T29 — class `scale`

Status: **COMPLETE for the write-set as specified; one out-of-write-set
finding not fixed (journaled row 175, filed as a follow-on).** `npm test`
green (800 files on disk == 799 test files + 1 pre-existing skip; 22334
tests), typecheck (both tsconfigs)/lint/build clean, DOT parity unchanged
(711/711 non-oracle-blind).

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
