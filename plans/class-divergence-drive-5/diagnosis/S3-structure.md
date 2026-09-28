# S3 (structure) diagnosis — cdd5 T8

Oracle: `test-results/dot-cache/<tree>/<slug>/in.svg` (1.2026.8beta1 recapture).
Ours: `npx jiti plans/class-divergence-drive/tools/render-diff.mts <tree>/<slug>`
(outputs land in `plans/class-divergence-drive/measurements/out/`, not the cdd5 tree).
Java paths are relative to `~/git/plantuml/src/main/java/net/sourceforge/plantuml/`
unless they start with `net/atmp/`. Port paths are relative to the repo root.

| family | rows | Java file:line | port file:line | size | write-set |
|---|---|---|---|---|---|
| entity-visibility-icon-dropped | 7 (Class-visibility-0..5, topave) | `svek/image/EntityImageClassHeader.java:109-121`; `svek/ClusterHeader.java:130-139`; `classdiagram/command/CommandCreateClass.java:172-206`; `command/CommandPackage.java:189-192` | `src/diagrams/class/class-declaration-parser.ts:83,156-157`; `src/diagrams/class/class-command-containers.ts:68-73` | M | `class-declaration-parser.ts`, `class-command-containers.ts`, `class-classifier-ast.ts`/`ast.ts` (field), `class-layout-header-geo.ts`, class header renderer, `class-cluster-header.ts` (reuse `class-visibility-icon.ts`) |
| skinparam-gradient-flattened | 2 (bisefo, kacecu) | `klimt/color/HColorSet.java:107-116`; `klimt/drawing/svg/DriverPathSvg.java:71-72` | `src/core/skinparam-key-handlers-table-a.ts:50-53`; `src/core/skinparam-key-handlers-table-b.ts:170-174`; `src/core/skinparam-key-normalize.ts:64-68` | M | `skinparam-key-handlers-table-a.ts`, `skinparam-key-handlers-table-b.ts`, `skinparam-accumulator.ts`, `theme-graph-colors-a.ts`, `class-empty-package.ts`, class cluster fill + edge stroke emitters |
| desc-leaf-classbox-fallback (= S2 `descriptive-usymbol-render-allowlist`) | 2 (vugime, tefeco) | `svek/GeneralImageBuilder.java:160-167` | `src/diagrams/class/renderer-usymbol-entity.ts:235-249` | S | `renderer-usymbol-entity.ts` |
| desc-label-embed-unported (= S2 `embedded-diagram-in-description-unsupported`) | 3 (kelefe, komuvi, rojida) | `EmbeddedDiagram.java:125-151,169-175` | `src/core/svek/image/EntityImageDescriptionDelegates.ts:121-131,299` | M | `EntityImageDescriptionDelegates.ts`, `EntityImageDescriptionName.ts:55-77` (same stub) |
| embedded-engine-unported | 2 (semutu mindmap, lubicu salt) | `EmbeddedDiagram.java:197-213` (nested `@startmindmap`/`@startsalt` system) | `src/index.ts:108-121` (no mindmap/salt plugin); `src/diagrams/class/class-nested-diagram-renderer.ts:110-112` | L | new `src/diagrams/mindmap/`, `src/diagrams/salt/` engines (+ registry line) |
| free-note-alias-not-quark-qualified (sibling of S2 `note-target-not-namespace-qualified`) | 4 (pojeje, rexupa, tamovu, ticemi) | `command/note/CommandFactoryNote.java:192-197` | `src/diagrams/class/class-notes.ts:280` | S | `class-notes.ts` (+ reuse `class-namespace-resolve.ts#resolveReference`) |
| remove-group-not-cascaded | 2 (jititi, xamive) | `abel/Entity.java:443-455`; `net/atmp/CucaDiagram.java:784-797` | `src/diagrams/class/class-directives-removal.ts:365-378` | S | `class-directives-removal.ts` |
| freestanding-note-opale-group-endpoint | 1 (cikifu) | `svek/GraphvizImageBuilder.java:245-251` | `src/diagrams/class/note-freestanding.ts:127-137` (gate in `findUniqueTouching` `:79-94`) | S | `note-freestanding.ts` (+ caller passes group ids) |
| separator-none-namespace-parent | 1 (cilibi) | `net/atmp/CucaDiagram.java:252-256` | `src/diagrams/class/class-container.ts:136-150` | S | `class-container.ts` |
| json-duplicate-no-execution-error | 1 (kokofa) | `objectdiagram/command/CommandCreateJson.java:141-142,202-203` | `src/diagrams/class/class-json-commands.ts:58` | S | `class-json-commands.ts` |
| class-business-usecase-dropped | 1 (xisora) | `classdiagram/command/CommandCreateElementFull2.java:236-237`; `abel/Entity.java:412-413` | `src/diagrams/class/class-declaration-parser.ts:141` | S | `class-declaration-parser.ts`, `class-layout-leaf-shapes.ts:65`, `renderer-usymbol-entity.ts:100` |
| class-circle-decor-unmapped | 1 (zefefo) | `decoration/LinkDecor.java:90`; `decoration/LinkType.java:275-307` | `src/diagrams/class/class-arrow-decor-map.ts:59-82` (no `'0'` key); `src/diagrams/class/class-arrow-grammar.ts:224-227,244` | S | `class-arrow-decor-map.ts` |
| addmethod-space-lenient | 1 (zolaza) | `classdiagram/command/CommandAddMethod.java:63-68` | `src/diagrams/class/class-command-relationships.ts:81` | S | `class-command-relationships.ts` |
| cluster-header-sprite-stereotype | 1 (dilese) | `svek/ClusterHeader.java:199-201` | `src/diagrams/class/class-cluster-header.ts:30-34` (documented "Not modelled") | M | `class-cluster-header.ts` (+ header height in namespace layout) |
| empty-package-leaf-url-dropped | 1 (rukate) | `svek/image/EntityImageEmptyPackage.java:102,148-149,168-169` | `src/diagrams/class/renderer-empty-package-leaf.ts:25-51` | S | `renderer-empty-package-leaf.ts` |
| generic-space-before-angle | 1 (nepevi) | `classdiagram/command/CommandCreateClassMultilines.java:106-107` | `src/diagrams/class/class-declaration-extractors.ts:398` | S | `class-declaration-extractors.ts` |
| tim-guessfunctions-pair-order | 1 (xuloxo, routing) | `tim/expression/TokenStack.java:161-185` (+ `:125-127`) | `src/core/tim/expression/TokenStack.ts:172,182` | S | `src/core/tim/expression/TokenStack.ts` |
| accept-candidate:upstream-crash | 1 (rubebe) | `dot/Neighborhood.java:151` (NPE, `pt4` null) | n/a | — | — |

