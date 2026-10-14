# T9 report

## Commits / files
- 9afa18c55 fix(description): port label width2 is the widest line
  - src/diagrams/description/layout-helpers-shape-endpoint.ts (portLabelWidth2 -> buildTextBlock + MeasurerStringBounder, trunc of widest line)
  - tests/unit/description/port-label-multiline.test.ts (new)
- 9dd626bd5 fix(description): emit inverted on -left-/-up- link edges
  - src/diagrams/description/ast.ts (DescriptiveLink.inverted?: true)
  - src/diagrams/description/command-table-links.ts (persist ParsedLink.inverted)
  - src/diagrams/description/layout-dot-tree.ts (DotInputEdge.inverted)
  - src/core/graph-layout.types.ts (doc comment only)
  - tests/unit/description/link-inverted-node-order.test.ts (new)

## layoutParity (survey layoutEqual, same computeLayoutEqual/layoutParity)
- unknown/deroxu-29-gude369: equal=false (clusterTree bb) -> equal=true
- component/texacu-57-daci050: false -> true (inverted links, mech B)
- usecase/depabo-06-kato214: false -> true; verdict structural-match -> conformant (mech B)
- unknown/kuduba-74-taki821: false -> true (`-up- ()`, mech B)
- unknown/tireno-34-buta139: false -> true (`C -left0)- D`, mech B)

## render-diff structural/numeric (before -> after)
- unknown/deroxu-29-gude369: 878/2508 -> 743/2505 (pass=false)
- usecase/depabo-06-kato214: 0/84 -> 0/0 (pass=true)

## Survey vs b3-eng (component, usecase, c4, unknown)
- Conformant losses: 0. Gains: depabo-06-kato214 (usecase) structural-match -> conformant; usecase conformant 29->30.
- dotEqual movers: none. verdict movers: only depabo. layoutEqual movers: exactly the 5 above (all false->true), no true->false.
- Totals now: component 69/70/127; usecase 30/17/46 (+1 oracle-error, as before); c4 2/0/9; unknown 423/48/354.

## Residuals
- deroxu render still diverges (layout equal): jar svg 2359x1345 vs ours 3769x2147; 2359 ~= 3757*0.625+11, in.puml has `skinparam dpi 60`, so ours looks unscaled (render path, not layout). Also title "EME Component Model" appears not drawn as first group (ours g[1] class=legend, jar title) and legend/cluster order shifts. Mechanisms NOT verified in Java; not investigated (outside write-set/layout).
- T8 residual untouched: core emitter prints zaent anchor before child cluster inside a port cluster (svek-dot-emit-clusters.ts); layout-neutral.
- State has the same A defect (state-leaf-node.ts:61-64), not touched.
- Port font styles: portLabelWidth2 maps FontSpec weight/style to BOLD/ITALIC only; draw path uses textFont(theme,'port'). No fixture exercises bold port fonts.

## Write-set extensions
- None beyond approved set (graph-layout.types.ts doc comment only).

## Tests
- New: 4 tests in 2 files, both red first (76/128 vs 29/61; [] inverted / sh0006 sh0007 sh0008).
- Targeted full run: `vitest run tests/oracle tests/architecture tests/unit/description tests/unit/class tests/unit/state` -> 434 files collected, 434 passed, 14563 tests passed (1 skipped, 3 todo). Includes description.golden (88 pins), layout-parity (464), description diff-baseline, description-parity, class/object/state oracle ratchets: all green, no re-pins.
- typecheck, eslint, prettier clean. No new src module, no catalog change.
