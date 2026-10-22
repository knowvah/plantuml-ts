# T4c — message label alignment

Agent: `typescript-pro` (sonnet), worktree `sdd2-T4c`. Commit:
`feat(sequence): honour SequenceMessageAlign and arrow alignment`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanism (research A §3)
`Rose.java:299-336` resolves messagePosition from the merged
`root/element/sequenceDiagram/arrow` style, including first / direction /
reverseDirection. `ComponentRoseArrow.java:166-172`: CENTER `(W −
abs(textDeltaX) − tw)/2`; RIGHT `W − abs(textDeltaX) − tw − padX2 −
(L2R_NORMAL ? 10 : 0)`. Rows align inside the block by the style's
alignment (`AbstractTextualComponent.java:81,89-92`). `right:right` →
`right` is already ported (`FromSkinparamToStyle.ts:411`). The port
implements only LEFT (`sequence-layout-message.ts` `labelLeftOf`;
`text-block-geo.ts:366+` `messageLabelBlock`). Mirror the CENTER/RIGHT
branches in `sequence-layout-exo.ts` `exoLabelLeft` (shares
`ComponentRoseArrow`). The port encodes direction differently (comment
near `labelLeftOf`): map first/direction from geometry, not `dressing1`.
Unconfirmed: multi-line rows under direction/first/reverseDirection.

## Targets
cexelu, dokuse, jatase (right), dopuko (center), nizoxo, kemaba
(direction), sizumo (first), vuvuge (reverseDirection). Pinned sevicu-84
(`left`) must stay byte-identical.

## Write-set
`src/diagrams/sequence/sequence-arrow-paint.ts`, `sequence-layout-
message.ts`, `text-block-geo.ts`, `sequence-layout-exo.ts`, their tests.

## Read-set
`research/research-a-text.md` §3; `sequence-arrow-paint.ts`;
`sequence-layout-message.ts` (label code); `text-block-geo.ts:350-466`;
the Java above.

## Acceptance
- Given `skinparam SequenceMessageAlign right`, then cexelu's row 2 x =
  54.506 (test citing `ComponentRoseArrow.java:166-172`).
- Given `first` / `direction` / `reverseDirection`, then sizumo's a2 =
  57.444, b1 = 67.444 (test).
- Given the 8 targets, then all are zero-diff or journaled; sevicu-84 is
  unchanged.
