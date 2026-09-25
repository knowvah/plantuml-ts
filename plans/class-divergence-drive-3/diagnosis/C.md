# T4 — group C diagnosis (23 fixtures)

Probes live in `diagnosis/scratch/` (gitignored). `h.mts` = shared render +
`compareSvg` helper; `*.diff.txt` = the `render-diff.mts` output per slug at
diagnosis time. Several probes verify a mechanism by patching one exported
function at runtime (jiti CJS interop makes module exports writable). No
`src/` edits were made.

## Summary

| mechanism-id | fixtures | files | est. size |
|---|---|---|---|
| C-1 | ponono, sumocu | `class/note-layout-measure.ts` (`buildBulletRows`) | S (~15 lines) |
| C-2 | ponono, sumocu | `class/note-layout-measure.ts` (`matchBulletLine`, new numbered-row builder; reuse `core/klimt/creole/StripeStyle.ts#getHeader`/`createListNumber`, `CreoleContext`) | M (~60) |
| C-3 | bidusa, ruliki | `class/index.ts`, `class/parser.ts` (`makeDefaultAST`/`parseClass` signature) | S (~15) |
| C-4 | bidusa, ruliki | `class/class-member-atom-resolve.ts`, class member row renderer (new SVG-sprite atom kind; reuse `core/creole-atoms-image-resolver.ts#resolveSvgSpriteAtom`) | M (~80) |
| C-5 | filoxo, rakopi | `core/svg-text-font.ts#toSvgFontFamily` | S (~10), cross-engine |
| C-6 | filoxo, rakopi | `class/renderer-classifier-colors.ts#classBorderStrokeWidth`, `class/class-body-enhanced-geometry.ts:37` / `class-body-enhanced-layout.ts#separatorStrokeWidth`, theme style cascade for `element.class` LineThickness | M–L |
| C-7 | givofi | `core/svg-defs.ts#collectDocumentDefs` | M (~30), cross-engine |
| C-8 | givofi, popesa | `class/class-layout-leaf-shapes.ts` / `class/class-ink-box.ts` (leaf database/node ink), `core/decoration/symbol/USymbolDatabase.ts`, `USymbolNode.ts` | S–M (~30) |
| C-9 | popesa | `core/BlockUmlBuilder.ts`, `core/assemble-svg.ts#seedOfUmlSource` (already filed, next-missions "Seed input for def ids") | M |
| C-10 | cagace, nadaba, kujiji | `class/layout.ts:499` (+ multi-page path) | S (~10) |
| C-11 | medosa | `core/svek/svek-edge-extremity.ts#place`, `class/renderer-arrowhead.ts`, new `RectangleArea#getClosestSide` port | S–M (~40) |
| C-12 | givoli, tekena, nadepi | dot-engine (flat labelled `minlen=0` edge spline) — issue draft | dot-engine |
| C-13 | givoli, tekena, nadepi (text Δ0.011); puvono, sekame (residual Δ0.017); kujiji (font 9.873 vs 9.874) | D3 layout-precision task (batch 5) | D3 |
| C-14 | puvono, sekame, vudepo, lejoga, pejone, xonamo | `class/class-dot-graph.ts:455-457` (node + edge creation order), class link draw order (`class/layout.ts` edge list / `renderer.ts`) | M |
| C-15 | vudepo, lejoga, pejone, xonamo | `core/svek/image/Opale.ts#resolveOpaleConnector` (or `class/note-opale.ts`) | S (~10) |
| C-16 | pejone, xonamo | `core/svek-dot-order.ts#firstEncounterOrder`, `graph-layout.types.ts` (`DotInputEdge` inverted flag), `class/class-dot-graph.ts` | M (~40) |
| C-17 | luzive, sadamo | `core/error/error-renderer.ts` | M |
| C-18 | luzive, sadamo | proposed-accept (identity strings) | — |

Closure evidence (probe-patched, all four together where a fixture needs several):
cagace 0/0, nadaba 0/0 (C-10); vudepo 0/0, lejoga 0/0 (C-14+C-15); pejone 0/0,
xonamo 0/0 (C-14+C-15+C-16); puvono 0/1, sekame 0/1 (C-14; residual C-13);
filoxo 0/0, rakopi 0/0 predicted (C-5 closed 6 S; C-6 rect site closed, divider
site is the second C-6 call site); kujiji 14/0 (C-10; residual C-13); medosa
vertical wings close (C-11). Not probe-closed: ponono/sumocu, bidusa/ruliki,
givofi/popesa, luzive/sadamo, givoli/tekena/nadepi (dot-engine).

---

