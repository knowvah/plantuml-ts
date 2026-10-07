# add4-T3a: R2 raw-worm label placement + HEX-LABEL-SLOT (branch add4/T3a)

## Commits
- `9918e9245` fix(activity): place edge labels on the raw worm, then compress them
- `2061b6703` fix(activity): box a hexagon's own label one slot per line
- (this note) docs(add4-T3a): report

## Mechanism R2 (instrumented, HIGH)
- **Mechanism:** `Snake#getTextBlockPosition` reads `worm.getPoint(i)` (`Snake.java:244-270`). `Worm#getPoint`
  resolves a point only through the Worm's own `tr`, its `move` translate (`Worm.java:65-79,322-330`).
  It never resolves through the UGraphic. So the jar places the label on the RAW worm.
  `text.textBlock.drawU(ug.apply(UTranslate.point(position)))` then maps each UText's draw point through `ct()`
  (`UGraphicCompressOnXorY.java:87-128`, fallthrough `getTranslate`). This happens ON_X, then ON_Y
  (`ActivityDiagram3.java:209-210`, `CompressionXorYBuilder.java:72-75`).
  Ours recomputed the position on the compressed points. The two differ whenever a removed slot lies inside the
  span the position averages. CENTER uses `(first.y + last.y - 10)/2`; LD/RD use the `pt1`/`pt3` mid.
- **Correction:** add3-T1b's claim was wrong. It said `getPoint` resolves through the compressing UGraphic
  (doc in `compress-geometry.ts`, now marked SUPERSEDED).
- **Instrumented, before any fix.** Raw anchor through `ctX`/`ctY` minus our recompute, per edge:

  | row | label | delta |
  |---|---|---|
  | meguta | `no3` | +10.5 |
  | boxefe | `dsc_5` | -1.528 |
  | jazedo, xaxene | `503`, `500` | +1.722 |

  Each equals the observed residual exactly.
- **Ruled out:**
  - Label measurement: the deltas are measured with a fake 10 px width and still match, so y does not depend
    on width.
  - The x axis: dx = 0 on every row.
- **Origin:** `renderer.ts#renderEdgeLabelAligned` (old), which called `getTextBlockPosition(points...)` on
  post-compression `edge.points`.

## Java -> ours
| Java | ours |
|---|---|
| `Snake.java:244-270` + `Worm.java:322-330` (raw placement) | `layout/compress/edge-label-anchor.ts:72-81` `placeOnPoints`, `:101` `labelAnchors` (read on raw edges) |
| `UGraphicCompressOnXorY.java:122-128` `getTranslate` on the UText point, X then Y | `edge-label-anchor.ts:110` `transformAnchors`; wired at `compress-geometry.ts:333` `compressGeometry` |
| (carry) | `edge-label-anchor.ts:126` `withLabelDeltas` stores `ActivityEdgeGeo.labelDelta` = anchor - recompute. It is a delta, so the later rigid canvas-origin shift (`canvas-origin-shift.ts`) carries it unchanged. X-pass deltas are set before the Y pass, so the Y slot finder sees `(ctX(x), y)` (`CompressionXorYBuilder.java:62-68`). |
| `Snake#drawInternalLabel` single draw site | `renderer.ts:110` `renderEdgeLabel` and `compress/shapes-of.ts#edgeLabelShape` both read `edge-label-anchor.ts:91` `edgeLabelLayout` |
| multi-line: one UText per stripe (`SheetBlock1.java:146-148`) | one anchor (first baseline). Per-line ink slots touch (`[b-h+1.5, b+1.5]`, h = 11), so `ct(b + k*11) = ct(b) + k*11` exactly. Verified: T1a small-2line 6->0, small-3line 9->0, big-mixed 4->0. |
| `SlotFinder#drawText` per UText (`SlotFinder.java:127-135`); `FtileDiamondInside.java:94-96` | `compress/shapes-of-hexagon-label.ts#ifOwnLabelShapes`: one `'text'` slot per line, positioned as `renderHexagonMultilineLabel`; routed in `shapesOf`. Replaces `ifOwnLabelShape`, which measured the `\n`-joined string. |

