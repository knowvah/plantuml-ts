## Observation: json-family node origin already matches the jar's Mirror
- **Context**: jfp B1, probing the M1 (size echo) + M2 (min-shift vs `Mirror(max)`) port on all 92 cached json/yaml/hcl rows.
- **Finding**: the probe changed no byte anywhere. The root is alone in rank 0, so graphviz's bb height equals the jar's `max` (`SmetanaForJson.java:97-102`) and `shiftToOrigin`'s min is 0; the engine returns the record's rank extent as declared + 1 (`record_init` Kluge), so `ROUND_TRIP_EPSILON`'s echo never fires on it.
- **Impact**: the min-shift/no-Mirror frame in `json/layout.ts#mirrorToDiagramSpace` is output-equivalent to upstream on today's corpus; porting `getPosition`/`Mirror` literally is structure, not bytes.
- **Confidence**: High (three independent probes)

## Observation: Smetana's record_init rounds sizes; modern graphviz does not
- **Context**: jfp B1, rank-axis residue on every multi-node json-family row.
- **Finding**: Smetana `shapes__c.java:1807-1808` `sz = POINTS(ND_width)` (ROUND) and no field PAD (`:1636-1644`); graphviz `shapes.c:3688-3689` uses `INCH2PS` (unrounded, commit `aee7eda7d`, 8.0.4). A model with ROUND(W)+1 reproduces every jar node x to 0.0000. Two more version deltas: `bezier_clip` side (`splines.c:136-142`, `b03040389`, 7.0.0) and arrow length 7.5 vs penwidth-aware ≈9 (`arrows.c:1190-1227`, `cfb1cc1a3`, 7.0.0).
- **Impact**: sub-pixel json/yaml/hcl residue is graphviz-version arithmetic; real `dot` 16.1.0 equals dot-engine on the same input.
- **Confidence**: High

## Observation: `scale` in the json family scales inputs, upstream scales at emit
- **Context**: jfp T1c, yaml/nuzaje-74-kenu009 (pathMax 133.6).
- **Finding**: `scale-geo.ts#scaleEdge` scales `points` but never `ep`; `VERY_FIRST_LINE` and `CELL_MARGIN_X` are added after scaling; upstream lays out at 1x and scales in `SvgGraphics` (`:468-475`). `scale-geo.ts`'s header claim that the structural gate catches every unscaled numeric is false — positional values bypass that gate.
- **Impact**: any `scale` row in the json family is off by more than layout; fix belongs in `src/diagrams/json/`.
- **Confidence**: High (ep verified by reading; sites 1-3 probed by T1c)

## Observation: dot-engine re-render of the same graph object is not idempotent
- **Context**: jfp T1a/T1c instrumentation (independently).
- **Finding**: `digraph{a->b}` rendered twice on one graph object: first render `a 27,90 / b 27,18` (= real dot), second `a 27,18 / b 99,18` with the first pass's edge route. `layoutGraph` renders once, so no production row is affected.
- **Impact**: any harness that calls `render()` twice on one builder graph measures garbage on the second call. Not filed in docs/graphviz-issues/ (no real-dot counterpart established for an in-process second render); needs a dedicated check before filing.
- **Confidence**: Medium (reproduced by two agents; not checked by the orchestrator)
