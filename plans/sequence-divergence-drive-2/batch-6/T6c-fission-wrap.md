# T6c — Fission wrap for message and note labels

Agent: `typescript-pro` (sonnet), worktree `sdd2-T6c`. Commit:
`fix(sequence): wrap labels by maxMessageSize and style MaximumWidth`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanism (research D cluster B)
Arrow labels: style `MaximumWidth`, else `maxMessageSize`
(`skin/rose/Rose.java:289-292`). Notes: `style.wrapWidth()`
(`ComponentRoseNote.java:67`, `ComponentRoseNoteBox.java:58`,
`ComponentRoseNoteHexagonal.java:58`; `Style.java:330-333`).
`SheetBlock1.java:123` calls `Fission.java:63-101`, which uses
`Math.abs(maxWidth)` (a negative `maxMessageSize` still splits — suneke)
and splits into neutrons whenever maxWidth ≠ 0, even when the line fits —
so the jar draws one `<text>` per word/space. No sequence consumer of
`theme.maxMessageSize` (`core/skinparam-theme-builder.ts:38-57`) or style
`MaximumWidth` exists; core `Fission.ts:249` `getSplitted` is unused here.
Pass the width into T6b's seam.

## Targets
xujavu, zicadi, nexuxi, taboza, suneke, tugaju, felasa (+ the other rows
of cluster B; zajova also needs T7e's banner).

## Write-set
`src/diagrams/sequence/sequence-creole-sheet.ts` (the `maxWidth`
argument), `geo-message.ts`, `geo-annotation.ts`, `sequence-skin-param.ts`,
tests.

## Read-set
`research/research-d-structure.md` cluster B; T6b's seam; the Java above;
`core/klimt/creole/Fission.ts`.

## Acceptance
- Given `skinparam maxMessageSize 50` and a long label, then the label is
  emitted as per-neutron `<text>` elements like the jar (test).
- Given `maxMessageSize -50`, then it still splits (`Math.abs`; suneke).
- Given cluster B, then structural sites are gone; no pinned row changes.

## Added at T3c hand-back (journal row 55)
putuku: self message + right note — drawn max = self.drawnMax + noteWidth (`CommunicationTileSelfNoteRight.java:154-178`); dominated by unported Maxmessagesize.

## Added at T5b hand-back (journal row 73)
N7: note text ignores `wrapWidth` (`ComponentRoseNote.java:67`): jafufe, xujavu, zajova.
