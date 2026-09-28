# S2 (edge shard) diagnosis — cdd5 T7

45 rows. Java = `~/git/plantuml` branch `dot-output` (paths under
`src/main/java/`). Port = `~/git/knowvah/plantuml-ts`. Renders:
`plans/class-divergence-drive/measurements/out/unknown__<slug>.{ours,jar}.svg`.
DOT evidence: the survey's own `setLayoutInputObserver` + `compareStructural`,
re-run per row (scratch script). "Instrumented" = a gated experiment in a
scratch copy of `src/` (never committed) that closed or moved the row.

## Families

| family | rows | Java file:line | port file:line | size | write-set |
|---|---|---|---|---|---|
| descriptive-usymbol-render-allowlist | 11 | `net/sourceforge/plantuml/svek/GeneralImageBuilder.java:160-167`, `:200-204` | `src/diagrams/class/renderer-usymbol-entity.ts:235-249` (+ `:19-25` colour/hexagon not threaded) | M | `renderer-usymbol-entity.ts`; hexagon polygon: `class-geo-types.ts` + the geo builder that carries node polygons |
| badge-glyph-letter-uncaptured | 6 | `net/sourceforge/plantuml/svek/image/EntityImageClassHeader.java:181-184` | `src/diagrams/class/class-badge.ts:430-435`, `class-badge-glyph-data.ts:69-70` | S | `class-badge-glyph-data.ts` (T, H outlines scraped from `dedumo`/`regodu` in.svg) |
| note-target-not-namespace-qualified | 4 | `net/sourceforge/plantuml/command/note/CommandFactoryNoteOnEntity.java:304` | `src/diagrams/class/class-notes.ts:211-212,254` | S | `class-notes.ts` (+ `class-namespace-resolve.ts` reuse) |
| degenerate-check-after-group-mute | 3 | `net/sourceforge/plantuml/dot/DotData.java:69-70`; `svek/GraphvizImageBuilder.java:214`, `:416-418`; `net/atmp/CucaDiagram.java:871-882` | `src/diagrams/class/layout.ts:220,244`; `class-geo-builders.ts:346` | S | `class-geo-builders.ts` (`degenerateSingleClassifier`), `layout.ts` |
| degenerate-excludes-notes | 3 | `net/sourceforge/plantuml/dot/DotData.java:69-70`; `svek/GraphvizImageBuilder.java:214-222` | `src/diagrams/class/class-geo-builders.ts:348` | M | `class-geo-builders.ts`, `layout.ts` (degenerate note geometry) |
| json-node-emitted-as-shield | 3 | `net/sourceforge/plantuml/svek/image/EntityImageJson.java:240-242`; `svek/SvekNode.java:132-136`; `svek/Bibliotekon.java:129-130` | `src/diagrams/class/class-port-rows.ts:220-230`; `src/core/svek-dot-emit-clusters.ts:72`; `src/core/svek-dot-emit.ts:122` | S | `class-port-rows.ts` |
| smetana-pragma-ignored | 3 | `net/atmp/CucaDiagram.java:480-481`; `net/sourceforge/plantuml/sdot/SmetanaEdge.java:215-217` | `src/diagrams/class/class-command-directives.ts:159-164` | M | `class-command-directives.ts`, `ast.ts`, `renderer-edge.ts` (+ `renderer-group.ts` link wrap) |
| diamond-folded-into-association | 2 | `net/sourceforge/plantuml/abel/LeafType.java:76-77`; `svek/GeneralImageBuilder.java:151-152`; `svek/image/EntityImageBranch.java:86-94` | `src/diagrams/class/class-declaration-parser.ts:147`; `renderer.ts:315-318` | S | `class-declaration-parser.ts`, `renderer.ts`, `renderer-assoc-lollipop.ts` |
| edge-label-not-creole | 1 | `net/sourceforge/plantuml/svek/SvekEdge.java:298-299` | `src/diagrams/class/class-edge-label-measure.ts:112`; `renderer-edge-label.ts:145-156` | M | `class-edge-label-measure.ts`, `renderer-edge-label.ts`, `class-edge-label-attach.ts` |
| link-middle-decor-partial | 1 | `net/sourceforge/plantuml/svek/SvekEdge.java:266-268`, `:353-356`, `:441`, `:986` | `src/diagrams/class/class-layout-edge-labels.ts:185-251`; `renderer-arrowhead-middle.ts:139-141` | M | `class-layout-edge-labels.ts`, `class-edge-note-box.ts`, `renderer-arrowhead-middle.ts`, skinparam key plumbing (`src/core/skinparam-accumulator.ts`, `skinparam-theme-builder.ts`) |
| class-note-table-bespoke | 1 | `net/sourceforge/plantuml/svek/image/EntityImageNote.java:207,236-237,284-288`; `klimt/creole/atom/AtomTable.java:127-131` | `src/diagrams/class/renderer-note-lines.ts:46` | M | `renderer-note-lines.ts`, `note-layout-measure-rows.ts` |
| class-portin-unported | 1 | `net/sourceforge/plantuml/svek/GeneralImageBuilder.java:124-127`; `svek/ClusterDotString.java:136-138,228` | `src/diagrams/class/class-descriptive-leaf-keywords.ts:32` (parsed as plain descriptive usymbol) | L | `class-dot-clusters.ts`, `class-dot-graph.ts`, `class-port-rows.ts`, `renderer.ts` |
| class-redeclare-mute-guard-missing | 1 | `net/sourceforge/plantuml/classdiagram/command/CommandCreateClassMultilines.java:245-246`; `abel/Entity.java:209-224` | `src/diagrams/class/class-declaration-parser.ts:268` | S | `class-declaration-parser.ts` |
| embedded-skinparam-hoisted | 1 | `net/sourceforge/plantuml/descdiagram/command/CommandCreateElementMultilines.java:192-193` | `src/core/preprocessor-collector.ts:147,236-238` | M (shared primitive, every engine) | `preprocessor-collector.ts` |
| package-borderstyle-unported | 1 | `net/sourceforge/plantuml/style/FromSkinparamToStyle.java:277`; `svek/image/EntityImageEmptyPackage.java:108` | `src/diagrams/class/class-empty-package.ts:185-197` (no dash); no `*BorderStyle` key anywhere in `src/` | M | `class-empty-package.ts`, `class-package-style.ts`, `src/core/skinparam-accumulator.ts`, `skinparam-theme-builder.ts` |
| harness:pragma-regex-matches-comment | 1 | preprocessor drops `'` lines (jar ran graphviz: `svek-1.dot` present) | `scripts/svg-parity-survey.ts:112,297,201` | S | `scripts/svg-parity-survey.ts` |
| harness:newpage-dot-page-count | 1 | `net/sourceforge/plantuml/NewpagedDiagram.java:119-121` | `src/diagrams/class/class-layout-multipage.ts:60`; `scripts/svg-parity-survey.ts:204` | S | `scripts/svg-parity-survey.ts` (or accept-candidate, see row) |
| accept-candidate:smetana-geometry | 1 | `net/atmp/CucaDiagram.java:480-481` | n/a (dot-engine by ruling 2026-08-09) | — | — |

