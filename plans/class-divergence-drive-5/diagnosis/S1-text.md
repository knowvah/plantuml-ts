# S1 diagnosis (T6): text / first-diff-text shard

The shard has 48 rows: 3 are pre-settled ACCEPTED and 45 are diagnosed below. Each row was measured with
`render-diff.mts` (outputs in `plans/class-divergence-drive/measurements/out/`). Instrumentation ran in a
scratch copy of `src/` under the session scratchpad and never touched the repo.
Family ids `cluster-style-signature-unmerged`, `collapsed-group-leaf-stereo-dropped`, `multiline-usecase-kind`
and `desc-label-embed-unported` are reused from `S4-style.md`. This shard locates the port origin of
`collapsed-group-leaf-stereo-dropped`, which S4 left as "not yet located".

| family | rows | Java file:line | port file:line | size | write-set |
|---|---|---|---|---|---|
| desc-leaf-classbox-fallback | 11 | `svek/GeneralImageBuilder.java:160-167` | `src/diagrams/class/renderer-usymbol-entity.ts:235-252` (allowlist), `:99-103` (keyword cast) | S | `src/diagrams/class/renderer-usymbol-entity.ts` |
| multiline-usecase-kind (S4) | 1 (gejuvu) | `descdiagram/command/CommandCreateElementMultilines.java:175-180` | `src/diagrams/class/class-multiline-element.ts:182-183,212-213` | S | `src/diagrams/class/class-multiline-element.ts` |
| multiline-element-blank-line-dropped | 3 | `descdiagram/command/CommandCreateElementMultilines.java:192-193` | `src/diagrams/class/class-multiline-element.ts:114,122` | S | `src/diagrams/class/class-multiline-element.ts` |
| creole-e1-newline-split | 2 (+boguko secondary) | `klimt/creole/legacy/CreoleStripeSimpleParser.java:164`; `CreoleParser.java:113-114` | `src/core/klimt/creole/legacy/CreoleParser.ts:408-419` | S | `src/core/klimt/creole/legacy/CreoleParser.ts` |
| empty-package-leaf-legend | 1 | `svek/image/EntityImageEmptyPackage.java:121-124` | `src/diagrams/class/class-empty-package.ts:150-176`; `renderer-empty-package-leaf.ts:50` | M | `src/diagrams/class/class-empty-package.ts`, `src/diagrams/class/renderer-empty-package-leaf.ts`, `src/diagrams/class/class-layout-helpers.ts` |
| cluster-style-signature-unmerged (S4) | 4 | `svek/ClusterHeader.java:144-150,209-215` | `src/diagrams/class/renderer.ts:109`; `class-cluster-header.ts:123-127`; `class-namespace-title-runs.ts:52-57` | M | `src/diagrams/class/renderer.ts`, `src/diagrams/class/class-cluster-header.ts`, `src/diagrams/class/class-namespace-title-runs.ts` (+ S4's set) |
| collapsed-group-leaf-stereo-dropped (S4) | 4 secondary | `svek/image/EntityImageDescription.java:194-202` | `src/diagrams/class/renderer-usymbol-entity.ts:167` | S | `src/diagrams/class/renderer-usymbol-entity.ts` |
| usymbol-leaf-entity-color-dropped | 1 (+gejuvu secondary) | `svek/image/EntityImageDescription.java:164-166` | `src/diagrams/class/renderer-usymbol-entity.ts:170` | S | `src/diagrams/class/renderer-usymbol-entity.ts` |
| badge-leaftype-spot-unported | 5 | `svek/image/EntityImageClassHeader.java:166-195,197-261`; `skin/plantuml.skin:239-273` | `src/diagrams/class/class-badge.ts:309-332` (letter), `:172` (fill) | M | `src/diagrams/class/class-badge.ts`, `src/diagrams/class/class-badge-glyph-data.ts`, `src/core/skinparam-element-buckets.ts` |
| package-header-multi-stereotype-truncated | 1 | `stereo/StereotypePattern.java:66-67`; `command/CommandPackage.java:88` | `src/diagrams/class/class-command-containers.ts:91` | S | `src/diagrams/class/class-command-containers.ts` |
| namespace-title-bypasses-creole | 3 | `svek/ClusterHeader.java:115-128`; `klimt/creole/legacy/CreoleParser.java:175` | `src/diagrams/class/class-namespace-title-runs.ts:159,169` | M | `src/diagrams/class/class-namespace-title-runs.ts`, `src/diagrams/class/class-namespace-shape.ts` |
| descriptive-leaf-code-bracket-not-stripped | 1 secondary | `classdiagram/command/CommandCreateElementFull2.java:249`; `StringUtils.java:86-90` | `src/diagrams/class/class-declaration-parser.ts:167` | S | `src/diagrams/class/class-declaration-parser.ts` |
| legend-document-background-cascade | 2 | `style/FromSkinparamToStyle.java:180`; `activitydiagram3/ftile/EntityImageLegend.java:49-51`; `style/StyleStorage.java:102-116` | `src/core/annotations/annotation-skinparam.ts:120-129` | S | `src/core/annotations/annotation-skinparam.ts` |
| creole-titled-horizontal-line-literal | 1 secondary | `klimt/creole/legacy/CreoleStripeSimpleParser.java:92-117`; `StripeSimple.java:154-155` | `src/core/klimt/creole/legacy/CreoleStripeSimpleParser.ts:120-122`; `CreoleParser.ts:409-417` | M | `src/core/klimt/creole/legacy/CreoleStripeSimpleParser.ts`, `CreoleParser.ts`, `src/core/klimt/creole/CreoleHorizontalLine.ts` |
| legend-style-maximumwidth-ignored | 1 | `activitydiagram3/ftile/EntityImageLegend.java:53-54` | `src/core/annotations/blocks-creole.ts:477` | S | `src/core/annotations/blocks-creole.ts`, `src/core/annotations/annotation-style-overrides.ts` |
| json-leaf-maximumwidth-ignored | 1 | `cucadiagram/BodierJSon.java:85`; `cucadiagram/TextBlockCucaJSon.java:186` | `src/diagrams/class/class-json-sizing.ts:322-346` | M | `src/diagrams/class/class-json-sizing.ts` (+ json body renderer) |
| json-node-edge-shield-port | 1 | `svek/image/EntityImageJson.java:240-242`; `svek/SvekNode.java:133-137` | `src/diagrams/class/class-port-rows.ts:221-230`; `src/core/svek-dot-emit.ts:122` | S | `src/diagrams/class/class-port-rows.ts` |
| member-method-params-reformatted | 2 | `cucadiagram/Member.java:133-137` | `src/diagrams/class/class-member-parser.ts:175-185`; `class-layout-helpers.ts:127-128` | S | `src/diagrams/class/class-member-parser.ts`, `src/diagrams/class/class-layout-helpers.ts` |
| class-note-text-alignment-unported | 2 | `svek/image/EntityImageNote.java:112`; `style/FromSkinparamToStyle.java:178` | `src/diagrams/class/renderer-note.ts:253-255` | M | `src/diagrams/class/renderer-note.ts`, `src/diagrams/class/note-layout*.ts` |
| degenerate-single-note-leaf | 2 secondary | `svek/GraphvizImageBuilder.java:214-221`; `svek/EntityImageDegenerated.java:53,88` | `src/diagrams/class/class-geo-builders.ts:348` | M | `src/diagrams/class/class-geo-builders.ts`, `src/diagrams/class/layout.ts` |
| desc-atom-text-tab-draw | 1 | `klimt/creole/legacy/AtomText.java:210-233` | `src/core/svek/image/EntityImageDescriptionDelegates.ts:213-216` | S | `src/core/svek/image/EntityImageDescriptionDelegates.ts` |
| parenthesis-element-code-as-display | 1 | `descdiagram/command/CommandCreateElementParenthesis.java:94-104` | `src/diagrams/class/class-command-containers.ts:176-179` | S | `src/diagrams/class/class-command-containers.ts` |
| creole-url-hyperlink-color-hardcoded | 2 | `klimt/creole/legacy/StripeSimple.java:224-226`; `klimt/font/FontConfiguration.java:57-60`; `skin/SkinParam.java:305-311` | `src/core/klimt/creole/command/CommandCreoleUrl.ts:60,94` | M | `src/core/klimt/creole/command/CommandCreoleUrl.ts` (+ font-config hyperlink field) |
| class-decl-as-case-sensitive | 2 secondary | `regex/Pattern2.java:114` | `src/diagrams/class/class-declaration-extractors.ts:362,379,390` | S | `src/diagrams/class/class-declaration-extractors.ts` |
| member-double-bracket-url-stripped | 2 secondary | `cucadiagram/Member.java:93` | `src/diagrams/class/class-member-parser.ts:29` | S | `src/diagrams/class/class-member-parser.ts` |
| desc-label-embed-unported (S4) | 1 secondary (gubeca) | `cucadiagram/BodyEnhanced2.java:91-94` | `src/core/svek/image/EntityImageDescriptionDelegates.ts:124` | L | as S4 |

Java paths are relative to `~/git/plantuml/src/main/java/net/sourceforge/plantuml/`.

## Pre-settled (ACCEPTED, in force; not diagnosed)
- `class/luzive-62-zote562`: error page version/source identity (cdd4 D6, D9).
- `class/sadamo-18-siva346`: error page version/source identity (cdd4 D6, D9).
- `class/zuduxu-90-kosi876`: upstream crash page (cdd4 D6).

## Rows

### unknown/felixe-38-dilu011 — desc-leaf-classbox-fallback
- first diff: `svg/g[1]/g[1]/rect[1]` (element name), ours=rect jar=ellipse. Ours draws a class box with a `C` badge. The jar draws a small circle with the lines a/b/c below it.
- Java: `svek/GeneralImageBuilder.java:160-167`: "if (leaf.getLeafType() == LeafType.DESCRIPTION) { ... return new EntityImageDescription(leaf, portionShower, links, bibliotekon);". `CommandCreateElementMultilines.java:182-187` makes every non-usecase TYPE0/TYPE1 leaf `LeafType.DESCRIPTION` with its `USymbol`.
- port: `src/diagrams/class/renderer-usymbol-entity.ts:235-252`: "classifier.kind === 'descriptive' && (classifier.usymbol === 'actor' || ... 'component' || 'database' || 'node' || 'rectangle' || 'package')". Any other usymbol falls to `renderClassifierBox` (`renderer.ts:69-73`).
- mechanism: Upstream sends every DESCRIPTION leaf to `EntityImageDescription`. The port's render dispatch allowlists only 6 usymbols. A `circle`/`entity`/`file`/`card`/`actor/` leaf parses correctly (AST: `kind: 'descriptive', usymbol: 'circle'`) and is sized as a description leaf (`tryMeasureDescriptionLeaf`), but it is drawn as a generic class box.
- confidence: HIGH (instrumented. With the allowlist widened to every descriptive usymbol in the scratch copy, felixe drops to 0 structural and 2 numeric diffs, and its ellipse and texts are byte-identical to the jar.)

### unknown/gogisu-39-bepa573 — desc-leaf-classbox-fallback
- first diff: `svg/g[1]/g[2]/rect[1]`, ours=rect jar=ellipse (the `entity ABC [ ... ]` leaf).
- Java: as felixe (`USymbols.fromString("ENTITY")` → DESCRIPTION leaf, `GeneralImageBuilder.java:160-167`).
- port: `renderer-usymbol-entity.ts:235-252`. The AST is `{kind:'descriptive', usymbol:'entity'}`.
- mechanism: As felixe, for usymbol `entity`.
- confidence: HIGH (instrumented: widened dispatch → 0 structural, 26 numeric)

### unknown/gubeca-19-lemu434 — desc-leaf-classbox-fallback (+ desc-label-embed-unported)
- first diff: `svg/g[1]/g[1]/rect[1]`, ours=rect jar=path (file symbol).
- Java: as felixe (`file` → `USymbolFile`).
- port: `renderer-usymbol-entity.ts:235-252`. AST `usymbol:'file'`, display carries a `{{yaml ... }}` block.
- mechanism: As felixe. Once dispatched, the next layer is the embedded `{{yaml}}` in the description label. The scratch render logs "EntityImageDescriptionDelegates: embedded diagrams ({{ ... }}) inside a description label are not supported" and leaves 1 structural diff (childCount 3 vs 4). That residual is S4's `desc-label-embed-unported`. Check D9 (the embedded-payload-bytes acceptance) before counting it as open.
- confidence: HIGH (instrumented)

### unknown/jixibu-01-xave465 — desc-leaf-classbox-fallback
- first diff: `svg/g[1]/g[1]/rect[1]`, ours=rect jar=path.
- Java / port: as gubeca (`file n [ ... {{json ... }} ]`).
- mechanism: As felixe. Once dispatched, 1 structural diff remains (`g[1]/g[1][childCount]` ours=9 jar=4): the embedded `{{json}}` draws inline, where the jar draws one image. Mechanism for that residual: unknown. Instrument next the `EmbeddedDiagram` path in `EntityImageDescriptionDelegates.ts` for json, and why it did not throw as yaml did. Then check it against D9.
- confidence: HIGH for the primary (instrumented), LOW for the residual

### unknown/juzuno-58-gesi397 — desc-leaf-classbox-fallback
- first diff: `svg/g[1]/g[1]/text[1]/@font-weight`, ours='' jar=700. The jar draws the card body through creole (`<b>card`). Ours prints the raw `This is a <b>card` inside a class box.
- Java: as felixe (`card` → `USymbolCard`).
- port: `renderer-usymbol-entity.ts:235-252` (usymbol `card` missing).
- mechanism: As felixe.
- confidence: HIGH (instrumented: widened → 0 structural, 4 numeric)

### unknown/petuju-02-zino378 — desc-leaf-classbox-fallback
- first diff: `svg/g[1]/g[1]/ellipse[1]/@fill`, ours=#ADD1B2 (class badge) jar=#000 (a creole bullet).
- Java / port: as felixe (`file` leaf).
- mechanism: As felixe.
- confidence: HIGH (instrumented: widened → pass, 0/0)

### unknown/pugesu-08-cove285 — desc-leaf-classbox-fallback
- first diff: `svg/g[1]/g[1]/rect[1]`, ours=rect jar=path.
- Java / port: as felixe (`file` leaf).
- mechanism: As felixe.
- confidence: HIGH (instrumented: widened → pass, 0/0)

### unknown/zivebo-26-nagu813 — desc-leaf-classbox-fallback
- first diff: `svg/g[1]/g[1]/rect[1]/@fill`, ours=#F1F1F1 class rect jar=#000 (a bullet).
- Java / port: as felixe (`file` leaf).
- mechanism: As felixe.
- confidence: HIGH (instrumented: widened → pass, 0/0)

### unknown/fepulu-27-soci473 — desc-leaf-classbox-fallback
- first diff: `svg/g[1]/g[1]/rect[1]`, ours=rect jar=ellipse (the business-actor head).
- Java: `classdiagram/command/CommandCreateElementFull2.java:242-245`: "type = LeafType.DESCRIPTION; usymbol = USymbols.fromString(symbol, ...)" for `actor/`. Dispatch is as felixe.
- port: `renderer-usymbol-entity.ts:238-240` allowlists `'actor'` but not `'actor/'`. `resolveSymbolKeyword` (`:99-103`) then casts the raw keyword, so the fix must map it through `KEYWORD_TO_SYMBOL` (`actor/` → `actor-business`).
- mechanism: As felixe, for usymbol `actor/`.
- confidence: HIGH (instrumented: widened → pass, 0/0)

### unknown/jefidu-98-gisu131 — desc-leaf-classbox-fallback
- first diff: `svg/g[1]/g[2]/rect[1]/@fill`, ours=#F1F1F1 (class box, raw table text) jar=#98FB98 (creole table cell).
- Java / port: as felixe (`card C [ |= Fill |= ... ]`).
- mechanism: As felixe. Once dispatched, 5 structural diffs remain: SVG-sprite path `@stroke-width` ours=1 jar=0.5 (`g[2]/path[2]`, `path[4]`, ...). Mechanism for that residual: unknown. Instrument next the sprite `<svg>` path stroke-width scaling in `core/klimt/sprite/svg-nanoparser-shapes.ts`.
- confidence: HIGH for the primary (instrumented), LOW for the residual

### unknown/sprite-SVG-Fill-Stroke-Combinatory-1 — desc-leaf-classbox-fallback
- first diff: `svg/g[1]/g[2]/rect[1]/@fill`, ours=#F1F1F1 jar=#98FB98.
- Java / port / mechanism: identical to jefidu, including the same 5-diff sprite stroke-width residual. The two in.svg files are the same diagram; the puml files differ only in their first line.
- confidence: HIGH (instrumented)

### unknown/gejuvu-17-vufu851 — multiline-usecase-kind (+ usymbol-leaf-entity-color-dropped)
- first diff: `svg/g[1]/g[1]/rect[1]`, ours=rect jar=ellipse (the `usecase/ test15 #cccccc as "…"` TYPE0 block).
- Java: `descdiagram/command/CommandCreateElementMultilines.java:178-180`: "} else if (symbol.equalsIgnoreCase(\"usecase/\")) { type = LeafType.USECASE_BUSINESS; usymbol = USymbols.USECASE_BUSINESS;".
- port: `src/diagrams/class/class-multiline-element.ts:212-213`: "const classifier = ensureClassifier(state, code, 'descriptive', code); classifier.usymbol = usymbol;". The AST is `{kind:'descriptive', usymbol:'usecase/'}`.
- mechanism: The multiline opener always creates a `descriptive` leaf, never the usecase(-business) kind. It then misses both the usecase render path and the usymbol allowlist, and draws as a class box (the same family as S4 pupoko).
- secondary: with dispatch fixed, 1 structural diff remains: `ellipse/@fill` ours=#F1F1F1 jar=#CCC. The `#cccccc` BACK colour reaches the AST, but the draw path drops it (`usymbol-leaf-entity-color-dropped`).
- confidence: HIGH (instrumented: widened dispatch → 1 structural, the colour only)

### unknown/boguko-42-zuda981 — multiline-element-blank-line-dropped (+ creole-e1-newline-split)
- first diff: `svg/g[1]/g[1]/text[2]/@font-size`, ours=10 jar=14. This is a positional shift: the jar has an extra `<text> </text>` blank row, and rect height is 94 vs 66.
- Java: `descdiagram/command/CommandCreateElementMultilines.java:192-193`: "lines = lines.subExtract(1, 1); Display display = lines.toDisplay();". Every body line is kept, blank ones included (`MultilinesStrategy.REMOVE_STARTING_QUOTE` only drops `'` lines).
- port: `src/diagrams/class/class-multiline-element.ts:122`: "if (raw.trim() !== '') pending.lines.push(raw);" (TYPE0; TYPE1 has the same at `:114`).
- mechanism: The port discards blank body lines of a multiline element. Upstream keeps each one as a `" "` display row, so the leaf is one 14 px row short. The second 14 px is `%newline()`: U+E100 stays inside one stripe and is drawn as "↵" (see buitin).
- confidence: HIGH (instrumented: keeping blank lines fixes the blank row and the rect gap narrows to the E100 line only)

### unknown/toxore-88-ruso838 — multiline-element-blank-line-dropped
- first diff: `svg/g[1]/g[1]/text[2]/@font-size`, ours=12 jar=14 (positional). Rect height is 205.846 vs 219.846.
- Java / port: as boguko (`class-multiline-element.ts:122`).
- mechanism: As boguko. The procedure-expanded display's blank line before `description…` is dropped.
- confidence: HIGH (instrumented: keeping blank lines in the scratch copy → pass, 0/0)

### unknown/fidaru-93-zumu093 — multiline-element-blank-line-dropped
- first diff: `svg/g[1]/g[1]/text[1]/@textLength` (positional). The jar's `g[1]` has 6 children, ours 4. Rect height is 142.923 vs 114.923.
- Java / port: as boguko.
- mechanism: As boguko. Two blank display rows (the empty `$label` line and the line before `$description`) are dropped from each of the three `$SpriteDecorator` leaves.
- confidence: HIGH (instrumented: keeping blank lines → 0 structural, 4 numeric)

### unknown/buitin-newline-chr-0 — creole-e1-newline-split
- first diff: `svg/g[1]/g[1]/text[1]/@textLength` (positional). The real departure is the last line: ours has one `<text>` "test 4 ↵test44" where the jar has two, "test 4" and "test44".
- Java: `klimt/creole/legacy/CreoleStripeSimpleParser.java:164`: "for (String singleLine : line.split(\"\" + Jaws.BLOCK_E1_NEWLINE)) { final StripeSimple stripe = ...; result.add(stripe); }". It is reached from `CreoleParser.java:113-114`.
- port: `src/core/klimt/creole/legacy/CreoleParser.ts:408`: "const build = buildLineAtoms(line, fontConfiguration);" … `:419` "return [createSimpleStripe(build.atoms, ...)]". That is ONE stripe per display line.
- mechanism: `%newline()` returns `Jaws.BLOCK_E1_NEWLINE` (U+E100, `tim/builtin/Newline.java`, `JawsFlags.USE_BLOCK_E1_IN_NEWLINE_FUNCTION = true`). Upstream's simple-stripe parser splits a display line on U+E100 into separate stripes. The port builds one stripe, so the sentinel reaches `UText`, which renders it as "↵" (`core/klimt/shape/UText.ts:168`).
- confidence: HIGH (instrumented via output: the "↵" glyph in ours is `UText`'s E100 replacement, which proves the unsplit sentinel reached the draw)

### unknown/zeraje-11-semu839 — creole-e1-newline-split
- first diff: identical to buitin (same source).
- Java / port / mechanism: as buitin.
- confidence: HIGH

### unknown/bijufi-98-xafa015 — empty-package-leaf-legend
- first diff: `svg/g[1]/text[1]/@font-weight` (positional). The jar has 9 children and ours 7: the jar draws `P legend` (rect + text) inside the collapsed empty-package leaf `P`, and ours omits it. The `P` leaf path is also 17.5 px shorter.
- Java: `svek/image/EntityImageEmptyPackage.java:121-124`: "final DisplayPositioned legend = ((Entity) entity).getLegend(); if (legend != null) { final TextBlock legendBlock = EntityImageLegend.create(legend.getDisplay(), getSkinParam()); stereoBlock = legendBlock;".
- port: `src/diagrams/class/class-empty-package.ts:150-176` (`measureEmptyPackageLeafDim` takes only `stereotypeLabels`) and `renderer-empty-package-leaf.ts:50`: "renderEmptyPackageIcon(nsGeo, theme, measurer, { tab: folderTab, tags: geo.stereotypeLabels ?? [] })". The group legend is routed onto `ns.legend` (`parser.ts:448-455`) but never read once the namespace collapses to a leaf.
- mechanism: When a package holding only a legend collapses to an empty-package leaf, upstream uses the legend as the leaf's stereo block (sized and drawn). The port sizes and draws the leaf from stereotype labels only, so the legend disappears and the leaf is too small.
- confidence: MEDIUM (read, not instrumented)

### unknown/catana-32-licu332 — cluster-style-signature-unmerged (+ collapsed-group-leaf-stereo-dropped)
- first diff: `svg/g[1]/g[2]/text[1]/@fill` (r1 cluster `«boundary»`), ours=#000 jar=#F00. The r1 title "R1" is also #000 vs #F00.
- Java: `svek/ClusterHeader.java:144-150`: "return signature.withTOBECHANGED(g.getStereotype()).with(g.getStereostyles()).getMergedStyle(...)" (title), and `:209-215`: "Cluster.getDefaultStyleDefinition(...).forStereotypeItself(g.getStereotype()).getMergedStyle(...)" (stereo block).
- port: `src/diagrams/class/renderer.ts:109`: "fontColor: DEFAULT_GROUP_FONT_COLOR," (title); `class-cluster-header.ts:123-127`: "const own = theme.colors.elements?.[ns.usymbol]?.font; return typeof own === 'string' ? own : DEFAULT_GROUP_FONT_COLOR;" (stereo).
- mechanism: Upstream merges the cluster header's style signature with the group's stereotype, so `rectangle { .boundary { FontColor red } }` colours both the title and the stereo. The port reads a fixed default (title) or the flat per-element font (stereo) and never merges a stereotype- or sub-selector-scoped style. This is the same unmerged-signature root S4 found for cluster borders.
- secondary: the collapsed `r2` leaf draws at 37.938x34 without `«boundary»`. Sizing already includes it (scratch trace: `tryMeasureDescriptionLeaf` → 95.9375x48 with `stereotype:["boundary"]`), but the draw passes `stereotypeLabels: []` (`collapsed-group-leaf-stereo-dropped`, located below). The leaf's red text is this family again, on the leaf side (`renderer-usymbol-entity.ts` `textFont(theme, symbolKeyword…)` takes no stereotype).
- confidence: MEDIUM (read). The secondary is HIGH (instrumented).

### unknown/tobevo-04-mata128 — cluster-style-signature-unmerged (+ collapsed-group-leaf-stereo-dropped)
- first diff: `svg/g[1]/g[2]/text[1]/@fill`, ours=#000 jar=#F00.
- Java: as catana. `skinparam rectangle<<boundary>> { FontColor red }` becomes a stereotype-scoped `rectangle` style (`FromSkinparamToStyle`).
- port: as catana.
- mechanism: As catana, reached through the skinparam form instead of `<style>`.
- confidence: MEDIUM (read)

### unknown/noxebo-98-foga433 — cluster-style-signature-unmerged (+ collapsed-group-leaf-stereo-dropped)
- first diff: `svg/g[1]/g[1]/text[1]/@fill` (r1 `«foo1»`), ours=#000 jar=#F00. The title correctly stays #000 in both.
- Java: `svek/ClusterHeader.java:209-215` (stereo block `forStereotypeItself`).
- port: `class-cluster-header.ts:123-127`.
- mechanism: `rectangle { Stereotype { FontColor red } }` is a `stereotype` sub-selector under `rectangle`. The port's stereo colour resolver reads only `elements[usymbol].font`, not the nested `stereotype` scope. The collapsed `r2` also loses `«foo1»` (secondary).
- confidence: MEDIUM (read). The secondary is HIGH (instrumented: 64.7875x48 sized, 37.938x34 drawn).

### unknown/juzica-68-kava475 — cluster-style-signature-unmerged (+ collapsed-group-leaf-stereo-dropped)
- first diff: `svg/g[1]/g[2]/text[1]/@fill` (PackageWithThing2 title), ours=#000 jar=#00F. Also stereo #000 vs #008000, and the rectangle title/stereo are #FFA500 in ours vs #F00/#800080 in the jar.
- Java: `svek/ClusterHeader.java:144-150,152-165` (title signature `{…, <usymbol>|package_, composite?, title}` merged with the stereotype) and `:209-215`.
- port: `renderer.ts:109`; `class-cluster-header.ts:123-127`; `class-namespace-title-runs.ts:52-57`: "const override = theme.colors.elements?.package?.font;" (the folder title reads only the flat package font).
- mechanism: The nested `package { title {…} stereotype {…} }` and `rectangle { title {…} stereotype {…} }` selectors never reach the header. The port reads the element-level `FontColor` (orange) or nothing. Upstream merges the `title`/`stereotype` sub-signatures.
- secondary: the collapsed `EmptyPackage1`/`EmptyRectangle3` leaves drop their `«something1»`/`«something3»` lines.
- confidence: MEDIUM (read)

### unknown/jimizu-14-zole306 — usymbol-leaf-entity-color-dropped
- first diff: `svg/g[1]/g[1]/rect[1]/@fill`, ours=#F1F1F1 jar=#FFF.
- Java: `svek/image/EntityImageDescription.java:164-166`: "HColor backcolor = colors.getColor(ColorType.BACK); if (backcolor == null) backcolor = styleTitle.value(PName.BackGroundColor)...".
- port: `src/diagrams/class/renderer-usymbol-entity.ts:170`: "backcolor: resolveElementPaint(theme, symbolKeyword, 'background'),". The classifier carries `color: '#White'` (AST dump).
- mechanism: `buildUSymbolEntityParams` builds the paint from theme-level element colours only, so the entity's own `#White` BACK colour, which is parsed and present on the classifier, never reaches `EntityImageDescription`.
- confidence: MEDIUM (AST instrumented, draw path read)

### unknown/doboco-09-doba683 — badge-leaftype-spot-unported
- first diff: `svg/g[1]/g[1]/ellipse[1]/@fill`, ours=#ADD1B2 jar=#7E57C2; glyph path ours=`C` jar=`D`.
- Java: `svek/image/EntityImageClassHeader.java:221-222`: "case DATACLASS: return StyleSignatureBasic.of(SName.root, SName.element, SName.spot, SName.spotDataClass);" and `:253-254` "case DATACLASS: return 'D';"; `skin/plantuml.skin:267-269` "spotDataClass { BackgroundColor #7E57C2 }".
- port: `src/diagrams/class/class-badge.ts:309-332`: `badgeLetter` handles interface/abstract/enum/annotation/protocol/entity and otherwise "default: return 'C';". `badgeFill` (`:172`) has no dataclass entry. The AST is `kind:'dataclass'`.
- mechanism: The parser ported the dataclass/struct/exception/metaclass/stereotype kinds, but the badge still maps them to the class letter and fill. Upstream gives each LeafType its own circled character and `spot<Kind>` style.
- confidence: MEDIUM (AST instrumented, badge read)

### unknown/girapu-90-pise235 — badge-leaftype-spot-unported
- first diff: `svg/g[1]/g[1]/ellipse[1]/@fill`, ours=#ADD1B2 jar=#CCC (`M`); `g[2]` ours=#ADD1B2 jar=#F7F (`S`).
- Java: `EntityImageClassHeader.java:217-220,249-252` (METACLASS 'M' / STEREOTYPE 'S'); `plantuml.skin:261-266`.
- port: `class-badge.ts:309-332`, `:172`.
- mechanism: As doboco, for metaclass and stereotype.
- confidence: MEDIUM

### unknown/jodasa-29-zara935 — badge-leaftype-spot-unported
- first diff: `svg/g[1]/g[2]/ellipse[1]/@fill`, ours=#ADD1B2 jar=#D94321 (`X`).
- Java: `EntityImageClassHeader.java:215-216,247-248` (EXCEPTION 'X'); `plantuml.skin:258-260`.
- port: `class-badge.ts:309-332`, `:172`.
- mechanism: As doboco, for exception.
- confidence: MEDIUM

### unknown/xusuxi-66-zaci221 — badge-leaftype-spot-unported
- first diff: `svg/g[1]/g[2]/ellipse[1]/@fill`, ours=#ADD1B2 jar=#F1F1F1 (the letter `P` already matches).
- Java: `EntityImageClassHeader.java:211-212` (`spotProtocol`). `plantuml.skin` declares no `spotProtocol` block, so the merged spot style inherits the element BackGroundColor.
- port: `class-badge.ts:172` (`badgeFill` default is the class green).
- mechanism: `badgeFill` gives un-surveyed kinds the class green. Upstream's `spotProtocol` style has no skin entry and falls back to #F1F1F1.
- confidence: MEDIUM

### unknown/zelura-55-pasa982 — badge-leaftype-spot-unported
- first diff: `svg/g[1]/g[2]/ellipse[1]/@fill`, ours=#ADD1B2 jar=#F1F1F1; glyph ours=`C` jar=`S`.
- Java: `EntityImageClassHeader.java:213-214,245-246` (STRUCT 'S', `spotStruct`, no skin entry).
- port: `class-badge.ts:309-332`, `:172`.
- mechanism: As doboco/xusuxi, for struct.
- confidence: MEDIUM

### unknown/mupavi-50-fijo192 — package-header-multi-stereotype-truncated
- first diff: `svg/g[1]/g[2]/text[1]/@font-style` (positional). The jar draws `«A»`+`«B»` for foo2 and `«Foo»`,`«Node»`,`«Bar»` for foo3; ours draws only `«A»` / `«Foo»`.
- Java: `stereo/StereotypePattern.java:66-67`: "new RegexLeaf(1, param, \"(\\\\<\\\\<.+?\\\\>\\\\>)\")". In `CommandPackage.java:88` nothing after STEREOTYPE can absorb a second `<<…>>`, so the lazy group widens to `<<A>><<B>>`.
- port: `src/diagrams/class/class-command-containers.ts:91`: "String.raw`\\s*(?:[#<][^{]*)?\\{(\\s*\\})?\\s*$`". The trailing `[#<]` catch-all swallows `<<B>>`, so the lazy `(<<.+?>>)` stops at `<<A>>`.
- mechanism: A catch-all the port added after the stereotype slot lets the lazy stereotype capture end at the first `<<…>>`, so every later label is lost. AST: `ns.stereotype = "A"`/`"Foo"`.
- confidence: HIGH (AST instrumented)

### unknown/pijugo-91-jilo150 — namespace-title-bypasses-creole
- first diff: `svg/g[1]/g[2]/text[1]/text()`, ours=`<<profile>> profile` jar=`«profile» profile` (textLength 109.2 vs 91.875).
- Java: `svek/ClusterHeader.java:128`: "TextBlock result = label.create(fontConfiguration, alignment, g.getSkinParam());" goes through `klimt/creole/legacy/CreoleParser.java:175`: "stripes = createStripes(skinParam.guillemet().manageGuillemet(cs.toString()), ...".
- port: `src/diagrams/class/class-namespace-title-runs.ts:159`: "for (const atom of buildLineAtoms(label, font).atoms) {". This is the raw StripeSimple lexer, with no `CreoleParser` guillemet step.
- mechanism: Namespace/package titles are lexed directly by `buildLineAtoms` instead of going through the full creole sheet. `CreoleParser`'s per-line `manageGuillemet` never runs, so `<<…>>` in a title is neither converted nor measured as `«…»`.
- confidence: MEDIUM (read)

### unknown/xukono-55-nezi535 — namespace-title-bypasses-creole
- first diff: identical to pijugo (`package "<<profile>> profile"`).
- Java / port / mechanism: as pijugo.
- confidence: MEDIUM

### unknown/zasuxe-15-lugo662 — namespace-title-bypasses-creole (+ descriptive-leaf-code-bracket-not-stripped)
- first diff: `svg/g[1]/g[1]/text[1]` (element name), ours=text jar=a. The jar wraps the title "to confluence page" in an `<a href="link">` underlined in #00F; ours prints the raw `[[link to confluence page]]`.
- Java: `svek/ClusterHeader.java:128` (full creole display, where `CommandCreoleUrl` builds a url atom).
- port: `class-namespace-title-runs.ts:159-169`. Only `'text'`/`'inline'` atoms are kept, and then "return runs.length > 0 ? runs : [{ kind: 'text', text: label, font }];". A url-only title yields no runs and falls back to the raw label.
- mechanism: As pijugo. The title bypasses the creole sheet, so the `[[url label]]` atom is dropped and the raw markup is drawn.
- secondary (DOT; dotEqual=False, clusterOk/size 0.229 in): `component [abc-service]` keeps its brackets. The id is `abc.[abc-service]` and the display `[abc-service]` (width 169.875 vs 153.375). Upstream strips them at `CommandCreateElementFull2.java:249`: "final String idShort = StringUtils.eventuallyRemoveStartingAndEndingDoubleQuote(codeRaw);" with the `"\"([:"` set (`StringUtils.java:86-90`). The port's `parseClassifierDecl` → `parseIdDisplay` (`class-declaration-parser.ts:167`) applies the class grammar, which strips only quotes.
- confidence: MEDIUM (primary read). The secondary is HIGH (AST dump plus the DOT diff).

### unknown/tonake-05-zibo183 — legend-document-background-cascade
- first diff: `svg/g[1]/g[1]/rect[1]/@fill` (legend), ours=#DDD jar=none.
- Java: `style/FromSkinparamToStyle.java:180`: "addConvert(\"BackgroundColor\", PName.BackGroundColor, SName.document);". `EntityImageLegend.java:49-51` merges `{root, root, document, <diagram>, legend}`. `StyleStorage.java:102-116` merges every matching style with `OVERWRITE_EXISTING_VALUE`, and the precedence is the value's `AutomaticCounter` priority (`FromSkinparamToStyle.java:357`), so the later skinparam `document` value outranks the skin's `document { legend { BackGroundColor #D } }`.
- port: `src/core/annotations/annotation-skinparam.ts:120-123`: "for (const [rawKey, value] of skinparam) { const key = normaliseAnnotationKey(rawKey); if (!key.startsWith(prefix)) continue;". Only `legend*` keys reach the legend.
- mechanism: `skinparam BackgroundColor transparent` is a `document`-level style that upstream merges into the legend's signature. The port applies only legend-prefixed skinparams, so the legend keeps the skin's #DDD.
- confidence: MEDIUM (read; the priority rule is inferred from the jar's `none`)

### unknown/pavozu-43-tone454 — legend-document-background-cascade (+ creole-titled-horizontal-line-literal)
- first diff: `svg/g[1]/g[1]/rect[1]/@fill`, ours=#DDD jar=none.
- Java / port / mechanism: as tonake.
- secondary: `..My title..` and `-- Next is KO --` render as literal text in ours (`text[6]` "..My title.." vs "My title"). Upstream classifies them as `HORIZONTAL_LINE` with a title (`CreoleStripeSimpleParser.java:112-116`: "final Matcher2 m7 = DOUBLE_DOT_DELIMITED_LINE.matcher(line, 0); if (m7.find()) { this.line = m7.group(1); this.style = new StripeStyle(StripeStyleType.HORIZONTAL_LINE, 0, '.');") and draws them with `CreoleHorizontalLine.create(fontConfiguration, line, ...)` (`StripeSimple.java:154-155`). The port returns `LITERAL` for any non-empty capture (`CreoleStripeSimpleParser.ts:120-122` `bareOrLiteral`), and `CreoleParser.ts:410-412` passes `''` as the title.
- confidence: MEDIUM

### unknown/terede-92-fuka839 — legend-style-maximumwidth-ignored
- first diff: `svg/g[1]/g[1]/text[1]/text()`, ours=the whole paragraph on one line jar=`facilisi.`. The jar wraps into 143 texts; ours has 2.
- Java: `activitydiagram3/ftile/EntityImageLegend.java:53-54`: "return style.createTextBlockBordered(note, ..., Style.ID_LEGEND, style.wrapWidth());". `Style.wrapWidth()` reads `PName.MaximumWidth`, which `<style> legend { MaximumWidth 100 }` sets directly.
- port: `src/core/annotations/blocks-creole.ts:477`: "const block = buildChromeCreoleBlock(lines, style, LineBreakStrategy.NONE, paint.sprites);". The doc comment at `:426-436` assumes that only a skinparam could set it.
- mechanism: The legend's line-break strategy is hard-wired to NONE, so a `<style>` `MaximumWidth` never wraps the legend.
- confidence: MEDIUM (read)

### unknown/nadedo-37-nesa665 — json-leaf-maximumwidth-ignored
- first diff: `svg/g[1]/g[1]/text[3]/text()`, ours=the full sentence jar=`aliqua.`. The jar's `g[1]` has 39 children; ours has 6.
- Java: `cucadiagram/BodierJSon.java:85`: "return new TextBlockCucaJSon(fontConfiguration, skinParam, json, style.wrapWidth());" → `TextBlockCucaJSon.java:186` "display.create0(..., wordWrap, ...)".
- port: `src/diagrams/class/class-json-sizing.ts:322-346`. Only `MinimumWidth` is applied (`floorAtMinimumWidth`, `:346`); no line-break strategy is threaded into the value cells.
- mechanism: `<style> json { MaximumWidth 200 }` wraps json value text upstream. The port measures and draws each value on one line.
- confidence: MEDIUM (read)

### unknown/negupo-97-loro420 — json-node-edge-shield-port
- first diff: `maxDelta@svg/g[1]/g[3]/text[1]/@x` (layout shift). dotEqual=False.
- Java: `svek/image/EntityImageJson.java:240-242`: "return ShapeType.RECTANGLE_HTML_FOR_PORTS;". `svek/SvekNode.java:133-137` emits the special-for-link table, and the jar's `svek-1.dot` references `sh0006->sh0007` with no port.
- port: `src/diagrams/class/class-port-rows.ts:221-230` sets `portRows` for `map` only. `src/core/svek-dot-emit.ts:122` then gives every other `plaintext` node "return `${rec.sh}:h`;".
- mechanism: A json leaf is plaintext with no `portRows`, so the port treats it as a shielded node and anchors all 3 magma (packing) edges at `:h`. Upstream's RECTANGLE_HTML_FOR_PORTS json nodes take plain endpoints. The different anchoring moves b/c/d (b x 119 vs 108.575, c y 191 vs 183), which narrows the graph below the title width and re-centres it.
- confidence: HIGH (instrumented: `compareStructural` shows only `portOk:false`, with candidate edges `fromPort/toPort:"h"` and oracle edges none)

### unknown/potase-97-japa248 — member-method-params-reformatted
- first diff: `svg/g[1]/g[5]/text[3]/text()`, ours=`__construct(FOORepositoryInterface)` jar=`__construct( FOORepositoryInterface )`.
- Java: `cucadiagram/Member.java:133-137`: "this.display = StringUtils.trin(Guillemet.GUILLEMET.manageGuillemet(displayClean.substring(1)));". The display is the verbatim source text.
- port: `src/diagrams/class/class-member-parser.ts:175-185`: "const rawParams = methodMatch[2]!.trim(); ... rawParams.split(',').map((p) => p.trim())". `class-layout-helpers.ts:128` then rebuilds it: "return `${member.name}(${member.params.join(', ')})${typeSuffix}`;".
- mechanism: The port decomposes a method into name and params, then re-serialises it, which normalises the whitespace inside the parentheses. Upstream draws the raw member text. The preprocessor output keeps `( FOORepositoryInterface )` (instrumented).
- confidence: HIGH (instrumented: preprocessed line and parsed member dumped)

### unknown/zaxavo-08-rake498 — member-method-params-reformatted
- first diff: `svg/g[1]/g[5]/text[3]/text()`, ours=`__construct(OrderRepositoryInterface)` jar=`__construct( OrderRepositoryInterface )`.
- Java / port / mechanism: as potase.
- confidence: HIGH (instrumented: member `params:["OrderRepositoryInterface"]`)

### unknown/fukegu-14-zona532 — class-note-text-alignment-unported (+ degenerate-single-note-leaf)
- first diff: `maxDelta@svg/g[1]/g[1]/text[3]/@x`, ours=12 jar=36.156 (`skinparam noteTextAlignment center`: the jar centres each line, ours leaves every line at x=12).
- Java: `style/FromSkinparamToStyle.java:178`: "addConvert(\"noteTextAlignment\", PName.HorizontalAlignment, SName.note);" and `svek/image/EntityImageNote.java:112`: "final HorizontalAlignment horizontalAlignment = style.getHorizontalAlignment();".
- port: `src/diagrams/class/renderer-note.ts:253`: "renderNoteLineAtoms(note.lineAtoms[i]!, note.x + marginX1, ...)". Every line starts at the left margin, and no alignment is resolved anywhere in the class note path.
- mechanism: The class note body is always left-aligned. The note's style HorizontalAlignment (from `noteTextAlignment`) is never read.
- secondary: every coordinate is 1 px less than the jar's, and the canvas is 1 px wider and taller. The jar has no svek dot for this lone note: `GraphvizImageBuilder.java:214-221` wraps it in `EntityImageDegenerated` (delta 7). The port runs a DOT graph because `class-geo-builders.ts:348` ("if (ast.classifiers.length !== 1 || ast.notes.length !== 0) return undefined;") excludes a note-only diagram, as its doc comment admits ("A lone freestanding note ... falls through to the normal dot path").
- confidence: MEDIUM for the primary (read). The secondary is HIGH (instrumented: jar 0 svek dots, port 1 layout graph).

### unknown/logavi-03-mita108 — class-note-text-alignment-unported (+ degenerate-single-note-leaf)
- first diff: `maxDelta@svg/g[1]/g[1]/text[3]/@x` (`noteTextAlignment right`).
- Java / port / mechanism: as fukegu.
- confidence: MEDIUM for the primary; HIGH for the secondary (instrumented)

### unknown/rizisu-50-liza998 — desc-atom-text-tab-draw
- first diff: `svg/g[1]/g[1]/text[2]/@x`, ours=17 jar=73; `text[3]` ours=17 jar=129.
- Java: `klimt/creole/legacy/AtomText.java:210-231`: "final StringTokenizer tokenizer = new StringTokenizer(text, \"\\t\" + Jaws.BLOCK_E1_REAL_TABULATION, true); ... if (s.equals(\"\\t\") ...) { final double remainder = x % tabSize; x += tabSize - remainder; } else { ... ug.apply(new UTranslate(x, ypos)).draw(utext); x += dim.getWidth(); }".
- port: `src/core/svek/image/EntityImageDescriptionDelegates.ts:213-215`: "if (atom.kind === 'text') { const m = measureLine(...); ug.apply(new UTranslate(0, m.height - m.descent)).draw(UText.build(atom.text, atom.font));". The atom is drawn at x=0 with no tab tokenizer.
- mechanism: The description-leaf text atom is sized with the tab rule, so the rect width 154.488 equals the jar's (56 = `fontSize*4` per tab, `AtomText.ts:19-33`). The draw emits the whole run at the atom origin, so tab-indented lines are not shifted.
- confidence: MEDIUM (the size match is measured; the draw path is read)

### unknown/sapofa-97-gizu737 — parenthesis-element-code-as-display
- first diff: `svg/g[1]/g[1]/text[1]` (element name), ours=text (`theta`) jar=image (the LaTeX render).
- Java: `descdiagram/command/CommandCreateElementParenthesis.java:94-104`, the third alternative: "new RegexLeaf(1, \"CODE3\", CommandCreateElementFull.CODE), ... new RegexLeaf(\"as\"), ... new RegexLeaf(1, \"DISPLAY3\", CommandCreateElementFull.DISPLAY)". `() theta as "<latex>…"` means code=`theta`, display=`<latex>\theta</latex>`.
- port: `src/diagrams/class/class-command-containers.ts:176-179`: "pattern: /^\\(\\)\\s+(?:\"([^\"]*)\"|(\\S+))(?:\\s+as\\s+(\\S+))?\\s*$/ ... ensureClassifier(state, match[3] ?? name, 'circle', name)". Only the `DISPLAY as CODE` reading exists.
- mechanism: The port reads every `() X as Y` as display-then-alias, so `theta` becomes the display and the quoted latex becomes the id (AST: `id:"<latex>\\theta</latex>", display:"theta"`). The latex markup therefore never reaches the label. After the fix, the residual is image bytes only: a permanent approved divergence (`DIVERGENCES.md:317-339`, KaTeX vs JLaTeXMath), so the fixed row should become `accept-candidate:latex-image-bytes`, not stay open.
- confidence: HIGH (AST instrumented)

### unknown/jixipo-21-mefu703 — creole-url-hyperlink-color-hardcoded (+ class-decl-as-case-sensitive, member-double-bracket-url-stripped)
- first diff: `svg/g[1]/g[1]/a[1]/text[1]/@fill` (title link), ours=#00F jar=#F00 (`<style> root { HyperlinkColor #FF0000 }`).
- Java: `klimt/creole/legacy/StripeSimple.java:224-225`: "atoms.add(AtomTextUtils.createUrl(url, fontConfiguration, skinParam));". The url atom takes the `FontConfiguration`'s hyperlink colour, which is built from the merged style (`FontConfiguration.java:57-60`). `SkinParam.java:305-308` falls back to BLUE only when nothing is set.
- port: `src/core/klimt/creole/command/CommandCreoleUrl.ts:60`: "const HYPERLINK_COLOR = '#0000FF';", applied unconditionally at `:94`.
- mechanism: The creole url colour is a constant in the port, so `root`- or stereotype-scoped `HyperlinkColor` never reaches any link (title, member, class name).
- secondary: (a) `class TRES AS "…"` becomes the id `TRES AS ""`. The port's `as` regexes are case-sensitive (`class-declaration-extractors.ts:362,379,390`), while upstream compiles every pattern with `Pattern.CASE_INSENSITIVE` (`regex/Pattern2.java:114`). (b) Member `+ [[modelo normal]]` is dropped at parse. `class-member-parser.ts:29` `TRAILING_URL_RE = /\s*(\[{2,3}[^\]]*\]{2,3})\s*$/` strips a double-bracket url, which empties the line, and `:286` returns null. Upstream's member-url pattern needs a third bracket (`Member.java:93` "^(.*?)(?:\\[(" + UrlBuilder.getRegexp() + ")\\])?$"), so `[[…]]` stays in the display as a creole link.
- confidence: MEDIUM for the primary (read). The secondaries are HIGH (AST: id `TRES AS ""`; uno's members lack the url row).

### unknown/zivenu-37-nace681 — creole-url-hyperlink-color-hardcoded (+ class-decl-as-case-sensitive, member-double-bracket-url-stripped)
- first diff: `svg/g[1]/g[1]/a[1]/text[1]/@fill`, ours=#00F jar=#F00. Also `g[3]` `.otro` link #0FF.
- Java / port / mechanism: as jixipo. The stereotype-scoped `.normal`/`.otro { HyperlinkColor }` is also dropped.
- confidence: MEDIUM (primary); HIGH (secondaries, same source shape as jixipo)