Unknown rows: 0.

## Pre-settled (ACCEPTED in fixtures.md; not diagnosed)

- class/bixogo-47-xulu385 — embedded {{ }} payload bytes (D9)
- class/cadutu-02-lazu601 — ELK layout
- class/cirojo-62-dubo306 — ELK layout
- class/gokoru-18-daba136 — ELK layout
- class/lagudi-03-rucu383 — ELK layout
- class/roxosu-00-pini153 — embedded {{ }} payload bytes (D9)
- class/rutefe-49-xeju709 — ELK layout
- class/tegefa-14-koxo759 — ELK layout
- class/temofi-63-vega763 — ELK layout

## Per-fixture

### unknown/Class-visibility-0 — entity-visibility-icon-dropped
- first diff: `svg/g[1]/g[1][childCount]`, ours=6 jar=7 (missing `<g data-visibility-modifier="PUBLIC_METHOD"><ellipse …/>`; rect width 41.363 vs 52.363, Δ11 = icon + 4px margin)
- Java: `svek/image/EntityImageClassHeader.java:109-121` — "final VisibilityModifier modifier = entity.getVisibilityModifier(); … final TextBlock uBlock = TextBlockUtils.withMargin(modifier.getUBlock(getSkinParam().classAttributeIconSize(), fore, back, false), 0, 0, 4, 0); name = TextBlockUtils.mergeLR(uBlock, name, VerticalAlignment.CENTER);"; set at `classdiagram/command/CommandCreateClass.java:175,206` — "visibilityModifier = VisibilityModifier.getVisibilityModifier(visibilityString + \"FOO\", false); … entity.setVisibilityModifier(visibilityModifier);"
- port: `src/diagrams/class/class-declaration-parser.ts:156-157` — "group 1 = VISIBILITY_PREFIX's capture (discarded, see its own doc comment)"
- mechanism: the parser matches the leading `+` but throws it away, so the classifier AST has no visibility field (instrumented: AST keys = `id,display,kind,typeParams,members,creationIndex,styleGeneration`). The header never gets the icon block, and the name block is 11px narrower.
- confidence: HIGH (instrumented)

### unknown/Class-visibility-1 — entity-visibility-icon-dropped
- first diff: `svg/g[1]/g[1][childCount]`, ours=6 jar=7 (same Δ11 set as -0)
- Java: as Class-visibility-0 (`+ class A {\n}` — `CommandCreateClassMultilines.java:222,256`)
- port: as Class-visibility-0
- mechanism: same as -0. This row reaches it through the multi-line opener.
- confidence: HIGH (instrumented on -0; identical diff set)

### unknown/Class-visibility-2 — entity-visibility-icon-dropped
- first diff: `svg/g[1]/g[1][childCount]`, ours=6 jar=7
- Java: as -0 (`+class A {}`)
- port: as -0
- mechanism: same as -0.
- confidence: HIGH (identical diff set)

### unknown/Class-visibility-3 — entity-visibility-icon-dropped
- first diff: `svg/g[1]/g[1][childCount]`, ours=6 jar=7
- Java: as -0 (`+ class A {}`)
- port: as -0
- mechanism: same as -0.
- confidence: HIGH (identical diff set)

