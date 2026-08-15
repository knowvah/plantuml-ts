# T2 — make a composite's inner DRAWN content measurable as ink

## Context

Same project context as T1 (read its Context section). This task is the
plumbing Batch 2 needs, landed separately so that a dimension change and a
reachability change never share a commit.

Jar measures a composite's inner content with a `LimitFinder` walk over the
DRAWN result, not over the layout boxes:

```java
minMax = TextBlockUtils.getMinMax(this, stringBounder, false);
```
`svek/SvekResult.java#calculateDimension`

`LimitFinder`, `UGraphicNo`, `MinMax`/`MinMaxMutable` and
`TextBlockUtils.getMinMax` are ALREADY PORTED — mission G0,
`src/core/klimt/drawing/LimitFinder.ts` and neighbours. **Do not re-port
them.** Check `.claude/catalog.md` before writing anything: agents in this
repo routinely rebuild what already exists.

## Task

Expose, for one composite, the ink extent of its inner drawn content, using
the existing `LimitFinder` machinery. Nothing consumes it yet — the value is
computed and returned/exported, and no existing dimension changes.

The hard part is reachability, not arithmetic: the ink walk needs the inner
content in a DRAWABLE form at sizing time. Establish whether the state
composite pipeline already has that, and if it does not, report exactly what
is missing and STOP rather than approximating with boxes. "Approximate it
with the child rects" is the defect this mission exists to remove.

## Read-set

- `src/core/klimt/drawing/LimitFinder.ts` and `UGraphicNo.ts` — the ported
  walk and its `UGraphic` sink.
- `src/diagrams/state/state-composite-sizing.ts` — where composite sizing
  formulas live today; its header cites `InnerStateAutonom`.
- `src/diagrams/state/state-composite-geo.ts:47,108-125` — `BOX_PAD` and
  `boundingBox`, the derivation Batch 2 replaces. Read it; do not edit it
  in this task.
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java`
  — `calculateDimension`, the method being ported.
- `.claude/catalog.md` — check what already exists first.

## Write-set

- `src/diagrams/state/state-composite-sizing.ts` (modify)
- its co-located test

`state-composite-geo.ts` is **T3's** write-set — do not touch it here.

## Interface contract (consumed by T3)

```ts
/** The ink extent of a composite's inner drawn content, in px, in the
 *  inner layout's own frame. `undefined` when the composite has no
 *  drawable inner content (an empty composite). */
export function innerInkExtent(/* … */): { minX: number; minY: number; width: number; height: number } | undefined;
```

`minX`/`minY` are required, not decorative: Batch 3's
`moveDelta(6 - minX, 6 - minY)` consumes them. Returning only `width`/
`height` would half-land the port and force T5 to re-derive them.

## Acceptance criteria

1. Given a composite with inner content, when `innerInkExtent` is called,
   then it returns a finite extent derived from a `LimitFinder` walk — not
   from child rect min/max.
2. Given an empty composite, when it is called, then it returns `undefined`
   rather than a zero-size box or a throw.
3. Given the whole test suite, when this task lands, then **no rendered
   output changes at all** — nothing consumes the new function yet.
4. Given a composite whose inner ink is inset from its child boxes, when the
   extent is compared against `boundingBox`'s value, then the two DIFFER —
   proving the walk measures ink, not boxes. Assert on that difference in
   the test; if they are always identical, the walk is not doing what it
   claims and that is a finding to report.

## Quality bar

All four gates exit 0. State DOT-parity 268/268. All 59 svg-state pins
hold. Coverage thresholds (90/90/90) apply to the new code.

## Boundaries

- **Always:** cite `file:line` for every ported constant; reuse G0's
  `LimitFinder` rather than writing a second walk.
- **Ask first:** any write outside the declared write-set; any change that
  moves rendered output in this task.
- **Never:** run a git command. Never approximate the ink walk with a box
  bounding box — stop and report instead.
