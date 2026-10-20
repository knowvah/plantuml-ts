# T2b — lifeline, activation box, destroy

Agent: `typescript-pro`, worktree `sdd1-T2b`. Commit:
`fix(sequence): paint lifelines and activations from the merged style`.
**Read [family-contract.md](family-contract.md) first — it is part of this
prompt.**

## The family
The dashed participant lifeline, activation boxes, and the destroy cross.
Planning measurement: the lifeline `<line>` misses `stroke-width:0.5` in
**1122** fixtures — `element { LineThickness 0.5 }` (`plantuml.skin:91-93`)
merged into `lifeLine { LineStyle 5 }` (`:141-143`); today
`renderer-lifeline.ts:215` strokes at `theme.scaleK`. Activation box fill is
`#DDD` where the jar draws `#FFF` (634 elements) — `activationBox {
BackGroundColor white }` (`:145-147`). Destroy: `destroy {
LineColor #A80036; LineStyle 0; LineThickness 2 }` (`:149-153`; signature `lifeLine, destroy`,
`LifeEventType.java:47-50`).

Java: `skin/ComponentType.java:78-87`; `skin/rose/ComponentRoseLine.java`,
`ComponentRoseActiveLine.java`, `ComponentRoseDestroy.java`;
`sequencediagram/teoz/LiveBoxesDrawer.java` (activation drawing, `:140`);
`sequencediagram/LifeEvent.java:104-110`.

## Write-set
`src/diagrams/sequence/{renderer-lifeline,sequence-life-state}.ts`, their
tests under `tests/unit/sequence/`.

## Read-set
`family-contract.md`; `decisions.md#d1`, `#d2`, `#d5`; `renderer-lifeline.ts`
(whole, 261); `sequence-life-state.ts`; `geo-annotation.ts:160-200`
(`LifelineSegment`), `geo-message.ts:85-110` (`ActivationGeo`);
`sequence-skin-param.ts` (`componentStyle`, `paintOf`).

## Acceptance
- Given `kugete-25-poba470`, when classified, then its lifeline
  `stroke-width` diff is gone.
- Given a default activation, then fill `#FFFFFF` as the jar emits it and
  thickness from the merged `activationBox` style (unit test cites the
  skin lines).
- Given `skinparam lifelineBorderColor red` and `<style> lifeLine {
  LineThickness 2 }`, then both arrive through the Style path.
- Given a `destroy`, then the cross is `#A80036`, thickness 2.
- Given the lifeline rows at b1b, then no row rises without a mechanism.

Quality bar and boundaries: per `family-contract.md`. Observability: N/A — no new
observable operations. Rollback: Reversible.