Secondary mechanisms (no row has them as the FIRST diff; each must land for
the listed rows to close):

| secondary | rows | Java file:line | port file:line |
|---|---|---|---|
| degenerate-check-after-group-mute (parse-time collapse arm) | beboke, fezaro, febuli, fokudi | as above | `src/diagrams/class/class-namespace.ts:74-120` (collapse at `}`), then `class-geo-builders.ts:346` |
| embedded-diagram-in-description-unsupported | josebu, dezobu | `net/sourceforge/plantuml/EmbeddedDiagram.java:75` | `src/core/svek/image/EntityImageDescriptionDelegates.ts:121-128` |
| usymbol-entity colour not threaded | febuli (`#white`), dezobu (`#Motivation`) | `svek/image/EntityImageDescription.java` (entity colours) | `src/diagrams/class/renderer-usymbol-entity.ts:19-21` |
| member double-bracket url stripped | fepoko | `net/sourceforge/plantuml/cucadiagram/Member.java:93` (only `[[[…]]]` is a member url) | `src/diagrams/class/class-member-parser.ts:65-71` |
| edge-label-not-creole (sprite) | kexaba | `svek/SvekEdge.java:298-299` | `class-edge-label-measure.ts:112` |

## Pre-settled (ACCEPTED in fixtures.md)

None: no `ACCEPTED` row carries `shard = S2`.

## Rows

### unknown/baleco-37-lili752 — degenerate-check-after-group-mute
- first diff: `svg/@height`, ours=68 jar=69 (every coordinate Δ1)
- Java: `net/sourceforge/plantuml/dot/DotData.java:69-70` — "return entityFactory.groups().size() == 0 && getLinks().size() == 0 && getLeafs().size() == nb;"; the empty package is muted only later, inside graphviz export: `svek/GraphvizImageBuilder.java:416-418` — "if (dotData.isEmpty(g) && g.getGroupType() == GroupType.PACKAGE) { g.muteToType(LeafType.EMPTY_PACKAGE);"
- port: `src/diagrams/class/layout.ts:220` — "const collapsedAst = collapseEmptyNamespacesFinal(ast);" runs BEFORE `:244` "const degenerate = degenerateSingleClassifier(pageAst, measuredMap);", whose `class-geo-builders.ts:346` "if (ast.namespaces.length !== 0) return undefined;" then sees 0 groups.
- mechanism: the port mutes the empty package into a leaf before the degenerate check, so a lone empty package takes `EntityImageDegenerated` (margin 7, no graphviz) where upstream still counts the group and runs graphviz (margin 6). Observer: jar 1 svek DOT, ours 0 layout inputs.
- confidence: HIGH (instrumented: gating the degenerate path on the pre-collapse group count made the row conformant)

