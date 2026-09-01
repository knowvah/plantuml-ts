# T5.1 — the left origin and the document margins

**Result.** The margin is **10 on every side, and it is two fives**. The
participant row does not start there unconditionally: upstream solves an
origin and then draws the body shifted so that whatever reaches furthest LEFT
lands on the margin.

```
image width  = contentSpan + 20
leftmost ink = 10
```

## The derivation

**1. The exporter's own margin — 5.** `TextBlockExporter:173` applies
`new UTranslate(margin.getLeft(), margin.getTop())` before drawing, and
`:201-202` returns `dim + margin.left + margin.right` as the image size. The
margin comes from `calculateMargin(diagram)` (`:492,511-515`), which falls
through to `diagram.getDefaultMargins()` when the `document` style declares no
`Margin`. For a sequence diagram
(`SequenceDiagram#getDefaultMargins:624-628`):

```java
public ClockwiseTopRightBottomLeft getDefaultMargins() {
    return modeTeoz()   // this is for backward compatibility
            ? ClockwiseTopRightBottomLeft.same(5)
            : ClockwiseTopRightBottomLeft.topRightBottomLeft(5, 5, 5, 0);
}
```

`same(5)` — 5 on all four sides in Teoz, which is the mode this port targets.

**2. The text block's own translate — another 5, and the shift.**
`SequenceDiagramFileMakerTeoz#getTextBlock`'s `drawU` (`:130-136`):

```java
ug = ug.apply(new UTranslate(5, 5));
body.setIndex(num);
final UTranslate min1translate = UTranslate.dx(-min1.getCurrentValue());
ug = ug.apply(min1translate);
```

with `min1 = body.getMinX(stringBounder)` (`:82`). So content at body-x `X`
lands at `5 - min1 + X`, and the leftmost content — at `X = min1` — lands at
**5** inside the block, **10** in the image. That is where
`jobadi-87-jegi648`'s first box is: `x="10" y="10"`.

**3. The width follows from the same two fives.** The block's own
`calculateDimension` returns `body + 10` (`:157`), and the exporter adds
`margin.left + margin.right` = 10 on top. Content span + 20, symmetric.

**4. The origin is SOLVED, not fixed.** `createMainTile` (`:88-98`) chains
`xcurrent = livingSpace.getPosD(...).addAtLeast(0)` participant by
participant off a `RealOrigin`, and `xorigin.compileNow()` (`:110`) solves it
after every tile has added its constraints. The `dx(-min1)` above is what
turns that solution into image coordinates: nothing can be left of the margin,
because the margin is defined as wherever the leftmost thing ended up.

## What this port had

| | this port | upstream |
|---|---|---|
| `LEFT_MARGIN` | 30 | 10 |
| `RIGHT_MARGIN` | 30 | 10 |
| `BORDER1` (`sequence-layout-exo.ts`) | **0** | the drawing space's left edge = the margin |
| origin | fixed | solved, then shifted by `-min1` |

`BORDER1 = 0` was the load-bearing one. Its comment claimed "this port lays
participants out from a fixed `LEFT_MARGIN` with no negative content, so the
origin IS the left edge" — but `border1` is the left edge of the CONTENT, not
of the image, so every left-border exo arrow was drawn 10px too far left. The
jar on `[<- Bob : hello` puts the border-end head at **11**; this port put it
at **1**, and that number was already written in the test's own comment as the
jar's.

## What was applied

1. `LEFT_MARGIN` 30 → 10, `RIGHT_MARGIN` 30 → 10.
2. `BORDER1` 0 → `LEFT_MARGIN`.
3. A two-pass origin solve in `layoutSequence`: lay out from `LEFT_MARGIN`,
   measure the leftmost content, and if anything overhangs, lay out again with
   the row pushed right by the overhang. That is `dx(-min1)` expressed as a
   correction rather than as a constraint solve.
4. Two constants the overhang measurement exposed, both cited, both wrong
   before:
   - `GroupingTile.MARGINX = 16` (`:89`) — this port used an uncited 20 for
     the group frame's reach beyond its contents. Jar-verified on
     `bovugo-63-lazo401`: its `opt` frame is `x="13.469"` against a leftmost
     lifeline centre of 29.469.
   - `GroupingTile.EXTERNAL_MARGINX1 = 3` (`:82`) — a group's footprint
     (`getMinX:697-698`) starts 3 left of the frame it draws. Sixteen fixtures
     were short by exactly 3.000 without it.

## Measured

| | before Batch 5 | after |
|---|---:|---:|
| leftmost participant box exact vs the jar | ~0 of 1044 | **707** |
| fixtures rendering a negative x coordinate | 0 (masked by the 30px margin) | 33 |
| total geometry distance | 3076534.997 | **2661116.421** |
| `@x` | 434797.374 | 289443.234 |
| `@x1` | 101805.109 | 48839.204 |
| `@x2` | 122470.088 | 76031.379 |

## Two residuals, with mechanisms

### (a) 33 fixtures still render content at a negative x

The origin walker deliberately does NOT count message LABEL extents. Adding
them was implemented and measured both ways:

| | labels excluded | labels included |
|---|---:|---:|
| negative-x fixtures | 33 | **7** |
| leftmost box exact | **707** | 687 |
| total distance | **2661116.421** | 2667352.786 |

Including labels fixes the clipping but costs 20 fixtures their origin and
6236 of total distance, because upstream does not always absorb a wide label
by moving the origin — sometimes it widens a GAP instead. Which of those two
happens is decided by the `Real` constraint system, and choosing between
modelling that and keeping this port's pairwise pre-scan is **exactly D6**,
which Batch 7 must decide explicitly. Stop condition 6 forbids deciding it
here by an edit, so the measurement is handed to T7.1 and the labels stay out
of the walker for now.

### (b) 138 fixtures shift the row by an amount the jar does not

In 37 of the first 40 sampled, **the jar shifts too** — the mechanism is
right and the magnitude differs. The magnitudes are driven by left-note widths
(`GroupingTile#getMinX` also subtracts `getNotesWidth(..., LEFT)`, which this
port does not model), by englobers, and by the inter-participant gap that
Batch 6 owns. After correcting `MARGINX` and `EXTERNAL_MARGINX1` the residual
histogram has no single mode left, which is what "several separately-owned
terms" looks like.

## Note for Batch 6, arriving early

`kibave-01-tafo463`'s five consecutive lifeline spacings are each off by
exactly **+10**, and `LivingSpaces#addConstraints` is `nextA >= prevE + 10`
(`:61-71`) against this port's `participantGap: 20`. The gap is 10, not 20.
