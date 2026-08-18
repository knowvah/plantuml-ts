# T13 — D2: G19 nested-cluster wrapper margin (fovafu-44#b)

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
SI28 (`other.md#fovafu-44-mifu394#b`): width +7.714 / height −10.594 on composite `B` wrapping nested `A`; hand arithmetic 4.594 + 6 = 10.594 matched. Candidate `state-composite-sizing.ts:77-87` (`measureAutonomWrapper`), Java `InnerStateAutonom.java:186-197` + `SvekResult.java:130-136`. nextStep: probe `childImg`/`wrapper` intermediates for B's pass against a hand-computed jar target; isolate which term (top gap 4.594? bottom margin 6?) and cite the Java that produces each.

## Write-set
`plans/state-declared-size-fix/findings/G19-nested-wrapper-margin.md` ONLY.

## Observability / Rollback
N/A — docs-only diagnosis; no new observable operation. Reversible (one markdown file).
