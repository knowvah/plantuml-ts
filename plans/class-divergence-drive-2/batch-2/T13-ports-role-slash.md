# T13 — member ports and role-slash labels

**Agent:** typescript-pro (sonnet, effort high) · **Depends on:** T11, T12

## Fixtures

nenexe-35-zere033, mugobo-34-fede498 (Q-9); nenepe-70-keri784,
pegeso-72-mana305 (Q-6); camuna-58-veca254, nafiki-56-jixu680,
rifuzu-80-nixo780 (Q-4/Q-5/Q-10, from T11); rilali-81-gifu188,
xoxega-30-vuju324, goloxu-09-nero458 (canvas +1, from T12 — journal row 31).

## Mechanisms · Write-set

Diagnosis sections are quoted from `diagnosis/Q.md` into the agent prompt.

- **Q-9** (HIGH) — `class-ink-box.ts#buildInkBox`'s edge loop never reads
  `e.roleLines` (`class-geo-types.ts:389`), so the additive role label's
  ink is missing from the canvas walk (Δ2). Upstream `LimitFinder` sees
  every drawn `TextBlock`, including `SvekEdge.java:1029-1063 drawRoleLabel`.
- **Q-6** (LOW, diagnose first) — nenepe/pegeso: canvas 3 px narrow, all
  drawn ink matches to 0.005. Not Q-9 (no labels). Instrument
  `layout-ink-extent.ts#computeClassDocumentDims` against the jar's
  implied extent; check whether port-anchored edges add an ink term the
  jar counts (e.g. a `UEmpty`/shield cell).
- **Q-4** (HIGH) — `renderGenericTag` hardcodes `GENERIC_TAG_BACKGROUND`
  and the border; upstream resolves `{root,element,classDiagram,class_,generic}`
  (`EntityImageClassHeader.java:138-149`).
- **Q-5** (HIGH) — `cardinalityFont` built from theme defaults only
  (`class-dot-graph.ts:334`, `layout.ts:311`); upstream merges
  `{root,element,classDiagram,arrow,cardinality}`
  (`GraphvizImageBuilder.java:124-131,235-241`) incl. FontStyle/FontColor.
- **Q-10** (LOW, diagnose first) — rifuzu/camuna/nafiki share a Δ31/Δ37
  cascade present WITHOUT any `<style>`; compare our DOT node widths for
  `Map<K,V>`/`HashMap<Long,Customer>` against `svek-N.dot` first.

- **Q-11** (open, diagnose first; journal row 31) — on the T11+T12 tree
  rilali/xoxega/goloxu differ ONLY in `svg/@width`+`@viewBox[2]`, ours
  1 px WIDER (373 vs 372, 374 vs 373, 239 vs 238). Every drawn element
  matches. All three have several DOWN Kal boxes on one entity spread by
  the newly ported `fixHoverlap` (`class-kal-overlap.ts`): check whether
  the ink walk still sees a Kal box / edge end at its PRE-`moveX`
  position, or counts the Kal box with the wrong `LimitFinder` rule.

Write-set: `src/diagrams/class/class-ink-box.ts`, `layout-ink-extent.ts`,
`renderer-classifier-badge-tag.ts`, `class-dot-graph.ts`, `layout.ts`,
`class-stereotype-layout.ts`, `src/core/style-cascade-class*.ts`, tests
beside each. Runs after T11 and T12 (Q-10 is measured on their tree;
`class-layout-generic-classifier.ts`/`class-edge-geo.ts` are theirs).

## Read-set

`diagnosis/Q.md` (T13 sections); prior mission T36's negative result on
port-row sizing (`plans/class-divergence-drive/batch-10/T36-port-row-sizing.md`,
its journal row) — do not re-derive a disproved premise.

## Acceptance criteria

- Given each fixture, when it renders, then the canvas width and every
  coordinate match the jar
- Given the role-slash syntax, when parsed, then the label split matches
  the Java regex it is ported from (cited in the test)
- Given the port-row fixtures already conformant, when render-all runs,
  then they stay conformant

## Observability · Rollback

N/A. Reversible.