### unknown/beboke-62-zofu377 — descriptive-usymbol-render-allowlist
- first diff: `svg/g[1]/g[1]/path[1]/@d`, ours=class "C" badge glyph, jar=queue right-cap path "M56,6 C51,6 …"
- Java: `net/sourceforge/plantuml/svek/GeneralImageBuilder.java:200-204` — "if (leaf.getLeafType() == LeafType.EMPTY_PACKAGE) { if (leaf.getUSymbol() != null) return new EntityImageDescription(…)"
- port: `src/diagrams/class/renderer-usymbol-entity.ts:238-248` — "classifier.kind === 'descriptive' && (classifier.usymbol === 'actor' || … 'component' || 'database' || 'node' || 'rectangle' || 'package')"
- mechanism: the renderer routes only six USymbols through `EntityImageDescription`; `queue` (traced: kind=descriptive, usymbol=queue) falls through to `renderClassifier` and is drawn as a class box with a C spot. Also: its DOT mismatch (jar 1 DOT, ours 0) is degenerate-check-after-group-mute via the parse-time collapse (`class-namespace.ts:74`). With both fixed in scratch a +1 px offset remains — mechanism unknown, instrument the canvas ink min-x of a graphviz-placed descriptive leaf next.
- confidence: HIGH (instrumented: widening the gate removed all 6 structural diffs)

### unknown/bizasu-70-vaxa243 — json-node-emitted-as-shield
- first diff: `svg/@height`, ours=190 jar=198 (dotEqual false on `portOk`)
- Java: `svek/image/EntityImageJson.java:240-242` — "return ShapeType.RECTANGLE_HTML_FOR_PORTS;"; `svek/SvekNode.java:132-136` — "if (type == ShapeType.RECTANGLE_HTML_FOR_PORTS) { appendLabelHtmlSpecialForLink(sb, stringBounder);"; `svek/Bibliotekon.java:129-130` — "if (result.isShielded()) uid = uid + \":h\";"
- port: `src/diagrams/class/class-port-rows.ts:221-230` sets `portRows` for `map` only ("A map is RECTANGLE_HTML_FOR_PORTS unconditionally"), so a json node reaches `src/core/svek-dot-emit-clusters.ts:72` — "return `${rec.sh} [shape=plaintext,label=<${shieldTable(node, rec.color)}>];`" and `svek-dot-emit.ts:122` — "return `${rec.sh}:h`;"
- mechanism: json leaves are emitted as a SHIELDED table (16 px top/bottom pads, `PORT="h"`, `:h` edge refs) instead of upstream's single-cell HTML_FOR_PORTS table, so graphviz lays out taller nodes (real `dot -Tdot`: jar DOT bb 417.5x184, our DOT bb 424x248).
- confidence: HIGH (instrumented: `portRows=[]` for json made our DOT byte-equal to the jar's and dotEqual true; a Δ1 canvas width remains — instrument dot-engine bb vs real dot's 417.5 next)

### unknown/bonaco-71-xefu608 — class-portin-unported
- first diff: `svg/g[1]/g[2]/rect[1]/@rx`, ours=2.5 jar=absent (port drawn as a class box)
- Java: `svek/GeneralImageBuilder.java:124-127` — "leaf.getLeafType() == LeafType.PORTIN || … PORTOUT) { … return new EntityImagePort(leaf, parent, bibliotekon);"; `svek/ClusterDotString.java:136-138` — "printRanks(Cluster.RANK_SOURCE, withPosition(EntityPosition.getInputs()) …); if (hasPort())"
- port: `src/diagrams/class/class-descriptive-leaf-keywords.ts:32` parses `portin` as an ordinary descriptive usymbol (traced: kind=descriptive, usymbol=portin); no class-engine cluster gets the port branch (our DOT: no `rank=source`, no `zaent` anchor; `portRanks` is set only in `description/` and `state/`).
- mechanism: the class engine has no PORTIN/PORTOUT leaf: the port is laid out as a normal cluster member and drawn as a class box instead of `EntityImagePort` on the cluster border.
- confidence: MEDIUM (read + trace, not instrumented)

### unknown/catigu-77-keje426 — degenerate-check-after-group-mute
- first diff: `svg/@height`, ours=68 jar=69
- Java / port: as baleco.
- mechanism: as baleco (`package test { }`).
- confidence: HIGH (instrumented, conformant under the experiment)

### unknown/cejegu-93-kobo234 — note-target-not-namespace-qualified
- first diff: `svg/g[1]/g[4]/path[1]/@d`, ours=plain note outline, jar=opale outline with the arrow bump "L224.17,81 L258.66,77 L224.17,73"
- Java: `command/note/CommandFactoryNoteOnEntity.java:304` — "final Quark<Entity> quark = diagram.quarkInContext(true, idShort);"
- port: `src/diagrams/class/class-notes.ts:211-212,254` — "const resolvedHostId = stripQuotes(hostId);" … "target: resolvedHostId," (raw id, never qualified by `opts.namespace`)
- mechanism: a `note … of X` inside a namespace keeps the bare target `X` while the class id is `ns.X`, so the note edge points at a non-node (our DOT: edge `__note_0 -> PragmaStringMultiTest`, dropped; jar 2 edges, ours 1) and the note loses its opale connector (hence also `path[2]@stroke-width` 1 vs 0.5: the non-opale corner is drawn un-stroked).
- confidence: HIGH (instrumented: qualifying the target against the namespace closed all four rows)

