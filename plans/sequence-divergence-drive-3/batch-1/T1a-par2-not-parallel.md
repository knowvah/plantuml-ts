# T1a — a `par2` group is parallel to the previous tile

Agent: `typescript-pro` (sonnet), worktree `sdd3-T1a`. Commit:
`fix(sequence): treat par2 group openers as parallel tiles`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanism (sdd2: `par2-not-parallel`; Java re-read)
`GroupingStart.isParallel()` is `parallel || isPar2GroupStart()`
(`sequencediagram/GroupingStart.java:104-107`), `isPar2GroupStart()` being
`getTitle().equals("par2")` (`:112-114`); the title is the TYPE keyword for
every group but a `group T [c]` rewrite (`SequenceDiagram.java:427`,
`CommandGrouping.java:131-145`). `GroupingTile.java:146` reads
`start.isParallel()`: `firstY = parallel ? currentY.getMin() : previousMax`
(`:154`), and `PlayingSpace#addParallelSiblingDisjointConstraints` clusters
parallel tiles and pushes them apart in x with `ensureDisjoint`
(`PlayingSpace.java:188-199,232-260`). Ours sets `FrameEvent.parallel` only
for a leading `&` (`command-grouping.ts:167`), so a `par2` stacks below the
previous tile and the layout (`sequence-layout-frame.ts:332`,
`sequence-layout-parallel-disjoint.ts:288`, which already consume
`parallel`) never sees it. The user's wording "a group titled par2" is the
TYPE keyword `par2` (or a `group par2 [c]` rewrite, whose `title` is `par2`).
Also: `GroupingLeaf.isParallel()` is `start.isPar2GroupStart()`
(`GroupingLeaf.java:100-104`) — the `else` leaves of a par2 are parallel too
(refiju's filed part).

## Targets
jexavi-40-degi377, daduxi-21-duse542, tukobo-89-zebi935 to 0. refiju-27-nupe082
to 0 only if its `else`-leaf part is reachable inside the write-set; the leaf
layout lives in `sequence-layout-frame.ts`/`sequence-layout-events.ts`
(owned by T1d/T1g this batch): if refiju still differs, hand back its
residual with the mechanism, do not edit those files (stop 1).

## Write-set
`src/diagrams/sequence/command-grouping.ts` and its test.

## Read-set
`command-grouping.ts:124-175,235-291`; `sequence-layout-parallel-disjoint.ts:
280-292`; `sequence-layout-frame.ts:326-340`; Java: `GroupingStart.java:95-115`,
`GroupingLeaf.java:95-105`, `GroupingTile.java:140-156`, `PlayingSpace.java:
185-260`; the four `.puml` under `tests/corpus/sequence/`.

## Acceptance
- Given `par2` (and `group par2 [x]`) opening a group after a message, when
  parsed, then the `FrameEvent` is parallel exactly as for `& par`; `par`,
  `alt`, `loop` openers stay non-parallel (unit test on the AST).
- Given jexavi, daduxi, tukobo, then each diffs to 0; refiju is 0 or handed
  back with its residual mechanism.
- Given the 1042 pins, then every pin stays byte-equal.

Observability: N/A — no new observable operations. Rollback: Reversible
(revert the task commit).
