# T1 — Diagnose the cluster vertical/height residual

## Prior observations (pre-loaded — do not re-discover)

- G5 C7 landed the cluster SIDE-margin mechanism: 1-2 levels of
  protection-wrapper nesting in the emitted DOT, each worth graphviz's
  default CL_OFFSET (8pt). WIDTH is now jar-exact on 84/84 corpus
  cluster fixtures. That mechanism is FINAL (`DotInputCluster.
  innerMarginLevels`/`unwrappedNodeId`, applied in
  `src/core/graph-layout-build.ts:183-210`). Do not re-derive it.
- The residual (G5 ledger §C7 "NEW residual"): heights still short.
  `gojuja-90-pune699` cluster `A`: ours 79 vs jar 85 (gap 6, levels=2).
  `fevida-60-kope208` `example`: 175 vs 181 (gap 6, levels=1).
  `cakaxu-97-nexe753` `AbstractState`: 235.5 vs 240 (gap 4.5, levels=2).
  `decede-10-buvu414`: overall `svg/@height` gap 1 (levels=1).
  Same level count → different gaps, so the residual depends on
  content shape, not wrap-level count.
- Plausible mechanism (UNVERIFIED — your job is to verify or refute):
  graphviz's cluster rank-separation, `~/git/graphviz/lib/dotgen/
  position.c:780`: `d1 = rank[r+1].ht2 + rank[r].ht1 + CL_OFFSET`
  ("cluster sep") — per-adjacent-rank-pair, distinct from the flat
  side margin.
- Fixtures with MULTIPLE top-level 'cluster' composites exist:
  `zaloga-87-lonu477`, `zumuje-46-gufe080` (comp1+comp2). Nested-
  cluster margin composition (child attaches to the parent's OUTER
  unwrapped level) is unverified against a real fixture.

## Context

plantuml-ts (TypeScript PlantUML port). State-diagram composite
clusters are laid out by the pinned dot-engine library
(`file:../dot-engine/*.tgz`) through the seam
`src/core/graph-layout-build.ts`; the jar oracle SVGs under
`oracle/` are the spec. Vitest; run scripts with `npx tsx`.

## Task

Produce the diagnosis.md artifact for the vertical residual:
mechanism (1-2 sentences), origin file:line, causal chain, ruled-out
list with evidence. Specifically:

1. Reproduce the 4 known gaps via `data-qualified-name`-matched box
   extraction (mirror G5 C7/C8's technique; see ledger §C8 for the
   pattern). Extend measurement to ≥4 FRESH cluster fixtures from the
   corpus (include `zaloga-87-lonu477` or `zumuje-46-gufe080`, and at
   least one nested-cluster fixture) — measure the guard set, not just
   the named symptoms.
2. Test the rank-sep hypothesis: build a minimal DOT repro (a cluster
   whose boundary is crossed by adjacent ranks of differing heights),
   run it through dot-engine directly AND reason it through
   `position.c` (`~/git/graphviz/lib/dotgen/position.c`, the
   `dot_position`/cluster-sep region around line 780). Determine
   whether dot-engine reproduces the C behavior.
3. Localize the divergence origin to exactly one of:
   (a) dot-engine diverges from the C source → fixLocation
   'dot-engine'; (b) dot-engine matches C, jar adds vertical
   margin/height outside layout (e.g. in svek Cluster/ClusterHeader —
   check `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/`;
   grep `src/main/java/net/`, never just the plantuml subtree) →
   fixLocation 'seam'.
4. State whether the mechanism covers, or explicitly excludes, the
   multi-top-level and nested-cluster cases from the measurement set.

## Write-set

NONE committed. Disposable probe scripts under
`scripts/_tmp-g6-*.ts` only — delete before finishing. Deliverable is
the mechanism artifact appended to
`plans/g6-cluster-geometry/decision-journal.md`.

## Read-set

- `plans/g5-measurer-calibration/ledger.md` — §C7 "NEW residual"
  section and §C8 measurement technique
- `src/core/graph-layout-build.ts:150-276` (seam; margin application)
- `src/core/graph-layout.types.ts:220-250` (DotInputCluster)
- `~/git/graphviz/lib/dotgen/position.c` (cluster sep region)
- `~/git/plantuml/.../svek/Cluster.java` and neighbors (jar-side
  cluster height accounting)
- Fixture sources: `tests/corpus/` state fixtures named above
  (regenerate with `python3 scripts/populate-corpus.py` if absent)

## Interface contract (consumed by T2)

Journal entry must contain, machine-readably:
`mechanism` (prose + origin file:line), `fixLocation`
('dot-engine' | 'seam'), `formula` (the exact per-rank-pair or
per-cluster computation to implement), `ruledOut` (list + evidence),
`coverage` (per-fixture predicted gap closure for all measured
fixtures, including the fresh ones).

## Acceptance criteria

- Given the 4 named fixtures + ≥4 fresh ones, when heights are
  box-extracted vs oracle, then every gap is attributed to the stated
  mechanism (predicted delta matches measured delta per fixture).
- Given the minimal DOT repro, when run through dot-engine, then the
  divergence-vs-C verdict is demonstrated by output, not asserted.
- Given the artifact, when T2 reads it, then it can implement without
  re-measuring anything.

## Quality bar

No production code changes → gates must remain green untouched
(`git status --short` empty of src/tests changes at finish; probes
deleted). If no mechanism can be stated within budget: journal the
ruled-out list + next instrumentation and STOP (README stop cond. 5).

## Boundaries

- Never modify `size-backlog.json`, goldens, or the DOT gate.
- Never touch the `insideAutonomPass` gate or side-margin code.
- No git mutations (orchestrator commits).

## Observability / Rollback

N/A — no committed changes. Reversible trivially.
