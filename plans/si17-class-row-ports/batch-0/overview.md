# Batch 0 — go/no-go: which source reproduces the oracle's bands

**Blocking.** Nothing in Batch 1 starts until T0 resolves
[ADR-1](../decisions.md#adr-1--where-do-the-class-port-bands-come-from-unresolved--batch-0).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T0](T0-band-source-gono-go.md) | Measure both band sources against jar oracle DOT | general-purpose | `../decision-journal.md` | — | [x] |

## Why this is a batch of its own

Both candidate sources are *plausible*, and the repo has been burned before
by acting on the plausible one: the standing T6 finding is that the ported
classes and the flat sizing tables are faithful in **different places**, so
"upstream's own path must be right" and "the map precedent must generalize"
are both guesses until measured.

T0 writes **no production code**. Its deliverable is a number-bearing
journal entry that names the winner, or a stop.

## Batch exit

- ADR-1 records a decision with per-band numbers behind it.
- The multi-compartment control is measured, not assumed — that is where
  option B is most likely to break.
- `bicabi-42-coto932` confirms the zero-election case predicted by ADR-3/4.
