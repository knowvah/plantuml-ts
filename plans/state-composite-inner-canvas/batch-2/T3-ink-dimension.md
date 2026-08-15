# T3 — the inner dimension is the ink extent plus `delta(15, 15)`

## Context

Same project context as `batch-1/T1-declared-size-harness.md`. Read it, plus
both prior-observation notes named there.

`state-composite-geo.ts:108-125#boundingBox` currently derives a composite's
inner size from a bounding box over its CHILD RECTS, padded by an
uncited `BOX_PAD = 12` on each side (`:47`). Upstream derives it from the
drawn content's ink:

```java
public XDimension2D calculateDimension(StringBounder stringBounder) {
    if (minMax == null) {
        minMax = TextBlockUtils.getMinMax(this, stringBounder, false);
        clusterManager.moveDelta(6 - minMax.getMinX(), 6 - minMax.getMinY());
    }
    return minMax.getDimension().delta(15, 15);
}
```
`svek/SvekResult.java#calculateDimension`

## Task

Replace the derivation with the ported one: take T2's `innerInkExtent`, and
return `extent + delta(15, 15)`. Delete `BOX_PAD` and the child-rect
bounding-box path it serves.

**The `moveDelta` line is T5's, not yours.** Port the dimension half only.
Note in a comment that the shift is deliberately deferred to Batch 3 and
name T5, so the half-ported method is legible to the next reader rather
than looking like an omission.

`delta(15, 15)` adds 15 to EACH axis in total (it is `XDimension2D#delta`,
not 15 per side) — verify that against the Java before relying on this
sentence, and cite what you find. Getting this wrong is a 15px error that
will look like a measurement problem.

If `boundingBox` has non-composite callers, they are NOT in scope: leave
them on the existing path and narrow the change to the composite
derivation. Report any such caller in the journal.

## The constants already exist and are already shared — IMPORT them

Both of this method's constants have a single owner as of `522873ef`:

```ts
import { INK_DELTA, JAR_INK_MARGIN } from '../../core/svek/SvekResult.js';
```
`src/core/svek/SvekResult.ts` — `INK_DELTA = 15`, `JAR_INK_MARGIN = 6`,
each cited to `SvekResult#calculateDimension`.

**Declaring either one locally is a stop condition** (decision D6). They
were previously declared four times across three engines and had already
produced a wrong cross-reference; this mission must not restore that.

Note the state engine ALREADY imports both, in
`state/layout-ink-extent.ts`, for the DOCUMENT-level ink walk. So the gap
this mission closes is narrower than "state lacks the constants": state has
them and applies them to the document, while the COMPOSITE path takes an
unrelated `BOX_PAD` route instead. Read `layout-ink-extent.ts`'s use of
them first — it is the in-repo model for the call you are about to write.

`HACK_X_FOR_POLYGON` is a different case and stays duplicated: `LimitFinder
.ts` keeps it private, so there is nothing to import. Do not "fix" that.

## Read-set

- `src/diagrams/class/class-ink-box.ts:20-40` — the precedent above.
- `src/diagrams/state/state-composite-geo.ts:39-125` — the derivation and
  `BOX_PAD`.
- `src/diagrams/state/state-composite-sizing.ts` — T2's `innerInkExtent`.
- `~/git/plantuml/.../svek/SvekResult.java` — `calculateDimension`.
- `~/git/plantuml/.../klimt/geom/XDimension2D.java` — what `delta` does.
  **Read it; do not assume.**
- `scripts/measure-composite-declared-size.ts` — T1's harness, your gate.

## Write-set

- `src/diagrams/state/state-composite-geo.ts` (modify)
- its co-located test

## Acceptance criteria

1. Given `bemena-23-zebu249`, when T1's harness runs after T4, then the
   `Configuring` composite's width `deltaPx` is **0.000**. (After T3 alone
   it may be worse — record the number, do not chase it.)
2. Given the state corpus, when the harness runs, then the `exact` count is
   no lower than the T1 baseline.
3. Given the source tree, when `BOX_PAD` is grepped, then it no longer
   exists in the composite path — the constant is retired, not renamed.
4. Given every constant introduced, when reviewed, then each carries an
   upstream `file:line` in a comment.
5. Given state DOT-parity, when re-run, then 268/268, unmoved.

## Quality bar

All four gates exit 0. 59 svg-state pins hold. Coverage 90/90/90 on new
code. **A broken pin is a stop condition, not something to re-baseline.**

## Boundaries

- **Always:** cite `file:line` for every constant; read `XDimension2D#delta`
  before using it.
- **Ask first:** touching `boundingBox`'s non-composite callers; any write
  outside the write-set.
- **Never:** run a git command. Never introduce a replacement constant
  without a citation — that is the exact defect being removed here.
