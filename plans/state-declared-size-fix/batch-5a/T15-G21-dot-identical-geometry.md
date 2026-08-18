# T15 — D4: G21 byte-identical DOT, different geometry (zacajo-09)

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
SI28 (`concurrent-region.md#zacajo-09`): our emitted region DOT is byte-identical to jar's `svek-2.dot` (`WIDTH="122"` too) yet the composite differs by 3.733 px; ruled out edge-label boxes and cluster substitution. nextStep: run the identical DOT through `@knowvah/dot-engine` and through the oracle graphviz (`dot -Tplain`/`-Tsvg` if `dot` is available; else `scripts/oracle-render.sh` on the puml) and diff node positions/bboxes; establish whether this is a dot-engine finding (then it is a `docs/graphviz-issues/` candidate — say so, with the minimal DOT, but do not file it) or an ours-side post-layout term.

## Write-set
`plans/state-declared-size-fix/findings/G21-dot-identical-geometry.md` ONLY.

## Observability / Rollback
N/A — docs-only diagnosis; no new observable operation. Reversible (one markdown file).
