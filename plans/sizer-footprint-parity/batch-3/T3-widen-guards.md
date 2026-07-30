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

**T3 ABSORBED T2's routing half — orchestration correction.**
`usecase-footprint.ts`'s `boxPoints`/`containingEllipse` and
`leaf-sizing-text.ts#footprintBoxes` have exactly ONE consumer:
`measureUsecase` in `leaf-sizing.ts:255-325`, called at `:134` — the guarded
path itself. Splitting "retire the substitute" from "remove the guards"
across a write-set boundary was wrong; the call graph makes them one unit.

So this task, in order:

1. Remove the two guards. Every usecase display then routes through
   `measureEntityLeaf` → `EntityImageDescription.calculateDimensionSlow`,
   which is ALREADY the faithful `TextBlockInEllipse`/`Footprint` path (see
   that file's own module doc).
2. `measureUsecase`, `footprintBoxes`, `boxPoints` and `containingEllipse`
   then become genuinely dead. **Delete them and `usecase-footprint.ts`.**
   Verify death by READING each caller, not by grepping — a prior mission
   reported 24 live constants as dead on a silently-failing glob.
3. Remove the last `imgFallbackFont` reference (T1 left it here deliberately).
4. Delete any `size-backlog.json` pin whose fixture flips — **deletion is
   the only permitted direction**.
5. Run the perf check.

If the substitute turns out NOT to be dead after the guards are removed,
**STOP and report** — that means the routing does not in fact reach
`Footprint`, and ADR-2's premise is wrong.

`imgFallbackFont`'s last reference lives here (T1 left it deliberately);
remove it with the guard.

## Write-set

- `src/diagrams/description/leaf-sizing.ts`
- `src/diagrams/description/usecase-footprint.ts` (DELETE the file)
- `src/diagrams/description/leaf-sizing-text.ts` — remove `footprintBoxes` and `inlineFootprintBox` if dead
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