### unknown/colede-79-give418 — class-note-table-bespoke
- first diff: `svg/g[1]/g[1]/line[1]/@stroke-width`, ours=0.5 jar=1 (and childCount 9 vs 11: no cell-background rects)
- Java: `svek/image/EntityImageNote.java:207` — "final UGraphic ug2 = UGraphicStencil.create(ug, this, UStroke.simple());"; `drawNormal` `:284-288` strokes only the polygon ("stroked.draw(polygon)") and draws the text on the un-stroked `ug` ("getTextBlock().drawU(ug.apply(new UTranslate(marginX1, marginY)))"), while the opale branch `:236-237` draws the text on `stroked`; `klimt/creole/atom/AtomTable.java:127-131` — "if (cellBackColor != null) { … .draw(URectangle.build(x2 - x1, y2 - y1));"
- port: `src/diagrams/class/renderer-note-lines.ts:46` — "const TABLE_GRID_STROKE_WIDTH = 0.5;" (fitted to the single attached/opale note `jovigo-38-tuni063`), and the bespoke grid/cell renderer emits no cell back rects (the faithful `src/core/klimt/creole/atom/AtomTable.ts:121-140` is not used).
- mechanism: table grid rules inherit the note's current stroke — 1 for a freestanding (`drawNormal`) note, 0.5 for an opale one — but the port hard-codes 0.5, and its bespoke table renderer drops `<#color>` cell backgrounds.
- confidence: MEDIUM (read; the two jar values match the two branches, not instrumented)

### unknown/daroli-95-remo515 — degenerate-check-after-group-mute
- first diff: `svg/@height`, ours=68 jar=69
- Java / port: as baleco (`package { together { } }`: upstream groups()=2).
- mechanism: as baleco.
- confidence: HIGH (instrumented, conformant under the experiment)

### unknown/dedumo-33-paco879 — badge-glyph-letter-uncaptured
- first diff: `svg/g[1]/g[1]/path[1]/@d`, ours="C" glyph (Q curves), jar="T" glyph "M31.864,30.25 L29.415,30.25 …"
- Java: `svek/image/EntityImageClassHeader.java:181-184` — "if (stereotype != null && stereotype.getCharacter() != 0) return new CircledCharacter(stereotype.getCharacter(), …"
- port: `src/diagrams/class/class-badge.ts:430-435` — "if (upper !== undefined && CAPTURED_BADGE_LETTERS.has(upper)) { return upper as BadgeLetter; } return badgeLetter(kind);"; `class-badge-glyph-data.ts:69-70` has no `T`/`H`.
- mechanism: `<< (T,#FFAAAA) >>` asks for a `T` spot; the port's captured-outline table has no `T`, so it falls back to the kind letter `C`.
- confidence: HIGH (read; the fallback branch is the only path that yields C for a `(T,…)` stereotype)

### unknown/deployment-last-name-multi-line-0 — descriptive-usymbol-render-allowlist
- first diff: `svg/g[1]/g[1]/path[1]/@d`, ours=class badge, jar=file fold "M46.662,7 L46.662,14.5 A2.5,2.5 …"
- Java: `svek/GeneralImageBuilder.java:160-167` — "if (leaf.getLeafType() == LeafType.DESCRIPTION) { … return new EntityImageDescription(leaf, portionShower, links, bibliotekon);"
- port: `renderer-usymbol-entity.ts:238-248` (no `file`).
- mechanism: `file` is not in the render allowlist, so the leaf is drawn as a class box (and its 3-line display as one `<text>`).
- confidence: HIGH (instrumented: conformant with the gate widened)