## Rows (probe weightedScore, b2 -> 9918e9245 -> 2061b6703)
| row | b2 | after R2 | after HEX | residual |
|---|---|---|---|---|
| momala-42-luvu884 | 48 | 48 | 48 | NOT R2, see below |
| sokomu-20-five757 | 46 | 46 | 46 | NOT R2, see below |
| jazedo-50-meka611 | 2 | 0 | 0 | |
| xaxene-93-doka767 | 2 | 0 | 0 | |
| ruzazu-94-meso880 | 2 | 0 | 0 | |
| meguta-71-pimi823 | 1 | 0 | 0 | |
| boxefe-81-situ725 | 1 | 0 | 0 | |
| pekefu-66-mepa144 | 8 | 8 | 0 | |
| zivocu-77-kopa900 (not briefed) | 8 | 1 | 1 | `text[2]/@font-family` "" vs `monospace`; not label placement |

- Probe Σ (31 rows): 1385 -> 1370 -> 1362. Risers: 0 at both commits.
- Element census (`activity-probe-elements.ts`): every delta unchanged ({} on all moved rows). No row moved
  away from the jar.
- Activity survey vs `b2-eng`: 6 rows structural-match -> conformant (boxefe, jazedo, meguta, pekefu, ruzazu,
  xaxene). Conformant losses: 0. Totals: 387 conformant / 8 structural / 56 diverged.

## momala / sokomu: residual is SWITCH ONE-LINK DRAW ORDER (outside my write-set)
- **Mechanism:** `FtileSwitchWithOneLink#addLinks` pushes `ConnectionVerticalTop` (the labelled in-link) and
  then `ConnectionVerticalBottom` (`FtileSwitchWithOneLink.java:134-143`).
  Ours pushes the bottom edge inside the per-case body pass, `walk-switch.ts:401` (`walkOneCaseBody` ->
  `pushOneLinkMergeEdge`). That is before `pushCaseInEdges` at `walk-switch.ts:438`. The line, polygon and
  text tags swap, and line[1]/polygon[3] read the other edge.
- **Scratch proof (reverted):** deferring the one-link push to after `pushCaseInEdges` takes momala 48->0 and
  sokomu 46->0. The same fix should also move T1a fixtures one-link (16) and one-link-1line (15), which show
  the identical diff shape.
- **Hunk for the owner** (walk-switch.ts, T3b/switch): in `walkSwitchCases`, push `pushOneLinkMergeEdge` for
  the single case after `pushCaseInEdges(step, cases, positions, tile, out)`, and remove it from
  `walkOneCaseBody`.

## Outside-write-set edits (flag)
- `src/diagrams/activity/activity-geometry.types.ts`: one additive optional field, `ActivityEdgeGeo.labelDelta`,
  plus its doc. It has no runtime code. No T3 agent owns this file.
- Tests whose pinned-wrong assertions now equal the jar, flipped to jar equality:
  - `tests/diagrams/activity/layout/snake-text-position-fixtures.test.ts`: dsc_5 98.5; default-arrow-label
    "hello" 106.5.
  - `tests/diagrams/activity/layout/swimlane-reservation-lane.test.ts`: lane-res-inlabel now has zero diffs.
    Before, it had `text[5]/@y` +3.278.
- `docs/catalog.md` regenerated (2 new modules).

## Hunk NOT applied (output-neutral today; owner T3c, canvas-origin*)
- `layout/canvas-origin-text-ink.ts#extendForEdgeLabelText` still places the label on `edge.points` and ignores
  `labelDelta`. It should read `compress/edge-label-anchor.ts#edgeLabelLayout` (x, width, lines, baselineY) so
  the ink bounds agree with the drawn text.
- Scratch-applied: probe Σ 1370 unchanged, ratchet and parity 455/455. So it is consistency only, but a label
  that is the extreme ink after a non-zero delta would mis-size the canvas.

