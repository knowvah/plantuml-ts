# T6 — Close-out

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`feat/sequence-oracle-harness`. Read this brief's `README.md`, `decisions.md`
and `decision-journal.md` **in full** — the journal is authoritative and
outranks any task file it postdates. Mirror SI32's close-out shape
(`plans/state-anchor-clip-retire/README.md`) and its `mission-index.md` row.

**Re-measure every number you publish.** Do not restate a figure from a task
report. SI32 produced two confidently-reported subagent measurements that did
not survive re-measurement, and its own close-out caught an orchestrator
miscount besides.

## Task
1. Append a "Close-out (2026-XX-XX)" section to this brief's `README.md`:
   corpus captured vs classified; fixtures baselined; how many errored;
   diff-count distribution; the six census bucket totals; the wall-clock
   ceiling T2 set and the current measured value; parity ratchets; coverage;
   confirmation that **zero fixtures were promoted** and **`src/` is
   untouched** (`git diff --name-only main..HEAD -- src/` must be empty —
   run it and quote the result).
2. `planning/mission-index.md`: a row after SI32, mirroring its columns, with
   per-task commit ids from `git log`.
3. `planning/next-missions.md`: mark the sequence-harness item done and state
   what the rebuild mission now inherits — the gate, the baseline, the census,
   and the ranked bucket queue.
4. `planning/sequence-deepdive.md`: update its "Prerequisites" section — the
   measurement surface it says is missing now exists. Replace the "does not
   exist yet" language with what was built and where.
5. Tick every batch in this brief's `README.md`.
6. State plainly what this mission did **not** do: no rendering fixed, no
   fixture promoted, no `src/` touched.

Read-only git only; no commits.

## Write-set
- `plans/sequence-oracle-harness/README.md`
- `planning/mission-index.md`, `planning/next-missions.md`,
  `planning/sequence-deepdive.md`
- `.agent-notes/g1h-T6.md`

## Read-set
- This brief's `README.md`, `decisions.md`, `decision-journal.md`
- `.agent-notes/g1h-T0.md` … `g1h-T5.md`
- `plans/state-anchor-clip-retire/README.md` — close-out precedent
- `planning/mission-index.md` rows SI31, SI32 — column shape

## Acceptance
- Given each published number, then it was re-measured in this task, and the
  close-out says how.
- Given `git diff --name-only main..HEAD -- src/`, then it is empty and the
  close-out quotes that.
- Given `ratchet.json`, then `fixtures` is still `[]`.
- Given the deepdive, then its Prerequisites section no longer says the
  measurement surface is missing.

## Observability
N/A — docs and register rows.

## Rollback
Reversible. Docs only.

## Quality bar
The four gates on a docs-only tree. Do not restate a number from a task report
without re-measuring it.

## Report (<=400 tokens)
Corpus and baseline numbers as re-measured; the bucket totals; confirmation
`src/` is untouched and nothing was promoted; anything the orchestrator must
fix before merge.
