# T1 diagnosis — jar's transition-label ink is the MARGED box, not the drawn text

> **LANDED 2026-08-15, commit `c62f7d21`.** Everything below held when
> implemented. Measured outcome: `measure-composite-declared-size.ts`
> **2454 → 2469** exact (160 → 145 mismatched, **zero** exact →
> non-exact); all six `Configuring` fixtures at **0.000**, was +0.527;
> `shape-match-report.ts` **776 → 779** doc-size-exact and **25695 →
> 25952** matched shapes; state DOT-parity 268/268; 59 svg-state pins
> hold. The residual predicted below was closed too — the quantization
> was scoped to the label's ink box (human-approved), which is why the
> six land exact rather than at 0.0017. Port-side detail, including the
> six `size-backlog.json` entries this unmasked, in
> `transition-label-ink-port.md`.

Mission `plans/transition-label-ink/`, batch-1/T1. Subject:
`test-results/dot-cache/state/bemena-23-zebu249`, the `Configuring`
composite (392.86168 ours against jar's 392.335).

## Observation: the "unsourced +1.000" is `marginLabel`, on the right

- **Context**: the brief framed this as two opposing mechanisms — (A) our
  fold uses the reserved box 113 where upstream folds the drawn text
  111.475 (−1.525), and (B) an unidentified +0.998 that makes jar's ink
  exceed its own rightmost drawn element by exactly 1.000. Eight
  hypotheses were already dead.
- **Finding**: **the framing is wrong, and there is only ONE mechanism.**
  Upstream does not fold the drawn text. It folds the `UEmpty` that
  `TextBlockMarged.drawU` emits for the label's *marged* block —
  `measuredWidth + 2 * marginLabel` = 111.475 + 2 = **113.475** — anchored
  at the reserved box's own top-left corner, one `marginLabel` left of the
  drawn text. The missing 1.000 is the label's RIGHT-hand `marginLabel`;
  the left-hand one is already inside the anchor.
- **Impact**: the correction is a single −(1 − frac(measuredWidth)) on the
  ink extent, not two opposing terms that must land together. D3 ("both
  mechanisms in one commit") is satisfied vacuously — there is one.
- **Confidence**: High. Derived from the Java, then confirmed to five
  decimals on this fixture and predicted in advance on two independent
  fixtures with different label strings.

## Mechanism

`SvekEdge` wraps every edge label in a 1px (6px for a self-loop) margin:

```java
// svek/SvekEdge.java:372-373
final double marginLabel = startUid.equalsId(endUid) ? 6 : 1;
return TextBlockUtils.withMargin(block, marginLabel, marginLabel);
```

`TextBlockUtils.withMargin` (`klimt/shape/TextBlockUtils.java:64-69`)
returns a `TextBlockMarged`, whose `drawU` draws an **`UEmpty` sized to the
full marged box** before drawing the inner text inset by the margin:

```java
// klimt/shape/TextBlockMarged.java:74-77
public XDimension2D calculateDimension(StringBounder stringBounder) {
    final XDimension2D dim = textBlock.calculateDimension(stringBounder);
    return dim.delta(left + right, top + bottom);
}
// klimt/shape/TextBlockMarged.java:79-87
public void drawU(UGraphic ug) {
    final XDimension2D dim = calculateDimension(ug.getStringBounder());
    if (dim.getWidth() > 0) {
        ug.draw(UEmpty.create(dim));                       // <- THE INK
        final UTranslate translate = new UTranslate(left, top);
        textBlock.drawU(ug.apply(translate));              // <- the glyphs
    }
}
```

`LimitFinder` folds that `UEmpty` at full size, with no `-1` inset (unlike
`drawRectangle`/`drawEllipse`) and no polygon hack:

```java
// klimt/drawing/LimitFinder.java:159-162
private void drawEmpty(double x, double y, UEmpty shape) {
    addPoint(x, y);
    addPoint(x + shape.getWidth(), y + shape.getHeight());
}
```

`UEmpty` is invisible in SVG (`klimt/shape/UEmpty.java:40-65` — a pure
size carrier), which is exactly why the composite's ink exceeds every
element visible in jar's own `in.svg`. Nothing is missing from the SVG;
the ink simply includes a shape that has no rendering.

**Anchor.** `labelXY.getPosition()` is the reserved box's min corner, not
the text anchor: `getXY` (`SvekEdge.java:808-813`) takes
`SvekUtils.getMinXY` over the points of the invisible coloured label table
graphviz laid out, and `SvekEdge.java:745` wraps it in a
`PositionableImpl` that stores the point verbatim
(`klimt/geom/PositionableImpl.java:53-55`). `SvekEdge.java:951-954` then
draws `labelText` — the *marged* block — at that corner, so the glyphs
land at corner + `marginLabel`.

**The floor is DOT-only.** The `113` is the reservation written into the
DOT, floored by an `(int)` cast: `SvekEdge.java:440-441` measures
`labelText.calculateDimension()` = 113.475, and `appendTable`
(`SvekEdge.java:504-507`) does `final int w = (int) dim.getWidth()` → 113.
The ink never sees that cast. Our `computeReservedLabelBox`
(`src/core/edge-label-box.ts:102`) ports the floor correctly; the bug is
that the ink walk reuses the floored value.

## Origin

`src/diagrams/state/layout-ink-extent.ts:389-390` — folds
`[label.x, label.x + label.width]` where `label.width` is
`reservedWidth = floor(measuredWidth + 2·marginLabel)` and `label.x` is
the *drawn text* x (box corner + `marginLabel`).

## Causal chain (bemena-23-zebu249, absolute SVG coordinates)

The frame is `absolute = raw + 6 + 12` — `moveDelta(6 − minX)`
(`svek/SvekResult.java:133`) plus `InnerStateAutonom#drawU`'s
`UTranslate(IEntityImage.MARGIN, …)` inside a composite box at x=7.

| | value | source |
|---|---|---|
| ink minX | 18.000 | spline control point, jar `in.svg` `C18,266.06` |
| label reserved-box corner | 261.86 | drawn text x 262.86 − `marginLabel` |
| label block dimension | 113.475 | 111.475 + 2·1, `TextBlockMarged#calculateDimension` |
| **ink maxX** | **375.335** | 261.86 + 113.475 — the `UEmpty` |
| ink extent | 357.335 | 375.335 − 18 |
| + `delta(15,15)` | 372.335 | `SvekResult.java:135` |
| + 20 | **392.335** | `InnerStateAutonom.java:186-197`, `marginForFields = 0` |
| jar's DOT | 5.449097 in | ×72 = 392.334984 ✓ |

The y axis independently corroborates the same frame and needs no
correction hypothesis: inner ink = [122, 329] absolute, height 207, +15
+ title 14 + 20 = 256 = jar's `height="256"`, exactly. Top is the start
ellipse (`drawEllipse` adds `y`, no inset); bottom is
`NewValuePreview`'s rect at `y + height − 1` = 329 (`drawRectangle`'s
inset, `LimitFinder.java:184-188`).

## Predictive check — three fixtures, three label strings

The per-fixture error is `floor(w + 2) − w − 1` = `1 − frac(w)` for the
label that sets the extent. Predicted BEFORE looking at the harness:

| fixture | label | measured `w` | predicted | observed Δ | residual |
|---|---|---|---|---|---|
| `bemena-23-zebu249` | `EvNewValueSaved` | 111.475 | 0.52500 | 0.52668 | 0.00168 |
| `movuva-53-jude799` | `shoot`/`move` | 31.76875 | 0.23125 | 0.23206 | 0.00081 |
| `dulixa-11-kufe247` | `EvConfig` | 52.8125 | 0.18750 | 0.19051 | 0.00301 |

`bemena`'s family is **six** fixtures, not the three the brief names:
`jorere-75-peja265`, `ketibo-84-juzo029` and `zitifa-97-bizo337` carry the
same `Configuring` composite at scope 2 with the identical +0.52668.

## The residual, and why 0.000 is not reachable here

Every residual above is the KNOWN 2-decimal read-seam quantization
already written up in `class-edge-spline-2dp-quantization.md`: jar scrapes
graphviz's `-Tsvg` **text**, which prints coordinates at 2 decimals, so
every graphviz-derived number jar holds is quantized. Ours are not.
Visible directly in this fixture — jar `M128.56,142.44` / `rect x="57.75"`
against our `M128.569,142.441` / `rect x="57.756"`; jar's label x is
exactly `262.86` where ours is `262.86168`.

Consequence for the mission's bar: `measure-composite-declared-size.ts`
compares at `EXACT_EPSILON = 5e-7` inches (3.6e-5 px), and these residuals
are 0.0008–0.003 px — 20× to 80× that. **The ink fix shrinks the error by
~99.7% but is not expected to move the `exact` count**, because the
quantization sits underneath it. The SVG-conformance band is 0.01 px
(`tests/oracle/svg-conformance/compare.ts:27-29`), so the same residual is
invisible there and the fix makes affected fixtures newly pin-eligible.

## Ruled out

Everything in `plans/transition-label-ink/evidence.md` §5 stays ruled out.
Added here:

- **`LimitFinder`'s other inset rules are not involved.** `drawRectangle`
  and `drawEllipse` inset the far edge by −1 (`:184-188`, `:211-215`), so
  they can only make ink *smaller* than the drawn shape;
  `drawUPolygon`'s `HACK_X_FOR_POLYGON = 10` (`:169-177`) is ±10, an order
  of magnitude off, and every arrowhead in this fixture sits ≥ 156px left
  of the extent. Neither can produce a +1.
- **`MinMax.getDimension()` is `maxX − minX`** (`klimt/geom/MinMax.java
  :151-153`), not `maxX` — so the extent is translation-invariant and the
  "ink = declared − 35" premise the whole mission rests on is confirmed,
  not assumed. The height arithmetic above closes it independently.
- **`DriverTextSvg`'s `trin`.** `DriverTextSvg.java:126-127` trims before
  measuring while `LimitFinder#drawText` does not, which *could* diverge
  on a label with trailing whitespace. Not this: the divergence here is
  exactly `2·marginLabel` on a label with no whitespace, and a space at
  13pt is 3.61px, not 1.
