# T3a — document width terms; self-message spacing

Agent: `typescript-pro` (sonnet), worktree `sdd2-T3a`. Commit:
`fix(sequence): mirror PlayingSpace width terms and self spacing`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanisms (research B)
- **M1** self reservation: `teoz/CommunicationTileSelf.java:272-277`
  `getMaxX = posC2 + getCompWidth()`; compWidth = max(textWidth, arrowWidth
  + 5 = 50) (`ComponentRoseSelfArrow.java:326-328`), textWidth = pure + 7 +
  7 (`AbstractComponentRoseArrow.java:62`); `PlayingSpace.java:93-96` folds
  every tile's `getMaxX`. cexeju: jar 90, port 75.
- **M2** delete the label loop (`computeTotalWidth`, formerly
  `layout.ts:377-386`): no upstream counterpart —
  `CommunicationTile.java:453-460` `getMaxX = max(rightPoint, leftPoint +
  compWidth)`, already ensured by `addConstraints` (`:404-427`). Remove
  imports left dead.
- **M5** `posC2`: `PlayingSpace.java:98-101` adds each LivingSpace's
  `getPosD` and `getPosC2`; posC2 = posC + `LiveBoxes.getMaxPosition`
  (`LivingSpace.java:235-238`, `LiveBoxes.java:367-372`). Read it from
  T2b's `LiveBoxes`.
- **M6** self spacing constraint: `CommunicationTileSelf.java:166-184`
  (`next.getPosC().ensureBiggerThan(getMaxX())` `:180`; the reverse case
  `:170-176` lands with T3b). The port skips self messages
  (`ev.from !== ev.to`, now in `sequence-layout-participant-
  constraints.ts`). botoku: jar P2 posC 344.006, port 226.587.

## Targets
M1: bajocu, buximi, cexeju, jobadi, komibe, maxuzu, mobeji, noneda, pidici,
rofate, rutipe, vataru, vujezi, xunolu, zoluna. M2: fuliko, gejoko, gutate,
mobobu, sixifa. M5: rexine. M6 (unverified): the 6 selfFwd x-only rows
(botoku, moxazi, sazaxe, socode, tetemo, tulece — confirm with the
predictor).

## Write-set
`src/diagrams/sequence/sequence-layout-width.ts`,
`sequence-layout-participant-constraints.ts`, their tests.

## Read-set
`research/research-b-width.md` M1, M2, M5, M6; `prototypes/width-
predictor.mts`; both write-set files (whole); `sequence-live-boxes.ts`
(read); the Java above.

## Acceptance
- Given `Bob -> Bob : hello` alone, then width = (int)(posC + max(text+14,
  50) + 10 + 10 + 1) (= 90 for cexeju; test citing the four Java lines).
- Given the label loop deleted, then fuliko's width is 152 (test).
- Given the targets, then each is zero-diff or journaled; the 7 pinned
  self-message rows do not change.

## Added at T2a hand-back (journal row 24)
`&` sibling x-disjointness (`PlayingSpace.java:167-260`, participant constraints) — verify and port if a fixture shows it.

## Added at T2c hand-back (journal row 28)
Write-set + `src/diagrams/sequence/sequence-note-anchor.ts`: `selfMaxX` must add the LiveBoxes posC2 term (`CommunicationTileSelf.getMaxX` = posC2 + compWidth, posC2 = posC + `LiveBoxes.getMaxPosition`, `LiveBoxes.java:347-372`). masibi: every right note after a self message on Bob is 5 short.

## Added at T2e hand-back (journal row 38)
- Exo left-border constraint: `CommunicationExoTile.java:176-181` `posC.ensureBiggerThan(xOrigin + preferredWidth)` for every non-right-border exo; skipped at `sequence-layout-participant-constraints.ts:111-120`. fojomu-60: Bob at 29 vs jar 223 (193.681 shift). Check other exo rows with long labels.
- Link anchor self `getMiddleX` lacks posC2 (`sequence-layout-link-anchor.ts`; `CommunicationTileSelf.java:259-277`).