### unknown/Class-visibility-4 — entity-visibility-icon-dropped
- first diff: `svg/g[1]/g[1][childCount]`, ours=6 jar=7
- Java: as -0 (`+class A`, single-line `CommandCreateClass`)
- port: as -0
- mechanism: same as -0.
- confidence: HIGH (identical diff set)

### unknown/Class-visibility-5 — entity-visibility-icon-dropped
- first diff: `svg/g[1]/g[1][childCount]`, ours=6 jar=7
- Java: as -0 (`+ class A`)
- port: as -0
- mechanism: same as -0.
- confidence: HIGH (identical diff set)

### unknown/topave-65-ceso890 — entity-visibility-icon-dropped
- first diff: `svg/g[1]/g[1][childCount]`, ours=3 jar=4 (cluster `foo` is missing `<g data-visibility-modifier="PRIVATE_METHOD">`; classes alice/Bob g[3]/g[4] are also each missing their icon, 7 vs 6)
- Java: `svek/ClusterHeader.java:130-139` — "final VisibilityModifier modifier = g.getVisibilityModifier(); if (modifier != null) { … result = TextBlockUtils.mergeLR(uBlock, result, VerticalAlignment.CENTER); }"; set at `command/CommandPackage.java:189-192` — "p.setVisibilityModifier(visibilityModifier);"
- port: `src/diagrams/class/class-command-containers.ts:68-73` — "optional leading VISIBILITY char (`CommandPackage.java:74` …) … [no] field consumes a package's visibility marker either"
- mechanism: `- package foo {` and `+ package Dummy {` lose their marker just as `- class alice` does. The package command and the class declaration parser both discard the VISIBILITY capture, so neither ClusterHeader's icon nor EntityImageClassHeader's icon is drawn.
- confidence: HIGH (instrumented on Class-visibility-0; code read for package)

### unknown/bisefo-56-dumu120 — skinparam-gradient-flattened
- first diff: `svg/defs[1][childCount]`, ours=0 jar=1; `svg/g[1]/g[3]/path[1]/@stroke` ours=`Red|Green` jar=`url(#ghwwyxnv1hwzc0)`
- Java: `klimt/color/HColorSet.java:111-114` — "if (c == '-' || c == '\\\\' || c == '|' || c == '/') { … return HColors.gradient(HColors.simple(col0), HColors.simple(col1), c);"; `klimt/drawing/svg/DriverPathSvg.java:71-72` — "DriverRectangleSvg.applyFillColor(svg, mapper, param); DriverRectangleSvg.applyStrokeColor(svg, mapper, param);"
- port: `src/core/skinparam-key-handlers-table-a.ts:50-52` — "['arrowcolor', 'defaultarrowcolor'], (acc, _v, color) => { acc.arrow = color;"
- mechanism: the `arrowcolor` handler stores the flattened `color` argument (`resolveColor`), not the `paint` argument (`resolveColorPaint`). `resolveColor`'s regex only splits on `-`, so `Red|Green` passes through as raw text (instrumented: `resolveColor('Red|Green') = 'Red|Green'`) and lands verbatim in `stroke=`, and no gradient def is emitted.
- confidence: HIGH (instrumented)

### unknown/kacecu-90-pudi895 — skinparam-gradient-flattened
- first diff: `svg/defs[1][childCount]`, ours=0 jar=1; `svg/g[1]/path[1]/@fill` ours=`#008000` jar=`url(#gtkolbun1ahr00)`
- Java: `klimt/color/HColorSet.java:111-114` (as bisefo); `klimt/drawing/svg/DriverRectangleSvg.java:83-85` — "if (background instanceof HColorLinearGradient) { … final String id = svg.createSvgGradient(gr, mapper);"
- port: `src/core/skinparam-key-handlers-table-b.ts:170-173` — "['packagebackgroundcolor'], (acc, _v, color) => { acc.packageBackground = color;"; `src/core/skinparam-key-normalize.ts:66-67` — "const m = /^(.+)-([a-zA-Z]+|#[0-9A-Fa-f]{3,8})$/.exec(value); return m ? (m[2] ?? value) : value;"
- mechanism: `packagebackgroundcolor` also stores `resolveColor`'s flattened string, which keeps only the SECOND stop (`red-green` → `green` → `#008000`). `acc.packageBackground` is typed `string`, so it cannot carry the Paint gradient. Instrumented: flat `skinparam packageBackgroundColor red-green` paints both cluster and empty-package leaf `#008000`, while an inline `#red-green` on a class correctly emits the gradient.
- confidence: HIGH (instrumented)

