# T7 — `ActorAwesome` / `ActorHollow` geometry + the `actorStyle` accessor

## Context

Two Batch-1 findings turned out to be one defect seen from two directions:
T2 flagged ACTOR_AWESOME and ACTOR_HOLLOW as USymbol MISMATCHes; T3
independently found `skinparam actorStyle` has NO `Theme` field, with both
the renderer (`renderer-symbol.ts:26`) and the sizer
(`leaf-sizing-consts.ts:55,58`) independently hardcoding `STICKMAN`.

T4 measured it against the jar:

| style | jar | ours | error |
|---|---|---|---|
| stickman / unset | 0.444792×1.027778 | same | — |
| awesome | **0.763889×1.041667** | 0.444792×1.027778 | −22.975 w, −1.0 h |
| hollow | **0.444792×0.652778** | 0.444792×1.027778 | +27.0 h |

**This is TWO fixes and they are SEQUENCED, not parallel.** Verified:
`src/core/skin/` contains only `ActorStickMan.ts` and `ActorStyle.ts`, and
`ActorStyle.ts:53` throws for AWESOME/HOLLOW with a comment recording the
deliberate deferral ("no `actorStyle()` accessor at all… no caller
anywhere"). So the accessor alone changes nothing, and the geometry alone
is unreachable. Do (a) then (b) in that order, in one commit.

## Task

(a) Port `ActorAwesome` and `ActorHollow` from upstream, mirroring how
`ActorStickMan.ts` was ported — same file layout, same names, same
`SymbolContext` seam. (b) Add the `actorStyle` skinparam/`Theme` accessor
and consume it at BOTH call sites, replacing the two hardcodes.

## Write-set

- `src/core/skin/ActorAwesome.ts`, `src/core/skin/ActorHollow.ts` (new)
- `src/core/skin/ActorStyle.ts` — remove the throwing branches
- `src/core/theme.ts`, `src/core/skinparam.ts` — the accessor
- `src/diagrams/description/leaf-sizing-consts.ts` — the sizer hardcode
- `src/diagrams/description/renderer-symbol.ts` — the renderer hardcode
- co-located tests

## Read-set

- `~/git/plantuml/.../skin/ActorAwesome.java`, `ActorHollow.java`,
  `ActorStickMan.java`, `ActorStyle.java`
- `src/core/skin/ActorStickMan.ts` — the porting pattern to mirror
- `planning/usymbol-composition.md` — the ACTOR_* rows
- `planning/sizer-renderer-parity.md` — the `actorStyle` row

## Acceptance criteria

- Given `skinparam actorStyle awesome`, when measured, then the node is
  **0.763889×1.041667** (jar); given `hollow`, **0.444792×0.652778**;
  given unset, unchanged at 0.444792×1.027778
- Given both paths, then NEITHER hardcodes `STICKMAN` any more, and both
  read the same accessor — a second independent read would recreate the
  divergence this mission exists to end
- Given the ratchet, then `widened` is 0 and `conformant` does not fall
- Given a fixture that flips, then its pin is deleted in THIS commit
- Given every geometry constant, then it is DERIVED from the Java, never
  fitted

## Observability / Rollback

N/A. Reversible.

## Quality bar

All four gates + the three ratchets. Do not "improve" upstream's actor
geometry while porting it.
