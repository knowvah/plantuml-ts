# T6a — deroxu: family census (item 28)

Prepend [../task-preamble.md](../task-preamble.md). Mission checkout, **read-only on `src/`**.

## Context
`unknown/deroxu-29-gude369` (719/1237 at plan time): a 313-line component diagram with `title`,
`legend top`, `skinparam dpi 60`, `componentStyle uml2`, `linetype polyline`,
`skinparam component { BackgroundColor<<V3>> …; Shadowing<<package>> true }`,
`skinparam <<Public>>/<<Protected>> { ArrowColor … }` and `hide stereotype`. Its layout is equal to
native (dsw). codd T4 ported scale/dpi. The first diffs show the jar drawing `title` first and then
`legend`, while we draw `legend` first; `<defs>` childCount 1 vs 0 (the shadow filter); and colours.
Because compareSvg aligns by position, one order defect cascades. Use segment comparison of element
geometry against the jar (memory "segment-compare-beats-align-counts"), not raw counts alone.

## Task
1. Render deroxu with `render-diff.mts`, and read both SVGs.
2. Classify **every** diff path into exactly one family. A family is one mechanism with its jar origin
   (`file:line`), not one attribute. Mark cascade families (diffs that vanish once an upstream family is
   fixed) as `cascadeOf: <family>`.
3. For each family, give an estimated write-set (files) and say whether it touches `src/core/**`.

## Write-set
`plans/graphviz-tracker-consume/measurements/deroxu-families.json`, `.agent-notes/gtc-T6a.md`. No `src/` edits.

## Interface contract (consumed by T6b+)
```json
[{ "family": "title-legend-order", "count": 0, "cascadeOf": null, "paths": ["svg/g[1]/g[1]/@class"],
   "javaRef": "…java:NN", "hypothesis": "…", "writeSet": ["src/…"], "touchesCore": false }]
```
Sorted by count descending, with the non-cascade families first.

## Acceptance
- Given deroxu's diffs, when classified, then every path belongs to exactly one family and the counts sum
  to the total.
- Given each non-cascade family, then it names a Java `file:line` and an estimated write-set.
- Given a family estimated to be large AND separable, then the report flags it for stop 8. It does not defer it.

**Observability:** N/A. **Rollback:** reversible (data only).
