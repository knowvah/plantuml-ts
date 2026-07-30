# T3 — Remove both narrowing guards

## Context

T1 and T2 removed the CAUSE of the two remaining narrowings. This task
removes the guards and lets the fixtures route.

| guard | cause removed by |
|---|---|
| box + `<img>` (`hasUnroutedBoxMarkup`'s `<img` check) | T1 |
| usecase + sprite, incl. MULTI-LINE (`hasUnroutedUsecaseMarkup`) | T2 |

**`<latex>` STAYS** — a deliberate documented divergence.
**folder/package STAYS** — it needs `create2`, which is mission SI1's
(ADR-10 of the previous mission). `FOLDER_SHOWN_TITLE_EXTRA_WIDTH` must
survive untouched; it is the faithful flat encoding of `getMarginX()`=6.

## Task

Remove the two guards. Delete any `size-backlog.json` pin whose fixture
flips — **deletion is the only permitted direction**. Then run the perf
check.

`imgFallbackFont`'s last reference lives here (T1 left it deliberately);
remove it with the guard.

## Write-set

- `src/diagrams/description/leaf-sizing.ts`
- `oracle/goldens/description/size-backlog.json` — deletions only
- co-located tests

## Read-set

- `src/diagrams/description/leaf-sizing.ts` — `hasUnroutedBoxMarkup`, `hasUnroutedUsecaseMarkup`
- `src/diagrams/description/leaf-sizing-legacy-fallback.ts` — which fallbacks survive
- `decisions.md#adr-4--gate-on-the-numbers-t5-already-measured`

## Acceptance criteria

- Given `jecici-56-bimu826`, when routed unguarded, then **widened 0** (it widened 0.398264in before T1)
- Given `bootstrap-0` and `ruziru-69-xixo434`, when routed unguarded, then **widened 0** (they widened 0.029321in before T2)
- Given a `<latex>` display, then it STILL does not route
- Given a folder/package display, then it STILL does not route and `FOLDER_SHOWN_TITLE_EXTRA_WIDTH` is intact
- Given the size ratchet, then conformance is **>= 320/351** with widened 0
- Given each flipped fixture, then its pin is deleted in THIS commit

## Perf check

Time `test-results/dot-cache/component/gutute-00-gaki684/in.puml` (71,961
bytes, the largest fixture) against the recorded **17.42ms** median.
`Footprint` draws in order to measure, so the usecase sizer may cost more.
**Flag a >10% regression; do not gate on it.** Record the number.

## If a pin WIDENS

**STOP.** Do not re-baseline. Diagnose to a mechanism at a `file:line` per
`~/.claude/rules/diagnosis.md`. A widened pin means ADR-1 or ADR-2 is wrong,
and that finding is worth more than the conformance number.

## Observability

N/A.

## Rollback

**Reversible** — code and pins revert together in one commit.

## Quality bar

All four gates (lint separately) + all ratchets + the parity guard + the
diff-count baseline (no rise).
