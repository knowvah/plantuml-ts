# add4-T2a: VIF-ORDER + VIF-INLABEL (branch add4/T2a)

## Commits
- `5ded59eba` fix(add4-T2a): draw vertical-if tiles and connections in jar order
- `3b560d2d6` fix(add4-T2a): port the vertical-if elseif inlabel
- (this note) docs(add4-T2a): report

## Java -> ours
| mechanism | Java | ours |
|---|---|---|
| node draw order: all tiles, all diamonds, tile2, lastDiamond | `vcompact/FtileIfLongVertical.java:492-502` | `layout/walk-if-long-vertical.ts` `walkIfLongVertical` (tail of file) |
| conns order VerticalIn*, Vertical*, ThenOut, ThenOutConnect*, In, LastElse, LastElseOut, drawn after the tile | `FtileIfLongVertical.java:173-201`; `FtileWithConnection.java:69-74` | same function |
| `west = max(10, tbInlabel.width)` over every branch; `FtileMargedWest(tile, west)` on every branch | `FtileIfLongVertical.java:141,154-158,164-165` | `tiles/gtile-if-long-vertical.ts` `westMargin`, `buildBranchLayouts(..., west)`, `computeGeometry(..., west)` |
| `tbInlabel` = inlabel at the arrow font, LEFT, width = widest line | `FtileIfLongVertical.java:155-157` | `layout/conditional-builder-long.ts` `measureVerticalInlabel` |
| next branch's inlabel labels `ConnectionVertical`, `withLabel(label, CENTER)` | `FtileIfLongVertical.java:183-190,281-282` | `layout/walk-if-long-vertical.ts` `connectionVertical` |

The census claim was right: the else label CENTER (`:319-320`) was already
landed by T1e. The VIF-ORDER fix was order only. The element multiset did not
move.

## Rows (probe weightedScore)
| row | base | after 5ded59eba | after 3b560d2d6 |
|---|---|---|---|
| gelixa-02-sele970 | 621 | 0 | 0 |
| fuleno-34-boni528 | 619 | 0 | 0 |
| gexuko-22-dumi059 | 544 | 0 | 0 |
| meguta-71-pimi823 | 373 | 1 | 1 |
| gafuxi-23-kexi909 | 306 | 0 | 0 |
| bejeta-45-sotu349 | 286 | 89 | 0 |
| divinu-75-busu278 | 274 | 73 | 0 |
| xovigi-85-rufa987 | 391 | 62 | 62 |
| taredi-65-vero960 (not mine) | 328 | 328 | 335 (RISER) |

Probe Σ: 8130 (base 380f86bfb) -> 4941 (5ded59eba) -> 4786 (3b560d2d6).
No other rows moved.

Also: the five authored `tests/fixtures/activity/T1p-b/vertical-if-*` fixtures
went from 354/514/354/396/354 to 0 diffs each. Their pins in
`tests/oracle/svg-conformance/activity-vertical-if-t1pb.test.ts` are now
`{0,0}`. That file is the vertical-if oracle test, edited as "their tests".

## Riser: taredi-65-vero960 328 -> 335 (SWIMLANE-GATE, wave 2)
- **Element census:** text delta +4 -> +5. This moves AWAY from the jar.
  polygon +10 and line +19 are unchanged.
  - The added text is the `No` inlabel on `ConnectionVertical(diamond0,
    diamond1)`. Both diamonds are in LaneB.
- **Mechanism:** the jar never paints that connection.
  - `getSwimlanes()` covers only the tiles and tile2 (`FtileIfLongVertical.java:111-121`), so LaneB never draws the composite.
  - In the other lanes, the Connection gate needs `tile1.getSwimlaneOut() == swimlane` (`UGraphicInterceptorOneSwimlane.java:93-104`). That fails for diamonds in LaneB.
  - We already over-draw the line. The port now also attaches its label.
- **Lane B width +2.047:** this is `(14.094 - 10) / 2`, the wider `west`, in a lane the jar sizes without the diamonds.
- **Census movers on taredi are all AWAY:**
  - style: width 463 -> 465 (jar 406); textCount 13 -> 14 (jar 9); fontSize 11: 4 -> 5 (jar has none).
  - text: textCount 13 -> 14 (jar 9).
  - swimlane: dividerXs[2..] +2.047, lane B width 118.919 -> 120.966 (jar 62.088), width 463 -> 465.
- **Resolution:** SWIMLANE-GATE removes the line and its label together. I did not gate the label locally: that would be a special case. If the orchestrator wants zero away-moves before wave 2, drop `3b560d2d6` alone. `5ded59eba` does not touch taredi.
- `activity.diff-baseline.ratchet.test.ts` fails on taredi (328 pin) until it is re-pinned.

## Census movers (3b560d2d6; 5ded59eba moved no census)
| row | gate | field | before -> after | jar | direction |
|---|---|---|---|---|---|
| bejeta | style | width | 209 -> 213 | 213 | = jar |
| bejeta | style | fontSize 11 | 4 -> 5 | 5 | = jar |
| bejeta | style/text | textCount | 8 -> 9 | 9 | = jar |
| divinu | style | width | 143 -> 189 | 189 | = jar |
| divinu | style | fontSize 11 | 5 -> 6 | 6 | = jar |
| divinu | style/text | textCount | 8 -> 9 | 9 | = jar |
| taredi | style/text/swimlane | see above | | | AWAY |

- **Element census vs b1:** bejeta and divinu text -1 -> 0 (= jar). taredi text +4 -> +5 (away). No other row changed.
- **Gates:** golden ratchet, harness-parity, compress invariant: green after both commits.
  - `tests/diagrams/activity`: 1263/1263.
  - typecheck and eslint: clean.