## Gates (after each commit)
- Green:
  - golden ratchet and harness-parity: 381 pins byte-equal
  - compress invariant
  - `tests/diagrams/activity`
  - diff-baseline ratchet
  - catalog drift
  - typecheck (both tsconfigs)
  - eslint
  - lizard (CCN <= 10, NLOC <= 30, <= 5 params)
  - files <= 500
- Census (style/text/swimlane baseline tests): green. No census movers, because no width, height, count or
  lane field moved.

## Fixtures (`tests/fixtures/activity/add4-T3a/<case>/{in.puml,in.svg}`, jar via oracle-render.sh)
| fixture | before | after |
|---|---|---|
| vif-center-label (CENTER) | text y +10.5 | 0 |
| switch-first-last-labels (LD/RD) | 2 | 0 |
| hex-multiline-elseif (= pekefu) | 8 | 0 |

- Tests:
  - `tests/diagrams/activity/layout/compress/edge-label-anchor.test.ts` (unit)
  - `edge-label-anchor-fixtures.test.ts`: the authored fixtures plus T1a big-1line, big-mixed, small-2line,
    small-3line, small-out-label and T1f after-endswitch, floating-one, pre-case-one, all now jar-equal
  - `shapes-of-hexagon-label.test.ts`

## Not done + why
- momala, sokomu (and T1a one-link*): one-link draw order, `walk-switch.ts`, outside the write-set. Hunk above.
- T1f after-endswitch-empty 7: +4 x on the empty case (SWITCH-GEOM, as T1f named it). Not label placement.
- zivocu 1: font-family monospace on `text[2]`. Not in my rows and not label placement; not investigated.
- canvas-origin-text-ink consistency hunk: T3c's file, output-neutral today.

## Observation: Worm#getPoint does not see the compressing UGraphic
- **Context**: R2. add3-T1b's doc in `compress-geometry.ts` asserted the opposite.
- **Finding**: `Worm.tr` is the Worm's own `move()` translate (`Worm.java:65-79`). `getPoint`/`resolve`
  (`:322-330`) apply only that translate. Any Snake computation done in `drawU` (label position, emphasize
  midpoint) is therefore on pre-compression coordinates, and only the final draw points pass through `ct()`.
- **Impact**: any port that recomputes a Snake-derived point after compression must carry a raw anchor instead,
  as `emphasizeAt`, `midArrowAt` and now `labelDelta` do.
- **Confidence**: High (instrumented on 4 rows, exact match).

## Resume: one-link switch order (momala/sokomu)
- **Commit:** `aaddfa5d9` fix(activity): push a one-link switch's merge edge after its in-link
- **Java -> ours:** `FtileSwitchWithOneLink#addLinks` adds VerticalTop and then VerticalBottom (`FtileSwitchWithOneLink.java:134-143`).
  Ours: `walk-switch.ts#pushMergeEdges`, called after `pushCaseInEdges` in `walkSwitchCases`. The single-case push was removed from `walkOneCaseBody`. The many-case path is unchanged and still goes through `pushCaseToMergeEdges`.
- **Rows:**
  - momala: 48 -> 0
  - sokomu: 46 -> 0
  - T1a one-link: 16 -> 0
  - T1a one-link-1line: 15 -> 0
- **Probe:** Σ 1362 -> 1268. Risers: 0.
- **Element census:** unchanged (delta {}).
- **Survey:**
  - momala and sokomu go from diverged to conformant.
  - Conformant losses: 0.
  - Totals: 389 / 8 / 54.
- **Census movers:** none.
- **Gates:** green.
  - ratchet + parity, 387 pins
  - compress invariant
  - `tests/diagrams/activity`
  - diff-baseline
  - catalog
  - typecheck
  - eslint
- **Test:** `tests/diagrams/activity/layout/walk-switch-one-link-order.test.ts`.
- **Lizard:** flags `pushSwitchDiamond` at 49 NLOC. That warning is pre-existing (same at HEAD) and the function is untouched.
