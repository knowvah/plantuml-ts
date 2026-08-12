# T6 — merge the audits into the authoritative ledger

## Context

`decisions.md` D5: `plans/object-close/ledger.md` is the authoritative
attribution for object diagrams, superseding G3's residue table. This task
builds it from T3/T4/T5's cluster audits and derives the queue that seeds
batch-2.

## Task

1. Merge the three (or more, if T5 split) audit files into `ledger.md`:
   a full 80-row attribution table plus the per-mechanism writeups.
2. Verify the arithmetic. G3's own table was internally inconsistent — it
   accounted for 79 of 80 fixtures, omitting `fafozi-27-reja300`, and the
   error survived until the next iteration caught it. Assert
   `conformant + non-conformant == 80` and that every slug appears **exactly
   once**.
3. Derive the batch-2 queue, ordered by **shared-mechanism reach** — number of
   fixtures a single mechanism would flip — not by per-fixture diff count
   (`decisions.md` D3). Size-backlog mechanisms lead.
4. Separate the queue into: *actionable*, *filed engine-blocked* (D6), and
   *needs maintainer scoping*. Only the first seeds the loop.

## Write-set

`plans/object-close/ledger.md`

## Read-set

- `plans/object-close/audit-size.md`, `audit-nonnumeric.md`,
  `audit-geometry*.md`
- T1's per-fixture table in `plans/object-close/decision-journal.md`
- `plans/g3-object-svg/README.md` — the superseded table, for the
  before/after the close-out will report

## Architecture decisions in force

D1 (no anonymous misses), D3 (queue order), D5 (this file is authoritative),
D6 (filed-vs-chased split).

## Interface contracts

`ledger.md` structure, consumed by batch-2 and batch-3:

```
## Attribution table (80 rows)
| slug | verdict | mechanism | java file:line | queue item |

## Mechanisms
### <mechanism name>
- Cause / origin / causal chain / ruled out
- Fixtures: <slugs>   ← reach

## Queue (actionable, by reach)
| # | mechanism | reach | cluster |

## Filed engine-blocked   (docs/graphviz-issues/<file>.md)
## Needs maintainer scoping
```

## Acceptance criteria

- Given the merged ledger, when the table is counted, then it has exactly 80
  rows and every slug appears exactly once.
- Given the table, when summed, then `conformant + non-conformant == 80` and
  the conformant count equals the current census.
- Given any non-conformant row, when read, then it names a mechanism and a
  Java `file:line`, or carries a measured engine verdict (D1).
- Given the queue, when read, then it is ordered by reach and each item names
  the fixtures it would flip.
- Given a fixture appearing in two audit files, when merged, then the conflict
  is resolved explicitly in the journal rather than silently deduplicated.

## Observability requirements

The ledger *is* the mission's reporting surface. It must state the current
census number and the baseline (23/80) so drift is visible without re-running
anything.

## Rollback

**Reversible** — a documentation-only commit.

## Quality bar

Arithmetic is a gate here, not a formality — check it twice. Return only the
ledger file. No preamble, no trailing summary.

## Boundaries

- **Always:** verify the row count and the sum.
- **Ask first:** any mechanism the audits left without a verdict.
- **Never:** invent a verdict an audit did not supply; edit production code;
  commit.

## Commit format

```
docs(object): merge the cluster audits into the authoritative ledger
```
