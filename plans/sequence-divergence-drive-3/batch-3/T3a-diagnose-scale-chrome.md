# T3a — diagnose the scale/chrome order

Agent: `debugger` (sonnet), worktree `sdd3-T3a`. Commit:
`docs(sequence): diagnose export scale vs chrome composition`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanism (lead; verify in Java)
Verified cites: `TextBlockExporter.java:159-177` (`exportTo`: dimension,
`computeScaleFactor(dim)`, `createUGraphic(dim, scaleFactor)`, border, margin
translate, handwritten wrap, `drawU`); `:198-203` `calculateFinalDimension`
(block + margin); `:205-209` `computeScaleFactor` (`scale.getScale(w,h) *
dpi/96`). `UgDiagram.java:128` is `addChrome`; the exporter builder is
`:137-145` (the brief's `:128-134` is the chrome call only — corrected).
The block handed to the exporter is already chromed, so the factor derives
from the chromed dimension and scales chrome with the body.
Port: `renderer.ts:331` `resolveScaleFactor(geo.scale, geo.totalWidth,
geo.totalHeight, theme.dpi)` on the unchromed geometry, then
`scaleSequenceGeometry`/`scaleSequenceTheme` (`scale-geo.ts:373,418`);
`index.ts:160-190` `applyAnnotationChrome` -> `applyExportedChrome`
(`core/annotations/chrome-export.ts:36`) chromes at 1x. mindmap/wbs/salt
route through `core/UgDiagram.ts` `exportTo` (`:126`) and
`core/TextBlockExporter.ts`; `assemble-svg-sequence.ts` already carries
`sequenceExportedDimension`.

## Targets
Diagnosis only. The 15 rows of T3b (`baketu-62-cumu838` first: dpi 400,
title and sprite stay 1x). Measure each row's diff before and after.

## Write-set
`plans/sequence-divergence-drive-3/diagnosis/scale-chrome.md` only.

## Read-set
`TextBlockExporter.java:120-230`; `UgDiagram.java:60-150`;
`renderer.ts:320-345`; `scale-geo.ts:373-470`; `index.ts:150-190`;
`chrome-export.ts` (all); `core/UgDiagram.ts:60-148`;
`core/TextBlockExporter.ts:195-305`; `assemble-svg-sequence.ts:85-160`;
`salt/index.ts:195-225` (a worked consumer).

## Interface contract (T3a -> T3b)
The artifact carries, per mechanism: **Mechanism**, **Origin** (port
`file:line`), **Upstream** (Java `file:line`, quoted), **Causal chain**,
**Ruled out** (with evidence), **Rows**, **Proposed write-set for T3b**
(exact files, approach, which are core and thus all-engine-gated),
**Confidence**. Plus: whether `src/core/svg.ts` is in the proposed write-set.

## Acceptance
- Given the 15 targets, when diffed, then each diff attribute is assigned to a
  mechanism or listed under "Unexplained" with the next instrumentation.
- Given the artifact, then every section is filled; a missing field is
  stop 16 (halt with the partial artifact, no fix proposed).
- Given the task commit, then it touches only the artifact.

Observability: N/A — no new observable operations. Rollback: Reversible
(revert the task commit).
