# Batch 4 — actor, then close out

Two tasks, sequential. T6 is deliberately LAST and alone, so it can be
reverted without touching Batches 1-3.

**Actor is not a USymbol case (D4).** `ComponentRoseActor.java:64` uses
`actorStyle.getTextBlock(biColor)`, which returns `ActorStickMan` /
`ActorAwesome` / `ActorHollow` per `ActorStyle.java:60-71`. All four are
already ported in `src/core/skin/`, and `theme.ts:69-72` already models
`skinparam actorStyle` — but `grep -rn "actorStyle" src/diagrams/sequence/`
returns **nothing**, so the setting is silently ignored in sequence diagrams
today.

This is therefore a feature addition as well as a re-mirror, and it touches
**179** corpus fixtures whose stick man is already count-correct and NOT
currently failing. That is why it is isolated.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T6 | Route sequence actors through `ActorStyle` | `typescript-pro` | `src/diagrams/sequence/renderer-participant-shapes.ts`, `src/diagrams/sequence/renderer.ts`, `src/diagrams/sequence/sequence-layout-participants.ts`, `tests/unit/sequence/renderer.test.ts` | T1–T5 | [ ] |
| T7 | Adjudicate and close out | `debugger` | `plans/sequence-participant-symbols/findings/adjudication.md`, `plans/sequence-participant-symbols/decision-journal.md`, `DIVERGENCES.md`, `planning/next-missions.md` | T6 | [ ] |

Batch gate: the four per-task gates, then the adjudicator against this batch's
parent **and** against `main`. Invariant: zero `regression`; `junaxa` stays
closed; `fobube`/`rugeco` do not rise.

**If T6 alone produces regressions that survive diagnosis, reverting T6 and
shipping Batches 1-3 is a legitimate outcome** — say so in the journal rather
than forcing it through. That is why it is last.
