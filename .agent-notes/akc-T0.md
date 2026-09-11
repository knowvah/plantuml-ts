# akc-T0 — the activity geometry before the compress port

Mission `activity-klimt-compress`, batch 0, 2026-09-10, branch
`feat/activity-klimt-compress` at `75138160` (source identical to the
brief's baseline `fa578b8a`). Probe: a scratch `npx jiti` script over the
268 `status:"baseline"` fixtures of `diff-baseline.json`, rendered through
`renderFixtureActivity` + `DeterministicMeasurer` + `fixtureIncludeStore()`,
scored with `compareSvg(.., 'deterministic')` and `weightedScore`. The
subset is every fixture whose source has a line matching `^\s*(split|fork)\b`.
Load average at measurement: 2.00 / 4.87 / 5.74 (1 / 5 / 15 min).

## Headline at the tip

| quantity | value |
|---|---|
| aggregate `weightedScore` (268) | 42511 -> 42511, 0 risers, 0 fallers, 0 throws |
| subset `weightedScore` (32) | 6752 -> 6752 |
| four activity oracle gates | 1260/1260, wall-clock 4.40 / 4.48 / 4.04 s (median **4.40 s**) |
| fixtures with a fork/split of 2+ branches | **32** (every subset fixture; `fork again`/`split again` case-insensitive) |
| fixtures with swimlanes (`^\s*\|`) | **60** (17 of them in the subset) |
| fixtures with an `if` / `while` / `repeat` hexagon | **160** (`if` 123, `while` 23, `repeat` 43; 12 of them also in the subset) |

The ratchet test declares no per-test timeout override (default 5000 ms per
test); the stop-13 SLI is the four-file wall-clock above.

## Aggregate x/width families (positional indices collapsed)

| family | 268 fixtures | 32-fixture subset |
|---|---|---|
| `svg/g[][childCount]` | 18038 | 2116 |
| `line[]/@x1` / `@x2` | 2705 / 2705 | 605 / 605 |
| `line[]/@y1` / `@y2` | 2697 / 2697 | 599 / 598 |
| `polygon[]/@points` | 1722 | 300 |
| `text[]/@x` / `@y` | 1455 / 1455 | 211 / 211 |
| `rect[]/@x` / `@y` | 920 / 920 | 180 / 180 |
| `svg/@viewBox[]` | 533 | 64 |
| `ellipse[]/@cx` / `@cy` | 464 / 442 | 60 / 58 |
| `svg/@width` / `@height` | 266 / 267 | 32 / 32 |
| `rect[]/@width` | 149 | 55 |

`childCount` is 42.4% of the aggregate; the comparator pairs children
positionally and never descends past a count mismatch, so attribute
families are comparable only on fixtures whose count already matches
(`.agent-notes/apc-T6.md`).

## The 28 is two 14s

`AbstractParallelFtilesBuilder#computeNewFtile` (`:129-131`):
`spaceArroundBlackBar = 20`, `xMargin = 14`, each branch wrapped in
`FtileUtils.addHorizontalMargin(ftile, 14, 14 + supp)`. Two adjacent
branches are therefore 28 apart BEFORE compression on both sides; the jar's
10 is `28 − 2 × 5` after `SlotSet#smaller(5.0)`
(`CompressionXorYBuilder.java:56`). The 18 per gap is not a target to fit;
it is what the port produces.

## Target dumps (ours vs jar, `--dump`)

Ours has a 12 px root margin (`LAYOUT_MARGIN`), the jar 16 on the left
(`.agent-notes/activity-canvas-bounds.md`): compare positions modulo that 4.

### `zizaki-04-guvi945` (fork, 2 branches, no lanes) — score 74

| element | ours | jar |
|---|---|---|
| fork bar | `x=12 w=125.4` | `x=16 w=103.4` |
| branch 1 box | `x=26` (right 60.7) | `x=28` (right 62.7) |
| branch 2 box | `x=88.7` | `x=72.7` |
| inter-branch gap | **28** | **10** |
| canvas | 149 × 212 | 139 × 254 |

X occupancy ours: bar-end reservations `[12,14]` and `[135.4,137.4]`
(`URectangle#drawWhenCompressed`, the bar is `ignoreForCompressionOnX`),
boxes `[26,60.7]`, `[88.7,123.4]`, arrowheads inside the boxes' x-range.
Gaps reversed: `[14,26]` 12, `[60.7,88.7]` 28, `[123.4,135.4]` 12; after
`smaller(5)`: 2 + 18 + 2 = **22** removed. Predicted: bar `12..115.4`
(**103.4** wide = the jar's), branch 1 at 24 (jar 28 − 4), branch 2 at
68.7 (jar 72.7 − 4). The jar removed exactly these three; nothing else.

Y: the two branches interleave (`[38,174]` continuous once boxes and
arrowheads are unioned); the bar-to-first-arrowhead gap is `[18,28]` = 10
and the last-box-to-join gap `[174,184]` = 10 with a 10-long ArrowsRegular
head (T1) — both vanish under `smaller(5)`. With our present 8-long head the
latter is 12 and would remove 2: **T1 must land before T5 or `zizaki`
Y-compresses by 2**. The jar removed nothing on Y.

In-branch vertical pitch, the filed non-goal: ours 52 (`38 → 90`), jar 67
(`42 → 109`); a gap of 20 vs 35 between stacked boxes. On this fixture the
y-carrying families weigh `rect[]/@y` 7, `line[]/@y1`/`@y2` 7 + 7,
`text[]/@y` 5, `polygon[]/@points` 7 (shared with x): ≤ 33 of 74. Not this
mission's.

### `simuti-16-lece058` (split, 3 branches, a1/a2 detach) — score 131

| element | ours | jar |
|---|---|---|
| boxes | `x=26, 87.35, 148.7` (w 33.35) | `x=16, 59.35, 102.7` |
| gaps | **28, 28** | **10, 10** |
| top thin line | `42.675..165.375` | `32.675..119.375` |
| bottom thin line | `104.025..165.375` | `76.025..119.375` |
| canvas | 208 × 235 | 156 × 187 |

The jar removed 18 per gap (two gaps) and nothing else. Ours additionally
carries the 14 px `xMargin` outside the first and last branch (`26 − 12`);
in the jar that leading 14 is absorbed by `Recentred`
(`ActivityDiagram3.java:212`, unported — `activity-canvas-margin`), not by
compression: `SlotSet#reverse()` emits only gaps BETWEEN occupied slots, so
a leading or trailing margin is never a slot. Expect ours after T5 at
`26, 69.35, 112.7` with the canvas 172 wide: the residual 14 on the left and
the extra 4 on the right belong to `Recentred`, not to this pass. Y: every
inter-row gap is 10 with a 10-long head; nothing bites either side.

### `bixefi-77-moki051` (fork, 3 lanes, no terminator) — score 220

| element | ours | jar |
|---|---|---|
| lanes (x) | `17 · 102.35 · 209.75 · 600.675` | `20 · 129.35 · 236.75 · 394.925` |
| lane widths | 85.35 / 107.4 / **390.925** | 109.35 / 107.4 / **158.175** |
| fork / join bar | `x=214.75 w=380.925` (both in lane 3) | fork `x=26 w=99.35` (lane 1); join `x=242.75 w=148.175` (lane 3) |
| canvas | 612 × 131 | 420 × 145 |

Ours puts both bars in lane 3 (the filed parser lane-capture defect,
`.agent-notes/apc-T6.md`) spanning Σ lanes. X occupancy in lane 3: bar ends
`[214.75,216.75]`, `[593.675,595.675]`; box 3 `[457.5,581.675]`; the two
cross-lane elbows' arrowheads at `x=266.425` and `380.8` are
`parallel-in`/`-out` decorations and are SKIPPED on X
(`Worm.java:159-168`, `compressionMode = ON_X`); the same-lane head at
519.588 sits inside box 3. Gaps: `[216.75,457.5]` 240.75 → 230.75,
`[581.675,593.675]` 12 → 2: **232.75 removed**, bar → `380.925 − 232.75 =
148.175` = the jar's join bar exactly, lane 3 → 158.175 = the jar's. Lane 1
stays 24 narrower than the jar's (109.35 holds the jar's fork bar; ours
holds only the box) — the parser defect, not this pass. Y: bar-to-head and
box-to-head gaps are 10 after T1; nothing bites, matching the jar.

### `pujozo-36-nino158` (laned `if`, 2 lanes) — score 140

| element | ours | jar |
|---|---|---|
| lanes (x) | `17 · 183.2 · 290.288` | `20 · 186.2 · 308.244` |
| lane widths | 166.2 / 107.088 | 166.2 / 122.044 |
| hexagon | `210.03..282.073`, 40 tall | `201.2..277.244`, 24 tall |
| canvas | 312 × 291 | 334 × 323 |

Lane 2 X gaps: box-to-hexagon overlap (`[191.414,260.689]` ∩
`[210.03,282.073]`); hexagon-right to the else-arrowhead `[282.073,292.689]`
= 10.6, but `FtileIfDown` reserves `UEmpty(5, 12)` beside the hexagon
(`:349,402,440`), leaving 5.6 → vanishes. Lane-1-to-lane-2: `[178.2,191.414]`
= 13.2 minus the divider's `UEmpty(x1 + x2, 1)` (`LaneDivider.java:91`) —
at most 3.2 removable, likely 0 once the divider occupies its padding
(T3 reads the Java). Y: every row gap is 10 after T1; nothing bites. The
jar's `[168.5,182.5]` hexagon-to-arrowhead gap is held by the `non` label
(`<text y=177.056 font-size=11>`): `UText` occupies through
`TextLimitFinder`. The 24-vs-40 hexagon and the else-branch routing are
pre-existing and outside this mission.

### `nomeco-93-minu967` (`while`, no lanes) — score 108

| element | ours | jar |
|---|---|---|
| hexagon | `143.638..273.638`, `y 52..92` | `178.638..312.638`, `y 55..79` |
| action | `x=12 w=393.275 y=112` | `x=49 w=393.275 y=99` |
| loop-back x | 425.275 | 454.275 |
| `end` | `cx=218.638 cy=198` (below) | `cx=29 cy=109` (left, from `endwhile`) |
| canvas | 437 × 224 | 489 × 174 |

X: the loop-back is a `ULine` (never occupies); right of the action's
`[12,405.275]` nothing is occupied, and a trailing region is not a slot:
0 removed. The jar's head at `312.638..322.638` beside the hexagon and its
`UEmpty(5, 12)` at `(x1, y1bis)` (`FtileWhile.java:272`) are what keeps the
jar's `[312.638, 454.275]` loop region uncompressed there.

**Y bites here, on ours only.** Our out-edge leaves at `y=164`, 20 below the
action's bottom (144): the gap `[144,174]` (a 10-long down head at the
`end`, `Direction.fromVector` on `dx=10, dy=20` → down) holds only a
`ULine` → **20 removed**, `end` at 178, canvas 204. The jar's structure
differs (`end` exits left), so there is no jar target for it; T5 journals
it as expected, and if the 20 is in fact our loop-back footprint's bottom
band rather than empty space, that is a T5 finding to name, not a reason to
reserve it.

