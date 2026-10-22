# T3b — reverse self message `A <- A`

Agent: `typescript-pro` (sonnet), worktree `sdd2-T3b`. Commit:
`feat(sequence): port reverse-defined self messages`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanism (research B M7; D10)
A self message written `A <- A` sets `isReverseDefine()`: upstream skips
the `x1` shift entirely and hands the drawing to
`ComponentRoseSelfArrow.drawLeftSide` (its own three-branch `dx`/`level`
arithmetic, `:177-190` and `:195+`); extents `CommunicationTileSelf.java:
263-277` (min = posC − comp, max = posC2) and the reverse spacing case
`:170-176`. The port does not record `reverseDefine` on self messages
(comment block now in `sequence-layout-message-self.ts`) and
`DIVERGENCES.md:779` calls it unported — no library forces it, so it is a
bug (D10). kumogu draws the loop at x 83.9, the jar at 41.9.

1. Record `reverseDefine` on the self message in `command-arrow.ts` (find
   where upstream sets it in the arrow command).
2. Lay out and draw the left-side loop (`drawLeftSide`).
3. Extents: min/max into `sequence-layout-width.ts`; the reverse spacing
   case into `sequence-layout-participant-constraints.ts`.
4. Delete the `DIVERGENCES.md` entry and the NOT-ported comment.

## Targets
SequenceArrows_0002_Test, dipazo, keloje, kevaru, kumogu, sufevi, tapije,
tifexe, tovese (the loop geometry; several also need T7a's dressing).

## Write-set
`src/diagrams/sequence/command-arrow.ts`, `ast*.ts`, `sequence-layout-
message-self.ts`, `renderer-message.ts`, `sequence-layout-participant-
constraints.ts`, `sequence-layout-width.ts`, `DIVERGENCES.md`, tests.

## Read-set
`research/research-b-width.md` M7; `DIVERGENCES.md:770-800`;
`sequence-layout-message-self.ts`; `renderer-message.ts:60-120`;
`skin/rose/ComponentRoseSelfArrow.java` (whole);
`CommunicationTileSelf.java:160-280`.

## Acceptance
- Given `A <- A : x`, when parsed, then the self message has
  `reverseDefine` (test).
- Given kumogu, then the loop is drawn at the jar's x (41.9) (test against
  the golden's path).
- Given `DIVERGENCES.md`, then the reverse-self entry is gone.
