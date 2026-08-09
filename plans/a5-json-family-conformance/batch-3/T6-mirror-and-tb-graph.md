# T6 — port `Mirror`, build the TB + swapped-dims graph

**Gated on T5 returning GO or PARTIAL.** On NO-GO this task does not run.

## Context

Upstream lays json out on graphviz's default TB with each node's width and
height swapped, then transposes every coordinate back. This port sets
`rankDir: 'LR'` instead. ADR-1 makes upstream's structure authoritative.

## Task

1. Port `Mirror` to `src/diagrams/json/Mirror.ts` — faithfully, including its
   out-of-range `System.err.println("BAD VALUE IN Mirror")` guard (as a
   documented no-op or a dev-only warning; do not silently drop the check, and
   do not throw where upstream prints).
2. Rewrite `layoutJson`'s graph construction: drop `rankDir: 'LR'`, set node
   `height` from the measured **width** and `width` from the measured
   **height**, exactly as `SmetanaForJson:236-244` does.
3. Transpose the layout result back through `Mirror` before it reaches the
   geometry the renderer consumes.

Keep the existing row/column measurement (`json-layout-prep.ts`) intact — this
task changes how the graph is *built and read back*, not how content is
measured.

## Read-set

- `plans/a5-json-family-conformance/adr1-gonogo.md` — T5's verdict and deltas.
- `~/.../jsondiagram/Mirror.java` — the whole file (37 lines of body).
- `~/.../jsondiagram/SmetanaForJson.java:233-262` — `createNode` and the swap.
- `src/diagrams/json/layout.ts:200-360`
- `src/core/graph-layout.types.ts` — `DotInputGraph` / `DotLayoutResult`.

## Write-set

- `src/diagrams/json/Mirror.ts` (create)
- `src/diagrams/json/layout.ts`
- `tests/unit/json/**` — tests for `Mirror` and the swapped-dims construction

## Architecture decisions (locked)

- **ADR-1:** TB + swapped dims + Mirror. Do not "simplify" back to `rankDir:
  'LR'` because it looks equivalent — if it were equivalent, T5 would have said
  so.
- **ADR-5:** the file is `Mirror.ts` and the class is `Mirror`, with
  `invAndXYSwitch` / `inv` / `invGit` keeping their upstream names. Do not
  rename to `transpose`/`flipCoordinates`.

## Interface contracts

```ts
// src/diagrams/json/Mirror.ts — mirrors Mirror.java
export class Mirror {
  constructor(max: number);
  inv(v: number): number;                    // max - v
  invAndXYSwitch(pt: XPoint2D): XPoint2D;    // x = inv(pt.y); y = pt.x
  invGit(pt: XPoint2D): XPoint2D;            // x = pt.x; y = inv(pt.y)
}
```

`layoutJson`'s exported `JsonGeometry` shape is **unchanged** — consumers
(`renderJson`, yaml, hcl) must not need editing for this task. If the shape has
to change, that is a finding: log it and stop rather than widening the write-set.

## Acceptance criteria

1. **Given** `Mirror(100)`, **when** `inv(30)` is called, **then** it returns 70;
   **and** `invAndXYSwitch({x: 10, y: 30})` returns `{x: 70, y: 10}`.
2. **Given** a json fixture, **when** laid out, **then** the graph handed to
   `layoutGraph` sets no `rankDir` and carries node `width`/`height` swapped
   relative to the measured box — asserted on the graph, not inferred from output.
3. **Given** the same fixture, **when** rendered, **then** its geometry is
   measurably closer to the jar golden than the Batch 2 baseline, by the metric
   T5 used.
4. **Given** yaml and hcl fixtures, **when** rendered, **then** they still
   render and are re-measured; report their delta explicitly.
5. **Given** `JsonGeometry` consumers, **when** the task ends, **then** none
   required editing.

## Observability requirements

N/A.

## Rollback

**Reversible.** New module plus a layout change; revert the commit. No data or
API migration — `JsonGeometry` is unchanged by contract.

## Quality bar

- Four gates green, exit codes captured directly.
- 90/90/90 coverage holds on the new module.
- Never ship a fitted constant. Every number traces to the Java or a
  jar-verified measurement, cited in a comment.
- Each ported symbol carries a JSDoc `@see` to its Java origin.

## Boundaries

- **Never:** modify `src/core/graph-layout.ts` (complexity-hook blocked; stop
  condition).
- **Never:** modify `src/diagrams/json/renderer.ts` — that is T8.
- **Never:** run `git commit` or any state-mutating git command.