## Not done + why
- **meguta residual ws 1:** the `no3` label is drawn at y 329.556; the jar draws it at 340.056 (+10.5).
  - Java: the jar computes the CENTER position on the uncompressed worm, `(first.y + last.y - 10)/2 - h/2` (`Snake.java:254-256`). It maps it through `ct()` only at draw time (`klimt/compress/UGraphicCompressOnXorY.java:87-118`, `CompressionXorYBuilder.java:72-75`).
  - Ours: `renderer.ts#renderEdgeLabelAligned` computes it from the post-compression points.
  - Delta: 10.5 is half of a 21 px Y slice that was removed between the label and the worm's end.
  - Status: this mechanism is inferred from the arithmetic. I did not instrument it (confidence MEDIUM). It is general, not VIF-specific.
  - Owner: `renderer.ts` (T2e), or `compress/` (T2b).
- **xovigi residual 62:** no VIF diffs remain. The rest is in other owners' files:
  - `partition "..." #Salmon` keeps its quotes and drops BACK2: `CommandPartition3.java:72-84` vs `dispatch-support.ts:220`. Owner T2b, group files.
  - The `(E)` connector is text where the jar draws a glyph.
  - The floating-note spike.
- **taredi SWIMLANE-GATE:** not mine (wave 2). See the riser section.

## Follow-up: SWIMLANE-GATE on add4/T2a (orchestrator request; 3b560d2d6 kept)

### Commit
- `d5765de3d` fix(add4-T2a): gate vertical-if diamonds and connections by swimlane

### Java -> ours
| mechanism | Java | ours |
|---|---|---|
| composite `getSwimlanes()` = swimlaneIn + tiles + tile2 lanes, never the diamonds' lane | `FtileIfLongVertical.java:111-121` | `walk-if-long-vertical.ts` `compositeSwimlanes` (reuses `tile-coordinates-group.ts#collectTouchedLanes`) |
| child Ftile drawn only in lanes its set shares with the active set | `UGraphicInterceptorAllSwimlanes.java:63-79`, `UGraphicInterceptorOneSwimlane.java:68-75` | `childDrawn` (diamonds, lastDiamond, their labels) |
| Connection drawn in lane L iff tile1 out / tile2 in are null or L | `UGraphicInterceptorAllSwimlanes.java:129-143`, `UGraphicInterceptorOneSwimlane.java:93-104` | `connectionDrawn` / `pushGatedEdge`; ConnectionIn is `super(null, diamonds[0])` (`:211`) so lane1 = undefined. An undrawn Snake's label is never attached |
| no Cross-pass fallback: these conns are not ConnectionTranslatable | `Swimlanes.java:178-200`, `ConnectionCross.java:49-64` | (no cross-lane edge emitted) |
| `getSwimlaneIn()` = `tiles[0].getSwimlaneIn()`, `getSwimlaneOut()` = `getSwimlaneIn()` | `FtileIfLongVertical.java:123-129` | `swimlane-lanes.ts` `laneIn`/`laneOut`, kind `gtile-if-long-vertical` |

- The gate is inactive when the diagram has no lanes, so non-swimlane output is unchanged.
- `swimlane-placement.ts` and `swimlane-context.ts` were not needed. Lane widths follow from the nodes and edges no longer emitted, through the existing measure. I did not merge `feat/activity-divergence-drive-4` (T2c), because I touched neither file.

### taredi-65-vero960
| | before (3b560d2d6) | after the gate only | after the gate + laneIn |
|---|---|---|---|
| score | 335 | 10 | 0 |
| element delta | polygon +10, line +19, text +5 | {} | {} |
| lanes A/B/C/D/E width | 74.7 / 120.966 / 74.7 / 74.7 / 74.7 | | 74.7 / 62.088 / 74.7 / 74.7 / 74.7 (= jar) |
| svg width x height | 465 x 423 | | 406 x 321 (= jar) |

- The 10 left after the gate alone was the outer cross-lane connector landing at the lane-B pointIn x (204.709). The jar lands it at 148.522. Porting `getSwimlaneIn()` closed it.

### Probe Σ
4786 (3b560d2d6) -> 4451 (d5765de3d). No other row moved.

### Risers
None. taredi falls 335 -> 0. The diff-baseline ratchet is green again.

### Census movers (d5765de3d, all to jar)
| row | gate | field | before -> after | jar |
|---|---|---|---|---|
| taredi | style | width | 465 -> 406 | 406 |
| taredi | style | height | 423 -> 321 | 321 |
| taredi | style | textCount | 14 -> 9 | 9 |
| taredi | style | fontSize 11 | 5 -> 0 | absent |
| taredi | style | strokeWidth 1 | 26 -> 7 | 7 |
| taredi | text | textCount | 14 -> 9 | 9 |
| taredi | swimlane | dividerXs | -> [20, 94.7, 156.788, 231.488, 306.188, 380.888] | same |
| taredi | swimlane | lanes, bandRect, titles | (to jar) | same |

The bejeta and divinu movers from 3b560d2d6 are unchanged and equal the jar.

### Tests and fixtures
- New authored fixtures with jar goldens (`scripts/oracle-render.sh`) in `tests/fixtures/activity/add4-T2a/`:
  - `vif-lane-gate` scored 342 before this commit and 0 after.
  - `vif-lane-mixed` scored 84 before and 0 after.
- Tests: `tests/diagrams/activity/layout/walk-if-long-vertical-lanes.test.ts`, plus `swimlane-lanes.test.ts` cases.
- Gates:
  - Green: golden ratchet, harness-parity, compress invariant, diff-baseline ratchet, `tests/diagrams/activity` (1274), typecheck, eslint.
  - Red, as expected: the style, text and swimlane census pins for bejeta, divinu and taredi. Every mover equals the jar, so they need a re-pin.
