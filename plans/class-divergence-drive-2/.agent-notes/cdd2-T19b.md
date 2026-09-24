# cdd2-T19b — cluster header stereotype + per-group legend

## Result

xenere-07-kuji864 8/212 -> 0/0 and sijoba-16-rari847 9/224 -> 0/0 (both
conformant). render-all vs b4: 601 -> 605 conformant, no count rose on any
fixture. class-dot-parity is green; the jar's `svek-1.dot` tables match
(xenere pack1 229x86, pack2 229x72; sijoba pack2 229x58).

## Observation: the first stop was a write-set gap, since widened
- **Context**: first pass, before any edit.
- **Finding**: the header's inputs reach neither the DOT sizing
  (`class-dot-clusters.ts:80` passed only strings) nor the render
  (`NamespaceGeo` had no field for them). Rule 5b' in
  `class-command-containers.ts` matched the stereotype with a
  non-capturing group, so it was dropped. The orchestrator widened the
  write-set (a T18 planning correction).
- **Impact**: a fix task whose mechanism is "a value is missing at draw
  time" needs the files that carry the value from parse to draw
  (ast -> dot clusters -> geo builders -> geo type -> scale), not just the
  files that draw it.
- **Confidence**: High

## Observation: ClusterHeader#getStereoBlock composition (Java-quoted)
- **Context**: porting `svek/ClusterHeader.java:173-220`.
- **Finding**:
  - The legend is the ORIGINAL block and the stereo text hangs off it:
    `DecorateEntityImage.add(null, legendBlock, stereo, hAlign, vAlign)`.
    The stereo goes below the legend unless the legend is `top`.
  - width = max(legend, stereo); height = legend + stereo.
  - Legend block = `buildAnnotationBlock('legend', ...)`: text + padding
    5 + border quirk 1 + margin 12.
  - `titleAndAttributeHeight` = `mergeTB(stereo, title)`. The oracle
    confirms it: pack1 91 = 63 + 14 + 14, and DOT HEIGHT = 91 - 5 = 86.
- **Impact**: the legend's 12px margin and +1 quirk are inside the DOT
  label size; a group legend grows the cluster by 25px beyond its rect.
- **Confidence**: High

## Observation: group legend routing
- **Context**: `AbstractClassOrObjectDiagram.java:353-363`.
- **Finding**: a legend command whose current group is not the root calls
  `currentGroup.setLegend` and never touches the diagram legend. The port
  reuses the shared annotation matcher, then moves the legend onto
  `Namespace.legend` and restores the diagram slot
  (`parser.ts#routeGroupLegend`). A root-level legend is unchanged.
- **Confidence**: High

## Observation: USymbol cluster title was LEFT-aligned; upstream is CENTER
- **Context**: xenere pack2's remaining diff was title `@x` (Δ100.8)
  once the header drew.
- **Finding**: `Cluster.java:370` passes
  `clusterHeader.getTitleHorizontalAlignment()`, which is `center` from
  `plantuml.skin:94-98`. `renderNamespaceUSymbol` passed LEFT, so
  `USymbolRectangle#asBig` used `posTitle = 3`. It now passes CENTER.
- **Impact**: closed three fixtures with a `<<Rectangle>>` or `rectangle`
  cluster. Isolated by reverting only this argument: domeki-03-zaga732 and
  mujopi-30-zadi566 went structural-match -> conformant, and
  sijisi-94-ripu606 numeric went 3 -> 2.
- **Confidence**: High

## Observation: the klimt draw path uses a comment-marker splice
- **Context**: USymbol clusters draw through klimt
  (`ClusterDecoration`); the header is a pre-built SVG string.
- **Finding**: `clusterHeaderStereoTextBlock`:
  - reports the header's dimensions, so every `asBig` positions title and
    stereo exactly as upstream;
  - at draw time records `ug.getTranslate()` and draws a `UComment`
    marker;
  - the marker is then replaced with the string body, shifted to that
    translate.

  Draw order matches the jar: outline, legend, stereo, title.
- **Confidence**: High

## Remainders (not modelled, no corpus fixture)
- Sprite stereotypes (`ClusterHeader.java:199-201`).
- User `skinparam legend*` / `<style> legend` on a GROUP legend: the
  layout sees only the `Theme`.
- `scale` combined with a header: `clusterHeaderStereo` is carried
  unscaled. A grep of every `scale` fixture found no container stereotype
  and no legend inside a group.
- `shiftFragmentBody` bakes offsets without re-rounding (e.g. `x=
  "372.30625"`). The root legend path already does the same; compareSvg
  tolerates it.

## Movers outside the list (all falls, no rises)
- giraca-14-xome136 7/188 -> 2/0: `package p2 <<stereo>>` now displays
  «stereo». The remaining 2 are the stereotype-scoped
  `packageBorderThickness<<stereo>>` skinparam, which predates this task.
- dojanu-92-vizo468 17/111 -> 12/2: «Dummy»/«Layout» now display on the
  non-empty clusters. What remains predates this task:
  - the `skinparam package<<Layout>>` colour cascade;
  - the collapsed-empty `p3 <<Dummy>>` leaf
    (`EntityImageEmptyPackage` path).
- domeki-03-zaga732, mujopi-30-zadi566 -> conformant; sijisi-94-ripu606
  numeric 3 -> 2: title alignment, see above.
