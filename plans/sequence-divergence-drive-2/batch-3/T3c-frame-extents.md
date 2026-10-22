# T3c — group frame extents (+9 in width)

Agent: `typescript-pro` (opus), worktree `sdd2-T3c`. Commit:
`fix(sequence): bound group frames by their own tiles as teoz does`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanisms (research B M3 + M4 — together; M4 alone zeroes none)
- **M4** frame extent: `teoz/GroupingTile.java:207-225` — min2/max2 = each
  child's `getDrawnMinX − 16` / `getDrawnMaxX + 16`; `max2.add(anElse
  .getMaxX())`; `max2.add(min + headerWidth + 16)`. `ElseTile.java:153-161`:
  `parent.getMinX() + elseWidth`. Header width:
  `ComponentRoseGroupingHeader.java:108-119`; else:
  `ComponentRoseGroupingElse.java:124-126`; `LifeEventTile.java:151-158`
  (posC + level·5); self drawn width `CommunicationTileSelf.java:303-312`
  with `ComponentRoseSelfArrow.java:348-352` (max(42, 7 + text)). The port
  (`sequence-layout-frame.ts:163-182`) bounds by ALL participants ±16 and
  notes, resolved before the branch walk: compute x/width after
  `walkBranches`, then backfill `FrameGeo`, `ElseGeo.x/width`, `tabRuns`.
- **M3** width: `GroupingTile.java:988-990` `getMaxX = max +
  EXTERNAL_MARGINX2 (9) + right notes` → add the frame term in
  `sequence-layout-width.ts`.

## Targets
M3 alone: cujoci, ducodo, fujodi, kizuga, lenamo, makatu, nubute, pixopo,
zujani. M3+M4: 22 (research B clusters B and C; e.g. badoba, bujuma,
cabeve, fasafe, jaxige, xupozu, rozove, zexili, xovuse, selave, bovugo,
dofefe). Also the nested-frame cluster X1 (29 rows) should move; report
it.

## Write-set
`src/diagrams/sequence/sequence-layout-frame.ts`, `sequence-layout-
width.ts`, their tests.

## Read-set
`research/research-b-width.md` M3, M4; `sequence-layout-frame.ts`
(whole); `sequence-layout-width.ts`; `teoz/GroupingTile.java:150-260,
980-1013`, `ElseTile.java`.

## Acceptance
- Given `group G` with one message between the first two of three
  participants, then the frame spans those tiles ±16, not all lifelines
  (dofefe; test citing `GroupingTile.java:207-225`).
- Given a long `alt` header, then frame width ≥ header + 16 (badoba: canvas
  188; test).
- Given the targets, then each is zero-diff or journaled; the one pinned
  row with a group frame does not change.
