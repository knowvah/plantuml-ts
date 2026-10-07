# add4-T1g — band anchor + FtileIfWithLinks hline lanes

Worktree `.claude/worktrees/add4-T1g`, branch `add4/T1g`, base `8e771a18b`.
No Serena calls, no `git stash`, and no `src/core/**` edits, so no engine survey.

## Commits

1. `876aaaaea` fix(add4-T1g): anchor the swimlane title band at block origin + 5
2. `8d23d54ea` docs(add4-T1g): regenerate catalog for swimlane-chrome.ts
   (`docs/catalog.md`, generated and drift-gated; required because commit 1
   added a module. It is outside the listed write-set, so the orchestrator
   should regenerate it on merge if it conflicts.)
3. `4651dd732` fix(add4-T1g): measure FtileIfWithLinks hline into every touched lane
4. `482deb1f1` fix(add4-T1g): keep FtileIfWithLinks branch exits in their own lane
5. this note

## Java -> ours

- `Swimlanes.java:363-366` (`drawTitlesBackground`: `ug.apply(UTranslate.dx(5))`
  from the block origin; width `lastSpecial.dx - 2*5 - 1`). Ported to the new
  `src/diagrams/activity/layout/swimlane-chrome.ts`:
  - `SWIMLANE_BAND_INSET_X = 5`.
  - `computeSwimlaneChrome(..., bandX?)`, moved out of `swimlane-placement.ts`,
    which re-exports it.
  - `bandReservationX`.

  Band right edge = `last.x + last.width - 1`. Derivation: the trailing
  special lane's dx is `xpos_n + x1_n + 5 + min/2` (`:426-428`, its MinMax
  is `getEmpty(true)` per `:119-120`). Its divider line is at
  `xpos_n + x1_n + min/2` (`swimlane-lane-origins.ts#trailingDivider`), so
  `dx - 6` = that divider - 1. This holds for any `bandX`.

  Callers:
  - `assign-coordinates-full.ts`: pass 1 passes `baseX + 5`. `baseX` is the
    block origin because `computeLaneOrigins` seeds `xpos = 0` there.
  - `canvas-origin.ts#finalizeGeometry`: passes the band reservation's own
    compressed and shifted x, which is the only `Reservation` with
    `ignoreX && ignoreY` (`Swimlanes.java:364-365`).
- `cond/FtileIfWithLinks.java:425-426` (`ConnectionHline super(null,null)`),
  with `vcompact/UGraphicInterceptorAllSwimlanes.java:129-143` (Connection
  branch) and `:89-102,160-168` (narrowing). The enclosing tile's
  `getSwimlanes()` resolves through `vertical/FtileDecorate.java:94-95` to
  `cond/FtileIfNude.java:79-87` (`in` plus tile1 plus tile2 lanes).
  Ported to `walk-if-with-links.ts#hlineMeasureLanesLinks`, which feeds
  `HlinePayload.measureLanes` (T1b's consumer
  `swimlane-measure-edges.ts#sameLaneEdges`).
- `cond/FtileIfWithLinks.java:374-375` (`ConnectionVerticalOut super(tile, null)`)
  with `Swimlanes.java:189-193` (Cross returns early on a null tile). Ported
  to `walk-if-with-links.ts#connectionVerticalOut`: lane1 = lane2 = the
  tile's out lane.

## Rows (probe, 87 baseline rows)

| after | Σ | movers |
|---|---|---|
| base `8e771a18b` | 9728 | — |
| c1 | 9623 | nikinu-06-sace939 105 -> 0 |
| c3 | 9613 | pezubu-98-niba240 55 -> 45 |
| c4 | 9568 | pezubu-98-niba240 45 -> 0 |

There were 0 risers at every commit. Element census has one mover, at c4:
pezubu `{line:+2}` -> `{}`, toward the jar. No other row's element delta
moved.

## The pezubu 45 (named, then fixed in c4)

After c3, two diffs remained, both caused by `ConnectionVerticalOut`'s
`super(tile, null)`:
1. Ours pushed the else exit as a cross-lane edge `(lane 3 -> lane 2)`. It
   was routed as a 3-segment elbow (181.375 -> 217.5 -> 147.025 -> 228.5)
   plus an arrowhead. The jar draws one straight line (181.375, 208.5 ->
   228.5) plus an arrowhead in lane 3. This accounts for the 20 vs 18 lines.
2. Because that edge was cross-lane, it was never measured into lane 3. A
   gated trace showed lane 3 items at `[77.65, 106.35]` and the arrowhead ink
   (±4 arrow + `POLYGON_FUDGE_X` 10) at `[79, 107]`. The arrowhead's far edge
   widens lane 3 by 0.65 (jar trailing divider 200.375 vs ours 199.725).

## Gates

- Golden ratchet, harness-parity, `compress/invariant.test.ts` and the text
  census were green after every commit. `npm run typecheck` and eslint were
  clean on touched files.
- The style and swimlane census pins are RED on 2 rows by design. Re-pinning
  is orchestrator-only. Every mover equals the pin's `jar` column:
  - nikinu: dividers `[20,280.45,406.275]` -> `[33,293.45,419.275]`, titles
    +13, band `{20,385.275}` -> `{16,402.275}`, lanes x +13, width 432 -> 445.
    All == jar.
  - pezubu (after c4): dividers last 190.725 -> 200.375, lane-3 title
    166.369 -> 171.194, band width 169.725 -> 179.375, lane-3 width
    -> 48.35, svg width 216 -> 226, style strokeWidth `1`: 16 -> 14. All ==
    jar.
  - At c3, pezubu was only partly there: width 225 vs jar 226. c4 closed it.
- Single-lane output is unchanged: `computeSwimlaneChrome` returns `{}` for
  ≤1 lane, no band reservation exists, no other probe row moved, and the
  ratchet is green.

## Tests / fixtures

- `tests/diagrams/activity/layout/swimlane-chrome.test.ts`: unit tests for
  bandX and `bandReservationX`, plus band and dividers vs the jar on all 8
  `add4-T1b/swimw-*` fixtures (floored: band 16/302.5, dividers 33..319.5).
- `swimlane-width-ab.test.ts`: the padded case is tightened from
  spacing-only to absolute `JAR_PADDED`.
- `tests/fixtures/activity/add4-T1g/hline-links-{else,then}-xlane.puml`.
  `else` is the pezubu markup and `then` is a new then-branch-cross-lane
  shape. Both now render with ws 0 vs jar oracles from
  `scripts/oracle-render.sh` (scratch renders, not committed).
- `walk-if-with-links-hline-lanes.test.ts`: dividers vs the jar for both
  fixtures, plus the straight else exit.

## Not done

- Nothing in scope. Both rows are at 0 and ready to pin; the census re-pin
  is orchestrator-only.
