# T12 — D1: G15 cluster-drawn child ink term (rovese-43, zoriza-41, zizemo-86)

## Common rules (all D-tasks)
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch `fix/state-declared-size`.
DIAGNOSIS ONLY (`decisions.md#D6`, locked): write ONLY your
`plans/state-declared-size-fix/findings/<group>.md`; never edit `src/`,
`tests/`, `oracle/`, `scripts/`; probes under `scripts_scratch/T<N>/`, deleted
before you finish; no git; no `.agent-notes/` (report observations). Records
follow `plans/state-declared-size-diagnosis/findings/SCHEMA.md` verbatim (one
record per fixture, `#a/#b` on distinct causes); `resolved` needs a real
`originFileLine` + `javaRef` + non-empty `ruledOut`; `unresolved` needs a
concrete `nextStep`; a ≤5-line fix may be PROPOSED in `proposedWriteSet`, never
applied. Read your SI28 record(s), `SYNTHESIS.md` §1 for your group,
`~/.claude/rules/diagnosis.md`, CLAUDE.md ("READ THE JAVA FIRST"; Java under
`~/git/plantuml/src/main/java/net/`). Measure with
`npx jiti scripts/measure-composite-declared-size.ts <slug>` (note: Batches
1–3 may have moved these numbers — re-measure first; if a fixture is now exact,
record `already-conformant` and say which task closed it). Report ≤500 tokens:
status · mechanism · originFileLine · javaRef · Δ arithmetic · what stayed open.

## Task
SI28 (`composite-b.md`) refuted the "missing cluster-margin path" claim (materializeCluster already uses the real cluster box) and left a candidate at `layout-ink-extent.ts:305-321`. nextStep: open `svek/ClusterHeader.java` and `svek/ClusterDotString.java` (and `Cluster.java:380-450`) for an uninset/title ink term the jar folds for a cluster-drawn composite child that our `addNodeInk` does not; then fix the probe label wiring (`graph-layout-build.ts#addEdges` — labelBox never became a placed labelX/labelY in T2 probe) so a numeric reconstruction of rovese matches our own 265.4×350 first, then test the term against jar. Read T8 first (Batch 3 may have moved these).

## Write-set
`plans/state-declared-size-fix/findings/G15-cluster-header-ink.md` ONLY.

## Observability / Rollback
N/A — docs-only diagnosis; no new observable operation. Reversible (one markdown file).
