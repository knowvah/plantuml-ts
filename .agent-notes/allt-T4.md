# T4 sweep — `activity-loop-lane-translate`

## Movers are exactly the 8 rows Batch 1 named

`diff -rq` of `t4-svg` against the T0 baseline render (`8815ec5b`, in
`allt-t0/base-svg`) differs on exactly `kijazo-83-kipu485`,
`ruzica-16-deli877`, `becanu-19-diti597`, `givanu-33-kire967`,
`kasadu-53-tuki533`, `kudedo-31-pafi082`, `mafete-03-rapa918`,
`manata-12-rido730` — nothing else. Diagonal scan 0/268.

## `weightedScore` is unchanged by byte movement on 5 of the 8 rows

`becanu`, `givanu`, `kasadu`, `manata` render DIFFERENT bytes than the
baseline (verified with a diff-bag script comparing `compareSvg` diffs
path-by-path, not just counts) but their `weightedScore` and diff COUNT are
identical before/after (e.g. becanu 190/161 both times). The underlying
per-attribute numeric values moved substantially closer to golden (e.g.
becanu's cross-lane line changed from x=118.663/35.675 dog-leg to
x=144.337, golden 148.337) but `compareSvg`'s default `weight=1` per diff
is magnitude-blind (memory `oracle-score-blind-to-magnitude`), so an
improvement that doesn't eliminate a diff outright doesn't move the score.
Confirms T3's port is working correctly on these rows even though the
gated ratchet/pin tests don't reflect it (they only fire on the 3 rows
whose diff COUNT changed: kijazo, ruzica, mafete).

## Residual (d) mechanism — two separate sizing passes in the jar

`Swimlanes#calculateDimension` (`Swimlanes.java:455-457`) don't reuse the
per-lane `LimitFinder` used by `computeDrawingWidths`/`computeSizeInternal`
(`:376-431`, which sets `dividers`/`swimlane.translate` from TILE content
only — `UGraphicInterceptorAllSwimlanes`'s `Connection` branch,
`UGraphicInterceptorAllSwimlanes.java:129-143`, gates
`contained1 && contained2` on a SINGLE swimlane, so a genuinely cross-lane
connection is invisible to every per-lane `LimitFinder`). Instead
`calculateDimension` calls `getMinMax` (`:483-487`), which runs a SEPARATE
full `drawU` over the whole `Swimlanes` TextBlock
(`TextBlockUtils.java:138-141`) into one fresh `LimitFinder` — this second
pass runs `drawWhenSwimlanes` again (lane translates already cached from
the first pass) and, at its end, `Cross` (`Swimlanes.java:358-360`), which
DOES draw the translated cross-lane connector. So: lane widths/dividers
never see the connector; the outer canvas does, via a later pass. Our
`assign-coordinates-full.ts#computeBounds` (T2's journal row 35) folds the
edge's points into the SAME `maxX` that also drives lane placement — one
pass where the jar has two — which is why `ruzica`'s canvas (450) still
falls short of golden (528): our single-pass fold isn't wrong in kind, just
computes a different (smaller) value than a true separate post-layout pass
would. Origin is `assign-coordinates-full.ts`, not in T4's write-set.

## Residual (e) — exact `--dump` evidence

`kudedo-31-pafi082 --dump`: index 27 is `<polygon lane=1>` in the jar but
`<line lane=1>` in ours; ours emits its two polygons (terminal tip, then
emphasize tip) as indices 29-30 instead of interleaving the emphasize tip
at its own segment like the jar. `mafete-03-rapa918` shows the identical
pattern at index 26. Matches T3's journalled mechanism
(`renderer.ts#renderEdge` vs `Worm.java:133-143,179-183`) exactly; cost is
1 alignment index each (34/37, 29/33 vs 35/37, 30/33 on the stub-elbow
version), confirmed unchanged from Batch 1's measurement.

## No fix was made in this task

All named residuals (a)-(f) have their origin outside the four Batch 1
files (`swimlane-loop-translate-while.ts`, `swimlane-loop-translate-repeat.ts`,
`walk-while-branch.ts`, `walk-repeat.ts`): (a)/(b)/(c) are pre-existing node
placement/non-translatable-shape divergences, (d) is
`assign-coordinates-full.ts`, (e) is `renderer.ts`, (f) needs no code. This
task's write-set changes are `fixtures.md`, this file, `measurements/t4.json`
and the journal — no `src/` diff.
