# T4 — layer `InnerStateAutonom`'s margins over the inner dimension

## Context

Same project context as `batch-1/T1-declared-size-harness.md`.

T3 landed the inner dimension (ink + `delta(15, 15)`). Upstream then wraps
that inner image in the composite's own title/attribute chrome before the
composite is declared as a node in the outer scope:

```java
public XDimension2D calculateDimensionSlow(StringBounder stringBounder) {
    final XDimension2D img = im.calculateDimension(stringBounder);
    final XDimension2D text = name.calculateDimension(stringBounder);
    final XDimension2D attr = attribute.calculateDimension(stringBounder);

    final XDimension2D dim = text.mergeTB(attr, img);
    final double marginForFields = attr.getHeight() > 0 ? IEntityImage.MARGIN : 0;

    final XDimension2D result = dim.delta(IEntityImage.MARGIN * 2 + 2 * IEntityImage.MARGIN_LINE + marginForFields);

    return result;
}
```
`svek/InnerStateAutonom.java#calculateDimensionSlow`

`MARGIN` and `MARGIN_LINE` are both 5 (`IEntityImage`), so the delta is 20,
or 25 when the composite carries attributes. `im` is T3's value.

Note `mergeTB` — a top-to-bottom merge of three blocks, which takes the MAX
width and the SUM of heights. Read `XDimension2D#mergeTB` and confirm that
before relying on it; the width/height asymmetry is exactly the kind of
thing that produces a correct-looking width and a wrong height.

## Task

Port `calculateDimensionSlow` over T3's inner value. The existing state
sizing code already models parts of this (its header cites
`InnerStateAutonom` and the `MARGIN*2+2*MARGIN_LINE+marginForFields` delta)
— **reconcile with what is there rather than adding a parallel formula.**
If the existing code already implements this correctly, say so and change
nothing but the wiring; a task that turns out to be a no-op is a fine
outcome, recorded in the journal.

## Read-set

- `src/diagrams/state/state-composite-sizing.ts` — the whole file; its
  header already cites this Java method.
- `src/diagrams/state/state-composite-geo.ts` — T3's output (read-only
  here; it is T3's write-set).
- `~/git/plantuml/.../svek/InnerStateAutonom.java` — `calculateDimensionSlow`
  and `calculateDimension`.
- `~/git/plantuml/.../klimt/geom/XDimension2D.java` — `mergeTB` and `delta`.
- `~/git/plantuml/.../svek/image/EntityImageState.java` — for how the same
  MARGIN constants are used on the flat (non-composite) state, so the two
  do not drift.

## Write-set

- `src/diagrams/state/state-composite-sizing.ts` (modify)
- its co-located test

## Acceptance criteria

1. Given the three named fixtures, when T1's harness runs, then each
   `Configuring` composite reports width `deltaPx` **0.000**.
2. Given the state corpus, when the harness runs, then `exact` is strictly
   greater than the T1 baseline, and no composite that was exact before is
   mismatched now.
3. Given a composite WITH attributes and one WITHOUT, when sized, then the
   delta is 25 and 20 respectively — the `marginForFields` branch is
   exercised by a test, not merely present.
4. Given the height axis, when the harness runs, then heights are reported
   and no worse than baseline. The evidence names a WIDTH delta; a height
   regression hiding behind a width fix is the failure mode here.
5. Given state DOT-parity, when re-run, then 268/268, unmoved.

## Quality bar

All four gates exit 0. 59 svg-state pins hold. Coverage 90/90/90.

## Boundaries

- **Always:** reconcile with the existing formula rather than duplicating
  it; read `mergeTB` before using it.
- **Ask first:** any write outside the write-set; any change to the flat
  (non-composite) state sizing.
- **Never:** run a git command. Never re-baseline a pin to fit the formula.
