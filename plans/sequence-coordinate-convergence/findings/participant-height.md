# T3.1 — the plain participant box height, derived from upstream

**Result.** Two different numbers, and conflating them is the whole of the
error:

```
drawn box height   = getTextHeight   = textBlockHeight + padding.top + padding.bottom   = text + 14
reserved head area = getPreferredHeight = getTextHeight + margin + deltaShadow + 1 + deltaCollection
                                       = text + 15
```

The box is drawn 28 tall for a one-line label and the head OCCUPIES 29. The
extra pixel is empty space below the box, and it is what separates the box
bottom from the lifeline top in every golden.

## The derivation

**1. What is drawn is `getTextHeight`.** `ComponentRoseParticipant#drawInternalU`
(`:100-104`) — the same two lines that settled the width:

```java
final double boxWidth  = getTextWidth(stringBounder);
final double boxHeight = getTextHeight(stringBounder);
final Shadowable rect  = URectangle.build(boxWidth, boxHeight)...
```

**2. `getTextHeight` is the text block plus top and bottom padding.**
`AbstractTextualComponent.java:110-114`:

```java
final protected double getTextHeight(StringBounder stringBounder) {
    final XDimension2D size = getTextBlock().calculateDimension(stringBounder);
    return size.getHeight() + padding.getTop() + padding.getBottom();
}
```

Padding is `Padding 7` on all four sides (`plantuml.skin:186-190`; the scalar
expansion is `ClockwiseTopRightBottomLeft.read`'s `case 1`), so this is
`text + 14` — the same 14 as the width, from the same source, on the other
axis.

**3. The reserved area is `getPreferredHeight`, which adds exactly 1.**
`ComponentRoseParticipant:129-132`:

```java
public double getPreferredHeight(StringBounder stringBounder) {
    return getTextHeight(stringBounder) + margin.getTop() + margin.getBottom()
         + deltaShadow + 1 + getDeltaCollection();
}
```

`margin` = 0 and `deltaShadow` = 0 for a participant (proved in
`participant-width.md` §6), and `getDeltaCollection()` = 0 unless
`collections`. So `getPreferredHeight = getTextHeight + 1`.

**4. That preferred height is what the head row reserves.**
`LivingSpace#drawHeadOrTail` (`:191-214`) builds the component and takes
`comp.getPreferredDimension(...)` — which is `(getPreferredWidth,
getPreferredHeight)` (`AbstractComponent.java:163-167`) — as the `Area` it
draws into. `getHeadPreferredDimension` (`:216-221`) returns the same thing to
the layout. So the head's extent is 29 while `drawInternalU` paints 28 at the
top of it.

**5. The `+1` belongs to `ComponentRoseParticipant` ALONE.** Read, not
assumed — every other head component's `getPreferredHeight` is
`stickman.height + getTextHeight` with no constant at all:
`ComponentRoseActor:89-92`, `ComponentRoseDatabase:96-99`,
`ComponentRoseBoundary:90-93`, `ComponentRoseControl:91-94`,
`ComponentRoseEntity:91-94`, and `ComponentRoseQueue:82-85` (glyph height
only). This matters for the fix: the extra pixel is added on the plain and
`collections` path and nowhere else.

## Verification against the goldens

Across all 1141 committed goldens, taking the top row of participant boxes:

```
box height 28.0                : 2304 boxes
lifelineTop - boxBottom == 1.0 : 2284 boxes
```

`jobadi-87-jegi648` in full: box `y="10" height="28"`, so the box occupies
[10, 38); the lifeline rect is `y="39"`. Head area = [10, 39) = 29 tall = box
+ 1. Both halves of the derivation, in one fixture.

The residual counts are my matcher pairing a box with a neighbouring
lifeline where several sit within its tolerance, not a second rule: the
distribution is 2284 at exactly 1.0 against single-digit counts everywhere
else.

## Reconciling the three numbers D2/the brief names

> Our box is 34, the jar's 28, our `measure('M').height` is 14.

- `measure('M').height` = 14 is the text block height, and it is CORRECT —
  the jar's own box height minus its own padding is 28 − 14 = 14, the same
  number. Nothing is wrong with the measurement.
- The jar's 28 = 14 + 2 × 7.
- Our 34 = 14 + 20, from `sequence-layout-participants.ts:435`'s bare
  `+ 20`, which carries no upstream citation. It is the height twin of the
  width's `participantPadding: 10` — the same 10-instead-of-7, doubled.

So the height error is entirely the uncited `+ 20`, and the missing `+1` is a
separate, previously absent term.

## What changes

1. `boxHeight`'s `+ 20` becomes `+ 2 * theme.sequence.participantPadding`,
   which is now 14 — the drawn box.
2. A `headSlack` of 1 is reserved below the plain and `collections` box when
   the head row's height is computed, and 0 for the glyph kinds, per §5.

The brief's note holds: this moves `headHeight`, hence every body `y` and the
footbox row.
