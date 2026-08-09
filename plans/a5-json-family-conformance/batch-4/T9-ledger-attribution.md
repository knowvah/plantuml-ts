# T9 — attribute every remaining non-conformant fixture

## Context

The mission's exit bar is **100% conformant minus named divergences**: every
fixture that is not zero-diff must be carried by a named entry. This task
produces those names.

The standard is G1-I10's, met by G2 across 718 fixtures, G3 across 80, and G4
across 271: every fixture individually accounted for. A summary line covering
fourteen fixtures does not meet it.

## Task

Re-run the census for all three types after Batch 3, and produce
`ledger.md` accounting for **every** fixture: pinned, or attributed to a
numbered mechanism.

For each mechanism, `~/.claude/rules/diagnosis.md` requires: **mechanism**,
**origin** (`file:line`), **causal chain**, **ruled out**. An empty "ruled out"
on a non-trivial fixture means the cause was guessed.

Classify each mechanism as exactly one of:

- **PORT GAP** — this port is missing behaviour upstream has. Fixable here; size
  it (files, blast radius) rather than describing it as "hard."
- **DELIBERATE DIVERGENCE** — we render differently on purpose. Needs a
  `DIVERGENCES.md` entry from T10, and a product reason. **Effort is not a
  reason** — a feature upstream ships that we found hard is a PORT GAP.
- **ENGINE DEFECT** — a @knowvah/dot-engine bug. File it in
  `docs/graphviz-issues/` (issue file + TRACKER line) as part of this task.
- **UNDIAGNOSED** — cause not yet isolated. Valid, but must state what was ruled
  out and what to instrument next.

## Read-set

- `plans/a5-json-family-conformance/baseline.md` — the Batch 2 baseline, to
  state the mission's before/after honestly
- `plans/a5-json-family-conformance/adr1-gonogo.md` — T5's verdict
- `plans/g4-state-svg/ledger.md` — the format and granularity to match
- `tests/oracle/svg-conformance/compare.ts` — re-read the `childCount`
  early-return before quoting any diff count as a total
- `docs/graphviz-issues/TRACKER.md` — check before filing anything new
- `DIVERGENCES.md` — the existing json entries (array index keys, primitive
  root); reconcile rather than duplicate

## Write-set

- `plans/a5-json-family-conformance/ledger.md` (create)
- `docs/graphviz-issues/<new-issue>.md` + a TRACKER line, per engine defect found

No production code.

## Architecture decisions (locked)

- **ADR-2:** a geometry gap may NOT be attributed to "the jar uses old
  graphviz." For json, Smetana is the target. Diagnose it.

## Interface contracts

`ledger.md` contains:

```
## Outcome
| type | before (Batch 2) | after | pinned | attributed |

## Mechanisms
| # | mechanism | class | origin (file:line) | fixtures | evidence |

## Per-fixture index
| slug | type | status | mechanism # |
```

`status` ∈ `pinned` | `attributed`. Every fixture in the corpus appears exactly
once in the per-fixture index. Consumed by T10.

## Acceptance criteria

1. **Given** the corpus, **when** `ledger.md` is read, **then** every fixture
   appears exactly once in the per-fixture index — count it and state the count.
2. **Given** any `attributed` fixture, **then** its mechanism row carries all
   four diagnosis fields and a class.
3. **Given** any mechanism classed DELIBERATE DIVERGENCE, **then** its reason is
   a product decision, never effort or difficulty.
4. **Given** any mechanism classed ENGINE DEFECT, **then** a
   `docs/graphviz-issues/` file exists with a minimal repro (ideally the exact
   DOT text) and a TRACKER line.
5. **Given** the outcome table, **then** the before-numbers match
   `baseline.md` — the mission's improvement is stated, not implied.

## Observability requirements

N/A — offline measurement and documentation.

## Rollback

**Reversible.** Documentation only.

## Quality bar

- Four gates green (unchanged — no code edited).
- Do not report a mechanism you have not verified against the Java or a
  controlled experiment.
- If a fixture cannot be diagnosed, say so as UNDIAGNOSED with its ruled-out
  list. "This is hard" is not a stop condition; an honest UNDIAGNOSED row is.

## Boundaries

- **Never:** pin a fixture that is not genuinely zero-diff.
- **Never:** widen a tolerance.
- **Never:** run `git commit` or any state-mutating git command.
