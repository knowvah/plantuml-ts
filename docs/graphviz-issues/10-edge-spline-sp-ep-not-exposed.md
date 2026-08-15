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


## Verification attempt on dot-engine 1.4.0 (2026-08-13) — not applicable yet

This issue asks for `sp`/`ep` to be EXPOSED on the spline API. Nothing in
`plantuml-ts` consumes them yet, so no fixture can move whether or not 1.4.0
publishes them. Checking this box needs a consumer first: the arrowhead
approximation this issue describes has to be switched over to the real
endpoints, and then the affected fixtures re-measured.

## CONSUMED 2026-08-15 on dot-engine 1.5.0 — and two things above are wrong

`ep` is now read on the json family: `DotInputEdge.attributes.arrowhead`/
`arrowtail`/`arrowsize` carry the attrs to the engine, `DotLayoutResult
.edges[].epX`/`epY` republish `bezier.ep`, and `json/JsonCurve.ts
#buildArrowHeadPath` draws the head to it. `ARROW_LENGTH` and `endPointOf` —
the extrapolation this issue existed to retire — are deleted.

**`sp` was deliberately NOT plumbed.** Upstream's only consumer stores it and
never reads it: `JsonCurve.java:55,73-76` assign `sp`, and nothing else in the
class touches it (`#drawCurve` uses `ep` alone). Publishing a field no
faithful consumer can justify would be speculative, so the port stops at `ep`.

### Correction 1 — the attribute list is THREE, not two

The "Related" section above quotes two `agsafeset` calls. `#createEdge` makes
**three** arrow calls, in this order, before the `tailport`:

```java
agsafeset(zz, edge, new CString("arrowsize"), new CString(".75"), ...);
agsafeset(zz, edge, new CString("arrowtail"), new CString("none"), ...);
agsafeset(zz, edge, new CString("arrowhead"), new CString("normal"), ...);
```
`SmetanaForJson.java:221-223`. `arrowtail=none` is missing from the quote
above; it is set here too, for faithfulness (a `dir=forward` edge draws no
tail arrow either way).

### Correction 2 — "until the engine is told, `ep` describes an unshortened spline" is FALSE

The premise was that `ep` would be useless until `arrowhead` was honoured on
input. It is not: **graphviz's default `arrowhead` is already `normal`**, so
`eflag` is set and `ep` is reported whether or not we declare anything.
Measured directly on a two-node probe — `ep` identical (67.179) with and
without the attrs; what moved was the spline's terminal control point,
55.903 → 58.222, because `arrowsize=.75` shortens by 7.5 where the default
1.0 shortens by 10. So declaring the attrs is about matching upstream's
shortening, not about unlocking `ep`.

### Measured effect, and an honest note on the jar delta

On this issue's own repro (`json/bavize-88-jumu158`) the arrow tip moves
135.04 → **139.01**, against jar's 132.27. That is FURTHER from the jar's
number and still correct, because the two are measured from different node
positions:

| | head node left edge | arrow tip | tip lands on the node? |
|---|---|---|---|
| jar | 132 | 132.27 | yes |
| before | 138.983 | 135.04 | **no — 3.9px short** |
| after | 138.983 | 139.01 | yes |

Both jar and this port now attach the arrow to their OWN node boundary, which
is the mechanism `Arrow(last, trueEp)` implements. The residual ~6.7px is the
node sitting where dot-engine put it rather than where Smetana did — the
accepted geometry delta of the 2026-08-09 one-engine ruling, not a defect.
The old number only looked closer because two errors partly cancelled: a
short arrow drawn on an over-shifted node. Per that ruling the delta is
recorded here and NOT chased.

json/yaml/hcl census is unmoved (20 zero-diff of 92, buckets identical): the
census counts differing attributes, and these edges already differed in
value, so a more accurate number lands in the same bucket.
