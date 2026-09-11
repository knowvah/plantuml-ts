# akc-T6 — re-measure, re-pin, close out

Mission `activity-klimt-compress`, 2026-09-10, branch
`feat/activity-klimt-compress`. Baseline `fa578b8a` (aggregate 42511; the 32
split/fork fixtures 6752). Probe: the T0 scratch script; re-pin: the previous
mission's scratch `repin-activity.ts`, one measurement.

## Headline

| quantity | before | after |
|---|---|---|
| aggregate `weightedScore` (268) | 42511 | **52954** (+24.57%; +10445 at T1, −2 at T5) |
| the 32 split/fork fixtures | 6752 | 8709 |
| `polygon[]/@points` (whole-attribute) | 1722 | 230; per-index `@points[]` appears at 12033 |
| `rect[]/@width` | 149 | 132 |
| `rect[]/@x` / `text[]/@x` / `line[]/@x1` / `svg/@width` | 920 / 1455 / 2705 / 266 | 920 / 1455 / 2705 / 265 |
| mean \|ours − jar\| on the subset: `rect@x` / `text@x` / `svg@width` / `line@x1` | 57.65 / 95.04 / 106.72 / 170.03 | 22.04 / 38.57 / 38.56 / 108.03 |
| `removed` over 268 | — | x 5827.175 (85 fixtures), y 2117 (160) |
| fixtures moved vs the post-T1 state | | 6 rose, 14 fell, 248 unchanged |
| siblings (23 files) | 2167 / 1 pending | identical per file |

## Observation: the gated score cannot see this mission's convergence

- **Context**: the exit bar said "Σ falls against 42511".
- **Finding**: T1 changed the comparator regime — 4-point heads pair per
  index with the jar's (≤ 8 diffs per head instead of one count mismatch)
  and every tip stays offset by the unported root margin — so Σ rose 10445
  before any compression ran, and the geometrically exact T5 pass moved it
  by −2. `rect[]/@x` stayed at 920 while its mean distance to the jar fell
  57.65 → 22.04 px on the fixtures the pass targets.
- **Impact**: a family-count exit bar is the wrong instrument for a port
  whose values converge without coinciding. State such bars on magnitude
  (a `mean |Δ|` table) or on named targets, and write the score bar as "zero
  unexplained rises". Same lesson as `.agent-notes/activity-canvas-bounds.md`
  (blind to magnitude), now on the mission's headline number.
- **Confidence**: High — `magnitude.ts` at `38cdfb41` and HEAD.

## Observation: the census tallies need the right quantity

- **Finding**: the Euclidean divider census marked `noxasi` "farther"
  (4.4 → 5.2) although its lane widths became exactly the jar's (64.0 /
  175.3): the whole set sits 3 px left (margin). On lane widths the census
  is 18 closer / 6 farther / 36 same with 16 exact matches. Canvas width
  "away" on 48 fixtures is the same shape: ours was already 14–125 px
  narrower for structures we do not draw, and compressing our whitespace as
  the jar compresses its own widens the residual.
- **Impact**: compare lane WIDTHS (D7's quantity) and say what the residual
  is made of before calling a move "away".
- **Confidence**: High.

## Observation: an arrowhead left of the canvas

- **Finding**: `bideta-97-cezo697` routes an edge to `x = −6.32`; its head
  spans `[−10.32, −0.32]`. The compress pass, correctly, found the 12.32 gap
  to the band reservation and removed 2.32. `canvas-bounds.test.ts` asserts
  nodes and lanes, not edge points. Filed `activity-off-canvas-arrowhead`.
- **Confidence**: High (`t6-slots.ts`).

## Observation: the halt was worth it

- **Finding**: stop 11 fired on a premise the Java contradicts, and the
  instrument (`overlaps()`) had a text-box bug that both hid two real pairs
  and invented two. Verifying each pair against `Worm.java:159-168` and
  `UGraphicCompressOnXorY.java:100-112` turned "7 defects" into "7 pinned
  pairs owned by the filed parser defect".
- **Confidence**: High.
