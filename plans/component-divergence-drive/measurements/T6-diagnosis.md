# T6 — text x/y diagnosis (D6, read-only; debugger agent report, 2026-10-15)

Measured at b2merge 9e2744253, DeterministicMeasurer only. Counterfactuals are env-gated patches in a
throwaway copy `/private/tmp/claude-501/codd-T6/wt` (gates T6_LABEL, T6_ALIGN, T6_TITLE, T6_STEREO, T6_MIN10,
T6_MINW, T6_STENCIL, T6_NL, T6_QUOTE); census files and per-mechanism ablation `abl-*.delta` (row lists)
in `/private/tmp/claude-501/codd-T6/`. **No measurer (width) errors**: in all 13 live component rows only
`@x`/`@y` differ and every `textLength` is equal — every error is placement/anchor.

## T6-A — description edge label drawn at the engine label CENTRE, not the parsed corner + text-block margin
- **Mechanism:** `layout-geo-post.ts#edgeLabelGeo` forwards `re.labelX/labelY` + shift (dx, dy);
  `graph-layout-svek-read.ts#svekLabel` returns the table CENTRE by design ("every consumer's own
  centre-to-corner step"); `SvekEdge#drawLabels` draws `UText` with that centre as origin. Missing step: the
  jar's corner is `getXY` (min x/y of the table polygon) and it draws `labelText` (`withMargin(block,1,1)`)
  at corner + labelShield. The class engine has this step (`class-edge-label-anchor.ts:267 portLabelAnchor`).
- **Java:** `SvekEdge.java:372-373` (marginLabel 1, 6 for a self-loop), `:741-748` (labelXY from getXY),
  `:808-815` (getXY), `:951-954` (`labelText.drawU(UTranslate(x+labelXY.x+labelShield, y+labelXY.y+labelShield))`).
- **Port:** `layout-geo-post.ts:68-75,105-110`; `renderer-edge.ts:109`; `src/core/svek/SvekEdge.ts:288-297`.
- **Chain (buduco):** DOT table 86x15, native `lp=109.68,32.5`, polygon min x 66.68 ⇒ jar text x =
  66.68 + 7 (dx) + 1 (margin) = 74.68, baseline y = top 11 + ascent 11.111 = 22.111. Ours x = 116.68,
  y = centre 18.5. Delta always x: w/2−1, y: 3.611 (ascent 11.111 − 7.5). buduco Δ42 (w=86), cigite 9.5,
  fodena 13.5, babafi 10, nedapu 27. Of 67 component+usecase fixtures with a jar link `<text>`, none is 0 at b2.
- **Counterfactual:** draw `buildTextBlock(text,font,CENTER)` at (x − trunc(w)/2 + 1, y − trunc(h)/2 + 1)
  with w,h = the reserved table (`re.labelWidth/labelHeight`), skipping link-note edges: buduco, cigite,
  fimoxe, fodena, keniji, luniju, nedapu, pegali, cojege, romuco → 0; babafi label → 0. Component 41 rows
  fall (15 → 0), usecase 15 fall; Σ −281. Two +1 rises (gevozu-46-sasu860, sunuju-01-pote718): `<latex>`
  link label becomes `text` where the jar has `image` — permanent KaTeX divergence, re-pairing.
- **Fixer must also handle:** link-note labels (dikexa, usecase fogiku/jafuke — EntityImageNoteLink merged
  label, separate mechanism); self-loop marginLabel 6; middle-decor labelShield 7; multi-line alignment;
  take w,h from `graph-layout-svek-read.ts:131 edgeLabelTables(inp).label` (equal to the DOT table); the
  `«stereotype»` label branch at `SvekEdge.ts:292` is still on the old path.
- **Ruled out:** measurer (textLength equal); dot-engine (native lp == ours, D8).
- **Write-set:** core `src/core/svek/SvekEdge.ts` (drawLabels; only importer is description
  `renderer-edge.ts`; D5 journal + guards), `layout-geo-post.ts`, `layout-helpers-types.ts:149`
  (`DescriptionEdgeGeo.label` gains w,h), `renderer-edge.ts`.

## T6-B — entity description text block aligned CENTER at draw time; the jar uses the style cascade
- **Mechanism:** `renderer-entity.ts:197 titleAlignment: HorizontalAlignment.CENTER` hard-coded. A
  multi-line `desc` is built by `BodyFactory.create3(..., defaultAlign)`, `defaultAlign =
  styleTitle.getHorizontalAlignment()`; the jar left-aligns by default.
- **Java:** `EntityImageDescription.java:175,188,191`; `plantuml.skin:12` (`root { HorizontalAlignment left }`),
  `:452-454` (`usecase { center }`); overrides `skinparam defaultTextAlignment` (root bucket),
  `<style> component { HorizontalAlignment right }` (element bucket).
- **Port:** `renderer-entity.ts:197`; sizer resolves LEFT-except-usecase at
  `src/core/svek/image/leaf-sizing-entity.ts:168 titleAlignmentFor` (ignores overrides, dims unaffected);
  class engine resolves it fully at `diagrams/class/renderer-usymbol-entity-style.ts:101`.
- **Chain:** bitexe "System/Controller/box": jar all three lines at x=31; ours centred (38.04/31/50.08).
- **Counterfactual:** `titleAlignment = usecase|usecase-business ? CENTER : (elements[symbol].horizontalAlignment
  ?? elements.root.horizontalAlignment ?? LEFT)` — zero rises (root-only draft raised zarabi-01-koka785 and
  the `defaultTextAlignment center` usecase rows; full cascade needed: fasave, zonobi, zarabi, berufi,
  bobije, seline, xoculo).
- **Rows:** component → 0: bitexe, butebe, gafico, tajadu, codabo-50-mupa164, mejoxi-96-cegu294,
  nujito-06-neca370, pepego-30-kati324, rigoge-48-ziso050, saxosu-09-nodi002; partial: babafi 4→2, fasave
  18→12, zonobi 8→4, sakare, seguci, vixeni, xusuxe, zaraze. Usecase → 0: fariba-82-xolu802 (11→0),
  cuzuci, fuvosu, kijufe, mutere, nenedo, seneso, tanuna. 18 comp / 13 usecase.
- **Write-set:** `renderer-entity.ts` only (description). Share one resolver with the class engine's
  `titleAlignmentFor` rather than a third copy.

## T6-C — cluster title alignment hard-coded LEFT; the jar's composite title style is CENTER
- **Mechanism:** `renderer-cluster.ts#buildHeader` defaults LEFT (`:121`) and returns
  `titleHorizontalAlignment: LEFT` (`:139`). `ClusterHeader` takes `style.getHorizontalAlignment()` of
  root/element/<diagram>/<usymbol>/composite/title; `plantuml.skin:93-99`
  (`element { composite,package { title { FontStyle bold; HorizontalAlignment center } } }`) ⇒ CENTER.
- **Java:** `ClusterHeader.java:121-128,151-163`; `USymbolRectangle.java:126-131` (LEFT → x=3, else
  centred); `USymbolCard.java:114` (always centred); `Cluster.java:371`.
- **Counterfactual:** default + returned alignment CENTER: 25 rows fall, 0 rises (component cemutu, cuxeda,
  daxija, fopako, zusota → 0; ruciga 108→11; bisedo, gurive, lesori, perapa, ravodu, repite, tuliba, vixeni
  partial; usecase 11 rows incl. fotisa, fumitu, molopu, tozubi, xeluxu → 0). Package/folder titles
  unaffected (#14). Also rebena, vuvave, xipane, siseda title x.
- **Residual:** perapa's 5.8/8.75 also moves the cluster `<rect>` — cluster-box x, not title.
- **Write-set:** `renderer-cluster.ts:117-139` (description); `description-cluster-header.ts` reads
  `buildHeader` for sizing (0 rises ⇒ sizing unchanged).

## T6-D — per-stereotype StereotypeFontSize not applied at draw/cluster-header time; AtomText 10-px minimum missing
- **Part 1:** `usymbol-resolve.ts#textFont` cannot take the entity's stereotype labels, so draw side
  (`renderer-entity.ts:141`) and cluster header (`renderer-cluster.ts:112`) size stereotype text from the plain
  role. `resolveElementFontSize(theme, sname, 'stereotype', labels)` already has the tier (sizer uses it);
  `textFont` doc: "Open, escalated (S1L-tail G4 tier 2)".
- **Part 2:** `measureLine` returns raw `dim.getHeight()` (`EntityImageDescriptionTextBlock.ts:93`); Java
  clamps `if (h < 10) h = 10` (`AtomText.java:179-181`) while the draw baseline uses the unclamped
  `rect.getHeight() − descent` (`AtomText.java:215`).
- **Chain (golamo):** jar «boundary» at font 6 (textLength 31.688, title table 47x19), leaf 44 high; ours font 12
  (63.375, table 63x21). Part 1 alone: 47x15, leaf 40; with the clamp: all sizes match; stereo `text/@y` Δ4 =
  unclamped baseline.
- **Counterfactual:** loroto-06-fano471 22→0, toxine-81-xofo986 22→0 (the two named in the `textFont` doc). 0 rises.
  Class/object/state census with the clamp: 0 of 1359 rows moved.
- **golamo residual (colour track):** `StereotypeFontColor` wired nowhere; cluster not styled by its
  stereotype (`buildStyleDefaults` ignores `rectangle<<boundary>>` stroke/dash); title x (T6-C).
- **Write-set:** font: `src/core/decoration/symbol/usymbol-resolve.ts` (`textFont` signature) + callers
  `renderer-entity.ts:141`, `renderer-cluster.ts:112`. Clamp: core `EntityImageDescriptionTextBlock.ts:87-94` +
  drawAtoms baseline (shared with class `class-namespace-usymbol-shape.ts`, `renderer-entity-port.ts`: D5 guards).

## T6-E — draw-side paint has no MinimumWidth
- `renderer-entity.ts` paint omits `minimumWidth`; jar `getArea()`: `if (minClassWidth > 0) area =
  TextBlockUtils.withMinWidth(area, minClassWidth, align)` (`BodyEnhanced2.java:114-116`); sizer reproduces the
  floor (`leaf-sizing-entity.ts:304-335`) so draw leaves the text left.
- dexigu (`minClassWidth 200` + `defaultTextAlignment right`): jar text x 211.575, ours 31.
- Counterfactual `minimumWidth: resolveElementMinimumWidth(theme, node.symbol)`: dexigu 33→4, kenece-24-juku624
  33→0, zifaji-87-raki559 29→0, usecase zotiru 12→8; 0 rises.
- **Write-set:** `renderer-entity.ts` only.

## T6-F — cluster title built with the substitute `buildTextBlock` instead of `Display#create` (rebena)
- Jar: `label.create(fontConfiguration, alignment, skinParam)` (`ClusterHeader.java:128`) → creole `SheetBlock`;
  `SheetBlock2.drawU` wraps the ug in `UGraphicStencil` (`SheetBlock2.java:99`); `CreoleHorizontalLine` is a
  10x10 atom drawn at half height. Port: `renderer-cluster.ts:122` uses `buildTextBlock`.
- Consequences: (i) `----` → `UHorizontalLine` with no stencil → "No driver registered for shape
  UHorizontalLine" thrown in `Cluster.drawU`, caught as "decoration failed"; every title line after the
  separator vanishes. (ii) separator advance y=37 vs jar 42. (iii) `* y` bullet + 6-px indent unsupported
  (text x Δ6, bullet missing, childCount 6 vs 7).
- Port origin: `renderer-cluster.ts:122`, `EntityImageDescriptionTextBlock.ts:469 buildTextBlock`, `:319 drawSeparatorLine`.
- Fix direction: build the title via `core/klimt/creole/Display.ts#create` as BodyFactory does.
- **Write-set:** `renderer-cluster.ts` (+ creole wiring if needed).

## T6-G — `%n()` newline sentinel not decoded in the parsed display (vuvave)
- `resolveNewlineEscapes` (`parse-helpers-strings.ts:209`) handles `\n`, `\r`, `\l` only; preprocessor leaves
  `Jaws.BLOCK_E1_NEWLINE` (U+E100); jar decodes in `Display.getWithNewlines` (`Display.java:315-339,330`); port
  `core/klimt/creole/DisplayNewlines.ts#parseWithNewlines` not called here.
- vuvave display stays one line "Foox----* y" (cluster 113x69 vs jar 74x107). Counterfactual U+E100 → `\n`:
  vuvave == rebena's residual (T6-F); usecase sotine 24→18.
- **Write-set:** `parse-helpers-strings.ts` (route through `parseWithNewlines`).

## T6-H — quoted display with an embedded `"` mis-parsed (xipane)
- `rectangle "A ""B"" C" as he {`: jar `DISPLAY_CORE = [%g].+?[%g]` is lazy and backtracks
  (`CommandCreateElementFull.java:130`). Port `RE_DQ_AS_ALIAS = /^("[^"]+")\s*as\s+(\S+)$/`
  (`parse-helpers.ts:127`; `RE_DQ_ONLY` `:145`) forbids embedded `"`; `splitLeadingQuote` closes at the first
  quote (`parse-helpers-strings.ts:478`). Falls to the bare-id path; title shows raw quotes and ` as he`.
- Counterfactual `/^(".+?")\s*as\s+(\S+)$/` + T6-C + T6-B: xipane 24/19 → 1 structural (`rect/@fill` #FFF vs none:
  container inline `#color` never applied, `renderer-cluster.ts:187-188` hard-codes overrides null — colour item,
  same cause as berufi's `#EBE5D5;line:black`). Read all `[%g].+?[%g]` alternatives (DISPLAY2/3/4, `CODE_WITH_QUOTE`).
- **Write-set:** `parse-helpers.ts`, `parse-helpers-strings.ts:478`.

## Map
| mechanism | rows | origin | fixer write-set |
|---|---|---|---|
| T6-A edge label centre vs corner | buduco, cigite, fimoxe, fodena, keniji, luniju, nedapu, pegali, cojege, romuco (→0); babafi (with B); bagoze→1, fogexa, radiga, tilexe, vosuxa, zodare, usecase vibunu; 41 comp / 15 usecase | `layout-geo-post.ts:68-75`; `SvekEdge.ts:288-297` | core `SvekEdge.ts` (D5), `layout-geo-post.ts`, `layout-helpers-types.ts`, `renderer-edge.ts` |
| T6-B entity text alignment | bitexe, butebe, gafico, tajadu, babafi + 14 comp; 13 usecase incl. fariba | `renderer-entity.ts:197` | `renderer-entity.ts` |
| T6-C cluster title alignment | cemutu, cuxeda, daxija, fopako, zusota (→0), ruciga, + 8 partial; usecase 11; rebena/vuvave/xipane/siseda | `renderer-cluster.ts:121,139` | `renderer-cluster.ts` |
| T6-D stereotype font + AtomText min 10 | golamo (geometry), loroto, toxine (→0) | `usymbol-resolve.ts:194`; `renderer-entity.ts:141`; `renderer-cluster.ts:112`; `EntityImageDescriptionTextBlock.ts:93` | `usymbol-resolve.ts` + callers; core `EntityImageDescriptionTextBlock.ts` (D5) |
| T6-E draw-side MinimumWidth | dexigu, kenece, zifaji; usecase zotiru | `renderer-entity.ts` paint | `renderer-entity.ts` |
| T6-F cluster title via substitute block | rebena, vuvave | `renderer-cluster.ts:122`; `EntityImageDescriptionTextBlock.ts:319,469` | `renderer-cluster.ts` (+ creole) |
| T6-G `%n()` sentinel | vuvave | `parse-helpers-strings.ts:209` | `parse-helpers-strings.ts` |
| T6-H embedded `"` | xipane | `parse-helpers.ts:127,145`; `parse-helpers-strings.ts:478` | `parse-helpers.ts`, `parse-helpers-strings.ts` |

## Named rows
- Fixed at b2 (instrument, T1a): gevaje, kokebo, tusugu.
- T6-A: buduco, cigite, fimoxe, fodena, keniji, luniju, nedapu, pegali. T6-B: bitexe, butebe, gafico, tajadu.
  A+B: babafi. golamo: D + C (+ colour track). rebena: C + F. vuvave: G + C + F. xipane: H + C + B (+ colour).
- Unexplained: none.

## Population (b2merge component census)
All counterfactuals: text/@x 86 rows/316 diffs → 26/151; text/@y 53/152 → 14/64; component conformant
124 → 161 (+37); component Σ 3796 → 3271; component+usecase Σ 4898 → 4170. Rises: only the 2 `<latex>` +1
re-pairings (T6-A). Class/object/state: 0 of 1359 rows moved.

## Residual text rows after T6 (24 component; not text placement unless noted)
- Draw-order/pairing swaps: balopu, saroje, dujodu, tujica, repoge, kanute, bozoju, zosaxo, nujove, vogefo, cumofi.
- Cluster-box x carrying text: perapa (5.8/8.75), zosuje (−40). Kermor: fojamu, siseda (T5, since fixed).
- Port labels dropped from DOT input (T0b #12): fetefi, misube. Link-note label draw: dikexa (+ usecase fogiku/jafuke).
- Small unattributed: banatu (0.125 port-edge label x), berelu, josoxo, ruciga (3), saveje (`scale 2`), sakare (1).

## For other owners
- `renderer-cluster.ts:187-188` hard-codes colour overrides null (container inline `#color`/`line:`/`text:`: berufi,
  xipane); `StereotypeFontColor` wired nowhere; cluster ignores stereotype-signed element styles — colour track (T10).
