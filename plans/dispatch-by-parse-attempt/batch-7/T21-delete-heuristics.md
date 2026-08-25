# T21 — delete the heuristic layer

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML. This mission
([README](../README.md)) replaced regex routing with upstream's parse-attempt
dispatch. The heuristics that did the routing are now unreachable.

Deleting them is the mission's deliverable, not a tidy-up: while they exist,
someone will tune one, and the divergence grows back.

## Task

Remove the heuristic layer. Candidates, with their current sizes:

| File | Lines | Note |
|---|---|---|
| `src/core/descriptive-keywords.ts` | 527 | consulted for a large share of the corpus by the old dispatch |
| `src/diagrams/class/class-dispatch.ts` | 451 | `classAccepts` and its TYPE alternation |
| tests asserting `accepts()` / heuristic behaviour | — | `tests/unit/dispatcher.test.ts`, `tests/unit/class/class-dispatch*.test.ts`, and others |

**`grep` before deleting each one.** "Looks unused" is not "is unused" — these
modules may export helpers that a renderer or sizer legitimately consumes for
reasons unrelated to dispatch. Keep exactly what has a live caller, move it to
a sensible home if its current file is going away, and say in the commit body
which symbols survived and why.

Preserve any test that asserts *routing outcomes* — those are still valid and
now assert the new mechanism. Delete only tests that assert the *heuristic's
internals*.

## Write-set

- `src/core/descriptive-keywords.ts` (delete or reduce)
- `src/diagrams/class/class-dispatch.ts` (delete or reduce)
- dead tests
- `docs/catalog.md` (`npm run catalog`)
- a new home for any surviving helper

## Read-set

- both files above, in full
- every caller `grep` turns up
- `plans/routing-heuristic-repair/README.md`'s closing note on `stereotype` —
  it documents *why* one entry was deliberately excluded from the class TYPE
  alternation. That reasoning dies with the file; check nothing else depends
  on it before letting it go

## Acceptance criteria

1. *Given* each deleted symbol, *when* `grep`ped across `src/`, `tests/` and
   `demo/`, *then* it has no remaining caller
2. *Given* the full suite, *when* run, *then* all four gates pass and the
   routing and refusal gates are unchanged
3. *Given* a symbol with a live caller unrelated to dispatch, *when* found,
   *then* it survives in a documented home and the commit body says why
4. *Given* `docs/catalog.md`, *when* regenerated, *then* it is drift-clean

## Observability

N/A — no new observable operations. Both gates must stay pinned.

## Rollback

Reversible — revert the commit.

## Quality bar

All four gates green; both conformance gates unchanged. Commit body lists what
was deleted, what survived, and why.

## Boundaries

- **Always:** `grep` before deleting; preserve routing-outcome tests
- **Never:** delete a symbol with a live caller; run Prettier

## Commit

`refactor(T21): delete routing heuristics superseded by parse attempt`
