# add4-T1e: phantom edge-label slot + zero-length end arrowhead (D6)

## Commits
- `e70f8b1bd` fix(activity): box edge labels where the snake draws them
- `2e221bf01` fix(activity): draw the end arrowhead on a zero-length last segment

## Mechanism 1: phantom label slot
- **Mechanism:** `compress/shapes-of.ts#edgeLabelShape` boxed every edge label at `pts[mid] + (4, -4)`.
  That is a renderer convention add3-T1b retired. `renderer.ts#renderEdgeLabelAligned` draws at
  `getTextBlockPosition(points, dim, labelAlign ?? LEFT)`. The stale box sat up to 4 px past the real
  ink and held X/Y slots that the jar compresses.
- **Java:** a Snake label has one draw site, `Snake#drawInternalLabel` -> `textBlock.drawU` at
  `getTextBlockPosition` (`Snake.java:225-231,244-270`). `SlotFinder#drawText` registers it
  (`klimt/compress/SlotFinder.java:121-128`). `FtileDecorateInLabel#drawU` draws nothing of its own,
  only `dy(yl)` (`vertical/FtileDecorateInLabel.java:71-74`). Switch case labels come from the
  connection's `Snake.withLabel(branch.getTextBlockPositive(), ...)`
  (`cond/FtileSwitchWithManyLinks.java:91-92,218-219`).
- **Port:** the box now uses the renderer's exact position: `getTextBlockPosition` plus
  `centeredFirstBaselineY`. Extents still come from the bounder (`TextLimitFinder`).
- **Not a skip:** unaligned labels (while/repeat backward, vertical-if else) move as well.
- **Duplicate reservation:** the walk-time `inLabelReservation` (`tile-layout-inlabel.ts`) now covers
  the same box as the shape. This is harmless (`SlotSet` merges). It may be redundant;
  `tile-layout-inlabel.ts` is outside my write-set, so I left it.

## Mechanism 2: end arrowhead on a zero-length segment
- **Mechanism:** pateca and duvole push a V-then-H DOWN-branch edge whose last segment has zero length.
  `renderer.ts` dropped the arrowhead (`dx === 0 && dy === 0`) and `shapes-of.ts#terminalArrowhead`
  dropped its box, so the Y compressor removed 10 px.
- **Java:** `Snake.create(..., asToDown())` fixes the decoration at construction (`Snake.java:144-148`).
  `Worm#drawInternalOneColor` draws it with no length test (`Worm.java:161-168`). The branch is
  `FtileSwitchWithManyLinks.java:159-186`.
- **Port:** new `compress/shapes-of-terminal.ts#terminalDecorationVector` returns the last segment
  that has length. Both the renderer (renderEdge's terminal `arrowTip` call site, not `arrowTip`
  itself) and `terminalArrowhead` use it.
- **This is a derivation, not the structure.** I verified it equals the creator's direction only for
  this one zero-length producer.
  - Corpus survey (instrumented harness, 451 fixtures): exactly two zero-length terminals, pateca and
    duvole, both this branch.

## Rows (probe Σ over 93 rows: base 10272 -> e70f8b1bd 9976 -> 2e221bf01 9930)
| row | before | after | note |
|---|---|---|---|
| mukigo | 104 | 1 | width 505 -> 493 = jar |
| cezabi | 104 | 1 | width 559 -> 536 = jar |
| lipiki | 66 | 18 | width 222 -> 210 = jar; residual = R1 below |
| boxefe (LABEL-SLOT) | 55 | 1 | height 336 -> 335 = jar; same mechanism |
| pateca | 20 | 1 | arrowhead +1 polygon, height 273 -> 283 = jar |
| duvole | 28 | 1 | arrowhead +1 polygon, height 249 -> 259 = jar |
| meguta | 373 | 385 | RISER, see below |

FRAME-TITLE-SLOT and HEX-LABEL-SLOT (pekefu) did not move.

