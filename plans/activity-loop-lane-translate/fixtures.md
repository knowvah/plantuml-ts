# Fixtures — `activity-loop-lane-translate`

The 22 rows the filing named, with what was measurable on main at
`8815ec5b` before T0 (2026-09-19): `while`/`repeat` keyword counts and the
number of `|lane|` declaration lines in the `.puml`. **T0 fills the last
three columns**: the connection classes the row reaches on a cross-lane
edge (`while-back`, `repeat-out`, `simple1`, `simple2`, `complex1`, `none`),
the `--align` count before, and the mechanism when it is not a translate
shape. Rows with 0 lane lines cannot be translate residuals (D8).

Read the T0 measurement in [`measurements/`](measurements/) (`base.json`
from `tools/render-all.mts`, per-slug `--align`/`--dump` output).

| Slug | while | repeat | lane lines | Classes (T0) | Align before (T0) | Align after (T4) | Note (T0/T4) |
|---|---|---|---|---|---|---|---|
| `ruzica-16-deli877` | 2 | 0 | 7 | while-back (x2) | 35/95 | 36/97 | Both back-edges cross (Web Service/Fournisseur), instrumented `WHILE-BACK cross=true` at `walk-while-branch.ts:185`'s `[bodyOutLane, headerInLane]`. T4: canvas 423->450 vs golden 528, residual (d), see `decision-journal.md` |
| `kijazo-83-kipu485` | 1 | 0 | 3 | while-back | 21/41 | 21/42 | Back-edge crosses ebee-vdq-form (body) -> Citoyen (header). T4: line +2 excess is the pre-existing while-exit dog-leg (`FtileWhile.ConnectionOut`, not translatable), residual (c); mid-arrow anchor 12.9px off is inherited node-position divergence, residual (a) |
| `judatu-15-xize591` | 1 | 1 | 1 | none | 78/105 | — | While and repeat both entirely inside lane `B` (instrumented cross=false for both); residual is not this mission's mechanism |
| `gesogi-81-xoma900` | 1 | 1 | 1 | none | 44/55 | — | Repeat entirely in `System`, while entirely in `Driver` (separate `fork` branches); both instrumented cross=false; the fork's own parallel-in/out edges are already ported (out of scope) |
| `xovano-23-tazo278` | 1 | 0 | 2 | none | 46/56 | — | Body dips into `Customer` and returns to `Team` before `endwhile`; back-edge's `bodyOutLane`=`headerInLane`=`Team`, instrumented cross=false |
| `bulasi-17-vafa634` | 1 | 1 | 1 | none | 29/42 | — | Only ONE `\|Swimlane 1\|` declared; `Swimlanes.java:352`'s `swimlanes().size() > 1` gate is false, so `drawWhenSwimlanes`/`Cross` never run (single-lane path); both instrumented cross=false |
| `camavo-50-kaku123` | 1 | 1 | 0 | none (D8) | 35/48 | — | No swimlane declared; walker's `lane1`/`lane2` are `undefined`, so `routeEdge`'s `meta.lane1 === undefined` branch (`swimlane-placement.ts:377`) always takes the same-lane shift path — mechanism, not a translate residual |
| `vupuse-73-nuso490` | 1 | 1 | 0 | none (D8) | 8/26 | — | Same mechanism as `camavo` — no swimlane declared, lanes undefined |
| `zepima-96-peco612` | 1 | 1 | 0 | none (D8) | 50/63 | — | Same mechanism as `camavo` — no swimlane declared, lanes undefined |
| `becanu-19-diti597` | 0 | 1 | 3 | complex1 + repeat-out | 8/36 | 10/36 | `REPEAT-BACK class=complex1` (col2->col1) AND `REPEAT-OUT` cross (col1->col2) — the only row reaching both cross-lane repeat shapes. T4: X matches golden at dx=4.0 offset (T3); remaining gap is the Y-compression pass, outside write-set |
| `givanu-33-kire967` | 0 | 1 | 3 | complex1 | 10/40 | 12/40 | `REPEAT-BACK class=complex1` (col2->col1); repeat-out same-lane (col2->col2). T4: same X-then-Y pattern as becanu, no new mechanism |
| `kasadu-53-tuki533` | 0 | 1 | 2 | complex1 | 25/32 | 25/32 | `REPEAT-BACK class=complex1` (Reviewer->Author); repeat-out same-lane. T4: connector X now EXACT (816.537=816.537), no change to alignment ratio (Y-compression only) |
| `kudedo-31-pafi082` | 0 | 1 | 5 | complex1 | 35/37 | 34/37 | `REPEAT-BACK class=complex1` (Lane1->Lane2); repeat-out same-lane. T4: -1 is residual (e), renderer.ts emphasize-tip order, outside write-set |
| `mafete-03-rapa918` | 0 | 1 | 3 | complex1 | 30/33 | 29/33 | `REPEAT-BACK class=complex1` (Swimlane2->Swimlane1); repeat-out same-lane. T4: -1 is residual (e), same mechanism as kudedo |
| `manata-12-rido730` | 0 | 1 | 3 | complex1 | 39/54 | 39/54 | `REPEAT-BACK class=complex1` (actorC->actorA); repeat-out same-lane; matches `stop-11-complex1.md`'s six rows. T4: connector X improves toward golden (line21 x 301.819->325.819, golden 349.881), remaining gap is a pre-existing lane-width divergence plus Y-compression |
| `bumaca-51-kece901` | 0 | 1 | 3 | none | 25/32 | — | `REPEAT-BACK class=simple1`, same-lane (swimlane 1); repeat-out same-lane; residual not this mission's mechanism |
| `navene-45-cozo466` | 0 | 1 | 3 | none | 72/107 | — | `REPEAT-BACK class=simple2`, same-lane (Developer); repeat-out same-lane |
| `rujuxa-07-neco067` | 0 | 1 | 1 | repeat-out | 72/98 | 72/98 | `REPEAT-BACK class=simple1` same-lane (L1), but `REPEAT-OUT` crosses (L2->L1) — cross-lane repeat-out independent of back-connection class. T4: byte-identical to baseline (T3), unchanged |
| `tobajo-64-mipi810` | 0 | 3 | 4 | none | 91/170 | — | All three repeats' back+out edges instrumented same-lane (`test b`/`test b`/`test c`) |
| `katopo-68-xajo866` | 0 | 2 | 1 | none | 18/29 | — | Both nested repeats' back+out edges same-lane (`lane 1`) |
| `felega-00-saxi785` | 0 | 1 | 2 | none | 20/31 | — | `REPEAT-BACK class=simple2`, same-lane (SW1); repeat-out same-lane |
| `megara-21-rumi574` | 0 | 1 | 4 | repeat-out | 33/41 | 33/41 | `REPEAT-BACK class=simple1` same-lane (Actor 1), but `REPEAT-OUT` crosses (Actor 3->Actor 1). T4: byte-identical to baseline (T3), unchanged |

