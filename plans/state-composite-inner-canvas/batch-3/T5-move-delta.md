# T5 — shift the inner content so its ink starts at 6

## Context

Same project context as `batch-1/T1-declared-size-harness.md`.

Batch 2 ported the dimension half of `SvekResult#calculateDimension`. This
is the other half, deliberately deferred (see the comment T3 left):

```java
minMax = TextBlockUtils.getMinMax(this, stringBounder, false);
clusterManager.moveDelta(6 - minMax.getMinX(), 6 - minMax.getMinY());
return minMax.getDimension().delta(15, 15);
```
`svek/SvekResult.java#calculateDimension`

The shift runs BEFORE the dimension is returned, and it moves the inner
content — not the composite box. Its effect is on where children sit
INSIDE the composite. Decision D2 puts it in this mission precisely because
a correctly-sized box full of wrongly-placed children is not a fix.

## Task

Port `moveDelta(6 - minX, 6 - minY)` using the `minX`/`minY` T2's
`innerInkExtent` already returns.

Two things to establish before writing, and to record in the journal:

1. **Which frame.** The shift is applied by `clusterManager` to the inner
   scope's content. Determine what the equivalent is in this port and apply
   it in that frame. Applying a correct number in the wrong frame is the
   most likely way this task fails, and it will look like an off-by-N.
2. **Whether it is already partly applied.** This port may already shift
   inner content somewhere for its own reasons. If it does, RECONCILE — do
   not stack a second shift on top. Two shifts that each look right in
   isolation will double.

Where `6` comes from: it is upstream's literal in this method. Cite it as
such. Do not rationalise it into a derived expression.

## Read-set

- `~/git/plantuml/.../svek/SvekResult.java` — `calculateDimension`.
- The `clusterManager.moveDelta` implementation it calls — follow it and
  read what it actually moves. **This is the task's central question; do
  not infer it from the call site's name.**
- `src/diagrams/state/state-composite-geo.ts` — where children get their
  positions inside a composite.
- `src/diagrams/state/state-composite-sizing.ts` — T2's extent, read-only.

## Write-set

- `src/diagrams/state/state-composite-geo.ts` (modify)
- its co-located test

## Acceptance criteria

1. Given a composite with inner content, when laid out, then the inner
   ink's min corner sits at (6, 6) in the composite's own frame.
2. Given `bemena-23-zebu249` / `pajefo-95-neri955` / `xepafa-33-lazi826`,
   when compared against jar, then the `Configuring` composite AND
   everything to its right are exact — the 0.261 offset is gone. That
   offset was half the 0.527, so it should fall out of Batch 2 plus this
   shift; if it does not, STOP and state the mechanism rather than adding
   a corrective offset.
3. Given the state corpus, when T1's harness runs, then no composite
   regressed against the Batch 2 numbers.
4. Given all 59 svg-state pins, when re-run, then every one holds.
5. Given the shift, when a test asserts it, then the test pins the FRAME
   (a child's absolute position), not merely that a function was called.

## Quality bar

All four gates exit 0. state DOT-parity 268/268. 59 pins hold.
Coverage 90/90/90.

## Boundaries

- **Always:** follow `moveDelta` into its implementation before porting it;
  reconcile with any existing shift rather than stacking.
- **Ask first:** any write outside the write-set.
- **Never:** run a git command. Never add a corrective offset to make a
  fixture land — if the number is off, the frame or the reconciliation is
  wrong, and that is a diagnosis to state, not a delta to absorb.
