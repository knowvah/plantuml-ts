# T6 — Route sequence actors through `ActorStyle`

## Context

`plantuml-ts` is a faithful port; the Java at `~/git/plantuml` is the spec.
**Open the method body.**

`renderActorShape` / `actorPathD` (`renderer-participant-shapes.ts:80-127`)
hand-roll the actor glyph as `ellipse` + one `path`. Its child COUNT was
already corrected in `sequence-command-coverage` T13 (2026-08-25), so this
task is **not** fixing a failing fixture — it is removing the last hand-rolled
participant glyph and adding `skinparam actorStyle` support.

Read `../README.md` and `../decisions.md` first. **D4** governs and contains a
correction you must not re-invert: **actor is NOT a USymbol case.**

## Task

1. Read `ComponentRoseActor.java` in full, especially `:64`
   (`this.stickman = actorStyle.getTextBlock(biColor)`) and `:67-80`
   (`drawInternalU`, whose `head` handling mirrors
   `ComponentRoseDatabase`'s).
2. Read `ActorStyle.java:60-71` — `STICKMAN` → `ActorStickMan(ctx, false)`,
   `STICKMAN_BUSINESS` → `ActorStickMan(ctx, true)`, `AWESOME` →
   `ActorAwesome`, `HOLLOW` → `ActorHollow`.
3. Thread `theme.actorStyle` (`src/core/theme.ts:69-72`) into the sequence
   engine and dispatch to the ported classes in `src/core/skin/`
   (`ActorStickMan.ts`, `ActorAwesome.ts`, `ActorHollow.ts`,
   `ActorStyle.ts`), drawn through `UGraphicSvg` as T1 does for USymbols.
4. Size from `ComponentRoseActor`'s own `getPreferredWidth`/
   `getPreferredHeight` — read them; do NOT assume they match
   `ComponentRoseDatabase`'s.
5. Delete `renderActorShape`, `actorPathD` and `computeActorGeo`
   (`:23-127`). Grep for references first.

## Write-set (exhaustive)

- `src/diagrams/sequence/renderer-participant-shapes.ts`
- `src/diagrams/sequence/renderer.ts`
- `src/diagrams/sequence/sequence-layout-participants.ts`
- `tests/unit/sequence/renderer.test.ts`

## Read-set

- `~/git/plantuml/.../skin/rose/ComponentRoseActor.java` — whole file
- `~/git/plantuml/.../skin/ActorStyle.java:55-71`
- `src/core/skin/ActorStyle.ts`, `ActorStickMan.ts`, `ActorAwesome.ts`,
  `ActorHollow.ts`
- `src/core/theme.ts:69-80` — how `actorStyle` is already resolved
- `src/diagrams/description/layout-types.ts` — the only current consumer of
  `ActorStyle`; follow its threading pattern
- `src/diagrams/sequence/renderer-participant-shapes.ts:23-127`

## Interface contract

No new exports. Consumes the ported `src/core/skin/Actor*` classes and
`theme.actorStyle`.

## Acceptance criteria

- Given a default diagram with an `actor`, then the emitted glyph is
  `ActorStickMan`'s and the child count is **unchanged** from before this task
  (it was already correct — a change here is a regression, not progress).
- Given `skinparam actorStyle awesome`, then `ActorAwesome`'s glyph is emitted
  — behaviour that does not exist today.
- Given `skinparam actorStyle hollow`, then `ActorHollow`'s glyph is emitted.
- Given `grep -rn "actorPathD\|computeActorGeo\|renderActorShape" src`, then
  there are no remaining references.
- 90/90/90 on the changed lines.

## Observability

Touches **179** fixtures — the largest blast radius in the mission, for zero
ratchet gain. The orchestrator adjudicates at the batch gate. **If this task's
rises survive diagnosis, reverting T6 and shipping Batches 1-3 is a legitimate
outcome** (see `batch-4/overview.md`); say so rather than forcing it.

## Rollback

**Reversible**, and deliberately isolated: T6 is the last code task and shares
no commit with Batches 1-3, so `git revert` of this one commit restores the
actor path without disturbing database or the five types.

## Quality bar

The four gates exit 0. `renderer.ts` must stay **under 500 lines**. No
Prettier. Never re-pin a baseline JSON.

## Commit

`feat(T6): route sequence actors through ActorStyle`
