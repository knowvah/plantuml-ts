# T2 — Placement switch + reverted stack, atomically (hard-barred)

## Context

plantuml-ts (`/Users/scottseely/git/plantuml-ts`), TypeScript port of
PlantUML (Java at `~/git/plantuml`; preserve upstream names with
`@see`; port faithfully, no refactoring). graphviz-ts pinned
(READ-ONLY at `/Users/scottseely/git/knowvah/dot-engine`). Vitest; probes
`scripts/_tmp-g8-t2-*.ts` via `npx tsx`, deleted before finish;
Serena MCP; `npm run typecheck` after edits.

## Locked inputs (read in order)

1. `plans/g8-label-placement/spec.md` (T1) — the conversion formula
   + fallback contract. Implement exactly this; no re-derivation.
2. `plans/g8-label-placement/decisions.md` — D1-D6.
3. G7 journal T18/T20/T20b rows
   (`plans/g7-borderpoint-rank/decision-journal.md`) — the three
   reverted change-sets to re-land (their exact shape is recorded;
   T18: FIXEDSIZE `setHtmlAttr` wiring in
   `graph-layout-build.ts#addEdges` mirroring `addClusters:308-314`
   + `measureTransitionLabel` `\n`-split heights `fontSize+1` /
   `lines*fontSize`; G5/C1: `ARROW_LABEL_FONT_SIZE=13` width-only,
   `plans/g5-measurer-calibration/ledger.md` §C1; T20b: gated
   `labelInk` param through `addNodeInk`/`buildInkBox`/
   `computeSvekResultGeometry` mirroring `includeArrowheadInk`,
   label box `[x,x+w]×[y-h,y]`).
4. `class-geo-builders.ts#attachEdgeLabel` — the in-repo precedent
   for consuming `labelX/labelY`.
5. `tests/unit/state/state-composite-pass.test.ts` — 5
   `describe.skip` suites to enable; all must pass.

## Task

1. **Placement switch.** `state-transition-label.ts#
   attachTransitionLabel`: new signature accepting the edge result's
   `labelX/labelY/labelWidth/labelHeight`; when `labelX !==
   undefined`, apply T1's conversion; else the legacy perpendicular
   formula (D1). Callers `layout.ts:126` and
   `state-composite-pass.ts:412` pass the edge result through.
   `state-geo-types.ts`: `label` gains `width`/`height` (additive).
   `renderer.ts:425-428`: draw per the spec's anchor convention.
2. **Re-land the stack** (exact shapes per locked input 3): T18,
   13pt width, T20b ink walk now folding the box at the RETURNED
   position. `state-composite-autonom.ts`: consume the completed
   walk; `Math.max` floor per D6 (remove only if the sweep proves
   zero widenings without it — test both, keep the proven one,
   journal).
3. **Tests** (`tests/unit/state/`): conversion arithmetic vs the
   spec's per-fixture oracle values; fallback path (result without
   label coords → legacy formula); every labeled corpus transition
   renders a label (fallback can't swallow); FIXEDSIZE attrs
   emitted; height/width measurement; ink-walk box fold; enable the
   5 skipped suites.
4. **Gate.** Run `npx tsx scripts/measure-state-size-deltas.ts` on
   the final state: ZERO widened; the 14-set (beguxu-19, fomusu-59,
   bemena-23, jorere, ketibo, pajefo, xepafa, zitifa, jaxebo,
   mifuti, pesita, +3 per harness) within tolerance. Then full
   gates: `npm test && npm run typecheck && npm run lint &&
   npm run build`; 57 pins byte-identical; parity ≥268/268
   (report the number — improvements possible).

## HARD BAR — no tuning, no variants

Any widened entry or broken pin in the final state: full revert
(`git show HEAD:<path> > <path>` all files, delete created files,
`git status --porcelain` clean, `npm test` green), report the
fixture + the divergent intermediate vs T1's spec, STOP (stop cond.
6). No fixture-conditional branches ever (D5 / stop cond. 7).

## Write-set (only these)

`src/diagrams/state/state-transition-label.ts`,
`src/diagrams/state/layout.ts`,
`src/diagrams/state/state-composite-pass.ts`,
`src/diagrams/state/state-geo-types.ts`,
`src/diagrams/state/renderer.ts`,
`src/core/graph-layout-build.ts`,
`src/diagrams/state/state-composite-edge-label.ts`,
`src/diagrams/state/layout-ink-extent.ts`,
`src/diagrams/state/state-composite-autonom.ts`,
`tests/unit/**`. Complexity-hook splits per the existing
`state-composite-*` pattern (report them). No git mutations. Never
touch graphviz-ts, goldens, pins, `size-backlog.json` (T3's job),
DOT-gate expectations.

## Interface contract (consumed by T3)

Landed tree + harness output: full JSON-lines run (widened=0,
improved list with before/after deltas, unchanged list) pasted in
the final message.

## Acceptance criteria

- Given a labeled transition with returned coords, when laid out,
  then `TransitionGeo.label={text,x,y,width,height}` per T1's spec.
- Given a result without label coords, when laid out, then the
  legacy formula applies and a test proves no corpus label is
  dropped.
- Given the harness on the final state, then zero widened and the
  14-set within tolerance.
- Given the suite, then all gates green, 57 pins byte-identical,
  parity ≥268/268, 5 enabled suites pass.

## Observability requirements

Harness run pre-commit is mandatory; paste the summary in the final
message (this is the SLI record for the journal).

## Rollback notes

Reversible — full-revert protocol (proven 3× in G7). One commit;
revert = `git revert <sha>`.
