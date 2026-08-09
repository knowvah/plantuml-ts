# T8 — port `JsonCurve`: edge routing on mirrored coordinates

**Depends on T7.** Last task in the batch.

## Context

T6 made the layout produce mirrored coordinates; T7 made edges leave from real
record ports. The renderer still draws edges the old way. Upstream draws them
through `JsonCurve`, which consumes the raw spline points and transposes each
one through `Mirror#invAndXYSwitch` as it builds the path
(`JsonCurve.java:96-120`).

## Task

Port `JsonCurve` to `src/diagrams/json/JsonCurve.ts` and route
`renderJson`'s edge drawing through it.

Two details from the Java that are easy to lose and are load-bearing:

- **Every** point is transposed, including Bézier control points — the path is
  built by transposing `points[i]`, `points[i+1]`, `points[i+2]` per curve
  segment, not by transposing endpoints and interpolating.
- `veryFirstLine` participates in the first segment (`supp(...)` at `:120`).
  Port it; do not drop it as unused until you have shown it is.

## Read-set

- `~/.../jsondiagram/JsonCurve.java` — the whole file
- `~/.../jsondiagram/Mirror.java#invAndXYSwitch`
- `~/.../jsondiagram/Arrow.java` — the arrowhead the curve terminates in
- `src/diagrams/json/renderer.ts` — current edge drawing
- `src/diagrams/json/Mirror.ts` — T6's port
- `src/core/spline-clip.ts` — **read its doc comment before touching spline
  math.** It documents why an upstream algorithm's odd granularity can be
  load-bearing: `DotPath#simulateCompound` finds a crossing with 8 fixed
  subdivisions, and a more precise bisection FAILS the ±0.01pt bar because the
  jar computes that exact 1/256-granular point. Assume the same risk here.

## Write-set

- `src/diagrams/json/JsonCurve.ts` (create)
- `src/diagrams/json/renderer.ts`
- `tests/unit/json/**`

## Architecture decisions (locked)

- **ADR-2:** for json, Smetana IS the target. A residual spline gap must be
  diagnosed, not excused by the svek family's "modern graphviz" note — that
  reasoning does not apply here.
- **ADR-5:** `JsonCurve`, and its methods keep upstream's names.

## Interface contracts

```ts
// src/diagrams/json/JsonCurve.ts — mirrors JsonCurve.java
export class JsonCurve {
  constructor(points: readonly XPoint2D[], xMirror: Mirror, veryFirstLine: number);
  /** SVG path `d` for the transposed spline. */
  toPath(): string;
}
```

`renderJson` consumes it in place of the current edge path construction, and
stops reading the `tailportY` field T7 removed.

## Acceptance criteria

1. **Given** a spline whose points are known, **when** `JsonCurve` builds the
   path, **then** every emitted coordinate equals
   `Mirror#invAndXYSwitch` of its input — control points included, asserted
   point-by-point.
2. **Given** a multi-segment spline, **then** the path is built in
   three-point curve groups matching `JsonCurve.java:99-101`, not by
   endpoint interpolation.
3. **Given** the corpus, **when** re-measured, **then** edge-path (`path@d`)
   diffs are reduced against the Batch 2 baseline; report the delta.
4. **Given** any fixture reaching zero diffs, **then** it is pinned into
   `oracle/goldens/svg-json/ratchet.json` with its golden.
5. **Given** yaml and hcl, **then** both re-measured and pinned where zero-diff.
6. **Given** the other five ratchets, **then** none regresses.

## Observability requirements

N/A.

## Rollback

**Reversible.** New module plus renderer change; revert the commit. Pinned
goldens revert with it.

## Quality bar

- Four gates green, exit codes captured directly — **never pipe a gate.**
- 90/90/90 coverage holds on the new module.
- Every ported method carries a JSDoc `@see` to its Java origin.
- If a spline is off by a hair, check granularity before precision: the jar's
  own subdivision count may be the answer, as it was for `simulateCompound`.

## Boundaries

- **Always:** report the geometry delta numerically, per type.
- **Never:** widen `TOLERANCES` in `tests/oracle/svg-conformance/compare.ts` to
  close a gap. That is a silent conformance change and a stop condition.
- **Never:** run `git commit` or any state-mutating git command.
