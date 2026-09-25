# cdd2-T11 — single-qualifier residual (Q-1, Q-3)

## Observation: Q-3 is graphviz's integer HTML cell, not the declared width
- **Context**: `baneru-00-kuro607`'s non-Kal `class2` sat +0.495px in X.
- **Finding**: jar's corner for a shielded node is the `PORT="h"` cell polygon
  (`DotStringFactory.java:390-396`, first `points=` after the title). Graphviz
  sizes that cell from `strtol(WIDTH)` (`htmllex.c:374-382` -> `doInt` :203),
  so `WIDTH="72.995"` is 72pt, and centres the integer table on the node
  (`htmltable.c:1914-1917`). `shieldCorner` used `centre - 72.995/2` =
  7.5025 instead of 8; the diagram-wide origin shift then moved EVERY other
  node/edge +0.4975. Fixed in `graph-layout.ts#shieldCorner`.
- **Impact**: any HTML-table node whose corner this port derives from a
  declared fractional size can carry the same sub-pixel shift. `cornerSize`
  (portRows) already floors for the same reason.
- **Confidence**: High (real `dot -Tsvg` on the cached `svek-1.dot`: cell
  `8,-176..80,-128`; after the fix all nine fixtures lose every 0.49x diff).

## Observation: the width floors now re-measure, not stretch
- **Context**: Q-1, header not re-centred after `applyKalWidthFloor`.
- **Finding**: `widenMeasuredClassifier` re-runs `measureGenericClassifier`
  with `widthFloor` = the final width (WeakMap keyed by the returned object,
  because the floors receive only that object and mutate it in place).
  Upstream's `HeaderLayout#drawU` takes the final width
  (`EntityImageClass.java:182,238`).
- **Impact**: `applySameClassWidthFloor` is NOT inert — sameClassWidth is
  plumbed (`skinparam-key-handlers-table-a.ts:259-262`); the same re-measure
  closed `dorafa-63-soba922`.
- **Confidence**: High

## Observation: coxose's horizontal-Kal residual is graphviz-issue 19
- **Context**: coxose-20-nifu136 keeps 44 diffs on its `-r->`/`-l->` links.
- **Finding**: dot-engine clips the flat (`minlen=0`) `sh0006:h->sh0008:h`
  spline at the node bbox (x 280.73..304.28) where real graphviz clips at
  the h cell (253.42..331.29) — `docs/graphviz-issues/19-flat-edge-ignores-
  html-table-port.md`. Not in plantuml-ts.
- **Confidence**: High (dot-engine `getLayout` vs `dot -Tsvg`, same DOT)