## Where Y compression bites: summary

Of the five dumped, only `nomeco` (ours) Y-compresses, and the jar's own
output shows none of the five was Y-compressed by the jar. Corpus-wide the
question is answered by T5's `removed.y` per fixture.

## Observation: T1 before T5 is load-bearing, not cosmetic

- **Context**: predicting Y slots with our present 8-long, ±3.2 arrowhead.
- **Finding**: the 20 px `spaceArroundBlackBar` rows and every 20 px
  inter-row gap leave `20 − 8 = 12` empty with our head and `20 − 10 = 10`
  with `ArrowsRegular` (`ArrowsRegular.java:42-79`, `delta1 = 10`). Under
  `smaller(5)` a 12-gap removes 2; a 10-gap vanishes.
- **Impact**: without T1, T5 would Y-compress every fork/join and every
  action-to-action gap by 2 px, corpus-wide, and the rise would be blamed on
  the pass. The batch-1 ordering is what prevents it.
- **Confidence**: High — arithmetic on the dumped y's, `SlotSet.smaller`
  read.

## Observation: a leading/trailing margin is not a slot

- **Finding**: `SlotSet#reverse()` emits the gaps between consecutive
  sorted slots; the space before the first and after the last occupied
  interval is never removed. `Recentred` (unported) is what trims the jar's
  leading `xMargin` on splits.
- **Impact**: `simuti`'s left 14 stays after T5; that residual is
  `activity-canvas-margin`'s, and must not be written as a compress target.
- **Confidence**: High.
