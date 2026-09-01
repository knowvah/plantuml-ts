# T2.1 — the plain participant box width, derived from upstream

**Result.** The box width is

```
boxWidth = pureTextWidth + padding.left + padding.right      = textWidth + 14
```

and there is **no minimum-width floor**. The 14 lives INSIDE `getTextWidth`
as PADDING — the question T2.1 was asked to settle — not added afterwards as
margin. Margin is a separate, and for a participant zero, term.

## The derivation, one `file:line` at a time

Every line below was read in `~/git/plantuml`, not recalled.

**1. What is drawn is `getTextWidth`, not `getPreferredWidth`.**
`ComponentRoseParticipant#drawInternalU` (`:100-104`):

```java
final double boxWidth = getTextWidth(stringBounder);
final double boxHeight = getTextHeight(stringBounder);
final Shadowable rect = URectangle.build(boxWidth, boxHeight)...
```

**2. `getTextWidth` adds the style padding to the raw text block.**
`AbstractTextualComponent.java:106-108`:

```java
final public double getTextWidth(StringBounder stringBounder) {
    return getPureTextWidth(stringBounder) + getOldPaddingX1() + getOldPaddingX2();
}
```

with `getOldPaddingX1/X2` returning `padding.getLeft()` / `padding.getRight()`
(`:116-122`). So the 14 is padding. Settled.

**3. That padding is the STYLE's padding.**
`ComponentRoseParticipant`'s constructor passes `style.getPadding()` as
`AbstractTextualComponent`'s padding argument (`:71`), and `Rose#createComponentParticipant`
(`Rose.java:133-134`) resolves the same value for the component's own copy:

```java
final ClockwiseTopRightBottomLeft padding = styles[0].getPadding();
final ClockwiseTopRightBottomLeft margin  = styles[0].getMargin();
```

So the two paddings in play are the same object, and neither is a skinparam.

**4. The style padding is 7, from the skin.**
`plantuml.skin:186-190`:

```
participant,actor,boundary,control,entity,queue,database,collections {
  BackgroundColor: var(--grey-blue);
  HorizontalAlignment center
  Padding 7
}
```

`Style#getPadding` (`Style.java:297-300`) reads `PName.Padding` and hands it to
`ClockwiseTopRightBottomLeft.read`, whose one-token branch expands a scalar to
all four sides (`ClockwiseTopRightBottomLeft.java`, `read`, `case 1`). So
left = right = top = bottom = 7, and left + right = **14**.

**5. The minimum-width floor is ZERO — D2 confirmed independently.**
`ComponentRoseParticipant:140-142` applies `minWidth` to the PURE text width:

```java
protected double getPureTextWidth(StringBounder stringBounder) {
    return Math.max(super.getPureTextWidth(stringBounder), minWidth);
}
```

and `minWidth` arrives from `Rose#getMinClassWidth` (`Rose.java:275-278`):

```java
private double getMinClassWidth(Style style) {
    return style.value(PName.MinimumWidth).asDouble();
}
```

`MinimumWidth` appears in **no** file under `src/main/resources/skin/`
(`grep -n MinimumWidth src/main/resources/skin/*.skin` → no matches), so the
lookup returns a `ValueNull`, whose `asDouble()` is `0`
(`ValueNull.java:57-59`). Upstream's floor is 0. `theme.ts:322`'s
`participantMinWidth: 80` has no counterpart at all.

**6. Margin is zero for a participant, so `getPreferredWidth == boxWidth`.**
`:135-137`:

```java
public double getPreferredWidth(StringBounder stringBounder) {
    return getTextWidth(...) + margin.getLeft() + margin.getRight()
         + deltaShadow + getDeltaCollection();
}
```

- `margin` — `PName.Margin` is declared nowhere in the participant scope nor at
  `root` (`plantuml.skin:1-19`), so `ValueNull#asString()` returns `""`
  (`ValueNull.java:72-74`), `read("")` fails its `[0-9 ]+` guard and returns
  `none()` = `(0,0,0,0)`.
- `deltaShadow` — `Shadowing: 0.0` at `root` (`plantuml.skin:18`).
- `getDeltaCollection()` — `0` unless `collections` (`:114-118`); the
  `collections` case is Batch 4's T4.3.

## Verification against the goldens — 3570 boxes, not six

The goldens hand us the jar's own text width directly: each participant emits
`<rect width="W">` immediately followed by `<text textLength="T">`.

Across all 1141 committed sequence goldens, 3620 participant boxes match that
shape, and **3589 of them have `W - T` = 14.000 exactly** — from the narrowest
label in the corpus (`'is'`, T = 10.150) to the widest (`ximuku-67-lupe952`'s
57-character participant, T = 579.250). `text x - rect x` is 7.000 on 3569 of
them, which is the same padding seen from the other side.

**Every one of the 31 exceptions is explained, not waved through:**

| shape | example | reading |
|---|---|---|
| multi-line label | `fozeva-08-tife475` `W=88.025`, lines `40.512` and `74.025` | widest line governs: `74.025 + 14 = 88.025` ✓ |
| multi-line label | `gevere-74-caba556` `W=42`, lines `19.425` and `28` | `28 + 14 = 42` ✓ |
| rich-text runs | `nunozo-09-zoce623` `W=113.663`, runs `24.15` + `50.575` + … | one label split across several `<text>`; the run total governs |
| explicit style override | `gepipe-05-rosu313` — source declares `Padding: 2 20`, `Margin: 0 50` | `W = 24.938 + 20 + 20 = 64.938` ✓ and `H = 14 + 2 + 2 = 18` ✓ |

`gepipe` is the strongest of the four: it independently confirms which term is
padding and which is margin, because it sets them to different values and the
BOX tracks padding alone.

## Measurer parity, re-measured rather than assumed

D3 established parity on six labels. Restricting to the 3570 single-line,
28-high, no-override boxes and measuring every label with
`DeterministicMeasurer` at `sans-serif 14`:

```
worst |ourMeasure - jarTextLength|    = 0.000500
worst |ourMeasure + 14 - jarBoxWidth| = 0.000500
```

So `measure(label).width + 14` reproduces the jar's participant box width
across the whole corpus to within half a thousandth of a pixel. If a box is
still wrong after T2.2, the fault is in the call site, not the arithmetic.

## What this port does today, and the two errors in it

`sequence-layout-participants.ts:175-178`:

```ts
const plain = Math.max(
  theme.sequence.participantMinWidth,          // 80  -- no upstream counterpart
  lw + theme.sequence.participantPadding * 2,  // 10  -- upstream is 7
);
```

Two independent errors: a floor that does not exist upstream, and a padding
6px too wide on every box. `renderer-participant-shapes.ts:146` reads the same
constant to place a badge, and the jar-verified comment directly above it
(`birocu-87-xubi808`: "image x=179.938 (`x + 7`)") already states 7 — so that
call site is currently 3px wrong for a reason its own comment records.

## Residual, carried into the record rather than fixed here

Upstream's padding is a per-style `ClockwiseTopRightBottomLeft` that a
`<style>` block can override per diagram; this port's is one scalar. Two
corpus fixtures exercise the difference (`gepipe-05-rosu313`,
`butali-53-kige134`'s `Margin`). Making participant padding style-driven is a
skin-plumbing change, not a coordinate one, and is outside this mission's
write-set. Correcting the scalar from 10 to 7 is strictly closer for every
fixture including those two.