### ponono-25-fevo574 (and sumocu-27-vubo674 — identical source except one blank line, identical diff)
Two mechanisms; the reported first diff (`text[36]`) is an LCS-alignment artefact.
Probe `seqdiff.py` (difflib over document-order element/text list) printed exactly
four hunks: `insert ellipse` at 41 and 70, and `'1.' -> '#','\xa0'`, `'2.' -> '#','\xa0'`.
Ellipse y: jar 16.5/29.5/55.5, ours 16.5/29.5/42.5/55.5/68.5 — the extras sit on
the wrapped continuation rows (y 47.111 and 73.111 text rows).

- mechanism-id: C-1
- mechanism: every wrapped row of a `*` bullet line carries the real `Bullet` atom; upstream seeds only the first Fission stripe with the header and every continuation with `blank(header)`, which reserves the width but draws nothing.
- java: `klimt/creole/Fission.java:87` — `line = new StripeSimpleInternal(true, stringBounder, blank(stripe.getLHeader()));` and `:151-170` (`blank()` → `drawU(UGraphic ug) {}`)
- ts: `src/diagrams/class/note-layout-measure.ts:468` — `atoms: [spacer, ...row.atoms],` applied to every row from `buildPlainRows`
- causal chain: a bullet sentence that wraps into N rows draws N ellipses instead of 1 → one extra `<ellipse>` per continuation row → positional misalignment of every later child.
- ruled out: text wrapping itself (every word, x and y identical, `seqdiff.py`); bullet width/indent (continuation rows start at x=24 on both sides).
- probe: `python3 scratch/seqdiff.py <jar> <ours>` → `insert 41 41 [] -> 41 42 [('ellipse','')]`, `insert 70 70 ...`; ellipse cy lists above.
- fix shape: `buildBulletRows` — rows[1..] get a width-only spacer (text-kind, zero glyph) of `bulletWidth`, row 0 keeps the `'bullet'` atom. Port of `Fission#getSplitted` header/blank split.
- owner: this mission
- confidence: HIGH

- mechanism-id: C-2
- mechanism: `#`-prefixed note lines (`LIST_WITH_NUMBER`) are not recognised by the class note builder, so the literal `#` draws as text instead of the `"1."`/`"2."` list-number header atom.
- java: `klimt/creole/legacy/CreoleStripeSimpleParser.java:71` — `HASH_HEADING_PATTERN = Pattern2.cmpile("^(#+)(.+)$");`; `klimt/creole/StripeStyle.java:63-65` — `final int localNumber = context.getLocalNumber(order); return AtomTextUtils.createListNumber(fontConfiguration, order, localNumber);`
- ts: `src/diagrams/class/note-layout-measure.ts:428-432` (`matchBulletLine` tests only `ASTERISK_PREFIXED_LINE_PATTERN`/`ASTERISK_HEADER_LINE_PATTERN`); the core klimt parser already has it (`core/klimt/creole/legacy/CreoleStripeSimpleParser.ts:153-155`, `StripeStyle.ts:56-60`).
- causal chain: `# here is…` falls through to `buildPlainRows` → `<text>#</text><text>\xa0</text>` where the jar draws one `<text>1.</text>` (x=12) with the text at x=26.381 → 1 extra text per numbered line + x shift of the row.
- ruled out: word wrap (see C-1 probe).
- probe: `seqdiff.py` hunk `replace 88 89 [('text','1.')] -> [('text','#'),('text','\xa0')]`; jar `<text x="12" … textLength="10.806">2.</text>` then `here` at 26.381.
- fix shape: add the `#` branch next to the asterisk patterns; header = `createListNumber(font, order, context.getLocalNumber(order))` with one `CreoleContext` per note sheet, continuation rows `blank(header)` (C-1). Filed earlier in next-missions ("`#`-prefixed numbered lists in notes") — this confirms it still reproduces.
- owner: this mission
- confidence: HIGH (mechanism); closure of both fixtures after C-1+C-2 predicted, not probe-verified.

### sumocu-27-vubo674
Same as ponono (C-1, C-2); identical diff lines.

