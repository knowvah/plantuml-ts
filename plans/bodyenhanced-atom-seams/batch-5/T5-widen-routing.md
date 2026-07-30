# T5 — Remove TWO narrowing guards (was three; see ADR-10)

## Context

T6 (last mission) routed `measureLeafNode` through
`EntityImageDescription` but had to narrow four times, each diagnosed to a
mechanism. Batches 2-4 removed the CAUSE of **two**:

| narrowing | now supplied by | remove the guard? |
|---|---|---|
| usecase + sprite | ink fields on `AtomImageResolver` (T3) | **YES** |
| box + `<img>` | `imgFallbackFont` threaded from `buildTextBlock` (T3) | **YES** |
| folder/package | would need `BodyEnhanced1.getMarginX()`=6 via `create2` — **moved to mission SI1 (ADR-10)** | **NO — stays** |
| box + `<latex>` | nothing; a deliberate divergence | **NO — stays** |

**This file previously said "three" and credited folder/package to
"T2b + T4". That is void.** `create2`/`BodyEnhanced1` need
`MethodsOrFieldsArea` and a ≈12,100-line cascade through `CucaDiagram`/
`Entity`/`Bodier` and the 40-file `skin/` package, which is SI1's scope.
`FOLDER_SHOWN_TITLE_EXTRA_WIDTH = 12` therefore **stays live and correct** —
it is the faithful flat encoding of `getMarginX`=6 applied both sides by
`decorate`. Deleting it here would break every folder/package title width.

## Task

Delete the **two** guards named YES above; route those cases through
`measureEntityLeaf`. Shrink `leaf-sizing-legacy-fallback.ts` to whatever
`<latex>` **and folder/package** still need — both fallbacks survive.

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

- Given usecase-with-sprites and `<img>`-bearing box displays, then both
  route through `measureEntityLeaf`
- Given a **folder/package** display, then it STILL does not route, and
  `FOLDER_SHOWN_TITLE_EXTRA_WIDTH` is intact — that narrowing is SI1's
  (ADR-10), and its 8 fixtures must not regress
- Given a `<latex>`-bearing display, then it STILL does not route — the
  deliberate divergence survives, and the two LaTeX fixtures do not regress
- Given the size ratchet, then `widened` is 0 and conformant **RISES**
  above 317/351. **Expect a modest rise:** the two guards being removed
  cover roughly the sprite and `<img>` cases (T6 recorded them as widening
  `bootstrap-0`, `ruziru-69` and `jecici-56`), not the 8 folder/package
  fixtures. A large jump is a reason to look for an accidental `create3`-for-
  `create2` substitution, not a cause for celebration
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
