# T18 — D7: G18 1 px shortfall on a bare single-node autonom (gokife-89)

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
SI28 (`stereotype.md#gokife-89`): NOT a stereotype effect and NOT the RoundedSouth family (single-node scopes, no composite outer box); candidate `state-composite-sizing.ts:64-90`, Java `InnerStateAutonom.java:186-197`; text/margins/`.delta(15,15)` all verified exact. nextStep: instrument dot-engine's layout of a synthetic bare single node (bounding box vs declared size, `pad`/`margin` defaults) against the oracle graphviz for the same DOT; then the wrapper arithmetic.

## Write-set
`plans/state-declared-size-fix/findings/G18-single-node-autonom.md` ONLY.

## Observability / Rollback
N/A — docs-only diagnosis; no new observable operation. Reversible (one markdown file).
