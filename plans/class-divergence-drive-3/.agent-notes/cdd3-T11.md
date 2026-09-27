# cdd3-T11 — generic tag cardinality style

## Observation: skinparam classBackgroundColor needs an explicit marker
- **Context**: Q-4's generic-tag fill cascade (`renderGenericTag`).
- **Finding**: `theme.colors.graph.classBackground` (`Paint`, the skinparam
  `classBackgroundColor` tier) is NOT optional -- `defaultTheme` always
  populates it (`#F1F1F1`, `theme.ts:267`), even when the user never wrote
  the skinparam. Unconditionally falling back to it from the generic tag's
  fill (`genericCascadeBackground ?? classBackground ?? '#FFFFFF'`) would
  have tinted EVERY unstyled generic tag `#F1F1F1` gray instead of jar's
  real white default. Jar-verified with an authored probe (`gen-c.puml`,
  `skinparam classBackgroundColor LightBlue`): the class box AND the
  generic tag both draw `#ADD8E6`; the plain/unstyled probe's tag stays
  `#FFF`. Added `classBackgroundExplicit?: true`
  (`theme-graph-colors-c.ts`), set only inside the `classbackgroundcolor`
  skinparam handler (`skinparam-key-handlers-table-b.ts`), threaded
  through the existing `GRAPH_OVERRIDE_FIELDS` table
  (`skinparam-theme-builder.ts`) the SAME way every other skinparam-only
  field already is.
- **Impact**: this "field always has a baked-in non-absent default, so an
  `??` fallback can't distinguish override from default" pattern likely
  recurs for `interfaceBackground`/`enumBackground`/`actorStroke` (also
  non-optional in `ThemeGraphColorsA`) if a future task needs the SAME
  "explicitly set" distinction for one of them.
- **Confidence**: High (jar probe + unit test, `gen-c.puml` regenerated
  fresh via `scripts/oracle-render.sh` since cdd2's `/tmp/cdd2-T13-oracle/`
  probes were gone).

## Observation: CARDINALITY_FONT_SIZE in graph-layout-build-edges.ts is dead code for class
- **Context**: chasing why camuna/nafiki's edge positions diverged before
  the ink-walk fix, initially suspected the DOT `labelfontsize` hint
  (`core/graph-layout-build-edges.ts:168,173`).
- **Finding**: that hint only fires in the plain-text `taillabel`/
  `headlabel` branch (`hasTailBox`/`hasHeadBox` both false). Class ALWAYS
  sets `tailLabelWidth`/`tailLabelHeight` (the jar-faithful FIXEDSIZE
  TABLE reservation, `class-dot-edges.ts`), so the constant is never read
  for class diagrams -- `theme.cardinalityFontSize` already reaches the
  graphviz label-box reservation correctly via that width/height path
  (confirmed by `class-dot-graph.ts:334`'s own `cardinalityFont` var,
  pre-existing). The REAL remaining divergence was `class-ink-box.ts
  #addEdgeTextInk`'s hardcoded height, used for the document ink-walk
  (canvas size + the uniform `moveDelta` shift `computeClassInkShift`
  applies) -- exactly what cdd2-T13's Q-5 note already named.
- **Impact**: don't re-chase `graph-layout-build-edges.ts` for a
  class-only cardinality-font divergence; it's shared/core and not the
  mechanism.
- **Confidence**: High (read the branch guards directly).

## Observation: camuna/nafiki's residual position diffs are dot-engine issue 19
- **Context**: post-fix render-diff still shows ~11-58px positional deltas
  on the edge `path`/`polygon`/tail-label `text`/`rect`.
- **Finding**: `structural` diff count dropped 9->1 (camuna) and 8->0
  (nafiki) -- every fill/font-size/font-style structural diff this task
  targeted is closed. The one remaining camuna structural row
  (`path[1]/@d`, a curved spline vs. jar's straight-ish path) plus both
  fixtures' numeric position deltas match `docs/graphviz-issues/
  19-flat-edge-ignores-html-table-port.md`, exactly as the task file
  pre-flagged ("their flat-edge lines are dot-engine issue 19 -- expected
  to remain").
- **Confidence**: High (structural-diff count matches the task's own
  acceptance bar; the residual file exists and matches by name).
