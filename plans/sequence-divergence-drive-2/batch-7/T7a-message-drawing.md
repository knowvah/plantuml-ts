# T7a — message drawing: self dressing, multicast, part anchors

Agent: `typescript-pro` (sonnet), worktree `sdd2-T7a`. Commit:
`fix(sequence): draw self-message dressing, multicast targets`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanisms (research D)
- **F** self-message circles and dressing1: `skin/rose/
  ComponentRoseSelfArrow.java:91-113` (circles for `o`), `:131-149`
  (dressing1: cross / async / normal), `drawLeftSide :195+` (T3b ported
  the reverse loop). The port draws only the dressing2 head
  (`renderer-message.ts` `renderSelfMessage`, `renderer-arrowhead.ts:
  346-362`). caluni 4/4 circles, kumogu 6/6.
- **J** multicast `A -> B & C`: `teoz/CommunicationTile.java:338,
  373-~395` (`drawMulticast`) — one polygon + line per extra target.
  Parsed (`command-arrow.ts:348-352`, `command-arrow-endpoints.ts:48`), no
  layout/render consumer.
- **Z** part-anchored messages are not drawn: `CommunicationTile.java:
  328-331` (`part1Anchor`/`part2Anchor` != null → return). nivaje: we draw
  2 slanted messages, the jar none.

`sequence-arrowhead.ts` is 499 lines: split it (pure move) in this commit
before growing it.

## Targets
F: SequenceArrows_0001/0002, caluni, keloje, kumogu, suredo, tovese,
bakuba. J: punove, pijixu, numezi, birefi. Z: nivaje.

## Write-set
`src/diagrams/sequence/renderer-message.ts`, `renderer-arrowhead.ts`,
`sequence-arrowhead.ts` (+ its split), `sequence-layout-message.ts`, tests.

## Read-set
`research/research-d-structure.md` F, J, Z; `renderer-message.ts`;
`renderer-arrowhead.ts:300-362`; `ComponentRoseSelfArrow.java` (whole);
`CommunicationTile.java:320-400`.

## Acceptance
- Given `A -> A` with `o` on both ends, then the jar's circles and dressing1
  are drawn (test against a golden's elements).
- Given `A -> B & C`, then C gets its polygon + line (test).
- Given a part-anchored message, then nothing is drawn for it (test).
- Given the targets, then structural sites are gone; no pinned change.

## Added at T3b hand-back (journal row 57)
- `renderer-arrowhead.ts:324-331` `SELF_REVERSE_DEFINE = false` comment ("drawLeftSide stays unreachable") is stale since T3b.
- Multicast below-arrow offset: `getPosArrow` (0 when below) read by `drawMulticast` (`CommunicationTile.java:338`).