## D6 status at T4 close

All 10 classified rows (`while-back` x2, `complex1` x6, `repeat-out` x2 incl.
`becanu`'s double-class) reach their translate shape with correct connector
geometry (X matches the golden after canvas offset, verified by T3/T4);
none reaches full per-tag/positional parity because of residuals (a)-(e)
below, all outside this mission's write-set. D6 is satisfied via its second
clause ("or the residual names its element and Java cite") for every row.

## Residuals handed to T6 (named, none fixable in this mission's write-set)

- **(a)** `kijazo-83-kipu485` mid-arrow anchor (431.828, 199.556) vs golden
  (431.828, 212.556): the shape is correct relative to its own edge
  (D4/`FtileWhile.java:307`); the 12.9 px gap is this fixture's pre-existing
  body/header node-position divergence (rect dy 20.25, header dy 5.5),
  inherited, not a translate-shape defect. Origin outside Batch 1's write-set
  (node placement, not `swimlane-loop-translate-*.ts`).
- **(b)** `kijazo-83-kipu485` lane-1 width 155.8 vs golden 193.8: pre-existing
  (present in `base-svg` before this mission), not this mission's mechanism.
- **(c)** `kijazo-83-kipu485` while-exit dog-leg, +2 `<line>` vs the jar's
  straight run: `FtileWhile.ConnectionOut` (`decisions.md`'s NOT-translatable
  list, `FtileWhile.java:465`) is not a `ConnectionTranslatable`, so it is
  out of this mission's scope by D1; pre-existing in `base-svg`.
- **(d)** `ruzica-16-deli877` canvas 423 -> 450 vs golden 528. MEASURED: the
  jar's canvas DOES grow from the translated back-edge's horizontal run, but
  via a mechanism separate from lane-width computation.
  `Swimlanes#calculateDimension` (`Swimlanes.java:455-457`) calls
  `getMinMax` (`:483-487`), which runs `TextBlockUtils.getMinMax(this, ...)`
  (`TextBlockUtils.java:138-141`) — a SEPARATE full `drawU` pass through
  `drawWhenSwimlanes` (`Swimlanes.java:315-350`) that runs `Cross` at its
  end (`:358-360`) AFTER `ensureSizeComputed` has already fixed the lane
  dividers/translates from `computeSizeInternal`/`computeDrawingWidths`
  (`:396-431`, `:376-395`). The per-lane width pass
  (`UGraphicInterceptorAllSwimlanes#draw`,
  `UGraphicInterceptorAllSwimlanes.java:129-143`) gates a `Connection` on
  `contained1 && contained2` for ONE swimlane at a time — the same gate D5
  cites — so a genuinely cross-lane connection is never drawn into any
  single lane's `LimitFinder` and never widens a lane's own width. Only the
  later, separate full-tree `getMinMax` pass captures the translated
  snake's real horizontal extent and grows the OVERALL canvas. Verdict: the
  golden (528) is right; our narrower canvas (450) means our
  `assign-coordinates-full.ts#computeBounds` folds the translated edge's
  points into the SAME `maxX` used for lane-width/divider placement (T2's
  journal row 35) instead of a separate post-layout canvas-only pass —
  origin is `assign-coordinates-full.ts` (T1b's closed write-set), outside
  T4's.
- **(e)** `kudedo-31-pafi082` (34/37, was 35/37) and `mafete-03-rapa918`
  (29/33, was 30/33): `renderer.ts#renderEdge` emits an edge's segment
  lines, then its terminal arrow tip, then its emphasize (mid-arrow) tip
  last; `Worm.java:133-143` emits the emphasize decoration INLINE at its
  matching segment (`drawLine(ug, line, direction)` draws the polygon then
  the segment's `ULine`, `:179-183`) with the end decoration last
  (`:164-171`). CONFIRMED via `--dump`: kudedo index 27 is a jar `polygon`
  where ours has a `line` (ours defers the polygon to index 30); mafete
  shows the identical pattern at index 26. Origin `renderer.ts`, outside
  every task's write-set per the README; filed, not fixed.
- **(f)** D5: no baseline row exercises a cross-lane non-translatable
  `while` connection (`ConnectionBackEmpty`/`ConnectionOut`), so nothing is
  suppressed. See `decision-journal.md`'s T4 row for the re-verified cite.

## Representative slugs (T0 confirms or replaces)

T0 instrumented `walk-while-branch.ts:185` (while-back), `walk-repeat.ts:345`
(repeat-back) and `walk-repeat.ts:240` (repeat-out) with a temporary
`ALLT_TRACE` env-gated `console.error` (reverted before commit; `git diff`
on `src/` is empty) to read the actual `lane1`/`lane2` pair each connector
carries, rather than inferring lane membership from the `.puml` text.
**T0 replaces two of the filing's three representative claims**:

- while back, cross-lane (CONFIRMED): `kijazo-83-kipu485`, `ruzica-16-deli877`
  (x2 instances)
- repeat, `complex1` (CONFIRMED, matches `activity-loop-tile-port` stop 11
  exactly): `becanu-19-diti597`, `givanu-33-kire967`, `kasadu-53-tuki533`,
  `kudedo-31-pafi082`, `mafete-03-rapa918`, `manata-12-rido730`
- repeat, cross-lane `repeat-out` (NEW — not named by the filing):
  `becanu-19-diti597` (also `complex1`), `rujuxa-07-neco067`,
  `megara-21-rumi574` — `ConnectionOut` is independently translatable
  (D1/decisions.md's translatable list) and can cross lanes even when the
  back-connection itself resolves to same-lane `simple1`/`simple2`
- **REPLACED**: `tobajo-64-mipi810` is NOT cross-lane — all three repeats'
  back+out edges instrument same-lane; its 91/170 align residual is a
  different, unread mechanism
- **REPLACED**: "both builders" (`judatu-15-xize591`, `gesogi-81-xoma900`,
  `bulasi-17-vafa634`) reach NEITHER `while-back` nor a cross-lane repeat
  shape — `judatu`/`gesogi` keep the while and repeat each fully inside one
  lane (`gesogi`'s are in separate `fork` branches); `bulasi` declares only
  one swimlane, so `Swimlanes.java:352`'s `size() > 1` gate never engages
  `drawWhenSwimlanes`/`Cross` at all. Their align residuals are not this
  mission's mechanism.

## Break rows (D9 gate)

None of the 22 carries a `break`. Checked ALL 268 baseline slugs (not only
the 5+9 named) for `break` + a `|lane|` declaration in the same fixture:
zero matches (`grep`, see `.agent-notes/allt-T0.md`). The nine break rows
of `activity-gtile-break-size` and the five of
`activity-repeat-break-welding` (`bizono`, `cixave`, `dacuga`, `dixiku`,
`doziki`) share no slug name and no connector class with any of the 22
classified rows here — **T5 struck** (D9).
