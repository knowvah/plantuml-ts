# T10 — Entry/exit family sweep + mission close

## Context

Final task. With T9 landed, sweep the 20-fixture entrypoint/exitpoint
family and close the mission per autonomous-execution Session End
rules.

## Task

1. Identify the family: state corpus fixtures containing
   `<<entrypoint>>`/`<<exitpoint>>` (grep `tests/corpus/state/`;
   pesita-10-dene726 is the known anchor; expect ~20).
2. Byte-compare each against its jar oracle: pin zero-diffs (+ remove
   backlog entries); for non-zero fixtures, box-measure, tighten
   entries, and journal each residual with a NAMED mechanism —
   distinguishing "known out-of-scope mechanism (insideAutonomPass /
   SvekEdge placement)" from "new, unnamed" (a new one gets a full
   journal entry with evidence).
3. Full-corpus final sweep: re-run all gates; record final censuses
   (state x/271, backlog entry count, pin count added this mission).
4. Write the mission summary at the bottom of the plan README: tasks
   completed vs planned, decisions count (flag any for review), gate
   results, known issues/follow-ups (explicitly re-list the two
   out-of-scope mechanisms and any new residuals as the G7 queue).
5. Check all remaining checkboxes.

## Write-set

`oracle/goldens/state/*` (pins),
`oracle/goldens/state/size-backlog.json`,
`plans/g6-cluster-geometry/` (README summary, checkboxes, journal).

## Read-set

`tests/oracle/state-dot-parity.test.ts` (pinning procedure);
batch 1-3 journal entries (for the summary).

## Acceptance criteria

- Given the family sweep, when complete, then every one of the ~20
  fixtures is either pinned or has a journaled named residual.
- Given the backlog, then entry count is ≤ its mission-start value
  and no entry widened at any point.
- Given the summary, then it records censuses, per-batch outcomes,
  and the explicit G7 queue.

## Quality bar

`npm test && npm run typecheck && npm run lint && npm run build` green
on the full branch before the summary is written.

## Boundaries

Byte-exact pins only; no git mutations (orchestrator makes the final
commit and the merge commit — merge, never squash).

## Observability / Rollback

The summary's census table is the mission's final metric. Reversible.
