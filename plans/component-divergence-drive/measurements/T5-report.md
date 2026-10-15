# T5 report -- kermor group-note drawing
Commit cba667bd4 (codd/T5, base 9e2744253). Not pushed.

## Files
src/diagrams/description/{renderer-cluster.ts (NotedCluster subclass), renderer-cluster-note.ts (NEW), renderer-note.ts (buildNoteBlock extracted, pure move), layout.ts, layout-cluster-boxes.ts (kermorNotesByAstId, withKermorNotes), layout-helpers.ts (shiftGeo moves notes), layout-helpers-types.ts (KermorNoteGeo/KermorNotesGeo, DescriptionNodeGeo.kermorNotes)}; src/core/{graph-layout-build-kermor.ts, graph-layout-build.ts}; docs/catalog.md; tests/unit/description/codd-t5-kermor-group-note.test.ts (NEW, 6 tests), tests/unit/core/graph-layout-build-kermor.test.ts (id assertion updated).
Write-set extensions: layout-helpers.ts, layout-helpers-types.ts (geo field + shiftGeo), src/core/graph-layout-build-kermor.ts + graph-layout-build.ts (CORE, ADDITIVE: alpha/beta label boxes published as result.clusters ids `<id>#kermor-note-top|bottom`; graph-layout-build.ts net 0 lines, still 500). Needed because the note position exists only in the engine's alpha/beta subgraph label; mapClusters skipped every name not in ClusterIndex.idByName. No change to graph-layout.ts.

## render-diff structural/numeric
| fixture | before | after |
|---|---|---|
| fojamu-08-veku866 | 1/46 | 0/0 (conformant) |
| zubujo-87-xaxa087 | 1/4 | 0/0 (conformant) |
| siseda-71-napu395 | 1/136 | 0/1 residual |
layoutParity: layoutEqual true, dotEqual true for all three (survey after).
D8: native `/opt/homebrew/bin/dot -Tdot` on svek-1.dot: fojamu cluster6alpha lp=(162.8,239) y-up = our alpha label (162.8,43) y-down (bb height 282); zubujo beta lp=(170.8,43); dot-engine not to blame.

## Diagnosis artifact
- Mechanism: the port never drew Cluster.drawU's KERMOR branch (Cluster.ts header listed it as unported); the layout also published no alpha/beta label position.
- Origin (Java): Cluster.java:302-307 (draw), :278-284 (setters), :393-399 getCucaNote, DotStringFactory.java:438-440 (continue when title table empty), :454/:460 (SvekUtils.getMinXY of the table polygon), EntityImageNoteLink.java:61-76, ComponentRoseNote.java:81-133, AbstractComponent.java:121-123 (UTranslate(paddingX=5,paddingY=5), Rose.java:65-66). Port: renderer-cluster.ts (NotedCluster), renderer-cluster-note.ts, layout-cluster-boxes.ts, graph-layout-build-kermor.ts#registerKermorClusterIds.
- Chain: fojamu jar draws note polygon at table-min (1,1)+5 = (6,6), width (int)(251.712+6+15)=272, height (int)(26+5+5)=36; text at +6,+5 (x=12, baseline 21.111); polygon+fold both stroke-width 0.5 (ComponentRoseNote strokes both); no entity group (EntityImageNoteLink has no startGroup). Ink of the note moves the canvas (293x246) and the cluster (10,67) via placeBody.
- Ruled out: EntityImageNote/renderer-note drawNote (would give group + 1px fold + 6,5 margins); dot-engine (native dot identical); the table not being (1,1) (probe: alpha label centre 162.8,43 w282 h46 -> min 21.8,20; gamma 30.8,86 vs jar 10,67: shift (20.8,19) -> (1,1)).

## Surveys (before = base, after = this commit; `svg:survey -- <tree> --out`)
- component conformant 125 -> 127, structural-match 52 -> 53, diverged 89 -> 86. Movers: fojamu, zubujo diverged -> conformant; siseda diverged -> structural-match (maxDelta 132 -> 92). 
- usecase 38/19/36 unchanged (+1 oracle-error); unknown 450/40/335 unchanged. Zero conformant losses; no per-row maxDelta change outside the 3 movers.
- Non-kermor group note: test pins it still renders as an entity-grouped note leaf (no `M6,6 L6,42 L278,42`).

## Residuals
- siseda `rectangle "internals" {}` cluster title x: jar 227.031 (centred in 243px rect), ours 135 (left). Mechanism: ClusterHeader title alignment is style-based (USymbolRectangle.java:126-131 CENTER); renderer-cluster.ts#buildHeader hardcodes LEFT (T2 residual, T7 owns). Not touched.
- Group-note `#color`/`<<stereo>>`: parse-state.ts (attachNoteToEntity) stores only text in kermorNotes; Cluster.getCucaNote passes note.getColors() (Cluster.java:398). Notes drawn with default paints; needs parse-state.ts/ast.ts (outside write-set). No corpus fixture uses it.
- LEFT/RIGHT group notes and second notes at one position: not drawn, matching Cluster.java (reads get(0) of TOP/BOTTOM only).
- layout-dot-tree.ts is 623 lines (pre-existing); untouched.

## Tests
- Targeted: `vitest run tests/oracle tests/unit/description tests/architecture` = 118 files, 10377 passed/1 skipped. Wider: tests/unit/description + tests/unit/core + architecture + description conformance/parity/layout-parity/wrapper-parity = 453 files collected, 9215 passed, 1 failed (graph-layout-build-kermor.test.ts id expectation, fixed + re-run green).
- typecheck, eslint, prettier clean; catalog regenerated.
