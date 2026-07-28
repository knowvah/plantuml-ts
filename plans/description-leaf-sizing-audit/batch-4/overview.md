# Batch 4 — Close the gaps (TEMPLATE)

**This batch has no fixed task list.** Its tasks are derived from the
`MISMATCH` rows of `planning/usymbol-composition.md` (T2) and the `GAP`
rows of `planning/sizer-renderer-parity.md` (T3/T4). A survey cannot name
its findings in advance; inventing task names here would be fiction.

## How to build this batch

1. After Batch 2, list every `MISMATCH` and `GAP` row.
2. Sort by evidence: rows with a FAILING FIXTURE first (ADR-4 — those are
   proven), then rows backed only by a jar probe.
3. Group rows that share a write-set into ONE task (`parallelism.md`: two
   tasks must never write the same file). `leaf-sizing-consts.ts` and
   `layout.ts`/`layout-dot-tree.ts` are the usual contention points.
4. Write one `TN-[name].md` per task from the template below.
5. Order tiers by identical-delta clusters — see below.

## Start every tier from identical-delta clusters

An IDENTICAL delta across fixtures is a reliable tell for ONE shared
cause, and it held every time last session: four fixtures at 3.1839 fell
to one note fix; kizobu-64/tacixe-99 at 0.1667 to one symbol-family fix;
kovaxi-11/zidebi-71 at 0.7720 to one (unimplemented) cause. Cluster the
backlog by delta before picking what to work on — it collapses N problems
into one.

## Task template

```
# TN — <gap name>

## Context
<the row, verbatim, plus the upstream file:line it cites>

## Write-set
<from the row — no two tasks in this batch may share a file>

## Read-set
<upstream Java for the mechanism; our current dispatch>

## Acceptance criteria
- Given <fixture or probe>, when measured, then <exact oracle numbers>
- Given the suite, then `widened` is 0 and conformant did not drop
- Given a fixture that flips, then its backlog pin is deleted in THIS commit
- Given a constant, then it is DERIVED from upstream, never fitted

## Observability / Rollback
N/A — no new observable operations. Reversible (code + pins revert together).

## Quality bar
All four gates + the three ratchets.
```

## Hard rules for every task in this batch

- **Never ship a fitted constant.** If you have a number that works but
  cannot point at the upstream expression it comes from, you have not
  found the mechanism. `size/4.5` was the answer the scan's 10.9 was
  approximating.
- **A pin deletion belongs in the same commit as its fix**, so code and
  ratchet data revert together.
- **Out of scope, do not start:** S1L-i (titled separators), S1L-j
  (multiline display), the sprite tail, the container remainder, the
  creole `{{ }}` embedded sub-diagram (UNIMPLEMENTED), the 2 LaTeX
  fixtures (permanent DIVERGENCE). Reclassifying which family a fixture
  belongs to is fine; fixing those families here is not.

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|-----------|------|
| — | derived from T2/T3/T4 tables | — | — | T2, T3, T4 | [ ] |
