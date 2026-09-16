# Architecture decisions — `activity-while-repeat-left-alignment`

Confirmed 2026-09-16. **Locked**; amend and halt on contradiction (stop 3).
Java paths are under `~/git/plantuml/src/main/java/net/sourceforge/plantuml/activitydiagram3/ftile/`.

## D1 — Port the merger arithmetic, not a centring patch

**Context.** `FtileWhile`: `geo = diamond1.appendBottom(whileBlock)`
(`vcompact/FtileWhile.java:584`), then `left = geo.left + 2*12` (+ special),
`width = geo.w + 2*12 + 12 + backward` (`:586-593`); children at
`total.left - child.left` (`:621-641`). `FtileRepeat`: `left =
max(repeat.left, d1.w/2, d2.w/2)`, `right = max(repeat.w - repeat.left,
d1.w/2, d2.w/2)` (`vcompact/FtileRepeat.java:767-786`); `width = max(left +
right, testWidth + 24) + backward + 24` (`:701-716`); body at `left -
repeat.left`, diamonds at `left - d.w/2`, backward at `width - backward.w`
(`:730-765`). Merger: `FtileGeometryMerger.java:44-56`. Ours takes
`contentWidth = max(child.width)` and centres each child
(`tiles/gtile-while.ts:28-31`, `tiles/gtile-repeat.ts:22-24`).

**Decision.** Each tile computes `contentLeft = max(child lefts)` and
`contentWidth = max(contentLeft - child.left + child.width)` over its
children (for repeat, the diamonds contribute `w/2` as their `left`), stores
one x-offset per child (`contentLeft - child.left`), and puts its hooks at
`contentLeft` (plus the gutter offset D2 fixes). Rejected: keeping
`max(child.width)` and only anchoring children on the existing centre — an
asymmetric child would overflow the tile, and it is not what the jar does.

**Consequences.** Symmetric children (`left == width/2`) produce the same
numbers as today; only fixtures with an asymmetric loop child move.

## D2 — Gutters and back-edge sides unchanged

**Context.** Ours: while `width = content + BACK_EDGE_MARGIN` with the back
edge on the right (`backEdgeRightX = width`), hook `x = (width -
BACK_EDGE_MARGIN)/2`; repeat `width = content + BACK_EDGE_MARGIN` with the
back edge on the left (`backEdgeLeftX = 0`), hook `x = width/2`. The jar's
gutters differ (24 left + 12 right for while; 24 outer for repeat) and the
simple repeat back edge goes left, the complex one right.

**Decision.** Keep `BACK_EDGE_MARGIN`, the sides, and each tile's hook
CONVENTION: while hook `x = contentLeft`; repeat hook `x = contentLeft +
BACK_EDGE_MARGIN/2` — so a symmetric configuration keeps today's hook
exactly (`content/2` and `width/2` respectively).

**Consequences.** Width divergences from the jar's gutters remain filed
(`activity-diamond-sizing`'s sibling); nothing symmetric moves.

## D3 — `GtileDiamond` untouched

**Decision.** The header/condition diamond keeps its 20/10/40 sizing (filed
as `activity-diamond-sizing`); its `left` is `width/2`. Stop 12.

## D4 — One task per loop kind, sequential, one re-pin

**Decision.** T1 while, T2 repeat, T3 re-pin; each measured against the
previous JSON, `base.json` = aitp's `final.json`. Sequential because both
tasks' movers overlap (a repeat body can hold a while) and attribution is
the point.

## D5 — Exit signal is the diagonal scan plus byte-identical symmetric fixtures

**Decision.** The aggregate is reported, never gated
(`compare.ts:404` is magnitude-blind and anti-monotone under element
growth). A task is done when its loop kind's diagonals are gone, every
symmetric fixture's score is unchanged, and every mover names its
asymmetric child.
