# T4b + T4c — core wrappers for linked port groups and kermor

Added 2026-10-14 by user ruling on stop 7 (journal row 32). One agent, one worktree: both tasks write
the same core emitter and builder files (parallelism rule: shared write targets collapse). Runs on
`dsw/T4` (after T4's commit 886980a3c), as additional commits by the `dsw-wrappers` agent.

Prepend [../task-preamble.md](../task-preamble.md). **This task is the ruled exception to the
preamble's "Do not edit those core files"**, for the files named in the write-set only.

## T4b — `a`/`i` pair for a linked hasPort cluster
Jar (`ClusterDotString.java:91-99,132-155,175-181`; repoge `svek-1.dot`):
`cluster6a { cluster6 { ranks; cluster6ee { zaent point; cluster6i { members; rect anchor } } } }`.
Today `wrapperLevels` (`src/core/svek-dot-wrappers.ts:64-67`) yields `a`/`i` only when
`portRanksLabelOnEe`. Also, `graph-layout-build-portcluster.ts:49,115-126` and
`svek-dot-emit-clusters.ts` `portClusterEeBlock` ignore `borderPointAncestorWrap` on hasPort clusters.
- Make the layout builder AND the svek DOT emitter honour `borderPointAncestorWrap` for hasPort
  clusters, nesting exactly as the jar prints it, including where the zaent point and the rect anchor sit.
- Update `wrapperLevels` so T1b's `wrapperChain` (candidate side) sees `a`/`i` for these clusters.
  It stays the single definition.
- Description side: set `borderPointAncestorWrap` on linked port clusters in `buildDotClusters`. The
  `linked` value is already computed there; T4 left a comment.
- Fixtures: component/repoge-41-demu604, component/gurive-62-ricu497, component/repite-70-vabe533,
  unknown/jujuga-39-miva043 (b2: structural-match→diverged, jar 12 vs ours 10 clusters).

## T4c — kermor `alpha > beta > gamma`
Read `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ClusterDotStringKermor.java` whole
(`printInternal` `:67-165`). Quote when `alpha` (`:81`) and `beta` (`:102`) are emitted, what each
contains (the note label?), and where `gamma` (`:126`) sits.
- Mirror it in the svek DOT emitter (`kermorClusterBlock`, `svek-dot-emit-clusters.ts:274-330`; its doc
  comment explains why alpha/beta were omitted, so retire that rationale) AND in the layout builder.
  If kermor has no builder path today, add one beside the existing cluster paths.
- Fixtures: component/fojamu-08-veku866, component/zubujo-87-xaxa087 (jar 3 vs ours 1),
  component/siseda-71-napu395 (jar 11 vs ours 4).

## Write-set
- `src/core/svek-dot-wrappers.ts`, `src/core/svek-dot-emit-clusters.ts` (and `svek-dot-emit*.ts` siblings
  only where the block lives), `src/core/graph-layout-build*.ts`, `src/core/graph-layout-cluster.types.ts`
  / `graph-layout.types.ts` (new optional fields with doc comments)
- `src/diagrams/description/layout-dot-tree.ts`, `src/diagrams/description/layout.ts`
- `tests/unit/core/**` (the builder/emitter tests for the new shapes), `tests/unit/description/description-svek-wrappers.test.ts`
- `tests/unit/scripts/survey-layout-equal.test.ts`, `tests/unit/oracle/layout-parity.test.ts`: only to
  re-point an expectation that flips because a fixture became equal (state the fixture)
- `docs/catalog.md` (`npm run catalog`)

## Guards (stop if violated; report, do not edit pins)
- class/object/state: `tests/oracle/svg-conformance/{class,object,state}.golden.ratchet.test.ts`,
  `tests/oracle/{class,object,state}-dot-parity.test.ts`, `tests/oracle/wrapper-parity*.test.ts` and
  `tests/unit/state`, `tests/unit/class` stay green. Any class/object/state mover is a stop.
- The layout-parity ratchet (297 pins) and `oracle/goldens/svg-description/ratchet.json` stay green.
- Measure with T1b's check swapped in, as in T4 (`git checkout dsw/T1b -- tests/oracle/svek-dot.ts
  tests/oracle/svek-dot.test.ts`, run `tests/oracle/description-parity.ratchet.test.ts`, then restore
  BEFORE committing).

## Acceptance
- repoge, gurive, repite, jujuga: layoutParity `equal`, or `firstDiff` past `clusterTree` with the
  residual named. The emitted svek DOT shows the jar's `a`/`ee`/`i` nesting.
- fojamu, zubujo, siseda: layoutParity `clusterTree` clean (cluster count and chain equal the jar's).
- Tightened description-parity: report before → after for the 9 red rows.
- Render-diff before → after for the 7 fixtures. Every rise carries a mechanism.
- One commit per sub-task (`feat(core): …`). The body quotes the Java and names the class/state guards run.

**Observability:** N/A. **Rollback:** Reversible (revert the two commits).
