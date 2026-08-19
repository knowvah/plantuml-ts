# `getLayout()` exposes no edge `xlabel` position

**Impact:** every `skinparam linetype ortho` / `polyline` state transition
label in `plantuml-ts` is placed by a homegrown geometric heuristic instead of
graphviz's real external-label force-search — because the engine computes the
placement, **draws** it, and then does not publish it. `render()` emits the
`<text>` at the searched position; `getLayout()` reports the edge with no
label field at all, so the consumer has nothing to read.

This is the same shape as **issue 13** (`getLayout()` exposed no
`tailLabel`/`headLabel` positions), which landed in 1.3.0 and let this repo
delete an SVG-scraping workaround outright, and **issue 06** (cluster geometry)
before it. As with both, the layout work is already done and correct — only the
snapshot surface is missing the field.

## Finding

`EdgeGeometry` (`dist/api/geometry.d.ts`, 1.5.0) carries exactly:

```ts
export interface EdgeGeometry {
    tail: string;
    head: string;
    points: { x: number; y: number }[];
    sp?: { x: number; y: number };
    ep?: { x: number; y: number };
    label?: { x: number; y: number };
    tailLabel?: { x: number; y: number };
    headLabel?: { x: number; y: number };
}
```

There is no `xlabel`. The internals are all present and working:

- `src/label/xlabels.ts` is a full port of `lib/label/xlabels.c` (the Hilbert-
  ordered force-placement search), alongside `xlabels-geom.ts` and
  `xlabels-intersect.ts`.
- `applyXLabel` / `initEdgeXLabel` read `e.attrs.get("xlabel")` and populate
  `e.info.xlabel`.
- `addXLabels` runs the search, and the SVG device emits the result — the
  edge-label slot order is documented in `dist/gvc/edge-labels.d.ts` as
  "label, xlabel, head, tail".

`snapshotEdge` (`dist/api.js`) reads `edge.info.label`, `edge.info.tail_label`
and `edge.info.head_label`, and assigns `geom.label`, `geom.tailLabel`,
`geom.headLabel`. It never reads `edge.info.xlabel`, and no `geom.xlabel`
assignment exists anywhere in the file.

## Repro

Verified live against `@knowvah/dot-engine@1.5.0` as installed. Two edges,
identical but for the attribute name:

```js
import { createGraph, getLayout, render } from '@knowvah/dot-engine';

function probe(attrs) {
  const b = createGraph({ directed: true });
  b.addNode('a', { shape: 'box', width: '1', height: '1', fixedsize: 'true', label: '' });
  b.addNode('b', { shape: 'box', width: '1', height: '1', fixedsize: 'true', label: '' });
  b.addEdge('a', 'b', attrs);
  const svg = render(b.graph, 'svg', { engine: 'dot' });
  const snap = getLayout(b.graph, { yAxis: 'down' });
  return { keys: Object.keys(snap.edges[0]), label: snap.edges[0].label, svg };
}

probe({ label:  'X' });   // control
probe({ xlabel: 'X' });   // subject
```

Observed:

| edge attrs | snapshot edge keys | `label` | `render()` `<text>` |
|---|---|---|---|
| `label="X"` | tail, head, points, **label**, ep | `{x: 41.055…, y: 98.4}` | `x="41.06" y="-94.2"` |
| `xlabel="X"` | tail, head, points, ep | `undefined` | `x="30.94" y="-94.15"` |

Two things this pins down:

1. The xlabel **is** placed — `render()` emits it — so the value exists at
   snapshot time and is not being computed on demand by the device.
2. It is placed by a **different algorithm** than the centre label: x
   `30.94` vs `41.06` on an otherwise identical graph. A consumer cannot
   approximate it from `label`, from the spline midpoint, or from any
   offset of either.

## What the consumer is forced to do today

`plantuml-ts` moves a transition label to `xlabel` under `linetype ortho`,
mirroring upstream PlantUML's own fork at
`svek/SvekEdge.java:433-437` (`state-dot-graph.ts#moveLabelToXlabel` sets
`xlabel`/`xlabelWidth`/`xlabelHeight` and deletes `label`). Because the
snapshot then reports no position, `state-transition-label.ts`'s
`edgeResult?.labelX !== undefined` gate fails and every such label falls
through to `perpendicularOffsetLabel(points)` — a spline-midpoint plus a fixed
perpendicular offset, with no relation to the force-search.

The cost is measurable, not theoretical. Fixture `pavuzo-79-zodu430`'s
composite declares **−2.460 px** narrower than the jar's on scope 2
(`1.954201in` vs `1.988368in`): the jar's real graphviz places that edge's
`xlp` at `27,75.558`, ours anchors the label somewhere else, and the
composite's ink box under-measures by the difference. The DOT-parity gate
cannot catch it — our emitted DOT text carries `xlabel=` correctly and
compares EQUAL to the jar's; the divergence is entirely on the layout-consumption
side.

## Requested API

```ts
export interface EdgeGeometry {
    // …existing fields…
    /** External (xlabel) position, if placed. @see lib/common/types.h:ED_xlabel */
    xlabel?: { x: number; y: number };
}
```

Populated in `snapshotEdge` from `edge.info.xlabel`, with the same `yAxis`
handling as the other label fields and the same absent-when-not-present
semantics. Gate it on the same "actually placed" signal `tailLabel`/`headLabel`
already use (`placedLabelPos`'s `->set` test) rather than on the attribute
merely being declared — an xlabel the search could not fit should read as
absent, not as a label at the origin.

No new options and no behaviour change: this publishes a value the layout has
already produced and is already drawing.

## Verification when it lands

In `plantuml-ts`:

1. Add an `a?.xlabel !== undefined` branch to `addEdges`
   (`src/core/graph-layout-build-edges.ts`), mirroring the existing `label`
   branch and its `labelBoxWidth`/`labelBoxHeight` fixed-size-table variant.
2. Map `ge.xlabel` → `labelX`/`labelY` in `toEdgeEntry`
   (`src/core/graph-layout.ts`), so `attachInlineTransitionLabel`'s existing
   gate starts passing for ortho edges.
3. Confirm `pavuzo-79-zodu430` scope 2 width goes exact (−2.460 px → 0), via
   `npx jiti scripts/measure-composite-declared-size.ts pavuzo-79-zodu430`.
4. Re-run the full declared-size harness and `render-manifest`: every
   `linetype ortho`/`polyline` composite with an inline transition label will
   move its label draw position, so the moves need an allow-list and a
   jar-side account, not a blind re-pin.

Until then the `xlabel`/`xlabelWidth`/`xlabelHeight` fields on
`DotInputEdge.attributes` (`src/core/graph-layout.types.ts`) are declared but
dead on the layout path — note that the doc comment there explicitly promises
`tailLabel`/`headLabel` reach the real layout call and says nothing about
`xlabel`, which is the asymmetry that exposed this.
