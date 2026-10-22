# T2d — `->(N)` inclination; response-below

Agent: `typescript-pro` (sonnet), worktree `sdd2-T2d`. Commit:
`fix(sequence): include arrow inclination in message tile height`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanisms
1. **INCL** (research C). The tile height includes incl1 + incl2
   (`ComponentRoseArrow.java:342-343`); the start point is at y + incl2,
   which is also the activation step (`:313-318`, via
   `CommunicationTile.java:194-198`). Reverse arrows use the reversed
   configuration (`CommunicationTile.java:158-159`): in the port use
   `reverseArrowConfiguration` when the direction is `'left'`
   (`sequence-layout-message.ts:65,115-120`). letagi: tile 27 + 60, every
   later y +60. Prototype `prototypes/m_incl.patch`. The activation-step
   y goes through T2b's `LiveBoxes`.
2. **RESPONSE-BELOW** (research C, LOW, unprototyped). `ComponentRoseArrow
   .java:330-332`: `isBelowForResponse` → yPoint = paddingY. Suspected for
   pukebe (delta 15 at the arrow line). Read the port side
   (`sequence-layout-message.ts:115`) and either fix with a citation or
   journal the mechanism you find instead.

## Targets
celego, fenoli, jajobi, letagi, vativa (`zeroAfterTask.T2d`); pukebe.

## Write-set
`src/diagrams/sequence/sequence-layout-message.ts`, its tests.

## Read-set
`research/research-c-vertical.md` (INCL, RESPONSE-BELOW);
`sequence-layout-message.ts` (whole); `sequence-live-boxes.ts` (read);
`skin/rose/ComponentRoseArrow.java:300-345`.

## Acceptance
- Given `A ->(30) B`, then the tile height includes the inclination
  (`ComponentRoseArrow.java:342-343`, test).
- Given `B <-(30) A`, then the reversed configuration applies (test).
- Given the targets, then each is zero-diff, or pukebe's mechanism is
  journaled with `file:line`.