### unknown/dezobu-62-vuzu421 — embedded-skinparam-hoisted
- first diff: `svg/@background`, ours=#CCCCFF jar=#FFFFFF
- Java: `descdiagram/command/CommandCreateElementMultilines.java:192-193` — "lines = lines.subExtract(1, 1); Display display = lines.toDisplay();" (the `{{ … skinparam backgroundColor #Motivation … }}` lines are the element's display, never dispatched to `CommandSkinParam`)
- port: `src/core/preprocessor-collector.ts:147` `accept()` / `:236-238` — "const single = RE_SKINPARAM_LINE.exec(trimmed); if (single !== null) { this.setSkinparam(…)" with no `{{`/`}}` depth tracking
- mechanism: the preprocessor collector hoists every `skinparam` line document-wide, including those inside an embedded `{{ }}` block, so the inner diagram's `backgroundColor` becomes the outer document's. Also on this row: embedded-diagram-in-description-unsupported (`EntityImageDescriptionDelegates.ts:121-128` throws, jar draws a 367x75 `<image>`; jar has 2 svek DOTs, ours 0), the entity colour `#Motivation` is not threaded (`renderer-usymbol-entity.ts:19-21`), the `<<$archimate/…>>` stereotype sprite is not drawn, and the display keeps its quotes in the jar (`"Scrum Pillars"`).
- confidence: MEDIUM (read; the embedded block is the only `backgroundColor` in the source)

### unknown/fakone-16-boro774 — smetana-pragma-ignored
- first diff: `svg/g[1]/g[3]/path[1]`, ours=`path` jar=`line` (link children order)
- Java: `net/atmp/CucaDiagram.java:480-481` — "else if (this.isUseSmetana() || this.dotIsAvailable() == false) maker = new CucaDiagramFileMakerSmetana(this);"; `sdot/SmetanaEdge.java:215-217` — "printExtremityAtStart(dotPath, ugStart); printExtremityAtEnd(dotPath, ugEnd); ug.apply(stroke).apply(color).draw(dotPath);"
- port: `src/diagrams/class/class-command-directives.ts:159-164` — "pattern: /^!pragma\s+[A-Za-z_]…/, execute() { /* ignored … */ }"
- mechanism: the class engine discards `!pragma layout smetana`, so edges are drawn with SvekEdge structure (path first, `id`/`codeLine`, `<!--link-->` comment) instead of SmetanaEdge's (extremities first, bare path, no comment). The numeric deltas (height 178 vs 160) are Smetana arithmetic — not a target (ruling 2026-08-09).
- confidence: MEDIUM (read, not instrumented)

### unknown/febuli-89-dusi249 — descriptive-usymbol-render-allowlist
- first diff: `svg/g[1]/g[1]/ellipse[1]`, ours=`ellipse` (class badge) jar=`path` (frame tab)
- Java / port: as beboke (`frame … { }` → EMPTY_PACKAGE with USymbol FRAME).
- mechanism: `frame` (traced) is outside the allowlist. Also: degenerate-check-after-group-mute (jar 1 DOT, ours 0), and the frame's `#white` is not threaded (`renderer-usymbol-entity.ts:19-21`; experiment residual `rect@fill` #F1F1F1 vs #FFF), plus the +1 px residual noted on beboke.
- confidence: HIGH (instrumented: the gate removed the badge/structure diffs; residuals listed)

### unknown/fepoko-61-fona364 — badge-glyph-letter-uncaptured
- first diff: `svg/g[1]/g[1]/path[1]/@d`, ours="C" glyph jar="H" glyph "M56.493,17.107 L58.942,17.107 …"
- Java / port: as dedumo (`<< (H,#E6FFE6) >>`).
- mechanism: no captured `H` outline, so fallback to `C`. Also: the member `-is_abstract [[ blaha(xyz,12) { tooltip } ]]` — upstream `cucadiagram/Member.java:93` treats only `[[[…]]]` as a member url, so the double-bracket stays in the display and is drawn as a creole link (84 px, jar width 197 vs ours 113); the port strips it (`class-member-parser.ts:65-71`).
- confidence: HIGH for the glyph (read); MEDIUM for the url secondary (read)

### unknown/fepudo-00-ziro735 — descriptive-usymbol-render-allowlist
- first diff: `svg/g[1]/g[1]/path[1]/@d`, ours=class badge, jar=file fold
- Java / port: as deployment-last-name-multi-line-0 (same source).
- mechanism: `file` outside the allowlist.
- confidence: HIGH (instrumented: conformant with the gate widened)

### unknown/fetajo-61-sesi146 — degenerate-excludes-notes
- first diff: `svg/@height`, ours=44 jar=43 (every coordinate Δ1, ours at 6 vs jar 7)
- Java: `dot/DotData.java:69-70` counts `getLeafs()`, which includes the NOTE leaf; `svek/GraphvizImageBuilder.java:214-222` — "if (dotData.isDegeneratedWithFewEntities(1) && … ) { … return new EntityImageDegenerated(tmp, getBackcolor());"
- port: `src/diagrams/class/class-geo-builders.ts:348` — "if (ast.classifiers.length !== 1 || ast.notes.length !== 0) return undefined;"
- mechanism: a lone note is a single leaf upstream and takes the degenerate path (no graphviz, margin 7); the port counts only classifiers, so it runs graphviz (margin 6). Observer: jar 0 svek DOT, ours 1 layout input.
- confidence: HIGH (observer-instrumented DOT count; offset direction matches the two margins)

### unknown/fezaro-08-nopo877 — descriptive-usymbol-render-allowlist
- first diff: `svg/g[1]/g[2]/rect[1]/@stroke`, ours=#181818 (class box) jar=none (stack body)
- Java / port: as beboke (`stack stack2 { }`).
- mechanism: `stack` outside the allowlist. Also: degenerate-check-after-group-mute (jar 1 DOT, ours 0). With both fixed in scratch a 0.5 px x offset of the stack remains (title present) — mechanism unknown, instrument the stack's graphviz node x vs the titled canvas translate next.
- confidence: HIGH (instrumented)

### unknown/fipezo-93-zimi512 — descriptive-usymbol-render-allowlist
- first diff: `svg/g[1]/g[2]/path[1]/@d`, ours=class badge, jar=folder outline
- Java: `command/CommandPackage.java:179-180` — "final USymbol usymbol = USymbols.fromString(stereotype, …" (`<<Folder>>` selects FOLDER) then `GeneralImageBuilder.java:200-204`.
- port: `renderer-usymbol-entity.ts:238-248` (traced: node1 kind=descriptive, usymbol=folder).
- mechanism: `folder` outside the allowlist. DOT is equal; a uniform +1 px x shift remains with the gate widened — same unresolved residual as beboke.
- confidence: HIGH (instrumented)

### unknown/fokudi-24-limo685 — package-borderstyle-unported
- first diff: `svg/g[1]/path[1]/@stroke-dasharray`, ours=absent jar=7,7
- Java: `style/FromSkinparamToStyle.java:277` — "addConvert(cleanName + \"BorderStyle\", PName.LineStyle, sname);"; `svek/image/EntityImageEmptyPackage.java:108` — "this.stroke = style.getStroke(colors);"
- port: `src/diagrams/class/class-empty-package.ts:185-197` returns only `strokeWidth`/`border`/`fill`, and no `*BorderStyle` skinparam key exists anywhere in `src/`.
- mechanism: `skinparam package { BorderStyle dashed }` is never converted to a LineStyle, and the empty-package leaf paint has no dash field. Also: degenerate-check-after-group-mute (all Δ1 numerics; gone under the experiment, leaving only the two dasharray diffs).
- confidence: HIGH for the degenerate part (instrumented); MEDIUM for BorderStyle (read)

### unknown/galata-74-luka487 — degenerate-excludes-notes
- first diff: `svg/@height`, ours=83 jar=82
- Java / port: as fetajo.
- mechanism: as fetajo (lone `note as N1`).
- confidence: HIGH (observer: jar 0 DOT, ours 1)

### unknown/gegosa-79-mini423 — diamond-folded-into-association
- first diff: `svg/g[1]/polygon[1]`, ours=bare `polygon` jar=`g` (entity group, id ent0017)
- Java: `abel/LeafType.java:76-77` — "if (type.startsWith(\"DIAMOND\")) return LeafType.STATE_CHOICE;"; `svek/GeneralImageBuilder.java:151-152` → `EntityImageBranch`, whose `svek/image/EntityImageBranch.java:86-94` wraps the polygon: "group.put(UGroupType.CLASS, \"entity\"); … ug.startGroup(group); … ug.closeGroup();"
- port: `src/diagrams/class/class-declaration-parser.ts:147` — "if (rawKind === 'diamond') return { kind: 'association' };" and `renderer.ts:315-318` draws `association` unwrapped (correct only for `EntityImageAssociation`).
- mechanism: `diamond X` was folded onto the `<>` association kind on the claim the two images are identical, but `EntityImageBranch` opens an entity group and `EntityImageAssociation` does not.
- confidence: MEDIUM (read, not instrumented)

### unknown/japode-92-famo984 — smetana-pragma-ignored
- first diff: `svg/g[1]/g[9]/path[1]`, ours=`path` jar=`line`
- Java / port: as fakone.
- mechanism: as fakone (4 crow's-foot links, 11 structural order diffs); numerics are Smetana arithmetic.
- confidence: MEDIUM

### unknown/josebu-55-seje426 — descriptive-usymbol-render-allowlist
- first diff: `svg/g[1]/g[1]/path[1]/@d`, ours=class badge, jar=frame tab "M34.333,7 L34.333,12 L27.333,19 L7,19"
- Java / port: as deployment-last-name-multi-line-0 (`frame FooBar [ … ]`, traced usymbol=frame).
- mechanism: `frame` outside the allowlist. Also: embedded-diagram-in-description-unsupported (`src/core/svek/image/EntityImageDescriptionDelegates.ts:121-128` throws, logged on stderr) — with the gate widened the row still differs by childCount 3 vs 2 and height 92 vs 190 (the missing embedded image).
- confidence: HIGH (instrumented)

### unknown/kefuna-77-kago547 — descriptive-usymbol-render-allowlist
- first diff: `svg/g[1]/g[3]/path[1]/@d`, ours=class badge, jar=frame tab
- Java / port: as fipezo (`package FrameA <<Frame>> { }`, traced usymbol=frame).
- mechanism: `frame` outside the allowlist.
- confidence: HIGH (instrumented: conformant with the gate widened)

### unknown/kexaba-26-kobu577 — badge-glyph-letter-uncaptured
- first diff: `svg/g[1]/g[1]/path[1]/@d`, ours="C" glyph jar="T" glyph
- Java / port: as dedumo (`<< (T,olive) >>`).
- mechanism: no captured `T` outline. Also: edge-label-not-creole — the link label `<$pk>` is measured as text (our DOT label box 38.24x15 vs jar 19x14) and drawn as `<text>` where the jar draws the sprite `<image>` (`svg/g[1]/g[3]/text[1]` vs `image`); this is why dotEqual is false (`labelSizeOk`).
- confidence: HIGH (read; DOT label box measured)

### unknown/latilu-49-jebu021 — degenerate-excludes-notes
- first diff: `svg/@height`, ours=83 jar=82
- Java / port: as fetajo.
- mechanism: as fetajo.
- confidence: HIGH (observer)

### unknown/lezema-07-vogu604 — descriptive-usymbol-render-allowlist
- first diff: `svg/g[1]/g[1]/path[1]/@d`, ours=class badge, jar=file fold
- Java / port: as deployment-last-name-multi-line-0 (`file test [ … ]`).
- mechanism: `file` outside the allowlist (creole body lines then render through `EntityImageDescription` as well).
- confidence: HIGH (instrumented: conformant)

### unknown/maxure-10-temu215 — descriptive-usymbol-render-allowlist
- first diff: `svg/g[1]/g[1]/path[1]/@d`, ours=class badge, jar=folder outline
- Java / port: as deployment-last-name-multi-line-0 (`folder test2 [ … ]`).
- mechanism: `folder` outside the allowlist.
- confidence: HIGH (instrumented: conformant)

### unknown/meramo-02-vasu175 — json-node-emitted-as-shield
- first diff: `svg/@height`, ours=286 jar=302
- Java / port: as bizasu.
- mechanism: as bizasu.
- confidence: HIGH (instrumented; same Δ1 width residual)

### unknown/momada-03-zeka599 — json-node-emitted-as-shield
- first diff: `svg/@height`, ours=286 jar=302
- Java / port: as bizasu.
- mechanism: as bizasu.
- confidence: HIGH (instrumented; same Δ1 width residual)

### unknown/muvici-42-dumo371 — note-target-not-namespace-qualified
- first diff: `svg/g[1]/g[4]/path[1]/@d`, ours=plain note outline, jar=opale "L127.5,203 L92.62,207 L127.5,211"
- Java / port: as cejegu (our DOT edge `春 -> __note_0`, class id `春春春.春`).
- mechanism: as cejegu.
- confidence: HIGH (instrumented: conformant)

### unknown/petiku-70-fogu777 — class-redeclare-mute-guard-missing
- first diff: `svg/@background`, ours=#FFFFFF jar=#000000 (jar is an error page: "Cannot create bar because it already exists")
- Java: `classdiagram/command/CommandCreateClassMultilines.java:245-246` — "if (entity.muteToType(type, null) == false) return CommandExecutionResult.error(\"Cannot create \" + idShort + \" because it already exists\");"; `abel/Entity.java:219-223` — newType STRUCT is not in the mutable set, so "return false;"
- port: `src/diagrams/class/class-declaration-parser.ts:268` — "classifier.kind = decl.kind;" (unconditional)
- mechanism: `foo <-- .bar` creates `bar` as a CLASS; `struct bar {` then may not mute CLASS→STRUCT upstream and the diagram errors, while the port re-kinds the classifier silently and renders.
- confidence: MEDIUM (read, not instrumented)

### unknown/punofe-33-loji825 — badge-glyph-letter-uncaptured
- first diff: `svg/g[1]/g[1]/path[1]/@d`, ours="C" jar="T"
- Java / port: as dedumo.
- mechanism: as dedumo.
- confidence: HIGH (read)

### unknown/racujo-01-veme537 — harness:newpage-dot-page-count
- first diff: none in SVG (survey-conformant); `dotEqual false`
- Java: `NewpagedDiagram.java:119-121` — "public TextBlock getTextBlock(int num, …) { final TitledDiagram titledDiagram = (TitledDiagram) diagrams.get(num);" — the CLI exports page 0 only, so the jar dumps one `svek-1.dot`.
- port: `src/diagrams/class/class-layout-multipage.ts:60` — "const geo = layoutSinglePage(page, theme, measurer);" for every page (deliberate, documented in `src/diagrams/class/index.ts` `getNbPages` comment); `scripts/svg-parity-survey.ts:204` — "if (dots.length !== inputs.length) return false;"
- mechanism: the port lays out both pages (2 layout inputs) while the jar lays out one; page 1's DOT is structurally equal (instrumented compare: `eq=true`). The gate fails only on the count. Fix options: compare the first `dots.length` inputs for a `newpage` source (harness), or accept-candidate "port renders every page".
- confidence: HIGH (observer-instrumented)

### unknown/regodu-14-peve499 — badge-glyph-letter-uncaptured
- first diff: `svg/g[1]/g[2]/path[1]/@d`, ours="C" jar="H"
- Java / port: as dedumo (`(H,#E6FFE6)`, 5 classes).
- mechanism: as fepoko's glyph half.
- confidence: HIGH (read)

### unknown/rexobo-28-rite508 — badge-glyph-letter-uncaptured
- first diff: `svg/g[1]/g[1]/path[1]/@d`, ours="C" jar="T"
- Java / port: as dedumo.
- mechanism: as dedumo (all 4 structural diffs are the 4 spots).
- confidence: HIGH (read)

### unknown/rilere-84-seba785 — note-target-not-namespace-qualified
- first diff: `svg/g[1]/g[4]/path[1]/@d`, ours=plain note, jar=opale
- Java / port: as cejegu (our DOT edge `__note_0 -> A`, class id `p1.A`).
- mechanism: as cejegu.
- confidence: HIGH (instrumented: conformant)

### unknown/rimeca-17-gice904 — edge-label-not-creole
- first diff: `svg/g[1]/g[3]/text[1]/@text-decoration`, ours=absent jar=underline (ours text is the literal `<U>agregation</U>`)
- Java: `svek/SvekEdge.java:298-299` — "block = link.getLabel().create0(font, alignment, skinParam, wrapWidth, CreoleMode.SIMPLE_LINE, null, null);"; `klimt/font/FontStyle.java:98-99` — "return \"\\<[uU](?::(#[0-9a-fA-F]{6}|\\w+))?\\>\";"
- port: `src/diagrams/class/class-edge-label-measure.ts:112` — "const m = measurer.measure(resolveTextEscapes(applyGuillemet(vis.text)), font);" (single-line arm: no creole, not even `stripCreoleMarkup`); `renderer-edge-label.ts:150` — "return text(label.x, label.y, label.text, {" (one plain `<text>`)
- mechanism: the class link label is measured and drawn as plain text, not as a creole block, so `<U>` is neither applied nor removed: our DOT label box is 116.4x15 against the jar's 63x15, and the label draws literally.
- confidence: HIGH (read; DOT label box measured)

### unknown/sejube-03-bote542 — link-middle-decor-partial
- first diff: `svg/g[1]/g[3]/ellipse[1]/@fill`, ours=#FFF jar=#F00
- Java: `svek/SvekEdge.java:266-268` — "this.arrowLollipopColor = skinParam.getHtmlColor(ColorParam.arrowLollipop, null, false); if (arrowLollipopColor == null) this.arrowLollipopColor = backgroundColor;"; `:353-356` — "if (link.getType().getMiddleDecor() == LinkMiddleDecor.NONE) this.labelShield = 0; else this.labelShield = 7;"; `:441` — "dimNote = dimNote.delta(2 * labelShield);"
- port: `src/diagrams/class/renderer-arrowhead-middle.ts:139-141` — "backColor: backgroundColor, diagramBackColor: backgroundColor," (no `arrowLollipopColor` key exists in `src/`); `class-layout-edge-labels.ts:240-251` — "This port has no `LinkMiddleDecor` concept … hasMiddleDecor: false," and `withLabelMargin` (`:185`) adds no shield
- mechanism: the `(0` middle decor is drawn but only half-ported: its inner circle is filled with the background instead of `skinparam arrowLollipopColor`, and its label box misses the 2x7 px shield (our DOT label 64.89x15 vs jar 78x29 → canvas 301 vs 315).
- confidence: HIGH (read; DOT label box measured, delta = exactly 2*7 on both axes)

### unknown/taboco-79-pire192 — diamond-folded-into-association
- first diff: `svg/g[1]/polygon[1]`, ours=`polygon` jar=`g`
- Java / port: as gegosa (`diamond diamond1 as "…"`).
- mechanism: as gegosa.
- confidence: MEDIUM

### unknown/tenule-05-fovi294 — note-target-not-namespace-qualified
- first diff: `svg/g[1]/g[4]/path[1]/@d`, ours=plain note, jar=opale
- Java / port: as muvici (same source bar comments).
- mechanism: as cejegu.
- confidence: HIGH (instrumented: conformant)

### unknown/tikiti-02-bagu049 — smetana-pragma-ignored
- first diff: `svg/g[1]/g[4]/a[1]/path[1]/@codeLine`, ours=3 jar=absent
- Java: as fakone; in `SmetanaEdge.drawU` the url wraps only the extremities and path (`:200-202` "ug.startUrl(url)" … `:217` draw) and the label is drawn after the url closes.
- port: `class-command-directives.ts:159-164`.
- mechanism: as fakone (SvekEdge structure: `id`/`codeLine` on the path, label inside the `<a>`); numerics are Smetana arithmetic.
- confidence: MEDIUM

### unknown/vakovo-25-licu237 — accept-candidate:smetana-geometry
- first diff: `maxDelta@svg/g[1]/g[1]/path[1]/@d[23]` (numeric only, structural=0)
- Java: `net/atmp/CucaDiagram.java:480-481` (`!pragma layout smetana` → `CucaDiagramFileMakerSmetana`)
- port: dot-engine by the 2026-08-09 ruling (CLAUDE.md "One layout engine")
- mechanism: all 131 diffs are layout arithmetic of Smetana vs dot-engine (the only links are `[hidden]`, so no SmetanaEdge structure is exercised). Candidate only (D7), not asserted.
- confidence: HIGH (structural=0 measured)

### unknown/xagomi-49-caki729 — descriptive-usymbol-render-allowlist
- first diff: `svg/g[1]/g[1]/rect[1]`, ours=`rect` (class box) jar=`text`
- Java: `svek/GeneralImageBuilder.java:160-167` (DESCRIPTION → `EntityImageDescription`); hexagon draws from the svek node polygon (the port's own `EntityImageDescription` says "upstream: bibliotekon == null" when absent).
- port: `renderer-usymbol-entity.ts:238-248` (traced usymbol=hexagon) and `:24-25` ("`hexagonPolygon` (neither symbol is a hexagon)" — not threaded)
- mechanism: `hexagon` is outside the allowlist; simply widening it throws "EntityImageDescription.drawHexagon: no hexagon geometry supplied" (instrumented), so the fix must also thread the node polygon. Remaining numerics are Smetana arithmetic (`!pragma layout smetana`).
- confidence: HIGH (instrumented)

### unknown/xicili-92-foke737 — harness:pragma-regex-matches-comment
- first diff: none in SVG (survey-conformant); `dotEqual false (oracleBlind)`
- Java: the `'!pragma layout smetana` line is a `'` comment the preprocessor drops; the jar ran graphviz (`svek-1.dot` present).
- port: `scripts/svg-parity-survey.ts:112` — "const PRAGMA_LAYOUT_RE = /!pragma\s+layout\s+/i;" tested unanchored on the raw markup at `:297`, and `:201` — "if (oracleBlind) return false;"
- mechanism: the harness's oracle-blind test matches the pragma inside a comment, so dotEqual is forced false; the real comparison is equal (instrumented `compareStructural`: `eq=true`, 8 nodes, 4 edges).
- confidence: HIGH (instrumented)
