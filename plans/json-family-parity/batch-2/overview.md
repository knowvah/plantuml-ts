# Batch 2 — engine node + edge data in core (D1)

One task, the only sanctioned `src/core/` change of the mission. Additive:
every existing `DotLayoutResult` field stays deep-equal for every caller, so
the close runs the all-engine chain (stop 5) and the d.ts compare (stop 6).
json does not consume the field yet — json/yaml/hcl stay byte-identical too.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T2a](T2a-engine-node-data.md) | `engineNodes` / `engineEdges` under `read: 'exact'` | typescript-pro (sonnet, effort high), jfp-T2a | `src/core/graph-layout.ts`, `src/core/graph-layout-result.types.ts`, `tests/unit/core/graph-layout-engine-nodes.test.ts` | b1 close | [ ] |
| close | merge; gates `b2`; chain vs b0 (0 movers anywhere); D5 check (0 movers) | orchestrator | per close-procedure | T2a | [ ] |

## Interface (T2a → T3a)
```ts
// src/core/graph-layout-result.types.ts — on DotLayoutResult, present ONLY under read: 'exact'
engineNodes?: ReadonlyArray<{
  id: string;
  cx: number; cy: number;   // graphviz ND_coord: node CENTRE, native y-UP frame, no shift, no flip
  width: number; height: number;  // engine post-layout size in points (ND_width·72, ND_height·72), never our declared echo
}>;
engineEdges?: ReadonlyArray<{
  id: string;                       // same id as edges[]
  points: ReadonlyArray<{ x: number; y: number }>;  // spline control points, same native frame
  epX?: number; epY?: number;       // bezier.ep, same frame; absent when no arrow
}>;
```