### unknown/vugime-87-zabe159 — desc-leaf-classbox-fallback
- first diff: `svg/defs[1][childCount]`, ours=0 jar=3; `svg/g[1]/g[1]/path[1]/@d` ours=class "C" glyph jar=file-corner outline; ours draws the raw `<back:…>` creole as one `<text>`
- Java: `svek/GeneralImageBuilder.java:160-167` — "if (leaf.getLeafType() == LeafType.DESCRIPTION) { … } else { return new EntityImageDescription(leaf, portionShower, links, bibliotekon); }"
- port: `src/diagrams/class/renderer-usymbol-entity.ts:235-249` — "return ( classifier.kind === 'descriptive' && (classifier.usymbol === 'actor' || … 'component' || … 'database' || … 'node' || … 'rectangle' || … 'package') );"
- mechanism: `file f [ … ]` parses correctly (instrumented AST/geo: `kind:'descriptive', usymbol:'file'`, width 216.96 = jar). The render-dispatch allowlist has no `file`, so the leaf falls through to the class-box renderer. That renderer draws the C badge and dumps the display unparsed, with no creole, so the `<back:>` filter defs are never emitted. Upstream sends every DESCRIPTION leaf to EntityImageDescription.
- confidence: HIGH (instrumented)

### unknown/tefeco-12-rato895 — desc-leaf-classbox-fallback
- first diff: `svg/g[1]/g[3][childCount]`, ours=4 jar=1 (ours `<!--class label-->` box + C badge + raw text; jar a lone `<image>` in `<g class="entity">`)
- Java: `svek/GeneralImageBuilder.java:160-167` (as vugime); `decoration/symbol/USymbolLabel` draws no frame
- port: `src/diagrams/class/renderer-usymbol-entity.ts:235-249` (no `'label'`)
- mechanism: `label label [ {{…}} ]` is a DESCRIPTION leaf with USymbol `label`, which is not on the allowlist, so it is drawn as a class box. Secondary: its `{{ }}` embed goes through the description sizer's throwing stub (`EntityImageDescriptionDelegates.ts:121`, family desc-label-embed-unported; stderr shows one `calculateDimensionSlow: renderer failed`). Once the allowlist is fixed, that family's fix is also needed before the `<image>` draws.
- confidence: HIGH (instrumented: stderr + render)

### unknown/kelefe-72-cefi192 — desc-label-embed-unported
- first diff: `svg/g[1]/g[1][childCount]`, ours=4 jar=7 (three `<image … data:image/svg+xml>` missing; geometry identical, numeric=0)
- Java: `EmbeddedDiagram.java:169-175` — "if (isSvg) { final String imageSvg = getImageSvg(…); final UImageSvg svg = new UImageSvg(imageSvg, 1); ug.draw(svg); return; }"
- port: `src/core/svek/image/EntityImageDescriptionDelegates.ts:121-128` — "throw new Error('EntityImageDescriptionDelegates: embedded diagrams ({{ ... }}) inside a description label are not supported -- …')" (installed at `:299` "const renderer = blockedEmbeddedRenderer();")
- mechanism: the description-text ISkinSimple hands EmbeddedDiagram a renderer that always throws. `drawU` catches it and draws nothing (instrumented: 3× "EmbeddedDiagram.drawU: renderer failed"). The registered nested renderer (`nested-diagram-registry.ts#getNestedDiagramRenderer`, already used by `annotations/blocks-creole.ts:404`) is never consulted. Box sizes still match because the jar's own `calculateDimensionSlow` also lands on its `new XDimension2D(42, 42)` catch fallback in the oracle env (`EmbeddedDiagram.java:137-150`: the SVG branch is gated on `stringBounder.matchesProperty("SVG")`; jar image y-steps are 42px while the drawn images are 51×54). The fix must wire only the draw path and keep the 42×42 sizing.
- confidence: HIGH (instrumented)

### unknown/komuvi-52-vave599 — desc-label-embed-unported
- first diff: `svg/g[1]/g[1][childCount]`, ours=9 jar=12 (three `<image>` missing)
- Java: as kelefe
- port: as kelefe
- mechanism: same as kelefe (instrumented: 3× drawU renderer failed).
- confidence: HIGH (instrumented)

### unknown/rojida-14-fuli428 — desc-label-embed-unported
- first diff: `svg/g[1]/g[1][childCount]`, ours=3 jar=4 (and g[2..4]; one `<image>` per `package X [ {{ … }} ]` leaf)
- Java: as kelefe
- port: as kelefe
- mechanism: same as kelefe (instrumented: 4× drawU renderer failed). `package` is on the allowlist, so this is purely the stub.
- confidence: HIGH (instrumented)

