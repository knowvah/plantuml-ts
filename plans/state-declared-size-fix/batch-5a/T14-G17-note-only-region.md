# T14 — D3: G17 note-only concurrent region (joleju-94)

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
SI28 (`concurrent-region.md#joleju-94`): −3/−3 px on two symmetric note-bearing composites; a minimal jar-cross-checked repro (note as third concurrent region) reproduces it with note size byte-identical to jar; narrowed to `stackConcurrentRegions`/`combineConcurrentPasses` handling of a note-only region (`state-composite-concurrent.ts`), Java `ConcurrentStates.java:133-141`. nextStep: recreate the repro under `scripts_scratch/T14/`, drive the real exported functions with the region list, print each region's contribution vs `ConcurrentStates#calculateDimension`, isolate the 3 px term to a line.

## Write-set
`plans/state-declared-size-fix/findings/G17-note-only-region.md` ONLY.

## Observability / Rollback
N/A — docs-only diagnosis; no new observable operation. Reversible (one markdown file).
