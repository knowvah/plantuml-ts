# T7g — SequenceMessage padder

Agent: `typescript-pro` (sonnet), worktree `sdd2-T7g`. Commit:
`feat(sequence): port the sequence message padder`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanism (research D cluster O)
`skin/SkinParam.java:1216-1229` (`sequenceDiagramPadder`: padding, margin,
border colour, background colour from `SequenceMessage*` skinparams);
`skin/rose/AbstractComponentRoseArrow.java:72-75` (`padder.apply` draws a
box behind each message label). Unported (no hits for
`SequenceMessage{Padding,Margin,BorderColor,BackGroundColor}`). Sizes go
through T6b's `LabelBlock`.

## Targets
gijamu, bakire, suvodo.

## Write-set
`src/diagrams/sequence/sequence-skin-param.ts`, `geo-message.ts`,
`renderer-message.ts`, tests.

## Read-set
`research/research-d-structure.md` O; `SkinParam.java:1200-1235`;
`AbstractComponentRoseArrow.java`; `klimt/.../Padder.java` (find it under
`src/main/java/net/`).

## Acceptance
- Given `skinparam SequenceMessagePadding 5` + border/background colours,
  then a label box is drawn like the jar's (test).
- Given the targets, then structural sites are gone; no pinned change.