## Riser: meguta-71-pimi823 (+12, height 434 -> 433, AWAY; jar 434). Element census unchanged.
- **Mechanism:** the vertical-if `ConnectionLastElse` label (`no3`) is pushed without an alignment.
  `walk-if-long-vertical.ts:232` sets `.label` only. Upstream uses `.withLabel(label,
  VerticalAlignment.CENTER)` (`vcompact/FtileIfLongVertical.java:319-320`). So the text is drawn at
  the LEFT position (90.094, 317.556) instead of the CENTER x = minX (86.094, the jar's x). The label's
  box now sits where we draw it. The old phantom happened to cover the slot that the jar's
  CENTER-placed text occupies.
- **Proof (scratch, not committed):** adding `labelAlign = { vertical: 'CENTER' }` at
  `walk-if-long-vertical.ts:232` returns meguta to 373, with height 434 = jar and x 86.094 = jar.
- **Owner:** `walk-if-long-vertical.ts`, a one-line fix outside my write-set.

## Census movers (style pin; text and swimlane did not move)
| row | field | before -> after | jar | direction |
|---|---|---|---|---|
| boxefe | height | 336 -> 335 | 335 | equals jar |
| cezabi | width | 559 -> 536 | 536 | equals jar |
| lipiki | width | 222 -> 210 | 210 | equals jar |
| mukigo | width | 505 -> 493 | 493 | equals jar |
| pateca | height | 273 -> 283 | 283 | equals jar |
| duvole | height | 249 -> 259 | 259 | equals jar |
| meguta | height | 434 -> 433 | 434 | AWAY (riser above) |
| sojono | width | 318 -> 314 | 508 | AWAY |

- **sojono:** the phantom box for `click - linka` reached 4 px past the real ink, to x 100.13
  against ink ending at 96.13. Removing it freed an empty 4 px column. The absolute width gap
  (314 vs 508) belongs to the unported SWITCH-NOTE (T1a), so this move cannot be judged until notes
  land.
- **Ratchet + harness-parity:** 393/393, pins byte-equal. `tests/diagrams/activity`: 1182 pass,
  5 expected fail.

## Tests changed beyond the write-set's own files (both assertions flipped from pinned-wrong to jar-equal)
- `tests/diagrams/activity/layout/branch-exit-label-fixtures.test.ts`
  - if-long-horizontal height 298: the claimed "Math.max(100, maxOutY) floor" was the phantom.
  - switch width 206: the claimed "case-diamond placement" was the phantom.
- `tests/diagrams/activity/layout/snake-text-position-fixtures.test.ts` (while-backward-bottom = boxefe)
  - The "~0.944 rounding" was the phantom. Every rect/polygon/line is now jar-equal.
  - `incoming` y is now jar-equal.
  - `dsc_5` was re-pinned 99.556 -> 100.028 (jar 98.5). The cause is R2.

## Not done
- **R1, short non-zero last segment, DOWN branch (lipiki 18, authored `add4-T1e/zero-length-down`
  `it.fails`).**
  - Mechanism: `ConnectionVerticalThenHorizontal` uses `asToDown()` when x1 lies in diamond2's
    `[ptD.x, ptB.x]`. The last segment `(x1, y2) -> ptA` can then be 1-4 px horizontal.
  - Ours reads RIGHT/LEFT off that segment. The arrowhead points the wrong way and its 8 px Y box
    lets compression take 6 px.
  - Structural fix: carry the end-decoration direction on `ActivityEdgeGeo`. It is already computed
    and dropped at `switch-connection-points.ts#verticalThenHorizontalPoints` (`direction`, :73-83).
    `terminalDecorationVector` would then become the fallback.
  - Owner: `activity-geometry.types.ts` plus the switch push site (T1f's files).
- **R2, label placement after compression.**
  - Ours computes `getTextBlockPosition` on the compressed points. The jar computes it on the raw
    points and then translates the text through `UGraphicCompressOnXorY`.
  - Seen in boxefe `dsc_5` (+1.528) and meguta `no3` y (329.556 vs 340.056 even with CENTER).
  - Owner: `renderer.ts#renderEdgeLabelAligned` / D1 of add3. This is the same family as T1a's 1.72 px
    and +5.056 label-y notes.
- **R3, renderSync path (real measurer).** pateca's x1 and ptA.x differ by an ulp there, so the last
  segment is non-zero and reads RIGHT. R1's field fixes it too.

## Addendum: meguta riser closed (write-set extended by the orchestrator)
- **Commit:** `86b6e578d` fix(activity): centre the vertical-if last-else label
- **Change:** `walk-if-long-vertical.ts#connectionLastElse` now sets `labelAlign = { vertical: 'CENTER' }`.
  - Upstream: `Snake.create(...).withLabel(label, VerticalAlignment.CENTER)` (`FtileIfLongVertical.java:319-320`).
  - Test: `walk-if-long-vertical.test.ts`.
  - Nothing else in the file was touched. Prettier had reflowed the `walkIfLongVertical` signature; I reverted that.
- **Probe (93 rows; the probe set is 93, not 100):** Σ 9930 -> 9918. meguta 385 -> 373. No other row moved; element census unchanged.
- **Census:** meguta height is 434 again, equal to the pin and the jar, so it no longer appears as a mover. The remaining style movers are the seven listed above. No text or swimlane movers.
- **Gates:**
  - ratchet + harness-parity: 393/393
  - `tests/diagrams/activity`: 1185 pass, 7 expected fail (the 2 new `it.fails` are R1)
  - typecheck and eslint: clean
- **Still open:** meguta's `no3` y is 329.556 against the jar's 340.056. That is R2 (label placement after compression).
