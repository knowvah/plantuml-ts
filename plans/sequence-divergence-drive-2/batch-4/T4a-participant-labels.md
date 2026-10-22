# T4a — stick-kind labels, badge rows, queue margin

Agent: `typescript-pro` (sonnet), worktree `sdd2-T4a`. Commit:
`fix(sequence): place actor-family, badge and queue labels as rose does`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanisms (research A §1, §4, §5)
- **STICK** (actor, boundary, control, entity, database):
  `ComponentRoseActor.java:60` (padding 0,3,0,3), `:75` (head: text at
  `(getTextMiddlePostion, dimStickman.getHeight())`), `:78` (tail: dy 0),
  `:85` (`(prefW − getTextWidth)/2`), `:91`; `AbstractTextualComponent
  .java:107,113`; same bodies in `ComponentRoseBoundary.java:76,79`,
  `Control :77,80`, `Entity :77,80`, `Database :82,85`. x: the block
  starts at `(prefW − (pure+6))/2` → centre −3; the port centres on
  `p.centerX` (`sequence-layout-participant-label.ts:276-280`). y: block
  top at bottom − T (head) / top + 0 (tail); the port uses the uncited
  `fontSize/2 + 4*k` (`sequence-layout-participant-sizing.ts:177-193`).
  balixa "Alice": jar x 79.931, baseline 80.889.
- **BADGE** (`<<($sprite,…)>>`): `TextBlockSprited.java:62` (height =
  max(sprite, label)), `:76` (rows from the block top);
  `Display.java:687`. Port centres on the block centre
  (`buildLabelRuns` `:326`). birocu: +18.
- **QUEUE**: `ComponentRoseQueue.java:67,77`; `USymbolQueue.java:130-131`
  Margin(5,15,5,5), `:147` label at x1 = 5; `USymbol.java:60-65`. Port
  `nameCenterX` centres (+5).

The tail `dy` in `renderer-participant-shapes.ts:185,202-203` reads the
same block height; a block-height field on `ParticipantGeo`
(`geo-participant.ts`) is likely needed.

## Targets
STICK 49 (balixa, cusiru, kibave, kedipo, dudeku, rujetu, doleso, boparo,
kuzoba, lunasu, …); STICK+BADGE: birocu, favale, peciku, xediki, cexeco;
QUEUE: butofu, pumula, sudugu. `fixtures.md` lists all rows tagged T4a.

## Write-set
`src/diagrams/sequence/sequence-layout-participant-label.ts`,
`sequence-layout-participant-sizing.ts`, `renderer-participant-shapes.ts`,
`geo-participant.ts`, their tests.

## Read-set
`research/research-a-text.md` §1, §4, §5; the four write-set files; the
Java above; `ActorStickMan.java:121`.

## Acceptance
- Given `actor Alice`, then the head label x = component x + (prefW −
  (pure+6))/2 and baseline = stick height + 10 + ascent (balixa values;
  test citing `ComponentRoseActor.java:75,85`).
- Given a badge participant, then rows start at the block top (birocu
  +18 gone; test).
- Given a queue, then label x = component x + 5 (test).
- Given the 419 pins, then none changes (no pinned stick/queue/badge).