### unknown/semutu-45-zeno907 — embedded-engine-unported
- first diff: `svg/g[1]/g[1][childCount]`, ours=0 jar=1 (the title's `<image>` of the nested mindmap)
- Java: `EmbeddedDiagram.java:197-213` (getImageSvgSlow renders the nested `@startmindmap` system)
- port: `src/diagrams/class/class-nested-diagram-renderer.ts:110-112` — "throw new Error('class-nested-diagram-renderer: rendered SVG has no viewBox=\"0 0 W H\" to measure');"; root: `src/index.ts:108-121` registers no mindmap plugin
- mechanism: the title's nested renderer is wired. But the nested `@startmindmap` source renders to this port's "Error: unknown diagram type" SVG (instrumented: `renderSync('@startmindmap…')`), which has no `viewBox`. The measurer throws, EmbeddedDiagram falls back and draws nothing. The port has no mindmap engine (`docs/catalog.md` and `src/diagrams/` have none).
- confidence: HIGH (instrumented)

### unknown/lubicu-73-fule059 — embedded-engine-unported
- first diff: `svg/g[1]/g[1][childCount]`, ours=4 jar=5 (rectangle's `<image>`), `svg/g[1]/g[2][childCount]` 5 vs 6 (note's `<image>`)
- Java: as semutu (nested `{{salt …}}`)
- port: as semutu (no salt plugin); also `EntityImageDescriptionDelegates.ts:121` (rectangle) and `src/diagrams/class/note-layout-measure-rows.ts:377-380` "note-layout-measure: no NestedDiagramRenderer wired for {{...}} embedded-diagram note regions yet"
- mechanism: three stacked gaps, instrumented from stderr. The rectangle's embed hits the description stub (desc-label-embed-unported). The note's embed hits the unwired note renderer. The body-row path that does reach the registered renderer gets a nested `@startsalt` that renders to the "unknown diagram type" SVG ("rendered SVG has no viewBox"). Even with both stubs wired, the missing salt engine leaves every image undrawn, so salt is the family.
- confidence: HIGH (instrumented)

### unknown/pojeje-60-vata579 — free-note-alias-not-quark-qualified
- first diff: `svg/g[1]/g[1]/@id`, ours=ent0001 jar=ent0003; ours draws only cluster `x` plus note `_n` twice (id collision), jar draws clusters `x`,`y` and notes `x._n`,`y._n`
- Java: `command/note/CommandFactoryNote.java:192-197` — "final Quark<Entity> quark = diagram.quarkInContext(false, diagram.cleanId(idShort)); … return CommandExecutionResult.error(\"Note already created: \" + quark.getName()); … diagram.reallyCreateLeaf(location, quark, display, LeafType.NOTE, null);"
- port: `src/diagrams/class/class-notes.ts:280` — "const id = stripQuotes(alias);"
- mechanism: a freestanding note's id is its bare alias, never resolved against the current group. Two `note as _n` in packages `x` and `y` both become id `_n`: one node in DOT (dotEqual false), package `y` ends up empty, and the survivor is drawn twice. Upstream `quarkInContext` makes them `x._n` and `y._n`.
- confidence: HIGH (instrumented render + DOT)

### unknown/rexupa-61-nezi165 — free-note-alias-not-quark-qualified
- first diff: `svg/g[1]/g[1]/@id`, ours=ent0001 jar=ent0002; jar has a cluster `X` (ent0003) around note `X.n`, ours has none
- Java: `command/note/CommandFactoryNote.java:192` (as pojeje); `net/atmp/CucaDiagram.java:262-275` (a dotted `X.n` resolves to child `n` of quark `X`, and the phantom group `X` is later built)
- port: `src/diagrams/class/class-notes.ts:280`
- mechanism: `note as X.n` keeps the literal id `X.n` with no namespace chain, so no group `X` is created or drawn. Upstream's quark resolution splits on the separator and builds `X` as a phantom group.
- confidence: HIGH (render; code read)

### unknown/tamovu-79-fifo533 — free-note-alias-not-quark-qualified
- first diff: `svg/g[1]/g[3]/@id`, ours=ent0003 jar=ent0001 (ours draws note `n` "my enother note" twice; the root `n` "my note" is lost)
- Java: `command/note/CommandFactoryNote.java:192`
- port: `src/diagrams/class/class-notes.ts:280`
- mechanism: `note as n` at root and `note as n` inside `package X` collide on id `n` instead of `n` and `X.n`.
- confidence: HIGH (render; code read)

### unknown/ticemi-41-laze086 — free-note-alias-not-quark-qualified
- first diff: `svg/g[1]/g[1]/@id`, ours=ent0003 jar=ent0002 (ours: `M` twice, cluster `b` lost)
- Java: `command/note/CommandFactoryNote.java:192`
- port: `src/diagrams/class/class-notes.ts:280`
- mechanism: same as pojeje via the `note "text" as M` form: `a.M` and `b.M` collapse to `M`.
- confidence: HIGH (render; code read)

### unknown/jititi-15-maxe512 — remove-group-not-cascaded
- first diff: `svg/g[1][childCount]`, ours=2 jar=0 (jar: empty 21×21 diagram; ours: cluster P + class P.A)
- Java: `abel/Entity.java:443-455` — "public boolean isRemoved() { … final Entity parentContainer = getParentContainer(); … if (parentContainer != null && parentContainer.isRemoved()) return true; return this.diagram.isRemoved(this);"
- port: `src/diagrams/class/class-directives-removal.ts:365-378` — "foldClassifiersInto(removed, ast, dirs, unlinked, 'remove', sep); foldNotesInto(…); return removed;"
- mechanism: `computeRemovedIds` folds directives over classifiers and notes only. Namespaces are never folded, and there is no ancestor cascade (the hide path has `cascadeHidden`, remove has none). Instrumented: `removed = ['P.B']`. So `remove *` never removes group P, and `restore P.A` leaves P.A visible. Upstream removes P, and A goes with it through the parent check.
- confidence: HIGH (instrumented)

### unknown/xamive-55-lipi586 — remove-group-not-cascaded
- first diff: `svg/g[1]/g[1]/@class`, ours=entity jar=cluster (ours keeps cluster `Foo.Bar` and class `Foo.Bar.Quz`; `g[1][childCount]` 7 vs 5)
- Java: `abel/Entity.java:443-455` (as jititi)
- port: `src/diagrams/class/class-directives-removal.ts:365-378`
- mechanism: `remove Foo.Bar` targets a namespace, which `computeRemovedIds` never folds (instrumented: `removed = []`). The group and its child class both survive.
- confidence: HIGH (instrumented)

### unknown/cikifu-97-pasu472 — freestanding-note-opale-group-endpoint
- first diff: `svg/g[1]/g[4]/@class`, ours=link jar=entity; ours emits an extra `<!--link  to GMN8-->` `<g class="link" id="">` (`g[1][childCount]` 16 vs 15)
- Java: `svek/GraphvizImageBuilder.java:245-251` — "if (isOpalisable(link.getEntity2())) { final SvekNode node = …getNode(link.getEntity2()); final SvekNode other = …getNode(link.getEntity1()); if (other != null) { ((EntityImageNote) node.getImage()).setOpaleLine(line, node, other); line.setOpale(true);"
- port: `src/diagrams/class/note-freestanding.ts:127-137` — "return findUniqueTouching(edges, noteIds, (e) => [e.from, e.to], () => false);" (candidate gate `:84` "if (fromIsNote === toIsNote) continue;" — nothing checks that the other end is a leaf)
- mechanism: the other end of `decoder_core .. monolit` is a package (cluster), which has no SvekNode upstream, so `other == null` and the link is drawn plainly. The port gives the freestanding note that edge's spline as its opale connector anyway (instrumented: note geo `connector` = the 16-point `x=769` spline of the real edge). The renderer then draws both the real `lnk10` and a note-connector link with empty entity-1.
- confidence: HIGH (instrumented)

### unknown/cilibi-66-tasa181 — separator-none-namespace-parent
- first diff: `svg/g[1][childCount]`, ours=5 jar=3 (ours: `f2` cluster at root + `f1` collapsed to an empty-package leaf; jar: `f2` nested in `f1`, `f3` qualified `f1.f2.f3`)
- Java: `net/atmp/CucaDiagram.java:252-256` — "if (sep == null) { final Quark<Entity> result = this.firstWithName(full); if (result != null) return Failable.ok(result); return Failable.ok(getCurrentGroup().getQuark().child(full));"
- port: `src/diagrams/class/class-container.ts:136-145` — "state.activeNamespace = effectiveId; if (ns.find((n) => n.id === effectiveId) === undefined) { … ns.push({ id: effectiveId, display, classifiers: [], creationIndex });"
- mechanism: with `set separator none`, `splitOnSeparator` returns null. The non-chain branch then pushes the new namespace without `parentId: enclosing`. Instrumented AST: `{id:'f1.f2'}` has no `parentId`, while the `useNewPackage`-only control gets `parentId:'f1'`. So `f1` looks empty and collapses to a leaf, and `f2` is emitted as a root cluster (our DOT differs from `svek-1.dot`). Upstream nests every unresolved name under the current group's quark when the separator is null.
- confidence: HIGH (instrumented AST + DOT)

### unknown/kokofa-47-deni140 — json-duplicate-no-execution-error
- first diff: `svg/g[1][childCount]`, ours=1 jar=60 (jar: crash page "java.lang.IllegalArgumentException … XDimension2D.<init> … TileText.calculateDimensionSlow … UgDiagram.exportDiagram"; ours: a class diagram with `J`/`42`)
- Java: `objectdiagram/command/CommandCreateJson.java:141-142` — "if (entity1 == null) return CommandExecutionResult.error(\"JSON already exists: \" + line0.getLazzy(\"CODE\", 0));" (entity1 is null per `:202-203` "if (quark.getData() != null) return null;")
- port: `src/diagrams/class/class-json-commands.ts:58` — "if (state.classifierIndex.has(id)) return undefined; // \"JSON already exists\"" (the duplicate is silently consumed; no `executionRefusal`)
- mechanism: upstream turns the second `json J {` into an execution error, and the jar's error page (`PSystemError extends UgDiagram`) then crashes in `TileText` while measuring. The port swallows the duplicate and renders the first J. After the port raises the error, the remaining gap is error page vs jar crash page, an `accept-candidate:upstream-crash` like zuduxu (cdd4 D6). Whether that crash is specific to the oracle's width-table bounder is not yet ruled out; next step: jar-render without `-DPLANTUML_DETERMINISTIC_TEXT`.
- confidence: HIGH (port side read and render-confirmed; jar stack trace read from `in.svg`)

### unknown/xisora-84-faca166 — class-business-usecase-dropped
- first diff: `svg/g[1]/g[1][childCount]`, ours=2 jar=3 (missing the business slash `<line>`; ellipse rx 42.598 vs 53.154)
- Java: `classdiagram/command/CommandCreateElementFull2.java:236-237` — "} else if (symbol.equalsIgnoreCase(\"usecase/\")) { type = LeafType.USECASE_BUSINESS;"; `abel/Entity.java:412-413` — "if (getLeafType() == LeafType.USECASE_BUSINESS) return USymbols.USECASE_BUSINESS;"
- port: `src/diagrams/class/class-declaration-parser.ts:141` — "if (USECASE_LEAF_RE.test(rawKind)) return { kind: 'usecase' };"
- mechanism: `usecase/` and `usecase` both collapse to `kind:'usecase'` with no business flag (instrumented AST). Sizing (`class-layout-leaf-shapes.ts:65`) and rendering (`renderer-usymbol-entity.ts:100`) therefore use plain `USymbolUsecase(false)` instead of the business variant, which is larger and has the slash line. The core `usecase-business` USymbol already exists (`src/core/descriptive-keywords.ts:44`).
- confidence: HIGH (instrumented)

### unknown/zefefo-37-xigo245 — class-circle-decor-unmapped
- first diff: `svg/g[1]/g[3][childCount]`, ours=2 jar=4 (two `<ellipse r=6>` end decorations missing; path ends Δ12; ours also emits `data-link-type="association"` which jar omits)
- Java: `decoration/LinkDecor.java:90` — "CIRCLE(decors1(\"0\"), decors2(\"0\"), 0, false, 0.5),"; `decoration/LinkType.java:301-307` — "if (hasAny(LinkDecor.CIRCLE_LINE, LinkDecor.DOUBLE_LINE) || bothNone()) return \"association\"; … return null;"
- port: `src/diagrams/class/class-arrow-grammar.ts:224-227` — "'0': 'none'," (kind only) and `src/diagrams/class/class-arrow-decor-map.ts:59-82` HEAD_TO_DECOR has no `'0'` entry
- mechanism: the `0` head glyph is recognised for type resolution but never mapped to a `LinkDecor`. Instrumented: `a 0--0 b` and `a 0-[dashed]--0 b` both parse `sourceDecor/targetDecor: none`. No circle extremity is drawn (`ExtremityFactoryCircle` already exists in `src/core/svek/extremity/ExtremityCircle.ts`), and `bothNone()` wrongly yields `association`.
- confidence: HIGH (instrumented)

### unknown/zolaza-45-sepi570 — addmethod-space-lenient
- first diff: `svg/g[1]/g[1][childCount]`, ours=7 jar=4 (root cause is routing: jar `data-diagram-type="STATE"` rounded state box; ours CLASS)
- Java: `classdiagram/command/CommandAddMethod.java:63-68` — "new RegexLeaf(1, \"NAME\", \"([%pLN_.]+|[%g][^%g]+[%g])\"), RegexLeaf.spaceOneOrMore(), new RegexLeaf(\":\"), RegexLeaf.spaceOneOrMore(), new RegexLeaf(1, \"DATA\", \"(.*)\")" (`regex/RegexLeaf.java:85-86` spaceOneOrMore = `[%s]+`)
- port: `src/diagrams/class/class-command-relationships.ts:81` — "pattern: /^(\"[^\"]+\"|[\\p{L}\\p{N}_.]+)\\s*:(?!:)\\s*(.+)$/u,"
- mechanism: upstream's member-add command needs whitespace on both sides of `:`. The line `https://forum…` matches no class command, the class factory refuses, and the state factory claims it. The port's `\s*` accepts it, so the class engine owns the block. Oracle-verified: `A:foo` routes STATE in the jar, `A : foo` routes CLASS, and ours routes both CLASS. After the fix this row leaves the CLASS set, and every class-corpus fixture with `X:y` must be re-measured.
- confidence: HIGH (instrumented against jar)

### unknown/dilese-24-neku812 — cluster-header-sprite-stereotype
- first diff: `svg/g[1]/g[1][childCount]`, ours=3 jar=4 (cluster `MyApp <<$java>>` missing its 48×48 `<image>`; header 48px shorter, svg height 157 vs 191)
- Java: `svek/ClusterHeader.java:199-201` — "final TextBlock tmp = stereotype.getSprite(skinParam); if (tmp != null) return tmp;"
- port: `src/diagrams/class/class-cluster-header.ts:30-31` — "Not modelled: a sprite stereotype (`stereotype.getSprite(skinParam)`, `ClusterHeader.java:199-201`)"
- mechanism: the cluster stereo block never tries the stereotype's sprite, so a `<<$sprite>>` group stereotype yields no block at all. Instrumented: `package P <<$java>> { class Y }` renders no image and no stereo text. The header is sized and drawn as if unstereotyped.
- confidence: HIGH (instrumented)

### unknown/rukate-37-jabu394 — empty-package-leaf-url-dropped
- first diff: `svg/g[1][childCount]`, ours=11 jar=9 (jar wraps the collapsed `core` package's path/line/text in `<a href="org/jgrapes/core/…">`)
- Java: `svek/image/EntityImageEmptyPackage.java:148-149` — "if (url != null) ug.startUrl(url);" … `:168-169` "if (url != null) ug.closeUrl();" (`:102` "this.url = entity.getUrl99();")
- port: `src/diagrams/class/renderer-empty-package-leaf.ts:25-51` (builds `nsGeo` from `geo`; never reads `geo.url`)
- mechanism: the collapsed empty package leaf's geo does carry `url` (instrumented: `org.jgrapes.core` leaf has `url`). The empty-package renderer ignores it and never emits the `<a>` wrapper that EntityImageEmptyPackage draws.
- confidence: HIGH (instrumented)

### unknown/nepevi-24-dune081 — generic-space-before-angle
- first diff: `svg/g[1]/g[1]/@class`, ours=entity jar=cluster (entity count differs: ours `Person <Eloquent>` + phantom `Person` + `PersonRich`; jar `Person` + generic box `Eloquent` + `PersonRich`)
- Java: `classdiagram/command/CommandCreateClassMultilines.java:106-107` — "new RegexOptional(new RegexConcat(RegexLeaf.spaceZeroOrMore(), new RegexLeaf(1, \"GENERIC\", \"\\\\<(\" + GenericRegexProducer.PATTERN + \")\\\\>\"))),"
- port: `src/diagrams/class/class-declaration-extractors.ts:398` — "const idThenGeneric = /^([^\\s<>]+)(<.*>)$/.exec(rest.trim());"
- mechanism: the port's id/generic split requires the `<` to touch the id. Instrumented: `class Person <Eloquent>` gives id `Person <Eloquent>` with no typeParams, while `class Person<Eloquent>` splits correctly. `PersonRich extends Person` then creates a second, phantom `Person`, which adds a DOT node (dotEqual false) and reorders every uid.
- confidence: HIGH (instrumented)

### unknown/xuloxo-85-vibu502 — tim-guessfunctions-pair-order
- first diff: `routing: jar CLASS, ours NONE` (ours is the preprocessor error page "Unknown built-in function $isDerivedFrom"; `svg/@background` #000000 vs #FFFFFF)
- Java: `tim/expression/TokenStack.java:162-185` — "final Map<Integer, Integer> parens = new HashMap<Integer, Integer>(); … parens.put(open.pollFirst(), i); … for (Map.Entry<Integer, Integer> ids : parens.entrySet()) { … final int nbArg = countFunctionArg(subTokenStack(iopen + 1).tokenIterator(), location);"; `:125-127` — "if (level == 0 && (typech == TokenType.COMMA || typech == TokenType.CLOSE_PAREN_MATH) || typech == TokenType.CLOSE_PAREN_FUNC) return;"
- port: `src/core/tim/expression/TokenStack.ts:172` — "const parens = new Map<number, number>();" and `:182` "for (const [iopen, iclose] of parens) {" (doc comment `:149-156` claims pairing order "has no effect on the final token array")
- mechanism: this is not a dispatcher or factory-order problem. The block never reaches `registry.resolve` because the preprocessor throws first. `countFunctionArg` reads tokens that earlier iterations already rewrote, and `eatUntilCloseParenthesisOrComma` returns on any `CLOSE_PAREN_FUNC` regardless of nesting level, so iteration order matters. Java's `HashMap<Integer,…>` iterates small int keys in ascending order, so the outer (lower `iopen`) call is counted before the inner one is rewritten (verified: `java H.java` prints `[1, 4]` after inserting 4 then 1). The port's insertion-ordered `Map` visits the inner pair first because it closes first. The outer `$f($g(x), y)` then counts 1 arg, and `getFunction($f/1)` misses. Minimal repro: `!$x = $f($g(1), 2)`. Oracle renders it as CLASS, ours gives "Unknown built-in function $f"; `$f(2, $g(1))` works in both. Here it is classy's `$isDerivedFrom($determineType($actual), $expected)` (`assets/stdlib/classy/plumbing/class-instancing.puml:176`).
- confidence: HIGH (instrumented + oracle)

### unknown/rubebe-45-sura795 — accept-candidate:upstream-crash
- first diff: `svg/g[1][childCount]`, ours=539 jar=47 (jar crash page "java.lang.NullPointerException: … because \"pt4\" is null")
- Java: `dot/Neighborhood.java:151` — "return intersection(pt1.getX(), pt1.getY(), pt2.getX(), pt2.getY(), pt3.getX(), pt3.getY(), pt4.getX(), …" (stack: `Neighborhood.drawU:80` ← `svek/EntityImageProtected.drawUntranslated:88` ← `SvekResult.drawU:89`)
- port: n/a (ours renders the 806-line UML metamodel diagram)
- mechanism: upstream crashes while drawing a protected entity's neighborhood (null spline point) under `skinparam groupInheritance 3`, so the jar output is a crash page, not a diagram. This is a deliberate-divergence candidate of the same class as zuduxu (cdd4 D6).
- confidence: MEDIUM (jar stack read from `in.svg`; the null-point origin is not instrumented)
