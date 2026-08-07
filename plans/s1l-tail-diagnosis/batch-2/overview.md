# Batch 2 — synthesis

One task. Runs only after all seven Batch 1 tasks complete, because it
consumes every findings file at once.

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|-----------|------|
| T8 | Re-partition all 26 fixtures by true mechanism | general-purpose | `findings/SYNTHESIS.md`, `README.md` (status ticks), `plans/s1l-leaf-sizing/ledger.md` (append) | T1–T7 | [ ] |

## Why this is a barrier, not a pipeline stage

T8 needs every finding in one context simultaneously. Its whole job is
cross-bucket: the historical triage claims 4 of T1's nine `container-cluster`
fixtures are actually sprite-caused, and neither T1 nor T2 can see that from
inside its own bucket. A pipeline stage that ran per-bucket would reproduce
exactly the blind spot this mission exists to remove.

## Batch exit bar

- Every one of the 26 fixtures appears in the re-partition exactly once.
- Each mechanism group names its `proposedWriteSet`, so the fix mission can
  batch on file ownership without re-deriving it.
- Groups whose write-sets overlap are flagged — they cannot be parallel tasks
  in the fix mission.
- Unresolved fixtures are listed separately with their `nextStep`, not folded
  into a group.
- Quality gates green; no `src/` path in the diff.
