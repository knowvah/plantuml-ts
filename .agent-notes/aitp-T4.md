# aitp-T4 — `GtileIfDown` port

Mission `activity-if-tile-port`, task T4. Ported `FtileIfDown`
(`vcompact/FtileIfDown.java`) as `GtileIfDown` + `layout/walk-if-down.ts`,
wired through `conditional-builder.ts`'s `down` dispatch.

## Key finding: `diamond2`'s geometry has THREE shapes, not two

`ConditionalBuilder#getShape2` (`:285-311`) alone suggests two cases (real
24x24 merge rhombus when `hasTwoBranches()`, else an invisible
`FtileEmpty(0, 6)`). But `FtileIfDown.create` (`:130-132`) REPLACES
`diamond2` with a fresh `new FtileEmpty(skinParam)` -- a genuine
zero-size placeholder, `(0, 0)`, not `getShape2`'s `(0, 6)` -- whenever
`optionalStop != null`, discarding whatever `getShape2` computed. So:

1. `optionalStop` set -> `diamond2Geo = (0, 0, left 0)` (no `if-merge`
   node, contributes 0 height to the total).
2. `optionalStop` unset, `hasTwoBranches()` true (both ORIGINAL then/else
   have a point out) -> the real `(24, 24, left 12)` rhombus, `if-merge`
   node emitted.
3. `optionalStop` unset, `hasTwoBranches()` false (the down builder's own
   main flow itself lacks a point out, e.g. ends mid-sequence in `stop;`
   without being classified `isOnlySingleStopOrSpot`) -> `getShape2`'s own
   `(0, 6, left 0)` invisible placeholder, no `if-merge` node, but the 6px
   height still pads the tile's total height.

Case 3 only arises via `ConnectionElseNoDiamond` (verified: whenever
`optionalStop` is null, `hasTwoBranches()` false requires the down
builder's own dispatch to have picked a main branch lacking point-out
WITHOUT that branch being classified stop-or-spot -- which is exactly
`ConnectionElseNoDiamond`'s own trigger condition, `hasPointOut1==false`).
Else1/Else2 are therefore never reachable when `diamond2Geo` is case 3 --
confirmed by construction, not just by the corpus.

`hasTwoBranches()` itself is computed from the ORIGINAL (pre-swap)
`then`/`else` branches' own `.hasPointOut()`, never the post-swap
main/side roles -- `ConditionalBuilder`'s own `tile1`/`tile2` fields are
built once in its constructor from the untouched branches.

## `isSmallerThanAllOthers` uses true declaration order (corrected)

`Swimlane#isSmallerThanAllOthers` (`Swimlane.java:130-137`) needs each
lane's declaration-order index (`Swimlane.compareTo`, `order` = an
increasing counter assigned the first time each `|name|` is parsed,
`Swimlanes.java:173`). This port's `ast.swimlanes: string[]` holds that
order. It is now threaded as a `laneOrder: readonly string[]` parameter
from `layoutActivity` (`tile-layout.ts`) through `tileNodes` -> `tileNode`
-> `tileIf` -> `conditional-builder.ts#buildIf` -> `buildIfDown` ->
`isMainLaneSmallerThanAllOthers`, which now compares by index exactly as
`compareTo` does, instead of an earlier lane-MEMBERSHIP approximation
(reverted -- see decision-journal.md's "T4 (corrected)" row: the
coordinator flagged the approximation as unacceptable per CLAUDE.md,
since `compareTo` is a mechanism the Java states explicitly, not one that
should be approximated). `tile-layout.ts` is edited as part of this
correction -- outside T4's originally declared write-set, pre-authorised
because it is already inside T3's write-set and the coordinator waived
stop 1 for this specific fix.

Measured zero behavioural change across the full 268-fixture corpus
(`t4.json`'s aggregate and all 17 laned `down` rows' scores are
byte-identical before/after) -- the corpus has no fixture where a main
flow re-enters a lane declared earlier than the if's own, the one case
membership and true order disagree on. Two new unit tests
(`tests/diagrams/activity/layout/walk-if-down.test.ts`, "by true
declaration order") construct that case directly with explicit
`laneOrder` arrays.

## Verification loop

`--align` on all three Q1 `down` slugs plus `cemipu-87-dinu624` (the laned
Else2 exemplar): `rerovo-62-nazo755` is an EXACT 4-tag match (14/16);
`vimako-25-mega336`'s polygon/line are exact (6/6, 5/5), the text gap is a
pre-existing multi-line-label rendering gap (unrelated to this task);
`vaxiki-78-nice114`'s polygon/line surplus is the T1-flagged snake-merge
residual, filed per D5. `cemipu-87-dinu624` (laned) is a near-exact match,
43/46, confirming Else2 fires correctly when the main flow stays in the
if's own lane.

`measurements/t4.json` vs `t3.json`: aggregate 52804 -> 51298, 66 true
movers (58 fallers, 8 risers), every one a `fixtures.md` `down` row. 2 of
the 8 risers (`gelono-70-zuce760`, `manata-12-rido730`) are large
(+137, +295) despite their TOTAL element count moving to parity with the
jar (39/39, 50/50) -- but NOT per-tag: `--align` reads polygon 13/14 +
line 13/12 (gelono) and polygon 12/14 + line 24/22 (manata). The polygon
deficit on both is the DEFERRED repeat mid-arrow (D6's amendment -- the
live repeat back-edge draws no `emphasize` arrow though the jar's golden
does, filed under `activity-repeat-connector-draw-order`); the line
surplus on both is the snake-merge residual (parent D5, same class as
`vaxiki-78-nice114`'s). The score rise itself is a D9 positional-pairing
artifact from correcting the `if`'s own draw order inside a `repeat`
body, not a count regression. See decision-journal.md's T4 rows for the
full mechanism per riser.
