# T19 — D8: G16 tightContentDimension 1 px (jijuze-43)

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
SI28 (`concurrent-region.md#jijuze-43`): clusterPosMap definitively ruled out (0 interceptions); a plain `n.x + n.width` walk with no shape-aware ink rule at `state-composite-cluster.ts:197-210` (`tightContentDimension`/`REGION_LEAF_MARGIN`), Java `SvekResult.java:126-136`; not externally monkeypatchable (intra-module call). nextStep: gated temporary tracing INSIDE the module is the one instrument — allowed ONLY if reverted before you finish (`git diff --stat` must show no `src/` change; the orchestrator verifies) — print the walk's per-node x+width and the jar's `getMinMax` for the same nodes; name the 1 px term.

## Write-set
`plans/state-declared-size-fix/findings/G16-region-leaf-margin.md` ONLY.

## Observability / Rollback
N/A — docs-only diagnosis; no new observable operation. Reversible (one markdown file).
