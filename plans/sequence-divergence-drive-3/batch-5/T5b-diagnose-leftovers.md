# T5b — diagnose every row still open after batches 1-4

Agent: `debugger` (sonnet), worktree `sdd3-T5b`. Commit:
`docs(sequence): diagnose rows left open after batches 1-4`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanism
None presumed: the rows are those `classify.mts` still reports non-zero at
the B4 close (`measurements/b4-classify.json`), minus T5a's row. sdd2's filed
mechanisms (`planning-open-rows.tsv`, column 6) are leads only; re-read the
cited Java and say where it disagrees (CLAUDE.md "READ THE JAVA FIRST").

## Targets
Diagnosis only: every open row gets a section or an "Unexplained" entry.

## Write-set
`plans/sequence-divergence-drive-3/diagnosis/leftovers.md` only.

## Read-set
`measurements/b4-classify.json`, `planning-open-rows.tsv`, `fixtures.md`
(sdd2), `diff-one.mts` per row; the Java each mechanism cites.

## Interface contract (T5b -> T5c…)
One section per mechanism: **Mechanism**, **Origin** (`file:line`),
**Upstream** (Java `file:line`, quoted), **Causal chain**, **Ruled out**,
**Rows** (slugs, which reach zero), **Proposed fix** (write-set, approach,
expected movement; core files flagged), **Confidence**. The orchestrator
turns each into T5c… with a journaled write-set; sections whose proposed
write-sets overlap are collapsed into one task.

## Acceptance
- Given the B4-close open rows, then each appears under exactly one
  mechanism or "Unexplained" (with what was instrumented, what next).
- Given a cluster of more than 10 rows with no mechanism, then halt with the
  partial artifact (stop 16).
- Given the task commit, then it touches only the artifact.

Observability: N/A — no new observable operations. Rollback: Reversible
(revert the task commit).