### bidusa-22-jutu505 (and ruliki-78-biji661 — same sprite lines, same diff shape)
First diff `g[1]/g[1][childCount] 14 vs 12`: the two `<$Netw>` rows draw no sprite path; every width term is +21.538 = 20·14/13 (the sprite's advance at font 14) and height +15.077 = 2·(21.538−14).

- mechanism-id: C-3
- mechanism: the class plugin builds its `SpriteRegistry` with no internal sprite store, so `sprite Netw jar:archimate/network` resolves to nothing even when `assetStore` is supplied.
- java: `command/CommandSpriteFile.java:108-112` — `if (src.startsWith("jar:")) { … sprite = SpriteImage.fromInternal(name);`
- ts: `src/diagrams/class/index.ts:47-48` — `parse(block) { return parseClass(block); }` (options dropped) and `src/diagrams/class/parser.ts:53` — `sprites: createSpriteRegistry(),`; contrast `description/index.ts:58-65`.
- causal chain: `registry.internal` undefined → `sprite-commands.ts:320-321` pushes `No such internal sprite` and registers nothing → `<$Netw>` atoms resolve to undefined → no ink, no width.
- ruled out: missing asset (`store.get('sprite:archimate/network.svg')` present), undimensionable SVG (`SpriteSvg.from` → 20×20), internal store lookup (`internalSpriteStoreFrom(store).get('archimate/network').width` = 20).
- probe: `scratch/probe-sprite.mts` → `warns [ 'No such internal sprite: archimate/network (sprite $Netw)' ]`; `probe-sprite2.mts` → `SpriteSvg.from network: 20 20`, `store.get network: 20`.
- fix shape: `classPlugin.parse(block, options)` → `parseClass(block, internalSpriteStoreFrom(options.assetStore), internalEmojiStoreFrom(...))` → `createSpriteRegistry(internal, emoji)`, mirroring `descriptionPlugin.parse`.
- owner: this mission
- confidence: HIGH

- mechanism-id: C-4
- mechanism: the class member-row sprite resolver handles only monochrome and color-4096 sprites; an SVG sprite contributes nothing even when registered.
- java: `klimt/creole/atom/AtomSprite` / `SpriteSvg` draw via `SvgNanoParser#drawU` (the jar output has `<path … fill="#AA0">` / `fill="#00F">` for the two rows).
- ts: `src/diagrams/class/class-member-atom-resolve.ts:87-88` — `const color = getSpriteColor4096(sprites, atom.name); if (color === undefined) return undefined; // unknown name`
- causal chain: even with C-3 fixed, `<$Netw>` (an SVG sprite) returns undefined → same zero-ink rows.
- ruled out: C-3 alone — `probe-sprite3.mts` injects the resolved sprite into `ast.sprites` after parse: output unchanged (S1 N50); `probe-sprite4.mts` with an inline `sprite Netw <svg…>` in a member row draws no path either.
- probe: `probe-sprite4.mts` → paths list contains only the class badge path for all three variants.
- fix shape: add a `getSpriteSvg` branch that reuses `core/creole-atoms-image-resolver.ts#resolveSvgSpriteAtom` (the `SvgNanoParser` decomposition other engines already use, scaled `fc.getSize2D()/13`, forced/ambient colour), plus a class member render-atom kind that emits those paths.
- owner: this mission
- confidence: HIGH (gap); closure after C-3+C-4 not probe-verified. Side note (not counted by the comparator): the `<$star*0.25>` `<image>` embeds a 48 px PNG where the jar embeds a 13 px one.

### ruliki-78-biji661
Same as bidusa (C-3, C-4).

### filoxo-23-fafi328 (and rakopi-21-sufa571 — `<style> visibilityIcon` vs `skinparam IconProtected*`, identical 10 S)
All 10 S are `font-family` on `<text>` (6) and class `rect`/divider `line` `stroke-width` (4) under `skin rose`. The lead (visibilityIcon cascade + shadow filter) is not involved: no icon colour or filter diff exists.

- mechanism-id: C-5
- mechanism: the shared text emitter compares the raw logical family `SansSerif` with the root `sans-serif`; upstream first maps logical names through `FontStack#getSvgFamily`, so `SansSerif` never reaches `<text>`.
- java: `klimt/font/FontStack.java:178-187` — `case SANS_SERIF: return "sans-serif";` reached via `UFont.java:112-113` (`case SVG: return fontStack.getSvgFamily();`), then `SvgGraphics.java:726-727` `if (fontFamily.equalsIgnoreCase(DEFAULT_FONT_FAMILY) == false) elt.setAttribute("font-family", fontFamily);`
- ts: `src/core/svg-text-font.ts:31` — `toSvgFontFamily` only swaps `"`→`'` (the klimt copy `svg-graphics-elements.ts#getSvgFamily` already has the switch).
- causal chain: rose.skin `root { FontName SansSerif }` → theme family `SansSerif` → `textFontFamily` emits `font-family="SansSerif"` on every class text.
- ruled out: skin not applied (colours #A80036/#FEFECE match); `defaultFontName` path (same result with `skinparam defaultFontName SansSerif`).
- probe: jar `scratch/jar-out/ff-sans.svg` (oracle-render.sh) → `<text x="36" … font-size="14">` (no family); ours `font-family="SansSerif"`. `probe-rose3.mts` patching the mapping removes all 6 font-family S on both fixtures.
- fix shape: port the `SERIF/SANS_SERIF/MONOSPACE` switch into `toSvgFontFamily`. Cross-engine: every `svg-shapes.ts` text caller with a logical family moves (expect other-engine movement; journal it).
- owner: this mission
- confidence: HIGH

- mechanism-id: C-6
- mechanism: the class box and body-divider stroke widths use a hard-coded 0.5 (plantuml.skin's `element { LineThickness 0.5 }`) instead of the style cascade's `LineThickness`; under `skin rose` (root 1.0, no element override) and any `<style> class/root { LineThickness N }` the jar draws N.
- java: `svek/image/EntityImageClass.java:215` — `final UStroke stroke = getStyle().getStroke(lineConfig.getColors());`; `cucadiagram/BodyEnhancedAbstract.java:121-122` — `return style.value(PName.LineThickness).asDouble();`
- ts: `src/diagrams/class/renderer-classifier-colors.ts:374` (`CLASS_BORDER_STROKE_WIDTH_DEFAULT = 0.5`) used at `:402`; `src/diagrams/class/class-body-enhanced-geometry.ts:37` (`ELEMENT_DEFAULT_LINE_THICKNESS = 0.5`) used by `class-body-enhanced-layout.ts#separatorStrokeWidth`.
- causal chain: rose → jar resolves 1.0 from `rose.skin:11` → rect + block0 divider `stroke-width:1`; ours 0.5 → 4 S.
- ruled out: skinparam path (`skinparam classBorderThickness 1` already works — probe `probe-rose.mts`); the divider being a `--` separator (those are already 1 via `separatorStrokeWidth`; the failing `line[1]` is the block0 sentinel using the default).
- probe: jar renders (`scratch/jar-out/`): `lt-class.svg` stroke-width:2, `lt-root.svg` 2, `rose-min.svg` 1; ours for all: 0.5 (`probe-rose2.mts`). `probe-rose3.mts` (ROSE=1, border forced to 1) → rect diffs gone, `line[1]` 1 vs 0.5 remains (second call site).
- fix shape: resolve `element.class` LineThickness from the active skin's cascade (root → element → classDiagram → class, user `<style>` merged) and use it for both `classBorderStrokeWidth`'s default tier and the body's `defaultThickness`; skinparam tiers keep precedence.
- owner: this mission
- confidence: HIGH (mechanism + two sites); fix touches theme cascade (size M–L).

### rakopi-21-sufa571
Same as filoxo (C-5, C-6). Its cdd2-T8 regression history is unrelated to these 10 S.

### givofi-11-xumu978
Geometry of every element is identical; diffs are gradient order (8 S) and width 226 vs 216.

- mechanism-id: C-7
- mechanism: document `<defs>` put caller-supplied klimt fragment defs (the database USymbol's gradient) before gradients lifted from the class body, so the seeded renumbering gives the class gradient index 1 although it is created first.
- java: `klimt/drawing/svg/SvgGraphics.java:393` — `id = gradientId + gradients.size();` then `defs.appendChild(elt)`: index = creation order = draw order (class `ent0001` draws first).
- ts: `src/core/svg-defs.ts:331` — `collapseDuplicateGradientDefs(prefixDefs + gradients.defs + filters.defs, …)`; the usymbol fragment defs enter via `class/renderer.ts:446-449` (`extraDefs += mergedUsymbolDefs`).
- causal chain: database gradient (klimt-shaped, `x1` before `id`) sits first in `<defs>` → renamed `…c0`; class gradient → `…c1`; jar has the reverse → 8 S on stop colours and `url(#…)` refs.
- ruled out: seed (both ids share `gl0fu3um6bzhc`, seed correct for this `!define`-free source); colour parsing (stop colours match per gradient).
- probe: ours `<defs>`: first `<linearGradient x1=… id="gl0fu3um6bzhc0">` with `#FFD8F4` (database), second `<linearGradient id="gl0fu3um6bzhc1" …>` `#C3D8F4` (class); jar the reverse.
- fix shape: order all lifted/prefixed gradient (and back-colour filter) defs by first reference in the body, not by source (klimt prefix vs inline), before `seededDefIdRenames`. Cross-engine: any mixed-emitter document moves.
- owner: this mission
- confidence: HIGH

- mechanism-id: C-8
- mechanism: a database/node LEAF's ink omits the invisible `UEmpty(10, 10)` that `USymbolDatabase#drawDatabase` / `USymbolNode#drawNode` draw past the shape, so the canvas is 10 px narrow (the namespace-cluster path already has it: `addNamespaceDatabaseInk`).
- java: `decoration/symbol/USymbolDatabase.java:77` — `ug.apply(new UTranslate(width, height)).draw(new UEmpty(10, 10));` (node: `USymbolNode.java:90`); `LimitFinder#drawEmpty` counts it.
- ts: `src/diagrams/class/class-layout-leaf-shapes.ts:80-83` (`symbolInk` measured for `actor` only) → database leaf falls to `addClassifierBoxInk` (`class-ink-box.ts:276`); `core/decoration/symbol/USymbolDatabase.ts:83-90` documents the UEmpty as dropped.
- causal chain: max ink x = 201.638 instead of 211.638 → `(int)(x+1)` canvas 216 vs 226.
- ruled out: gradients (jar `db-plain`, `db-grad`, `cl-grad` all 226 vs ours 216); allow_mixing leaves in general (rectangle 215 vs 216, component 235 vs 236 — a different −1 term, see note); horizontal-only (vertical `db-vert`: jar 111×197, ours 107×187 = +10 below and to the right of the cylinder, class right edge dominates x by 4).
- probe: `probe-w.mts` over `scratch/jar-in2` renders: `db-plain jar 226 ours 216`, `node-grad jar 246 ours 236`; `probe-dbv.mts` → `[107,187]` vs `[111,197]`.
- fix shape: leaf ink rule for `usymbol === 'database'` = plain path box + `(x+w+10, y+h+10)`; node = polygon rule + `(x+10, y+h+10)` (port `UEmpty` into the symbol walk, or reuse the namespace helpers for leaves).
- owner: this mission
- confidence: HIGH (database, probe); node leaf MEDIUM (only its +10 width was measured).
- note (out of this fixture set): allow_mixing `rectangle`/`component` leaves measure ours +1 wide (215/216, 235/236) — a separate ink term, not diagnosed here.

### popesa-39-sobe866
- mechanism-id: C-9 (+ C-8 for width 226 vs 216, same database leaf)
- mechanism: def ids are seeded from the raw source lines; upstream hashes the preprocessed lines (`!define` line removed, `MyBlue` substituted).
- java: `core/UmlSource.java:222-234` (`seed()` over `source`); `PSystemBuilder.java:232-240` passes the preprocessed `source` to `UmlSource.createWithRaw`.
- ts: `src/core/assemble-svg.ts:551-557` (`seedOfUmlSource` hashes `rawSourceLines`), gap documented at `:538-549`.
- causal chain: different seed → `g1dfzmcprqomz60` vs `g30vatrr2be6m0` → 7 S on the id and its refs.
- ruled out: gradient order (single gradient); the renumbering pass (correct on givofi).
- probe: prior measured result quoted in `assemble-svg.ts:544-546` (post-substitution lines reproduce `30vatrr2be6m`); not re-run here.
- fix shape: keep the post-substitution, pre-extraction line list in `core/BlockUmlBuilder.ts` and hash it (next-missions "Seed input for def ids").
- owner: this mission (already filed)
- confidence: MEDIUM (not re-probed this run); C-8 part HIGH.

### cagace-55-libu760 / nadaba-37-zaku242 / kujiji-68-cujo036
- mechanism-id: C-10
- mechanism: the `scale` factor is computed from the post-`ensureVisible` integer canvas instead of `TextBlockExporter#calculateFinalDimension` (raw ink dim + 15 + margins, fractional).
- java: `core/TextBlockExporter.java:199-201` — `new XDimension2D(dim.getWidth() + margin.getLeft() + margin.getRight(), …)`; `:207` — `scale.getScale(dim.getWidth(), dim.getHeight())`; `ScaleMaxWidth.java` `maxWidth / width`.
- ts: `src/diagrams/class/layout.ts:499` — `resolveScaleFactor(ast.scale, geo.totalWidth, geo.totalHeight, theme.dpi)` where `totalWidth = floor(pre + 1)` (`core/TextBlockExporter.ts:72`).
- causal chain: cagace pre 82.9375 vs used 83 → k 0.60286 vs 0.60241 → font 8.44 vs 8.434 and every scaled number off; nadaba pre height 69 vs 70; kujiji 1276.14375 vs 1277.
- ruled out: unscaled layout (no-scale jar renders: 83×68, 184×70, 1277×206 — identical to ours); the T35 margin term (pre = raw + CUCA margins 0/5/5/0 reproduces jar values exactly).
- probe: `probe-scale2.mts` → cagace rawW 77.9375, nadaba rawH 64, kujiji rawW 1271.14375; `python3` arithmetic → font 8.44 / 10.145 / 9.873 vs jar 8.44 / 10.145 / 9.874; `probe-scale3.mts` (pre-truncation dim patched in) → `cagace S 0 N 0`, `nadaba S 0 N 0`, `kujiji S 14 N 0` (all remaining are font-size 9.874 vs 9.873).
- fix shape: carry `rawWidth + MARGIN_LEFT + MARGIN_RIGHT` / `rawHeight + MARGIN_TOP + MARGIN_BOTTOM` (unfloored) into `resolveScaleFactor`; same for `layoutMultiPage`.
- owner: this mission
- confidence: HIGH
- kujiji residual: C-13 (D3). Jar's right-most rect ends at 1262.14 (2-dp node position) vs ours 1262.144 (`probe-kujiji.mts`); pre dim ≤ 1276.1376 is needed for 9.874.

### medosa-71-ligu412
- mechanism-id: C-11
- mechanism: crow's-foot extremities are always built with `side = null`, so the wing endpoints are never clamped to the contact side's axis.
- java: `svek/SvekEdge.java:544-546` — `if (nodeContact != null) side = nodeContact.getRectangleArea().getClosestSide(center);`; `svek/extremity/ExtremityCrowfoot.java` drawU `if (side == Side.SOUTH || side == Side.NORTH) { left = new XPoint2D(left.getX(), middle.getY()); … }`; `klimt/geom/RectangleArea.java:209-227`.
- ts: `src/core/svek/svek-edge-extremity.ts:51` — `const drawable = factory.createUDrawable(point, angle, null);`
- causal chain: two crow-feet on foo2's top edge: jar wings y2 = 114.79 (clamped to middle), ours rotated 111.549 / 118.035.
- ruled out: angle/contact point (middle y2 114.792 vs 114.79, x values within tolerance).
- probe: `probe-crow.mts` (side forced NORTH) → the four vertical-wing diffs disappear; the horizontal `foo2 }- foo3` foot then shows 147/131 vs 139, proving the side must be per-endpoint `getClosestSide` (EAST/WEST there), not a constant.
- fix shape: pass the contact node's rect to `place()` (class `renderer-arrowhead.ts:233`), port `RectangleArea#getClosestSide`, forward the `Side` to `createUDrawable`.
- owner: this mission
- confidence: HIGH

### givoli-70-rade072 / tekena-28-fobe713 / nadepi-13-mufu566
tekena's source is byte-identical to givoli; nadepi drops `skinparam svek true`. Same 24 N.

- mechanism-id: C-12
- mechanism: dot-engine routes the flat labelled edge `ClassicalWavePropagator -> Potential : has` (`sh0030->sh0014`, `minlen=0`, label) with a different spline than graphviz while both nodes are placed identically.
- java: n/a (graphviz `dotsplines.c` flat labelled edges); our DOT is layout-equivalent to the jar's.
- ts: n/a — `@knowvah/dot-engine` output.
- causal chain: tail point x 1179.66 vs real 1169.7 (+9.96), second control +18, end −0.82 → `g[46]` path and arrow polygon N diffs.
- ruled out: our DOT (differs from `svek-1.dot` only in cluster names/formatting; real `dot -Tdot` on OUR DOT gives the identical `pos` string); node placement (sh0030 x 1268.04 vs real 1268, sh0014 564.04 vs 564.04; frame offset dx≈0, dy=−107 from edge-24 1201.77/1201.8).
- probe: `/opt/homebrew/bin/dot -Tdot svek-1.dot` → `pos="1169.7,850.43 1141.2,864.71 1109.2,877.94 1078,885.25 930.09,919.93 755.7,868.88 652.81,829.44"`; same on `givoli-70-rade072.ours-0.dot`; `raw-edges.mts` → `edge-27 1179.66,358.61 1153.80,344.34 1124.74,331.10 1096.04,323.75 941.79,284.26 758.19,338.58 651.99,379.67` (y agrees after −107, x does not).
- fix shape: new `docs/graphviz-issues/22-…` (flat labelled edge endpoint/control points diverge; repro = `svek-1.dot` above, edge `sh0030->sh0014`) → T5 / dot-engine mission.
- owner: dot-engine (issue draft above)
- confidence: HIGH

- mechanism-id: C-13 (second residual on these three)
- mechanism: tail-label text `x` 76.871 vs 76.86 — the jar positions tail labels from 2-dp `-Tsvg` polygon points (`65.31`) where we use exact `tail_lp` (65.305); remaining 0.006 attributed to the same quantisation in the `moveDelta` term.
- java: `svek/SvekEdge.java:751-755,808-813` (`getXY` → `SvekUtils.getMinXY(… POINTS_EQUALS)` on the SVG text); D3.
- ts: label position from dot-engine exact coordinates.
- probe: real `-Tsvg` polygon for `#000047`: `points="65.31,-1132.61 …"`; real `tail_lp="68.805,1139.1"` (−3.5 → 65.305).
- owner: D3 task (batch 5)
- confidence: MEDIUM (0.005 of the 0.011 reconciled exactly; the other 0.006 not decomposed)

### puvono-84-doro361 (and sekame-22-meze147 — same diagram, identical diff)
- mechanism-id: C-14
- mechanism: note entities (and their connector links) are appended after every classifier/relationship, but upstream creates them at the `note … of X` command, so their `sh` uid, DOT node order and DOT edge order interleave with the classifiers.
- java: `svek/GraphvizImageBuilder.java:226-229` (`printEntities(getUnpackagedEntities())` in creation order, then `for (Link link : dotData.getLinks())`); jar DOT: note `sh0007` right after `Oscillator sh0006`, note link `sh0006->sh0007 color #000018` is the FIRST edge.
- ts: `src/diagrams/class/class-dot-graph.ts:455-457` — `dotNodes.push(...noteParts.nodes); dotEdges.push(...noteParts.edges);`
- causal chain: node multiset and edge multiset identical but order differs → graphviz mincross differs → real dot bb 1369.3 (our DOT) vs 1208.2 (jar DOT) → width 1391 vs 1230 and two re-routed edges.
- ruled out: dot-engine (real dot on our DOT gives the same wrong 1369.3 as dot-engine); node sizes/edge attributes (`scratch/dotcmp.py`-style check: `node multiset equal True edge multiset equal True`).
- probe: `probe-puvono.mts reorder` (notes moved after their creation predecessor, note edges moved to creation position) → `puvono S 0 N 1`, `sekame S 0 N 1`.
- fix shape: build the DOT node list and the link list in entity/link creation order (`creationIndex`) — notes and note-connector links included — for DOT emission and for the `<g class="link">` draw loop (see vudepo).
- owner: this mission
- confidence: HIGH
- residual (N1, `g[27]` `Potential <|- CompositePotential` cp1.y 186.52 vs 186.503): C-13. Real dot `839.69,387.74` → 180.26 (2 dp); dot-engine `839.690,180.255` — engines agree; the jar reads the 2-dp value. MEDIUM.

### vudepo-27-cuvo793 (and lejoga-79-poji465 — longer note text, same shape)
Layout is identical (every entity x/y matches, canvas 821×502). The 84 S come from a missing link group plus note shape.

- mechanism-id: C-15
- mechanism: a note connector whose graphviz path has more than one bezier must not be opalised; the port opalises every single-link note, so the left note draws the Opale notch outline and no dashed `<g class="link">`.
- java: `svek/SvekEdge.java:769-770` — `if (isOpalisable() == false) setOpale(false);`, `:804-806` — `return dotPath.getBeziers().size() <= 1;`; `svek/image/EntityImageNote.java:239-240` — `else if (opaleLine == null || opaleLine.isOpale() == false) drawNormal(ug2);`
- ts: `src/core/svek/image/Opale.ts:305-310` (`resolveOpaleConnector` rejects only `rawPoints.length < 2`) called from `class/note-opale.ts:73` via `note-layout-tip.ts#singletonNoteGeo`.
- causal chain: `Note left of RowHybridMacroStage` is far from its entity (3-bezier path) → jar: plain polygon note + dashed `lnk10` link; ours: arc-segmented Opale path, no link → sibling count 19 vs 20 → LCS misalignment of every entity group.
- ruled out: layout (`ents.py`: all positions equal); link direction attributes (`data-*` are stripped by `normalize.ts:143`).
- probe: `probe-opale2.mts` (guard `pts.length > 4 → undefined`) → note_0 path becomes `M346.513,343.5 L346.513,366.5 L399.363,366.5 …` (jar shape) and `lnk10` appears, but last; after moving it to creation position: `vudepo S 0 N 0`, `lejoga S 0 N 0`.
- fix shape: add the bezier-count guard (points > 4 ⇒ not opalisable) → existing plain-note + dashed-connector path (already correct under strictuml, `fogexa-30-zupo141` 0/0).
- owner: this mission
- confidence: HIGH
- plus C-14: the note link must be drawn in creation order (`lnk10` between `lnk7` and `lnk12`).

### lejoga-79-poji465
Same as vudepo (C-15 + C-14); note link `lnk12` must precede `lnk14`. Probe result above.

### pejone-71-tige404 (and xonamo-50-podo529 — adds `Mario <-up- Credits`)
The `title` vs `entity` first diff is an LCS artefact (both documents start with the title group); the real gaps are layout (width 1962 vs 1924) and a missing note link `lnk13`.

- mechanism-id: C-16 (+ C-14, C-15)
- mechanism: `Cluster#printCluster1` declares the tail node of every inverted (`-up-`/`-left-`) edge, newest first, BEFORE the `minlen=0` batch; the port does not model it (documented residual), so graphviz creates nodes in a different order.
- java: `svek/Cluster.java:195-212` — `for (SvekEdge l : lines) if (l.isInverted()) { … firsts.add(0, sh); }`, `:515-523` printCluster1; `svek/DotStringFactory.java:188-190` (printCluster1 before `lines0`).
- ts: `src/core/svek-dot-order.ts:137-143` ("Deliberately not ported … `DotInputEdge` carries no `isInverted` signal").
- causal chain: jar DOT opens with `sh0019 sh0017 sh0016 sh0021 sh0020 sh0015 sh0012 sh0011 sh0010 sh0010 sh0009` (Coin, Pipe, Button, Glydon, TRex, Frog, Capturable, InteractionInitiator, Mario, Mario, Cappy) → different mincross → bb 1938.3 vs our 1900.5.
- ruled out: node/edge content (multisets equal); notes-order alone (reordered DOT → real dot bb 1900.3, still wrong); dot-engine (real dot on reordered+printCluster1 candidate DOT → `bb="0,0,1938.3,672"` = jar).
- probe: `probe-order.mts` with `GUARD=1` (C-15), note reorder (C-14) and `TOP=` prepended node order (C-16) → `pejone S 0 N 0`; xonamo with `TOP=Credits,…` → `xonamo S 0 N 0`.
- fix shape: carry `inverted` on `DotInputEdge` from the class link (`Link#isInverted`), and in `firstEncounterOrder` push the tail of every inverted edge (reverse edge order, NORMAL-position root nodes only) before the `lines0` batch; same in `svek-dot-emit.ts` so DOT text stays in parity.
- owner: this mission
- confidence: HIGH
- side observation (not a counted diff): our title `<text x="851.7031250000001">` is unformatted; 33 cached class outputs carry ≥4-dp coordinates on title/chrome text.

### xonamo-50-podo529
Same as pejone (C-14, C-15, C-16); `TOP` list gains `Credits` first. Probe 0/0.

### luzive-62-zote562 / sadamo-18-siva346 (error pages)
Decision per D6: split. Two text() diffs are identity (proposed-accept); the rest is a real renderer gap (fix).

- mechanism-id: C-17
- mechanism: the error-page renderer uses line-advance/ascent ratios fitted to a NON-deterministic jar render (AWT metrics) and emits no `textLength`; under the oracle's `StringBounderFromWidthTable` the height is exactly the font size (14 px pitch), and the `[From …]` band is as wide as the widest listing line.
- java: `FileFormat.java:185-187` (deterministic flag → `StringBounderFromWidthTable`), `StringBounderFromWidthTable#calculateDimension` `final double height = size;`; `error/PSystemError.java:239` (band text); `klimt/shape/GraphicStrings.java`.
- ts: `src/core/error/error-renderer.ts:72-73` — `LINE_ADVANCE_RATIO = 14.1328 / 12; ASCENT_RATIO = 11.6016 / 12;` (fitted constants), text calls without `textLength`.
- causal chain: our pitch 16.488 vs 14 → every `y` off by a growing Δ, canvas height 238 vs 218 (luzive) / 205 vs 190 (sadamo); band rect 123.275 vs 135.45 (= widest listing line `class StationCrossing {`), sadamo 115.488 vs 145.6; no `textLength` → 9 S each; width 388 vs 389 (`(int)(5+378.175+5+1)`).
- ruled out: font sizes/colours/weights (all equal); line content (equal apart from C-18).
- probe: jar/ours listings above (`render-diff` N lines: jar y 17, 40, 58, 72, 86 … step 14; ours 16.602, 32.668, 49.156 … step 16.488).
- fix shape: take heights/ascent from the injected measurer (height = size under `WidthTableMeasurer`), emit `textLength`, size the band background to the merged block width, apply `ensureVisible` truncation for the canvas; drop the fitted ratios.
- owner: this mission
- confidence: HIGH (gap), MEDIUM (exact banner→band spacing rule not re-derived: jar banner top 5 → band top 25).

- mechanism-id: C-18
- mechanism: identity strings. Banner: jar oracle is a dev build printing `PlantUML version $version$ / $git.commit.id$` (`version/CompilationInfo.java:7` `COMMIT = "$git.commit.id$"`); ours prints `plantuml-ts version 0.1.0 / unknown`. Source: jar ran on a file → `[From in.puml (line 10) ]`; `renderSync` is the string API, which upstream labels `"string"` (`SourceStringReader.java:104`) → ours `[From string (line 10) ]` is faithful.
- owner: proposed-accept -> `luzive-62-zote562`, `sadamo-18-siva346`: `svg/g[1]/text[1]/text()[1]` and `svg/g[1]/text[2]/text()[1]` (and their `textLength`, which follows the string) — evidence above
- confidence: HIGH

### sadamo-18-siva346
Same as luzive (C-17 fix + C-18 proposed-accept); error at line 8 of a 1339-line source.

## Unresolved / partial
- ponono, sumocu: C-1+C-2 closure not probe-verified (numbered-row x after `createListNumber` width predicted from jar `2.` at x=12, text at 26.381).
- bidusa, ruliki: C-3+C-4 closure not probe-verified; C-4 needs a class-row SVG-sprite draw path.
- givofi, popesa: C-7/C-8/C-9 not jointly probe-closed; C-9 relies on the earlier recorded measurement.
- givoli, tekena, nadepi: dot-engine (C-12) + C-13 (D3); not closable in this mission.
- kujiji: after C-10, 14 S remain (font 9.873 vs 9.874) → D3.
- puvono, sekame: after C-14, N1 remains (Δ0.017) → D3.
- luzive, sadamo: C-17 fix + C-18 proposed-accept; banner→band vertical gap rule to derive from `GraphicStrings` when fixing.
