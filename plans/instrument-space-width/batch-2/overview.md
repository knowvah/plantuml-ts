# Batch 2..N — fix every reveal family (D8, template)

Tasks are created by the orchestrator from `measurements/families.md` after
T1b. One task per family (push-forward: split/merge families when the census
shows a shared/distinct mechanism). Batches repeat (2a, 2b, …) until
`measurements/owed.json` is empty. Stop 13: 3 fix batches without the owed
count halving.

| ID | Family | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| (from census) | | typescript-pro | named per family; disjoint within a batch | b1 / previous batch | |

Close each batch per [close-procedure.md](../close-procedure.md); clear rows
from `owed.json` only when re-measured at the close (never on an agent's word).

## Task file template — `batch-2/T2<x>-<family>.md`

```
# T2<x> — <family>: <one-line symptom>

Agent: typescript-pro (sonnet, high). Prompt = common-rules.md + this file.
Worktree: measurements/mkwt.sh T2<x>.

## Why (measured at b1 — re-take, do not trust)
Signature: <diff path>. Fixtures (<n>): <list or measurements/families.md#anchor>.
b0 → b1 per fixture: <verdict / ws>. Hypothesis is NOT given: find the Java.

## Write-set
<files>; tests/fixtures/isw-T2<x>/; its tests; .agent-notes/isw-T2<x>.md.

## Do
1. Render 3 family fixtures with the jar; locate where ours first departs.
2. Read the Java that produces that value under real-width spaces; quote it.
3. Port the mechanism once at its origin (no per-engine copy); author jar
   fixtures isolating it (single space, runs of spaces, leading/trailing).
4. Rule-12 survey; report which owed rows clear and any new movement.

## Acceptance
- Given every fixture in the family, when surveyed, then conformant (or ≤ its
  b0 score with 0 elements AWAY).
- Given the all-engine survey, when diffed against the batch's prev, then 0
  losses outside owed and 0 new owed rows.

Observability: N/A. Rollback: reversible.
```
