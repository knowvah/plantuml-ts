# cdd3-T32 — edge geometry: leaf contacts, HashSet order, empty-label boxes, wrapped tips

Baseline: `/tmp/cdd3-T32-pre.json` (worktree HEAD a65f3d7f, before any edit).
After: `/tmp/cdd3-T32.json`. Surveys object/unknown: pre vs post, 0 movers.

## Result

| fixture | before (S/N) | after (S/N) | mechanism |
|---|---|---|---|
| mefike-75-vova900 | 0/3 | 0/0 conformant | E2-5 |
| tunelu-64-xica833 | 5/95 | 0/0 conformant | E3-13 |
| vonago-16-zime449 | 5/227 | 0/0 conformant | E3-13 + HALF_PRINTED_FULL draw |
| zepeki-75-pifo352 | 0/1 | 0/0 conformant | wrapped-member tip (new) |
| gujigi-63-roki030 | 30/576 | 7/23 | E3-13 (improved); rest E3-14 + constraint two-pass |
| jakapi-64-tine258 | 0/352 | 0/352 | HashSet order ported; residual needs D3 + unexplained ink |
| delasa-80-jusu462 | 3/10396 | unmoved | E3-12 is engine-only (no code here) |

No other class row moved. No conformant row left conformant.

## Observation: the allButSametails contact is the TRIMMED path end (E2-5)
- **Context**: mefike's stub line ended on the diamond tip.
- **Finding**: `Neighborhood.java:97-99` reads `SvekEdge#getStartContactPoint()`
  (`SvekEdge.java:1314-1322`), which reads `dotPath` after `getExtremitySimplier`
  trimmed it (`:560-563`), during the node pass (`SvekResult.java:82-89`), before
  `drawU`'s magnetic move of a copy (`:907-941`). `class-edge-geo.ts#attachLeafContacts`
  now takes `drawnEdgePoints` after `fixKalOverlaps`. The same mechanism was jakapi's
  "12 px shorter stub" (T18 Finding 2): after the fix that stub differs only by the
  global Δ3.76 shift.
- **Confidence**: High (mefike 0/0).

## Observation: Neighborhood's triangles iterate a HashSet; order needs jar-exact doubles
- **Context**: jakapi T18 Finding 1.
- **Finding**: `src/core/java-hash-set.ts` replays JDK 21 `HashMap.putVal`/`resize`/
  small-table `treeifyBin` (tests assert orders printed by a real JDK 21 run).
  `renderer-group.ts#uniqueSametailContacts` now iterates in that order with
  `XPoint2D.hashCode` (`XPoint2D.java:24-32`). jakapi did NOT move: our contacts are
  exact doubles in our frame (222.587504, 203.000004), the jar's are graphviz 2-dp text
  plus `SvekResult#calculateDimension`'s `moveDelta` (215.59 + 10.759…, 204 − 1). The
  hash is bit-sensitive, so the order can only match once D3 (2-dp read) lands AND the
  jakapi frame Δ3.763 is fixed.
- **Tree bins not ported**: need ≥9 keys in one bucket of a ≥64 table (≥49 keys);
  documented in the module header.
- **Confidence**: High (JDK-verified order); jakapi outcome depends on D3.

