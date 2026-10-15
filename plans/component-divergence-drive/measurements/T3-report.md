# T3 report -- childCount family

Commit e6052105c (codd/T3, base 10f43063a). Not pushed. No core touched.
Files: edited src/diagrams/description/{note-grammar,parse-state,renderer,renderer-draw-sequence,renderer-entity,renderer-note-opale}.ts; new renderer-note.ts, renderer-color-override.ts (renderer-entity.ts was at 499 lines, so ColorOverride parsing and the note draw moved out -- pure move); docs/catalog.md; tests/unit/description/codd-t3-{note-uid,note-draw,leaf-redeclaration,hidden-cluster-ink}.test.ts (new), parser.test.ts and renderer-note-opale.test.ts (updated for new jar-true values).
Write-set extensions used: note-grammar.ts, parse-state.ts, renderer.ts (all description, none T2's).

## Rows: render-diff structural/numeric before -> after
| row | before | after | state |
|---|---|---|---|
| gekato-87-lisi598 | 9/0 | 0/0 | CLOSED (conformant) |
| tijexo-10-zipo222 | 5/0 | 0/0 | CLOSED (conformant) |
| cuxelu-66-zopu195 | 2/0 | 2/0 | residual R1 |
| gacida-77-joku810 | 2/0 | 2/0 | residual R2 |
| jazabe-68-bica131 | 2/0 | 2/0 | residual R2 |
| givape-84-xano421 | 1/0 | 1/0 | residual R2 |
| lakuti-06-dobi447 | 4/0 | 4/0 | residual R3 |
| sugaca-11-boma467 | 3/0 | 2/0 | residual R4 (@background fixed) |
| mavuxi-16-jafi782 (scope add M5) | 7-struct-free big x shift (canvas 265) | 0/8 (canvas 249 = jar) | residual numeric = T2's M1 box |
| kizobu-64-rozo458 (scope add) | 12/48 | 0/51 | childCount+ids CLOSED; numeric = M1 box |
| tacixe-99-gesi489 (scope add) | similar | 0/58 | same |
| basetu-75-xevi153 | 2/2 | 0/0 | conformant |
| xufexu-38-fola855 | baseline 25 | 2/0 | note url text (not mine) |

## Diagnosis artifacts
### D-A. Note drawn as a bare rect, text outside the group (gekato, tijexo, basetu, ~5 usecase/unknown rows)
- Mechanism: the port drew a non-opale note as `URectangle` and closed the entity group before the text; the jar draws polygon + fold + text inside one group.
- Origin: Java svek/image/EntityImageNote.java:154-157 (startGroup), :272-286 drawNormal (`Opale.getPolygonNormal` Opale.java:149-157, `getCorner` :134-147, text :285), :233 closeGroup. Port: renderer-entity.ts (old drawNoteFallback/drawFallbackBox), renderer-note-opale.ts (old drawOpaleShape closed its own group).
- Chain: group childCount 2 vs 3, `<rect>` vs two `<path>`, text outside `<g>`.
- Fix: renderer-note.ts#drawNote + renderer-note-opale.ts#drawNoteShape (+ local `opalePolygonNormal`, roundCorner fixed 0 like the sibling polygons). Fold keeps default stroke width 1 (drawn on the unstroked ug, :285); opale path strokes both (Opale.java:123-126); text gets bg+border (Opale.java:107) and, for opale only, the stroke. Border = `elements.note.border ?? theme border`.
- Ruled out: fill/stroke theme (fill was #FEFFDD already); opale geometry (identical d strings before and after).

### D-B. Note fill ignored `#color` and the `.tag` style
- Mechanism: note-grammar.ts matched `<<stereo>>` and `#color` in a non-capturing group and discarded them; the renderer used `theme.colors.noteBackground` unconditionally.
- Origin: Java EntityImageNote.java:100-103 (`entity.getColors().getColor(BACK)` else style BackGroundColor, with `getStyleSignature().withTOBECHANGED(getStereo())`) set by CommandFactoryNoteOnEntity.java:331-336. Port: note-grammar.ts:59-78, parse-state.ts#emitNoteLeaf.
- Fix: capture both (NoteDecor), store on the leaf (node.color / node.stereotype), resolve in renderer-note.ts#resolveNotePaints (override > `.tag` cascade `theme.colors.noteTagCascade` > `note {}` bucket > noteBackground). Not read for a note: inline `line:` (java uses only style LineColor).

### D-C. Note leaf ids (gekato ent0007/ent0010 vs ours 0006/0008)
- Mechanism: `diagram.getUniqueSequence("GMN")` draws a value from the shared cpt1 counter before `reallyCreateLeaf`; port did not consume it.
- Origin: CommandFactoryNoteOnEntity.java:327 (:329 leaf, :342+ link). Port: parse-state.ts#attachNoteToEntity.
- Fix: emitGeneratedNoteLeaf burns one index first. (`note as X` / floating notes do NOT, correctly.)

### D-D. Duplicate leaf from a redeclaration (kizobu, tacixe; childCount + ids)
- Mechanism: not preprocessing -- `!define F H`/`G H` correctly make both circles `as H`. The port's emitNode appended a second node for an id already declared in the same scope, and consumed a second uid; the jar reuses the entity.
- Origin: CommandCreateElementFull.java:316 `Entity entity = quark.getData(); if (entity == null) entity = reallyCreateLeaf(...)` then setDisplay/stereotype/setColors (:322-347); type mismatch is an error (existsWithBadType3). Port: parse-state.ts#emitNode (no redeclaration handling; a lone redeclaration was hidden by a later dedup, a sibling cluster exposed it).
- Fix: reuseLeaf in emitNode (same parent array, both non-group, same symbol): display replaced, stereotype if given, colour replaced/cleared, no push, no new uid, lastEntity unchanged.
- Ruled out: the preprocessor (R: 3-line probes with and without `!define`, 1 vs 2 H only changed with a following sibling cluster).

### D-E. Hidden cluster contributes ink (M5, mavuxi)
- Mechanism: renderer gated cluster skipping on `respectHidden`, which is false for the LimitFinder pass; Java tests the model flag.
- Origin: Cluster.java:298-300 `if (group.isHidden()) return;`; SvekResult.java:132. Port: renderer-draw-sequence.ts drawClusters.
- Fix: unconditional skip. Test pins the jar canvas width 249 (was 265).

### D-F. Root background name not resolved (sugaca)
- `skinparam backgroundColor gray` reached the root `style="background:gray"`; jar writes `#808080`. renderer.ts#unwrapKlimtSvg now resolves via resolveColorToSvgHex.

## Residuals (with mechanisms)
- R1 cuxelu: edges to a `portout` carry a label in the DOT (space reserved) but graphviz emits no label position ("node sh0011, port P unrecognized"; no `#00000d` polygon), so SvekEdge.getXY returns null, labelXY stays null and nothing is drawn (SvekEdge.java:742-746, :951-954). Ours: re.labelX/labelY are undefined (probed) and `edgeLabelGeo` falls back to pts[mid]. ORIGIN: layout-geo-post.ts:68-78 (T2 file) -- skip the label when re.labelX is undefined. Needs re-slot; check ELK path does not rely on the fallback.
- R2 gacida/jazabe/givape (+ census rows with `[[url]]`): entity url unimplemented. Jar wraps the entity's shapes in `<a ... xlink:href>` inside the entity group (EntityImageDescription.drawU startUrl, already ported in core/svek/image/EntityImageDescription.ts:413-419 reading `entity.url`). The description parser strips the token (parse-helpers-strings.ts#stripUrl; command-table-directives.ts:2i comment says addUrl has "no observable effect" -- false) and buildEntityParams passes `url: null` (renderer-entity.ts). Wiring needed: capture via core/url/UrlBuilder (UrlMode.STRICT, topurl) -> DescriptiveNode.url (ast.ts) -> DescriptionNodeGeo.url (layout-helpers-types.ts + layout-helpers.ts copy: T2 files, 2 additive lines) -> buildEntityParams. Also `url of X is [[..]]` (CommandUrl.java:93-100) and note urls (EntityImageNote.java:151,235). Not done because the geo type lives in T2's files.
- R3 lakuti, bokumi, nofunu, saveje (+ more): link "middle circle" `-0)-`, `-(0)-`, `-(0-`, `-0-`: grammar captures group `inside` but drops it (link-grammar-regex.ts:163). Java CommandLinkElement.java:104,149-157 `withMiddleCircle*`; SvekEdge draws the circle/arc at the path middle and `hasMiddleDecor` gives labelShield 7 (SvekEdge.java:353-356). Port: link-edge-attrs.ts:329-348 fixes hasMiddleDecor=false; core SvekEdge has no middle decor drawing (class has renderer-arrowhead-middle.ts). Core origin (D5) -- needs a mission.
- R4 sugaca: jar draws the full-canvas background rect FIRST (before the title group); ours draws the klimt body rect after the title (g/rect order). Origin: core assemble-svg.ts / src/index.ts applyAnnotationChrome description path (no finalize for DESCRIPTION). Core -- stop/report.
- R5 other childCount families seen in the remaining set (37 rows have childCount diffs): note on link polygon (dikexa, povuju, tujica, josoxo: EntityImageNoteLink not ported; port folds note text into the label), link head/tail quantifier labels (purevo `"1"`, misube `"*"`), magic arrows (berelu `>`/`<` labels), kermor group notes (fojamu, siseda, zubujo = T5), phantom groups (fidati, kofovu, tojitu = T2 M4), balopu/saroje (g[1]=1 vs 5: probable url).
- sugaca/mavuxi/kizobu/tacixe numeric remainders are T2's M1 (padded-union cluster box).

## Surveys (before = base 10f43063a, after = this commit; `npm run -s svg:survey -- <tree> --out ...`)
- component conformant 86 -> 91, structural-match 72 -> 75, diverged 108 -> 100. Movers (all up): basetu, dozudi, gekato, silito, tijexo -> conformant; kizobu, tacixe, tizuza -> structural-match.
- usecase conformant 31 -> 36, diverged 44 -> 38: exposant-02-usecase, kovaxi-11-reti348, nobiza-91-fimo741, pivudu-29-pele178, zidebi-71-nocu387 -> conformant; zacute-55-zece399 -> structural-match.
- unknown conformant 433 -> 433, diverged 343 -> 339: bixixe-41-vigu064, gigetu-10-funi859, kuduba-74-taki821, zodela-36-sica712 -> structural-match.
- c4 unchanged 2/9. Zero conformant losses in any tree. Movers' mechanism: D-A/D-B/D-C (notes), D-D (redeclaration), D-E (hidden cluster); the note movers are the ones whose only diff was note shape/group.
- Census component: 0-diff fixtures 90 (survey conformant 91 differs because census uses the ratchet metric); childCount families now g/g 29 rows, root g 16 rows. No risers observed (@id re-pairing not needed: all survey movers are upward).

## Tests
- Targeted run: tests/unit/description + tests/architecture + tests/oracle/{description-parity.ratchet,wrapper-parity}.test.ts + tests/oracle/svg-conformance/{description.diff-baseline.ratchet,description.golden.ratchet,layout-parity.ratchet}.test.ts: 57 files collected, 2941 tests, all passed (after xufexu-38-fola855 diff-baseline 25 -> 2; it had risen to 34 once the separator lines lost their fore colour, fixed by applying Fore(border) to the note text per Opale.java:107).
- New files: 4, 6 tests (uid sequence, note path/fill/tag, redeclaration ids, hidden cluster canvas width). Typecheck, eslint and prettier clean; catalog regenerated.
- Not run: class/object/state ratchets (no core touched).
