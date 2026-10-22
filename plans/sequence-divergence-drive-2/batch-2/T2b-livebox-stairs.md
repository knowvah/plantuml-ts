# T2b — activation stairs (LiveBoxes); self-message x

Agent: `typescript-pro` (opus), worktree `sdd2-T2b`. Commit:
`fix(sequence): port teoz LiveBoxes for activation bar ends`.
Read [../task-contract.md](../task-contract.md) first. Think through
`LiveBoxes` end to end before writing code; this replaces a model, it does
not patch one.

## Mechanisms (research C: STAIRS, SELFX — land together; SELFX alone zeroes none)
1. **STAIRS.** Port `teoz/LiveBoxes.java` into a new
   `sequence-live-boxes.ts`:
   - `addStep` (`:79-86`): a deactivate landing on a y already recorded
     gets y + 5;
   - `getStairs` (`:284-336`): position, seenActivate / seenDeactivate,
     Note resets; `Math.max(createY, position)` (`:330`, unconfirmed by
     the prototype — test it);
   - every life event binds to `lastEventWithDeactivate`
     (`SequenceDiagram.java:367-404`), not only the first after a message.
     The port's consume-once `cursor.lastMessageY`
     (`sequence-layout-life-event.ts:53-91`, reset at `:64,75`) goes;
   - self-message steps: activate/destroy at p2.y, deactivate at p1.y
     (`CommunicationTileSelf.java:113-126`); `LifeEventTile.java:65-71`.
   nanedo: jar bar 66 → 79 (height 13), port height 8. nocilo: second
   `activate` starts 8 low today.
2. **SELFX.** The self-message loop end and label sit on the component
   origin; only the outgoing segment starts at `deltaX1`
   (`ComponentRoseSelfArrow.java:91-93,121-123`,
   `CommunicationTileSelf.java:136-153`). The port anchors `xRight` and the
   label at `fromX = base + deltaX1` (`renderer-message.ts:84-101`; the
   self branch of `labelLeftOf`, now in `sequence-layout-message-self.ts`).
   kilili: 89.288 vs jar 94.288. The "jar-verified" comment at the old
   `sequence-layout-message.ts:396-398` is contradicted (gesiba) — fix it.

Export `LiveBoxes` per the batch overview contract (consumed by T3a's
`posC2` and T7b). Prototype: `prototypes/m_stairs_selfx.patch` +
`proto-stairs.ts`.

## Targets
`prototypes/expected-zero.json` → `zeroAfterTask.T2b` (17 rows: nanedo,
nocilo, donuli, gojuro, tukivo, taduka, kilili, comelo, nofola, pixima,
TeozTimelineIssues_0003/0004, …). Also check the prior findings research C
could not reproduce: extra level-2 bar after `++ ++ destroy`.

## Write-set
New `src/diagrams/sequence/sequence-live-boxes.ts`;
`sequence-layout-life-event.ts`, `sequence-layout-activation.ts`,
`sequence-layout-message-self.ts`, `renderer-message.ts`,
`sequence-layout-message.ts` (only `applyMessageActivation` and the
activation-step hand-off to `LiveBoxes`; T2a's gauge code is not yours to
reshape); their tests.

## Read-set
`research/research-c-vertical.md` (STAIRS, SELFX); the two prototype files;
`sequence-layout-life-event.ts`, `sequence-layout-activation.ts` (whole);
`renderer-message.ts:60-120`; `teoz/LiveBoxes.java` (whole),
`LiveBoxesDrawer.java`, `LifeEventTile.java`.

## Acceptance
- Given `A -> B ++` then `B --> A --`, then B's bar runs from the arrow y to
  the deactivate y + 5 when they coincide (`LiveBoxes.java:79-86`, test).
- Given two life events after one message, then both bind to it
  (`SequenceDiagram.java:367-404`, test).
- Given classify, then the 17 rows are zero-diff (or journaled), no pinned
  row changes, and the B2 close's all-engine survey shows no loss.

## Added at T2a hand-back (journal row 24)
Exo arrow x level: `CommunicationExoTile.java:122` IGNORE_FUTURE_DEACTIVATE vs `exoSpan` bare stack level.
