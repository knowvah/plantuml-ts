# Decisions — sequence-newpage-pagination

Every entry below was read out of the Java before it was written down; the
`file:line` in each is where to re-read it.

## D1 — The page band, in this port's coordinates

Upstream's body geometry has `y = 0` at the top of the body (heads are drawn
separately, un-translated). This port's `SequenceGeometry` has `y = 0` at the
top of the HEAD row and the body below it, so upstream's `ymin`/`ymax` shift
by `headHeight`:

```
headHeight            = participant head row height (= max participant height)
bodyEnd               = geo.lifelineEndY        (upstream `fullHeight` + headHeight)
newpageYs[i]          = the i-th NewpageGeo's y

ymin(0)               = headHeight                       (upstream 0)
ymin(k>0)             = newpageYs[k - 1]
ymax(k >= n)          = bodyEnd                          (upstream fullHeight)
ymax(k <  n)          = min(newpageYs[k] + 21, bodyEnd)
pageHeight            = ymax - ymin
dy                    = headHeight - ymin                (body translation)
```

`21` is `NewpageTile#getPreferredHeight` = `ComponentRoseNewpage
#getPreferredHeight` (`1`) `+ 2 * MARGINY` (`10`) —
`NewpageTile.java:50,94-96`, `ComponentRoseNewpage.java:68-71`.

@see teoz/PlayingSpaceWithParticipants.java:96-110 (getYMin/getYMax)
@see teoz/PlayingSpaceWithParticipants.java:204-229 (drawU)
@see teoz/PlayingSpace.java:338-350 (yNewPages/getNbPages)

## D2 — The clip band is `[ymin, ymax + 1]`, and it is measured, not inferred

`drawU` translates the body by `dy(headHeight - ymin)` and THEN applies
`new UClip(-1000, ymin, MAX_VALUE, pageHeight + 1)`.
`AbstractCommonUGraphic#apply` translates a `UClip` by the ug's CURRENT
translate before storing it (`:112-114`) — so in body-geometry coordinates
the band is `[ymin, ymin + pageHeight + 1] = [ymin, ymax + 1]`, inclusive at
both ends (`UClip#isInside` uses `<` / `>`).

The `+ 1` is visible in the golden. `digula-66-dipe776`: heads `y=45..73`,
lifelines `y1="74"`, footer heads `y=338`, so `headHeight = 29` and
`pageHeight = 338 - 45 - 29 = 264`; the separator sits at `y=327 = 243 + 10 +
74`, so the newpage tile's `y` is `243` and `ymax = 243 + 21 = 264`. The
lifelines end at `y2="339" = 264 + 1 + 74`, one pixel past `ymax`. A band of
`[ymin, ymax]` would have written `338`.

The x half of the clip is `[-1000, ~MAX]`; every x this port emits is inside
it, so `isInside(x, y)` reduces to a test on `y` alone. That reduction is
what lets the transform work in geometry space at all — recorded here so it
is checked rather than assumed if an x-negative geometry ever appears.

`UClip#enlarge` would widen the band by 1 in each direction, but
`enlargeClip()` has exactly one caller — `UGraphicHandwritten.java:60` — which
is not on this path.

## D3 — The six per-shape rules, and the KIND they map onto

| shape | rule | driver |
|---|---|---|
| `ULine` | clamp both endpoints' y; drop when the clamped endpoints coincide; a DIAGONAL line with one endpoint outside is dropped, not clamped | `DriverLineSvg:59-69` -> `UClip#getClippedLine` |
| `URectangle` | clamp; drop when clamped height <= 0 | `DriverRectangleSvg:66-74` |
| `UText` | all-or-nothing on the anchor `(x, y)` | `DriverTextSvg:88-90` |
| `UPath` | all-or-nothing on bbox min AND max corner | `DriverPathSvg:58-60` |
| `UPolygon` | all-or-nothing: every point must be inside | `DriverPolygonSvg:57-61` |
| `UEllipse` | all-or-nothing on `(x, y)` and `(x+w, y+h)` | `DriverEllipseSvg:56-64` |

The port emits geometry KINDS, not shapes, so each kind is assigned the rule
of the shapes it emits. Where one kind emits shapes with DIFFERENT rules, the
kind is split by hand rather than averaged — see D4.

## D4 — Per-kind mapping, including the straddle cases

- `lifeline` (a participant's dashed `ULine` + its muting `URectangle`) —
  CLAMP. Both shapes clamp, and both clamp to the same band, so the kind is
  not split.
- `activation` (a `URectangle`) — CLAMP; dropped when the clamped height
  <= 0.
- `message` — ALL-OR-NOTHING on the arrow's own `y`. A message emits a
  horizontal `ULine` plus a `UPolygon`/`ULine` head plus `UText` labels, and
  every one of those sits at (or within a few px of) the arrow `y`: a
  horizontal `ULine` whose single `y` is outside the band is dropped by
  `getClippedLine` (both endpoints outside, `x1 != x2`, so `null`), the
  polygon head needs all points inside, and the text needs its anchor inside.
  All three agree on the arrow `y`.
  A SELF message is the one shape whose components span a real y range (the
  loop is ~26px tall). Upstream would clip its three segments independently.
  This port keeps the whole self message when its `y` is in the band and
  drops it otherwise, and pins that as the chosen answer: splitting a
  `MessageGeo` into per-segment survivors would require the renderer's
  self-loop arithmetic to move into the transform.
- `note` — ALL-OR-NOTHING on the box's `y`. STRADDLE CASE: a note whose box
  crosses the boundary would have its `URectangle` CLAMPED and its `UText`
  lines DROPPED individually by upstream. This port drops the whole note when
  its top `y` is outside the band. Pinned in a test.
- `divider` — ALL-OR-NOTHING on the tile's `y`. Same straddle shape as a
  note (band rect + rules + label box + text). Pinned in a test.
- `frame` — CLAMP on the body rectangle (`y`/`height`), then the header tab,
  the branch separators and the `ref` body are each dropped when THEIR own
  `y` leaves the band. This is the one kind where clamping and
  all-or-nothing genuinely coexist in upstream, because `GroupingTile` draws
  a `Blotter` rect (clamped) and a header component (text, all-or-nothing).
  A frame whose whole span misses the band is dropped.
- `space` — no ink at all; carried through unchanged so indices and cursor
  arithmetic downstream are unaffected. It emits nothing either way.
- `newpage` — the separator `ULine` (Batch 3). Horizontal, so all-or-nothing
  on its `y`; it is deliberately inside BOTH adjacent bands, which is the
  overlap `PlayingSpaceWithParticipants.java:78-80` describes.
- `participant` heads and the footbox row — NOT clipped. `drawU` draws them
  on the un-clipped `ug` (`:222-226`).
- `boxes` (a `box`/`end box` background) — CLAMP; it is a `URectangle`.

## D5 — `renderSync` returns page 1

Confirmed by the maintainer 2026-09-01 and restated here because it is the
mission's one API decision: `renderSync`/`render` return page 1, and a new
`renderPagesSync`/`renderPages` returns every page. No other engine in this
port paginates, so this is the precedent.

## D6 — Identity when there is no `newpage`

`paginateSequence(geo, 0)` on a geometry with no newpage tile returns the
input object unchanged (same reference), mirroring
`scaleSequenceGeometry`'s `k === 1` fast path. That is what bounds the blast
radius to the ~35 fixtures that carry a `newpage`.
