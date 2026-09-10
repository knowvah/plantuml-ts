# T1 — `ArrowsRegular` as the shared arrowhead

**Agent:** `typescript-pro` · **Depends on:** —

## Context

Faithful TypeScript port of PlantUML; the Java is the spec — read the
method body. Read [`../README.md`](../README.md) and
[`../decisions.md#d3`](../decisions.md) (locked). `ArrowsRegular`
(`activitydiagram3/ftile/ArrowsRegular.java:42-79`): `delta1 = 10`,
`delta2 = 4`; `asToDown` is `(-4,-10), (0,0), (4,-10), (0,-6)` relative to
the tip; `asToUp`, `asToRight`, `asToLeft` are the rotations written out
there. It is the default (`skin/SkinParam.java:1308-1309`; `ArrowsTriangle`
only under a style — FILE it, do not port). `Worm#drawInternalOneColor`
(`ftile/Worm.java:154-168`) draws the decoration at the last point through
`UStroke.simple()` in the arrow colour, filled and stroked. Our
`renderer.ts#arrowTip` (`:35-63`) draws a 3-point triangle 8 long and ±3.2
from the last segment's direction; `Direction.fromVector` picks the
decoration by the dominant axis of the last segment.

## Read-set

- `src/diagrams/activity/renderer.ts:35-63` (`arrowTip`), `:157-200`
  (`renderEdge`, the mid-arrow at `:198`)
- Java: `ArrowsRegular.java` (whole), `ftile/Arrows.java` (the abstract
  base), `klimt/geom/Direction.java#fromVector`, `Worm.java:154-168`
- `tests/unit/activity/renderer.test.ts` (arrowhead pins)

## Write-set

See the batch table. `docs/catalog.md` only on drift.

## Task

Tests first. `arrows-regular.ts` exports `arrowDirection(dx, dy)` (the
`Direction.fromVector` rule, cited), `arrowHeadPoints(dir)` (the four
points relative to the tip, cited per method), and `arrowHeadExtents(dir)`
(`{minX, maxX, minY, maxY}` relative to the tip — what `SlotFinder#
drawPolygon` reads as `getMinX()/getMaxX()`). `renderer.ts` draws the
polygon from `arrowHeadPoints` translated to the tip, fill and stroke in the
arrow colour, `stroke-width 1` (as today). Run the probe; journal the
polygon-family movement per fixture class; any OTHER family rising gets its
own instrumented row.

## Interface contract (consumed by T3)

```ts
type ArrowDir = 'up' | 'down' | 'left' | 'right';
function arrowDirection(dx: number, dy: number): ArrowDir;
function arrowHeadPoints(dir: ArrowDir): ReadonlyArray<{ x: number; y: number }>;
function arrowHeadExtents(dir: ArrowDir): { minX: number; maxX: number; minY: number; maxY: number };
```

## Acceptance criteria

- Given a downward segment, when the tip is drawn, then the polygon is
  `(-4,-10), (0,0), (4,-10), (0,-6)` translated to the tip
- Given `bixefi-77-moki051`, then its arrowheads match the jar's `points`
  byte for byte where the tip already matches
- Given the probe, then `polygon[]/@points` falls; every other riser is journaled

## Observability / Rollback

N/A / **Reversible.**

## Quality bar

All four gates green except the expected red in the activity oracle
equality/ratchet gates (list each with counts).

## Commit

`fix(akc-T1): draw activity arrowheads as ArrowsRegular does`
