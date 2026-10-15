# T2 report (branch codd/T2, base 10f43063a)

## Commits (one per mechanism)
- d7808bd25 fix(description): draw containers at the engine cluster rect (M1)
- 137f35249 fix(description): run the port frontier under kermor too (M6)
- 8ae582e4d fix(description): put set-separator phantom groups in the geo tree (M4)
- eb87da5ce fix(core): resolve skinparam packagestyle to the cluster symbol (M2)
- 2d7601f6f fix(description): draw no edge label the engine gave no position (R1, cuxelu)

## Files
M1: layout-dot-tree.ts, layout.ts, layout-helpers.ts (computeContainerBbox deleted), layout-helpers-types.ts (CONTAINER_PADDING/TOP_PAD deleted), NEW layout-cluster-boxes.ts (clusterBoxesByAstId + pure move of buildPortClusterInfoByAstId/clusterRectsByAstId out of layout.ts, which was at the 500-line cap); tests cluster-box-engine-rect.test.ts.
M6: layout-cluster-boxes.ts (kermor early return + param removed), layout.ts; kermor-port-frontier.test.ts.
M4: layout.ts (buildGeoAndEdges builds from buildNamespaceGroups(ast.nodes, sep)); phantom-group-geo-tree.test.ts.
M2 core: theme.ts (PackageStyleSetting; Theme + ThemePartial), skinparam-accumulator.ts, skinparam-key-handlers-table-a.ts, decoration/symbol/usymbol-resolve.ts (resolvePackageStyle, resolveSymbol 'package'). Description: NEW layout-package-style.ts (applyPackageStyle), layout.ts (layoutDescription entry), renderer-cluster.ts (defaultPackageStyle = resolvePackageStyle(theme)). Tests: tests/unit/core/skinparam-packagestyle-codd-t2.test.ts, description/layout-package-style.test.ts, description/package-style-jar.test.ts + 12 jar fixtures tests/fixtures/description-packagestyle/.
R1: layout-geo-post.ts; edge-label-no-position.test.ts + tests/fixtures/description-edge-label/.
docs/catalog.md regenerated.

## render-diff structural/numeric, before -> after
bamami 0/88 -> 0/9 (group box 145x81 = jar cluster6 16,16.07,161,97.07; residual x D3, caption y 5.9 = T4)
bobixe 0/88 -> 0/9; pugodi 0/88 -> 0/9; rufopi 5/91 -> 5/13
zosuje 20/180 -> 20/180 (count same; values moved toward jar: height 408->427 of 462, path x D29->D10; residual Margin 10 20 30 40 = T4, plus colour S rows)
juvose 58/294 -> 0/0 (conformant)
cemutu 2/190 -> 0/1 (rect)
rigoge 0/769 -> 0/3; zaraze 1/769 -> 1/3 (verbatim width)
fidati/kofovu 236/2800 -> 239/249; tojitu 236/2516 -> 239/242 (3036->488 old-instrument equivalent; see M4b)
fojamu 2/22 -> 2/20; siseda 20/168 -> 20/95; zubujo 2/15 -> 2/4 (frontier; residual = kermor TOP note, T5)
xenusu 7/8 -> 7/8 (control unchanged)
cuxelu 2/0 -> 0/0
layoutParity: layout-parity ratchet (469) green; the changes are draw-side only.

