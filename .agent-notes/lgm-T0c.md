# lgm-T0c: jar-input vs dot-engine 1.6.1 differences, minimised

Experiment: every cached `svek-N.dot` (548 class, 251 component, 398 unknown, rest same) through `dot -Tsvg` 16.1.0 and `renderSvg`. Exact differing set (11): class nugecu, sokevu; component repoge, xenusu, zosuje; unknown bamami, bobixe, deroxu, pugodi, rufopi, xagonu. Real exit 1: zuduxu, rubebe.

## Issues filed
- 28 flat non-adjacent edge ignores splines=polyline/line: deroxu. Confidence MEDIUM (dotsplines.c make_flat_edge et test).
- 29 ortho self-loop lost: xagonu. LOW on cause (ortho.c addLoop).
- 30 adjacent flat pair with a port, port-less edge off ~0.2px: sokevu, repoge. LOW on cause (make_flat_adj_edges aux layout).
- 31 [~] zuduxu, rubebe: graphviz exits 1 after Pshortestpath failure but writes SVG; edges lost identically; not issue-27 class.
- 32 makeSimpleFlatLabels mirrored detour: zosuje, bamami, bobixe, pugodi, rufopi (mirror sums verified). MEDIUM-LOW (route.c strict-> split tie).
- 33 parallel labelled non-flat edges, bend position: xenusu. LOW.
- 34 HTML table border order (16.1.0 border first; 15.0 source and dot-engine last): rubebe order flip. MEDIUM.
- 35 narrow-label parallel edges 0.226px layout offset: found while minimising, no fixture isolates it. LOW.

## Merged into existing
- 23: nugecu-04-tona107 (already named there) confirmed same mechanism; appended an "Also seen in" paragraph and a TRACKER sub-line.

## Caveats
- ~/git/graphviz is 15.0.0-82 (2026-06-10); oracle dot is 16.1.0. C pointers are from 15.0.0-82; version skew is real (issue 34).
- Minimiser jumps mechanisms: bamami minimised alone to #35/#33-like cases; the fixture's own difference is the mirror (#32), checked by mirror sums on the original.
- Not instrumented: the route.c tie-break hypothesis (32/33/23) is unconfirmed.
- Real dot node-label text metrics differ from dot-engine for default labels; minimiser forced label="" to avoid false positives.
