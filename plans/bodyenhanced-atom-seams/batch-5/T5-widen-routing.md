# T5 — Remove the three narrowing guards

## Context

T6 (last mission) routed `measureLeafNode` through
`EntityImageDescription` but had to narrow four times, each diagnosed to a
mechanism. Batches 2-4 removed the CAUSE of three:

| narrowing | now supplied by |
|---|---|
| folder/package | `BodyEnhanced1.getMarginX()` = 6 (T2b + T4) |
| usecase + sprite | ink fields on `AtomImageResolver` (T3) |
| box + `<img>` | `imgFallbackFont` threaded from `buildTextBlock` (T3) |
| box + `<latex>` | **NOTHING — this one STAYS** |

## Task

Delete the three guards; route those cases through `measureEntityLeaf`.
Shrink `leaf-sizing-legacy-fallback.ts` to whatever `<latex>` still needs.

## Write-set

- `src/diagrams/description/leaf-sizing.ts`
- `src/diagrams/description/leaf-sizing-legacy-fallback.ts`
- `oracle/goldens/description/size-backlog.json` — DELETE pins whose
  fixtures flip; deletion is the only permitted direction
- `tests/architecture/sizer-renderer-parity.test.ts` — ONLY to delete a
  `KNOWN_GAPS` entry this closes
- co-located tests

## Read-set

- `src/diagrams/description/leaf-sizing.ts` — the dispatch and its guards
- `src/diagrams/description/leaf-sizing-legacy-fallback.ts` — its module
  doc records exactly why each fallback exists
- `plans/description-leaf-sizing-audit/decisions.md` — the ADR-6 AMENDMENT

## Acceptance criteria

- Given folder/package, usecase-with-sprites and `<img>`-bearing box
  displays, then all route through `measureEntityLeaf`
- Given a `<latex>`-bearing display, then it STILL does not route — the
  deliberate divergence survives, and the two LaTeX fixtures do not regress
- Given the size ratchet, then `widened` is 0 and conformant **RISES**
  above 317/351
- Given each flipped fixture, then its pin is deleted in THIS commit
- Given the flat tables, then only entries with no remaining reader are
  removed — **verify by READING, not grepping.** A scan last mission
  reported 24 live constants as dead because a zsh glob failed silently.

## If a pin widens

STOP, diagnose to a `file:line`, report. A widened pin here means a batch
2-4 assumption was wrong, and that is worth more than the conformance
number.

## Observability / Rollback

N/A. Reversible — code and pins revert together.

## Quality bar

All four gates + all three ratchets + T1's golden ratchet + the parity
guard.