## Diagnosis artifacts
M1. Mechanism: non-port container drawn at padded union of child boxes (16/28 fitted constants) instead of the engine cluster rect. Origin port: layout-dot-tree.ts buildGeoNode (portInfo===undefined -> computeContainerBbox); Java DotStringFactory.java:432-441, Cluster.java:511-512, ClusterDecoration.java:78,89-90. Chain: jar draws cluster<N> bb (bamami 145x81) -> ours 145x62 -> path/rect/edge-clip (simulateCompound) and ink-shift origin all move. Width/height carried verbatim (USymbolCloud.java:75 seed). Ruled out: dot-engine (D8 native==DE identical on bamami, zosuje, juvose, fidati, fojamu, run this session), wrapper level, titles (#14 untouched; package titles still folder UTranslate(4,2), engine cluster.label never read). ELK path: structural tree has no engine boxes; PortClusterCtx.clusterBoxByAstId is optional and absent there (placeholder zero box, positions come from the maker) -- the ELK adapter file is outside my write-set; recommend it pass an explicit map or stay as is.
M6. Mechanism: buildPortClusterInfoByAstId returned {} under kermor; Cluster.drawU runs manageEntryExitPoint whenever entityPositionsExceptNormal()>0 (Cluster.java:344-345, :410-430), nothing kermor-specific. Chain: no PortClusterInfo -> engine rect kept (fojamu 186x172) vs frontier 186x146. Ruled out: engine (identical), anchor (kermor only skips the anchor node).
M4. Mechanism: layout classified buildNamespaceGroups(ast.nodes) but buildGeoAndEdges built from ungrouped ast.nodes; Java CucaDiagram.java:325-336,464. Chain: DOT had 5 clusters, renderer saw 0. Fix recomputes the pure function. Residual M4b NOT fixed (T3, renderer-uid.ts): jar numbers phantom groups ent0121-0125 (last), ours ent0001..; remaining 239 structural rows are id/order shifts.
M2. Mechanism: packagestyle never reached the group USymbol; Java CommandPackageWithUSymbol.java:194, USymbols.java:103-104, SkinParam.java:820-826, PackageStyle.java:50-92, ClusterHeader.java:88-93,155-163, Cluster.java:357-376. Port: skinparam-key-handlers-table-a.ts (rect only), accumulator/theme 'rect' type, usymbol-resolve.ts, renderer-cluster.ts:194 packageStyle null/FOLDER. Design: Theme.packageStyle widened to PackageStyleSetting ('rect' retained for RECTANGLE so the class engine reads exactly what it did; unknown value stays a no-op as before). Resolution is at the layout entry (applyPackageStyle), not in the parser, because the parser has no theme; this is where componentStyle already takes effect (ordering caveat: a skinparam after the package declaration would still apply; no corpus fixture does that). Styles with null toUSymbol keep the 'package' keyword (sname package_, supplements 0/0) and resolveSymbol returns null; Cluster draws nothing; verified against the jar: no cluster group emitted, identical svg (agent/storage/component1/component2/artifact). All of folder, node, frame, cloud, database, card, agent, storage, component1/2, artifact match the jar exactly in the new fixtures. Ruled out: stereotype <<Node>> (symbol wins), dot-engine.
R1. Mechanism: edge to a portout gets no label position from graphviz; SvekEdge.java:742-746, :951-954 draw nothing; edgeLabelGeo fell back to spline midpoint. ELK path does not use layout-geo-post.ts.

## D8
TRACKER entries consulted: #14 (titles, kept), #32/#35 (bamami, engine identical), #11/#15 untouched. Native dot -Tdot vs DE: IDENTICAL for bamami, zosuje, juvose, fidati, fojamu.

## Census (component, new instrument)
Sigma 21193 -> 4828; zero-diff 85 -> 115; no row rose. 1-3: 23->39 ... (final after: 115 zero / 39 one-to-three).
Surveys (before -> after conformant/structural/diverged): component 86/72/108 -> 116/53/97; usecase 31/18/44 -> 32/19/42; unknown 433/49/343 -> 449/37/339; c4 2/0/9 unchanged; class 723/0/0 unchanged; object 63/8/9 unchanged; state 78/11/184 unchanged. Zero conformant losses. Movers: component 30 -> conformant (8 diverged, 22 structural-match), 3 diverged->structural-match; usecase 1 sm->conformant, 2 diverged->sm; unknown 16 -> conformant, 2 diverged->sm. All explained by M1 box/ink-shift, M2 (cemutu, juvose), R1 (cuxelu).

## Guards (all green)
class/object/state golden ratchets, class/object/state dot-parity, wrapper-parity, layout-parity ratchet (469), description golden ratchet, description diff-baseline ratchet, description-parity ratchet.
Tests: tests/unit + tests/architecture + the guard set above = 1188 files collected, 23168 tests; only the 4 known npm-pack packaging tests fail (sprite-package-files, stdlib-package-files x2, stdlib-packages). Targeted description run earlier: 42 files / 1501 tests green.

## Residuals
- M4b phantom group uid/order (renderer-uid.ts, T3): fidati/kofovu/tojitu 239/249.
- Cluster title alignment: ClusterHeader.getTitleHorizontalAlignment is style-based (CENTER for rectangle/packagestyle rect: USymbolRectangle.java:126-131), renderer-cluster.ts buildHeader hardcodes LEFT. Jar x=39.819, ours 10 for a plain `rectangle` group as well as packagestyle rect (T7). Pinned only for box in package-style-jar.test.ts.
- kermor TOP note (T5), Margin (T4), perapa/banatu port-cluster x (unexplained, not touched).
- Empty `package {}` leaf (EntityImageEmptyPackage uses packageStyle) is not restyled; only non-empty groups. Phantom groups keep sname package even for non-null styles where Java has a null symbol -> same sname; drawn symbol follows the style via resolveSymbol (not exercised by any fixture).
- ELK adapter packageStyle() still returns FOLDER (description-elk-adapter.ts, outside write-set).
- Null-symbol clusters log Cluster.drawU console.error once per walk (mirrors Java printStackTrace; noisy).
- Notes for .agent-notes (orchestrator): resolveSymbol is description-only; layout.ts was at the 500-line cap so helpers moved to layout-cluster-boxes.ts.
