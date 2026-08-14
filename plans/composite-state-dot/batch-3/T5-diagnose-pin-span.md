# T5 — Diagnose the pin-span gap

## Context

Read [batch-3/overview.md](overview.md) in full first — it records five things
already verified, which must not be re-walked. In particular the frontier
calculator and the border-point recognition are both confirmed CORRECT.

## Task

Produce a mechanism for why, on `flop` in `temuxi-28-cega322`, our pin centres
span 143.5px where jar's span 170px.

This is a diagnosis task. Per `~/.claude/rules/diagnosis.md`, it is complete only
when you can state:

- **Mechanism** — the specific cause, in one or two sentences
- **Origin** — the `file:line` where it originates
- **Causal chain** — why the 26.5px follows from that cause
- **Ruled out** — what you eliminated, and the evidence that did it

**Do not propose a fix before the mechanism is stated.** An empty "ruled out" on
a defect this size means it was guessed rather than isolated.

## Write-set

None. Findings go to `decision-journal.md`.

## Read-set

- `test-results/dot-cache/state/temuxi-28-cega322/{in.puml,in.svg,svek-1.dot}`
- `src/diagrams/state/state-composite-cluster.ts` — `borderPointMemberIds` (~:345)
- `src/diagrams/state/state-composite-geo.ts` — `borderPointBox` (~:244)
- `src/diagrams/state/state-composite-frontier.ts`
- `~/git/plantuml/.../svek/Cluster.java:410-436` — `manageEntryExitPoint`
- `~/git/plantuml/.../svek/ClusterDotString.java:94-158`

## Leading candidate (NOT verified — treat as a starting point, not an answer)

The composite DOT we hand the engine differs from jar's in ways beyond the
wrappers batch 1 fixes: cluster membership and `{rank=source;...}` grouping. If
the pins land in a different rank group, graphviz spaces them differently and the
frontier faithfully reports it.

## Acceptance criteria

- Given `flop`, when instrumented, then the reason its pin centres span 143.5
  where jar's span 170 is stated with a `file:line`.
- Given that mechanism, when written to the journal, then it carries all four
  required elements including a non-empty ruled-out list.
- Given the mechanism, when scoped, then T6's write-set is named — or, if it falls
  outside `state-composite-*.ts`/`state-dot-graph.ts`, the task STOPS and says so.

## Observability requirements

N/A — diagnosis only.

## Rollback

N/A — no code changes.

## Quality bar

No code changes; gates unaffected. The deliverable is the journal entry.

## Commit

`docs(T5): mechanism for the composite pin-span gap`
