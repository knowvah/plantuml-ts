# apc-T0 — the split/fork subset before the parallel port

Mission `activity-parallel-connectors`, batch 0, 2026-09-10, branch
`feat/activity-parallel-connectors` at `bf8a79f2` (source identical to the
brief's baseline `b7c293c6`). Probe: a scratch `npx jiti` script over the
268 `status:"baseline"` fixtures of `diff-baseline.json`, rendered through
`renderFixtureActivity` + `DeterministicMeasurer` + `fixtureIncludeStore()`,
scored with `compareSvg(.., 'deterministic')` and `weightedScore`. The
subset is every fixture whose source has a line matching `^\s*(split|fork)\b`.
The four activity oracle gates: 1260/1260 at this tip.

## Headline at the tip

| quantity | value |
|---|---|
| aggregate `weightedScore` (268) | 43977 -> 43977, 0 risers, 0 fallers |
| subset `weightedScore` (32) | 8218 -> 8218 |
| subset with a `fork` line / split only | 17 / 15 |
| subset with swimlanes (`^\s*\|`) | 17 |
| subset with a terminator (`detach|stop|end|kill|break`) INSIDE a fork/split branch | **11** |
| subset with a terminator anywhere in the source | 22 (the brief's "21") |
| our exact zero-length `<line>`s | 2, both on `simuti-16-lece058` |
| the jar's near-zero `<line>`s (dx, dy <= 0.01) | 7: `racana-82-zece676` 4, `jupoxe-15-sugo110` 2, `sopape-11-laxo488` 1 |

The 11 strictly-inside fixtures (D5's population): decudi, firibi, gevaxi,
jupivo (`break`), maketa, nexitu, popofi, simuti, sopape, tobajo, xenofo.
The other 11 of the brief's "21" end the diagram with `stop`/`end` AFTER the
join, where `hasPointOut()` never gates a connector.

## Subset families (weight, positional indices collapsed)

| family | weight |
|---|---|
| `svg/g[][childCount]` | 3733 |
| `line[]/@y1` / `@y2` / `@x1` / `@x2` | 600 / 599 / 596 / 595 |
| `polygon[]/@points` | 313 |
| `text[]/@y` / `@x` | 206 / 203 |
| `rect[]/@y` / `@x` | 176 / 173 |
| `text[]/@textLength` | 166 |
| `rect[]/@width` | 72 |
| `svg/@viewBox[]` | 64 |
| `ellipse[]/@cy` | 60 |

## The 32 fixtures (pinned score; lanes; terminator inside a branch)

tobajo 776 L T · judatu 463 L · decudi 456 L T · jevoce 382 L · maketa 357 L T ·
firibi 336 L T · nexitu 336 T · nupose 316 L · roboja 316 L · popofi 301 T ·
gevaxi 287 T · jupivo 259 T · racana 259 L · fovaja 247 · gesogi 242 L ·
camavo 220 · simuti 219 T · gugala 213 L · misiji 211 L · noxasi 207 L ·
bugaja 206 L · bunoxu 202 · bixefi 181 L · xenofo 155 T · vokibe 152 ·
sopape 150 L T · begivo 140 L · labala 138 · cifafo 132 · zizaki 131 ·
garuga 120 · fomapa 108.

## Target shapes

### `simuti-16-lece058` (split, no lanes; a1/a2 `detach`, a3 continues)

JAR: top thin line `y=55` from `x=32.675` to `119.375` (`stroke-width:1.5`),
three vertical drops `56.5 -> 75` at each branch's own x with `asToDown`
heads; bottom thin line `y=127` from **`76.025`** to `119.375`; ONE out
drop `119.375: 107 -> 127`; then `76.025: 128.5 -> 147` to the kill cross
(`stroke-width:2.5`). No rect anywhere.
OURS: two `rect` bars `height=8` at `y=52` and `y=180`, every branch routed
from `barCenterX=112.025` via side-then-vertical-then-side, join
connectors for the two detached branches, and the two zero-length lines
`112.025,80 -> 112.025,80` and `112.025,180 -> 112.025,180` (branch 2's
centre equals the bar centre).

### `bixefi-77-moki051` (fork, three lanes, no terminator)

JAR: fork bar `rect x=26 y=40.5 w=99.35 h=6 fill=#555 stroke #555 rx=2.5`
in swim1; join bar `x=242.75 y=118.5 w=148.175 h=6` in swim3. Same-lane
branch 1: straight drop `75.675: 46.5 -> 66.5`. Cross-lane in-connectors
leave the bar's lane at `118.35,46.5`, run horizontal at **`50.5 = 46.5 + 4`**,
drop at the branch x. Cross-lane out-connectors leave at `y=98.5`, run
horizontal at **`104.5 = 118.5 - 14`**, drop into the join bar at `249.75`.
OURS: both bars `rect h=8 fill=#181818` spanning `214.75..611.675`
(`NODE_MARGIN_X`/`BAR_OVERHANG` widths), every branch elbowed at the bar
centre `413.213`.

## Observation: split step 2 clamps `first` to the composite's own left

- **Context**: on `simuti` only a3 (`x=119.375`) has an out point, yet the
  jar's bottom line starts at `76.025`.
- **Finding**: `ParallelBuilderSplit#doStep2` sets `first`/`last` only
  from branches with `hasPointOut()`, then `if (last < geom.getLeft()) last
  = geom.getLeft(); if (first > geom.getLeft()) first = geom.getLeft();`
  (`ParallelBuilderSplit.java:171-176`; the same clamp in step 1 at
  `:104-109`). `geom.getLeft()` is the assembled inner's in/out x — the
  composite's centre. So the thin line always reaches the centre.
- **Impact**: D4's "`first..last` span the branches with an out point" is
  incomplete; T3 must port the clamp or the line on every partially-detached
  split is short.
- **Confidence**: High — method read this session.

## Observation: the jar's fork bar is `#555`, stroked, `rx=2.5`

- **Finding**: `bixefi` draws `fill="#555" style="stroke:#555;stroke-width:1;"
  rx="2.5" ry="2.5"`. D4 cites `FtileBlackBlock.java:101-110` for the
  stroke and says "in its own colour"; the rounded corners and the colour
  source (style `activityBar`? `LineColor`?) are for T3 to read there
  before writing the rect.
- **Confidence**: High for the SVG; the Java source of `#555`/`2.5` unread.

## Observation: the `+4` / `-14` elbows are visible verbatim in the goldens

- **Finding**: `bixefi` in-connectors run horizontal at `bar.y2 + 4` and
  out-connectors at `join.y1 - 14`, exactly D6's `ConnectionIn#drawTranslate`
  / `ConnectionOut#drawTranslate` literals.
- **Confidence**: High.
