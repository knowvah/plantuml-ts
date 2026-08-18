# T17 — D6: G22 the 2.033 px residual (dapunu-39)

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
SI28 (`composite-a.md#dapunu-39`): our reconstruction is bit-exact for "ours" yet 2.033 px short of jar on every ink hypothesis (cluster, self-loop arrowhead, pseudostate ink, URL reservation all ruled out). nextStep: diff jar's `svek-3.dot` node line for `Main_Connected` against our DOT INPUT for the same node (declared width/height/label table), i.e. move upstream of the ink walk; if the inputs differ, that is the mechanism (cite the Java producing jar's attribute); if identical, diff engine outputs as in D4.

## Write-set
`plans/state-declared-size-fix/findings/G22-dapunu-residual.md` ONLY.

## Observability / Rollback
N/A — docs-only diagnosis; no new observable operation. Reversible (one markdown file).