## Observation: jakapi's uniform Δ3.763 x is an ink-only jar contribution (open)
- **Finding**: jar `dx = 6 − minX = 10.759`, so the jar's LimitFinder saw ink at
  graphviz-frame x = −4.759; ours sees −0.996. No element drawn in the jar SVG lies
  left of x = 10.759 (User rect), so the jar's extra ink is not drawn in the final
  SVG. Ruled out: the HashSet order (swaps ink, doesn't extend it); the third sametail
  contact (inside Group's rect, `intersection` null, skipped); edge labels and port
  labels (all ≥ 13.9 in the jar SVG); the together block (no cluster emitted).
- **Next**: a LimitFinder dump of the jar (or the pass-0 draw of anything
  stateful, cf. the LinkConstraint finding below).
- **Confidence**: Medium.

## Observation: E3-13 — an empty-text label still reserves its table
- **Finding**: `SvekEdge.java:430-442` appends the `<TABLE>` whenever
  `hasNoteLabelText() || getLinkConstraint() != null`; `withLayoutBox` now keeps the
  box for `label === ''` (constraint spot, note-only label).
- **Follow-through (vonago)**: `Relationship.linkNoteHalfWidth` conflated
  HALF_PRINTED_FULL and HALF_NOT_PRINTED. Only the latter skips the draw
  (`SvekEdge.java:950-951`); new `linkNoteNotPrinted` on the B-side
  (`AbstractClassOrObjectDiagram.java:282-284`), and `mergedLayout` reserves the
  halved table (`eventuallyDivideByTwo`, `:440-442`), so the full block draws at the
  half table's corner (jar M70.52,6).
- **Confidence**: High.

## Observation: E3-12 needs no plantuml-ts code
- **Finding**: upstream gates via `getXY` returning null when the label colour is
  absent from `-Tsvg` (`SvekEdge.java:740-747,808-815`), then `labelXY != null`
  (`:951`). Our consumer already returns on `labelX === undefined`
  (`class-edge-label-attach.ts:168`, `class-edge-geo.ts#attachNoteAndConstraintSpot`),
  and the ink walk reads the same labels. The only missing piece is dot-engine
  publishing `label` when `lp->set` is false — `docs/graphviz-issues/25` (filed).
  dot-engine 1.6.0 has no gate and no `set` flag; a sentinel test on (0, 8) would be a
  guess, so nothing was added.
- **Confidence**: High.

## Observation: wrapped member = one tip target (zepeki)
- **Finding**: `getBestMatch` scans `rawBody` lines (`BodierAbstract.java:69-86`) and
  `getInnerPosition` returns the member's whole text block
  (`MethodsOrFieldsArea.java:287-294`); the notch aims at its centre
  (`EntityImageTips.java:175-179`). Our rows split a wrapped member into sub-rows, so
  the tip hit the first sub-line (Δ6.996 = half a 14-px line). Rows now carry
  `memberWrap {text,height,width}` on the first row and `wrapContinuation` on the
  rest (`class-member-rows.ts#annotateWrappedMembers`); `note-tips-resolve.ts`
  matches/aims on them. Enhanced-body rows are not annotated (no wrapped
  enhanced-body tip fixture).
- **Confidence**: High (0/0).

## Observation: `constraint on links` draws with STALE pass-0 coordinates (gujigi, open)
- **Context**: gujigi's residual 23 N after E3-13 are mostly the dashed constraint lines.
- **Finding**: `LinkConstraint` (`cucadiagram/LinkConstraint.java:70-104`) is shared
  by both links and keeps `x1,y1` (link1 = LAST link, `CucaDiagram.java:682-695`,
  `CommandConstraintOnLinks.java:107`) and `x2,y2`. `SvekEdge#drawU` (`:993-1011`)
  runs twice: the `calculateDimension` LimitFinder pass (pre-`moveDelta` frame) and
  the SVG pass. In the SVG pass link2 draws first with link1's pass-0 value (not
  translated), then link1 redraws with both fresh. Also the minimum-distance pick
  compares the square at `x + labelXY` (shifted by `dx,dy`) against `todraw.sample()`
  (un-shifted, and post-decoration-trim), so the chosen square point depends on the
  frame offset D. Verified on gujigi's 4 links with our pre-frame data: drawn (trimmed)
  path, pass 0 with offset 0 and pass 1 with D = (7, −1) reproduce every jar corner
  (spot+(0,10), (0,10), (0,5), (0,10); stale (0,10), (0,5)).
- **Blocker**: pass 1 needs the jar's `dotPath` frame: jarPre = ourPre + (minX,
  ROUND(bbH + 2·pad) − bbH + minY) (`graphviz lib/common/emit.c:1250`, `arith.h:48`;
  `graph-layout.ts#shiftToOrigin` subtracts the node min). That is the graphviz-frame
  read the batch-5 D3 task owns (`graph-layout.ts`). Port it there, then: pass-0 ink
  (one line + label, link1's draw) into `class-ink-box.ts`, pass-1 selection after the
  shift in `layout.ts#assembleShiftedGeometry`.
- **Confidence**: High on the mechanism (all 6 corners reproduced), unimplemented.

## Remaining gujigi structural diffs
- g[9]: E3-14 (`renderer-usymbol-entity.ts`, T28's primary) — untouched.
