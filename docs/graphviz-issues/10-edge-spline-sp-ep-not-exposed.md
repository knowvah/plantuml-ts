# `EdgeGeometry` does not expose a spline's `sp` / `ep`

**Impact:** any consumer drawing its own arrowheads has to approximate the
point graphviz already computed. In plantuml-ts this affects every
`@startjson` / `@startyaml` / `@starthcl` edge — the arrowhead's DEPTH is
extrapolated rather than read.

**Finding (A5 ledger, mechanism M3):** graphviz's `bezier` struct carries
three things: the control-point list, `sp` (start point) and `ep` (end
point). `sp`/`ep` are the arrow attachment points, deliberately separate
from the control points, because when an edge has an arrowhead the spline is
shortened and the arrow spans the gap from the last control point to `ep`.

`dist/api/geometry.d.ts` exposes only the list:

```ts
export interface EdgeGeometry {
    tail: string;
    head: string;
    /** Bezier control points for the edge spline, in points. */
    points: { x: number; y: number }[];
    label?: { x: number; y: number };
}
```

PlantUML reads `ep` straight off the spline and hands it to its arrow
builder — `JsonCurve.java:78-82` stores it, `#drawCurve` ends with
`new Arrow(last, trueEp).drawArrow(...)`. With no `ep` available, this port
extrapolates from the spline's terminal direction by one arrow length
(`ARROW_LENGTH` 10 × upstream's `arrowsize` of `.75`) in
`src/diagrams/json/JsonCurve.ts#endPointOf`. The arrowhead's direction and
shape are then correct; only its depth is inferred.

**Requested:** `sp?: {x, y}` and `ep?: {x, y}` on `EdgeGeometry`, present
when the spline carries them. This is a pure export — the values already
exist in the model after routing; nothing needs recomputing.

## Related, and worth deciding together

`DotInputEdge` in plantuml-ts has no `arrowhead` / `arrowsize` field either,
so this port cannot currently tell the engine an arrow exists. Upstream sets
both on every json edge:

```java
agsafeset(zz, edge, new CString("arrowsize"), new CString(".75"), new CString(""));
agsafeset(zz, edge, new CString("arrowhead"), new CString("normal"), new CString(""));
```
`SmetanaForJson.java:221-223`

Until the engine is told, it neither reserves nor shortens for the arrowhead,
so the spline terminates where the jar's does not — and `ep`, once exposed,
would still describe an unshortened spline. **Exposing `sp`/`ep` is only half
the fix; honouring `arrowhead`/`arrowsize` is the other half.** Whoever picks
this up should confirm which of the two the engine already supports on input
before scoping the work.

## Repro

Any json-family fixture with a nested value, e.g.
`test-results/dot-cache/json/bavize-88-jumu158`. The jar draws

```xml
<path d="M124.57,40.08 L126.88,37 L124.57,33.92 L132.27,37 L124.57,40.08" fill="#000"/>
```

where `132.27` is `ep`. This port reconstructs a tip 7.5 points along the
spline's own final direction instead.
