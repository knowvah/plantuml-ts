# T3 — size-backlog cluster attribution (8 fixtures)

Audited 2026-08-11 on `feat/object-close` (working tree at
`3f26bbba` + uncommitted sibling edits). READ-ONLY: no production file changed.

**Metrics used, and they are not the same metric.**

- *SVG diffs* (`diffs`, `maxNumericDelta`, non-numeric paths) — `compareSvg`
  over `renderFixtureClass` + `DeterministicMeasurer`, i.e. the ratchet /
  census / `plans/object-close/baseline-object.json` metric. Dumped per slug
  with the T3 `diff-fixture.mts` harness.
- *Node size* (`maxSizeDeltaIn`) — `compareStructural` over `toSvekDot` +
  `WidthTableMeasurer`, i.e. `tests/oracle/object-dot-parity.test.ts`'s D4
  assertion against `oracle/goldens/object/<slug>/svek-1.dot`. Node `width`/
  `height` in that DOT are INCHES; ×72 = px. All px figures below are ×72.

**Two properties of `maxSizeDeltaIn` that matter for reading this report**
(`tests/oracle/svek-dot.ts:249-265`): it pools *all* node widths and *all*
node heights into ONE sorted list and pairs by rank, so (a) it never names the
offending node, and (b) a single node's error can be reported at a smaller
magnitude than it actually is (see `togixe-65-bepo490`). `plaintext` nodes
parse as 0×0 on both sides, so map/json boxes are invisible to it entirely.

**Pin staleness.** `oracle/goldens/object/size-backlog.json` pins ratchet
downward only; three of the eight pins over-state the current delta. Measured
now: `tenalu-53-meri239` 0.027778 (pinned 0.055556), `fafozi-27-reja300`
0.000001, others as pinned.

---

### tobuka-93-jale775
- Mechanism: `skinparam minClassWidth 400` floors an OBJECT box's width
  upstream, but this port applies `PName.MinimumWidth` only on the generic
  class-leaf path and only for `LeafType#isLikeClass` kinds, so all seven
  object nodes keep their natural text widths (66.9…76.2px) instead of 400px.
- Java origin: `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageObject.java:151-153`
  (`final double minClassWidth = getStyle().value(PName.MinimumWidth).asDouble(); if (width < minClassWidth) width = minClassWidth;`),
  fed by `.../style/FromSkinparamToStyle.java:241` — `addConvert("MinClassWidth", PName.MinimumWidth)` with an EMPTY `SName...`
  varargs, i.e. a signature that matches every element, object included.
- Ours: `src/diagrams/class/class-object-map-sizing.ts:367` (and the enhanced
  branch at `:340`) compute `width = Math.max(fieldsDim.width, title.width +
  OBJECT_X_MARGIN_CIRCLE * 2)` with no floor term;
  `src/diagrams/class/class-layout-helpers.ts:402` gates the only
  `resolveMinClassWidth` call on `LIKE_CLASS_KINDS`
  (`:416-418` = class/abstract/interface/enum/annotation/entity — no `object`),
  and object never reaches that call anyway: `tryMeasureNonGenericClassifier`
  (`:264`, `:294`) returns `measureObjectClassifier` before `:386`.
- Causal chain: oracle DOT gives every node `width=5.555556` (400px);
  ours emits 0.604–1.059 in (43.5–76.2px). Node width is the only input that
  differs (heights are 34px on both sides, structurallyEqual=true), so
  graphviz lays the same graph out on boxes ~333px too narrow: `rect/@width`
  −333.062, every `@x` shifts (max 935.361), and the canvas collapses
  `svg/@width` 390 vs 1544 (Δ1154). `maxNumericDelta` 1196.619 is an edge
  control point. The single non-numeric path `g[8]/path[1]/@d` is a spline
  that gains control points at the wider spacing — downstream of the same
  cause, not an independent defect.
- Ruled out: (a) `skinparam monochrome true` — the fixture's only non-numeric
  diff is a path `@d`; no colour/stroke attribute diverges, so monochrome is
  applied correctly. (b) The layout engine — node heights, node count, edge
  count, degree sequence, minlen, nodesep and ranksep are all identical
  (`structurallyEqual=true`), so the geometry delta is entirely explained by
  the width input. (c) The "endpoint-only entities default to class sizing"
  hypothesis from the earlier mission: every entity here is an explicit
  `object` declaration and all seven size identically in the jar (400px),
  which is the floor, not a class default.
- Verdict: fixable
- Shared with: — (only fixture in the corpus that sets `minClassWidth`)

### fonulu-92-libi014
- Mechanism: `!theme crt-amber` is served from this port's COMPILED theme
  table, which carries the theme's `<style>` block and a few hand-copied
  fields but drops every `skinparam` block in the theme file. crt-amber's
  `skinparam CircledCharacter { Radius 9 }` therefore never reaches the badge,
  so the circled character is drawn at the default radius 11 and both rect
  nodes are 2×(11−9) = 4px too wide AND 4px too tall.
- Java origin: `~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/SkinParam.java:548-551`
  (`getCircledCharacterRadius()`: `value == -1 ? getFontSize(null, FontParam.CIRCLED_CHARACTER) / 3 + 6 : value`
  — default 17/3+6 = 11, overridden to 9 by
  `~/git/plantuml/src/main/resources/themes/puml-theme-crt-amber.puml:106-110`).
- Ours: `src/core/themes-builtin-a-m.ts:205-237` — the `'crt-amber'` entry has
  `fontFamily`, `diagramMargin`, `styleOverrides` (the `<style>` root only) and
  a `json` colour bucket; nothing from the theme's ~20 `skinparam` blocks.
  Generated by `scripts/compile-themes.py`. The consumer is fine:
  `src/core/skinparam-key-handlers.ts:275` parses `circledcharacterradius`
  and `src/diagrams/class/class-badge.ts:112-119` honours the override — the
  value simply never arrives.
- Causal chain: rect nodes 82.563×48 vs 78.563×44 → +4/+4. Confirming
  experiment: re-rendering the same markup with `!theme crt-amber` replaced by
  a literal `skinparam CircledCharacter { Radius 9 }` yields
  `Map 78.563×44`, `Customer 88.637×44`, `HashMap 173.913×44` — byte-exact
  against `oracle/goldens/object/fonulu-92-libi014/svek-1.dot` (`sh0006`
  1.091146×0.611111, `sh0009` 1.231076×0.611111, plaintext TD WIDTH
  173.9125/HEIGHT 44). So this single skinparam takes the pin to 0.
  The 4px box error moves `rect/@width`, `@height`, `ellipse/@rx`,`@ry`
  (11 vs 9) and every downstream `@x`/`@y` (max 90.215). The 34 non-numeric
  paths are the SAME dropped-theme cause on the colour axis: `rect/@fill`
  `#F1F1F1` vs `#282828`, `ellipse/@fill` `#B4A7E5` vs `#FFB000`,
  `line/@stroke-width` 0.5 vs 1 — crt-amber's `skinparam Class/Object/…`
  blocks and `LineThickness 1`.
- Ruled out: (a) Font metrics — `StringBounderFromWidthTable#calculateDimension`
  (`~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/font/StringBounderFromWidthTable.java:67-80`)
  is family-agnostic (one SANS_SERIF table, `height = size`), identical to
  `src/core/measurer.ts`'s `WidthTableMeasurer`, so crt-amber's
  `FontName Verdana` cannot produce a size delta in this harness. (b) `!theme`
  loading in general — `lunike-70-xipi897` proves themes ARE loaded and
  applied (its aws-orange `defaultFontSize 12` lands). (c) The
  "bracket-attribute endpoint declaration" hypothesis (`Shop [customerId:
  long]`): those two entities become `plaintext` port nodes whose oracle cell
  widths we match exactly once the radius is right (173.913 above), so the
  bracket syntax is not the size cause.
- Verdict: fixable
- Shared with: `lunike-70-xipi897` (same compiled-theme-table gap, different
  dropped property)

### lisepi-64-mudo307
- Mechanism: `<style> object { FontSize 12 }` sets the OBJECT MEMBER-ROW font
  upstream — `EntityImageObject` passes its own element `Style` into the
  bodier, and `MethodsOrFieldsArea` builds each row's `FontConfiguration` from
  that style. This port measures object member rows at the DIAGRAM default
  (`theme.fontSize` = 14), so `Object_user`'s two rows are 14pt instead of
  12pt: +4px height and a fields-driven (not title-driven) width.
- Java origin: `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageObject.java:115-116`
  (`this.fields = entity.getBodier().getBody(getSkinParam(), false, showFields, entity.getStereotype(), getStyle(), null);`)
  → `~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/MethodsOrFieldsArea.java:240`
  (`FontConfiguration config = FontConfiguration.create(skinParam, style, leaf.getColors());`, `style` being that argument, stored at `:103`).
- Ours: `src/diagrams/class/class-object-map-sizing.ts:229` —
  `const fontSpec = { family: theme.fontFamily, size: theme.fontSize };` inside
  `measureObjectFields`, and the same literal at `:417` for the enhanced-body
  branch. The object element bucket IS parsed (it is read at `:318-321` for
  the NAME override) — it is simply never consulted for the body.
- Causal chain: arithmetic closes exactly. Header is correct on both sides
  (`<style> object { header { FontSize 18 } }` lands: `text[1]/@font-size` is
  NOT in the diff list), title = 18+4 = 22. Jar body = 2 rows × 12 + 2×4
  margin = 32 → node 110.975×54; ours = 2 rows × 14 + 8 = 36 → 113.413×58.
  Width flips governor: jar is title-driven (`Object_user`@18 = 96.975 + 4
  padding + 10 xMarginCircle = 110.975), ours is fields-driven
  (`name = "Dummy"`@14 = 101.4125 + 12 = 113.4125). The 67 non-numeric paths
  are the rest of the same `<style>` block never reaching the object/map
  elements: `text/@font-family` (Helvetica), `@font-style` (italic),
  `@font-weight` (bold), `rect/@stroke`, `@stroke-dasharray` (`LineStyle
  10-5`), `@stroke-width` (`LineThickness 2`), plus `@textLength` on every
  mis-sized row.
- Ruled out: (a) "`<style>` blocks entirely unapplied" (the earlier mission's
  hypothesis) — the header FontSize 18 IS applied, and `sh0007` (`object
  London`, no body) is byte-exact at 74.075×38 in both. The gap is scoped to
  the body rows and the non-size properties, not to `<style>` parsing.
  (b) The shared 0.055556 pin with `fonulu-92-libi014` — see "Shared
  mechanisms" below; the two 4px deltas have unrelated causes.
  (c) `FontName Helvetica` as a size cause — impossible under the
  family-agnostic width table (same citation as fonulu).
- Verdict: fixable
- Shared with: — (the FontSize-to-body gap is object-specific; the map/json
  `<style>` gaps in the same fixture are non-numeric only)

### togixe-65-bepo490
- Mechanism: under `allow_mixing`, exactly ONE of the 26 leaves diverges —
  the `state` leaf. Upstream sizes it with `EntityImageState`
  (`MARGIN` delta 20 on both axes, then `atLeast(50, 50)`); this port routes
  `kind:'state'` in the class engine to the generic class-leaf formula, which
  uses a different margin and has no 50×50 floor.
- Java origin: `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageState.java:102-111`
  (`dim.delta(MARGIN * 2 + 2 * MARGIN_LINE + heightSymbol)` then
  `result.atLeast(MIN_WIDTH, MIN_HEIGHT)`, constants `MIN_WIDTH = MIN_HEIGHT = 50`
  at `:65-66`), dispatched diagram-type-agnostically at
  `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/GeneralImageBuilder.java:130-142`
  (`if (leaf.getLeafType() == LeafType.STATE) … return new EntityImageState(leaf);`).
- Ours: `src/diagrams/class/class-layout-helpers.ts:264-353` —
  `tryMeasureNonGenericClassifier` has branches for collapsed packages,
  object/map/json and USymbols, but none for `state`, so it falls through to
  `measureGenericClassifier` at `:379`. The correct formula exists but only in
  the STATE engine: `src/diagrams/state/state-sizing.ts:203-208`
  (`STATE_MARGIN_DELTA = 20`, `STATE_MIN_WIDTH/HEIGHT = 50` at `:134-136`).
- Causal chain: node-by-node, 25 of 26 nodes are byte-exact. `sh0029`
  (`state`, the only `style=rounded` node) is jar 50.275×50 vs ours
  62.275×48 — width +12, height −2. Height: jar floors max(14+20, 50) = 50;
  ours has no floor. Width: jar = name(30.275) + 20; ours adds 32.
  **Metric caveat:** the reported `maxSizeDeltaIn` is 0.046701 (3.362px), far
  below the true 12px per-node error — an artifact of the sorted-pool pairing
  described at the top of this file. The 12px box shifts the whole rank and
  produces `maxNumericDelta` 39.610.
- Ruled out: the "descriptive-USymbol icon sizing under `allow_mixing`"
  hypothesis (`gapisu-00` family) is REFUTED here: every USymbol node
  (agent/artifact/card/cloud/component/…/queue/stack/storage/usecase) matches
  the oracle DOT to the last decimal. The 32 non-numeric paths are USymbol
  DRAWING decomposition, not sizing — `childCount` mismatches on g[3..25],
  `rect/@rx`,`@ry`, `@stroke-width`, `text/@text-anchor`, `@textLength` — i.e.
  we emit a different element count for the same box. That is a separate,
  larger workstream and does not move any node size.
- Verdict: fixable (state-leaf sizing); the non-numeric residue is a distinct
  USymbol-markup item, not size
- Shared with: — (no other fixture in this cluster declares a `state` leaf)

### lunike-70-xipi897
- Mechanism: `!theme aws-orange` sets `skinparam object { AttributeFontSize 11 }`,
  which upstream writes `PName.FontSize` onto the `object` ELEMENT style —
  not onto an "attribute" sub-style — so the object's HEADER inherits it by
  set containment and the name draws at 11pt. This port's compiled theme table
  hand-carries only aws-orange's `classAttributeFontSize`, and this port has no
  `objectattributefontsize` skinparam handler at all, so every object name is
  measured at the theme's `defaultFontSize` 12.
- Java origin: `~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/FromSkinparamToStyle.java:201`
  — `addConFont("objectAttribute", SName.object);` (→ `objectAttributeFontSize`
  ⇒ `PName.FontSize` at `SName.object`, per `addConFont` at `:428-433`),
  matched by `EntityImageObject.java:132-134`'s header signature
  `{root, element, objectDiagram, object, header}`. Source:
  `~/git/plantuml/src/main/resources/themes/puml-theme-aws-orange.puml:451-458`.
- Ours: `src/core/themes-builtin-a-m.ts:47-72` — the `'aws-orange'` entry
  carries `classAttributeFontSize: 11` (`:62-71`) and no object equivalent;
  `src/core/skinparam-key-handlers.ts:241` handles only
  `classattributefontsize`.
- Causal chain: all four object nodes are exactly 12/11 too wide and 1px too
  tall. Verified against the width table: jar `London` 50.712 − 14 (2×2
  padding + 2×5 `xMarginCircle`) = 36.7125 = widthTable("London")@11 exactly;
  ours 54.05 − 14 = 40.05 = the same string @12. Same for Washington
  (58.0938 / 63.375), Berlin (28.1875 / 30.75), NewYork (44.6875 / 48.75).
  Heights 31 vs 32 = title(11+4 vs 12+4) + 16 empty-fields. Controlled
  experiment through the jar: `skinparam object { AttributeFontSize 11 }`
  alone, with `defaultFontSize 12`, reproduces `font-size="11"`,
  `textLength="36.713"` and node width 50.713; `classAttributeFontSize 11` in
  the same position leaves it at 12/40.05. The 5.3px node error propagates to
  `maxNumericDelta` 87.635.
- Ruled out: (a) `skinparam dpi 100` (also in aws-orange) as the size cause —
  it is a pure output magnification: probed through the jar, `dpi 100` leaves
  the svek DOT unchanged and multiplies every SVG number by 100/96
  (font-size 12 → 12.5, width 74 → 77.083). It explains lunike's SVG values
  being 1.0417× the DOT values but contributes nothing to node size.
  (b) `defaultFontName "Verdana"` — family-agnostic width table, as above.
  (c) The 26 non-numeric paths are NOT size: `defs[1][childCount]` 0 vs 1 and
  `g[1..5][childCount]` 3 vs 4 are aws-orange's `BackgroundColor
  $PRIMARY_LIGHT-$PRIMARY` GRADIENT (the jar emits a `<linearGradient>` plus a
  header `<path>` band per node); the arrow `polygon`/`path` `@fill`/`@stroke`
  diffs are the same dropped theme colours.
- Verdict: fixable
- Shared with: `fonulu-92-libi014` (compiled-theme-table gap)

### pikuba-31-faxo766
- Mechanism: creole TABLE markup (`| a | b |`, `|= h |= h |`) inside an
  object/entity body is parsed and laid out as a real table upstream — one
  `<text>` per CELL at computed column x's, plus grid `<line>`s — while this
  port measures and draws each body line as one literal text run with the pipe
  characters intact.
- Java origin: `~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/legacy/CreoleParser.java:91-100`
  (`if (lastStripe instanceof StripeTable && isTableLine(line)) … else if (isTableLine(line)) return Arrays.asList(new StripeTable(fontConfiguration, skinParam, line));`),
  reached from the object/entity body via
  `EntityImageObject.java:115-116` → `MethodsOrFieldsArea.java:240-266`
  (`create8(config, align, skinParam, CreoleMode.SIMPLE_LINE, …)`).
- Ours: `src/diagrams/class/class-body-enhanced-layout.ts:393`
  (`measureEnhancedBody`) and `src/diagrams/class/class-object-member-creole.ts`
  route body lines through `CreoleStripeSimpleParser`/`StripeSimple` only;
  neither consults `isTableLine`. The machinery is already ported and unused
  on this path: `src/core/klimt/creole/legacy/StripeTable.ts:175`,
  `src/core/klimt/creole/atom/AtomTable.ts`,
  `src/core/klimt/creole/legacy/CreoleParser.ts`.
- Causal chain: both boxes are governed by the body block, so the missing
  table changes both dimensions identically — jar 315.138×156 and 315.138×119,
  ours 275.287×146 and 275.287×110 (Δ 39.85 wide, 10 tall). Ours renders
  `<text …>| PK | id | INT UNSIGNED AUTO INCREMENT |</text>` as one run
  (textLength 263.287); the jar renders `PK` @x=17, `id` @x=35.725,
  `INT UNSIGNED…` @x=93.213 plus four horizontal rules — hence
  `childCount` 4/12/9 vs 18/40/32 (the three non-numeric paths) and canvas
  607×245 vs 687×259 (`maxNumericDelta` 80).
- Ruled out: (a) A pure padding/margin miscount — the per-cell x positions in
  the jar (17 / 35.725 / 93.213) are column stops that only a table layout can
  produce; no single-run width can generate them. (b) The layout engine —
  there are no edges in this fixture and both nodes are `shape=rect` with
  matching structure, so every SVG delta is inside the two boxes.
  (c) Not audited further here but noted: the jar draws an "E" circled
  character for `entity "Table 1"` where we draw a "C". Size-neutral, filed as
  an observation, not part of this row's mechanism.
- Verdict: fixable
- Shared with: — (only fixture in this cluster using table markup)

### tenalu-53-meri239
- Mechanism: `AtomText` floors a text run's HEIGHT at 10px regardless of font
  size. Object `A`'s name draws at 8pt (`<<Foo1>> { FontSize 8 }`), so the jar's
  name row is max(8, 10) + 4 padding = 14; this port has no floor and produces
  8 + 4 = 12. The whole 2px node-height residue is that one clamp.
- Java origin: `~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/legacy/AtomText.java:179-181`
  (`double h = rect.getHeight(); if (h < 10) h = 10;`), summed into the title by
  `EntityImageObject.java:240-247`'s `nameDim.getHeight() + stereoDim.getHeight()`.
- Ours: `src/diagrams/class/class-object-map-sizing.ts:324-328` —
  `nameM.height + OBJECT_NAME_PADDING * 2` straight off the measurer
  (`height = font.size`, `src/core/measurer.ts:88`,`:192`);
  `src/core/klimt/creole/legacy/AtomText.ts` ports the width/tab half of
  `calculateDimensionSlow` (java:183-187) but not the `h < 10` clamp at
  java:179-181.
- Causal chain: jar title = 26, ours 24, everything else identical.
  Decomposed from the jar SVG: rect top 7.167; stereo baseline 16.5
  (offset 9.333 = ascent@12) ; name baseline 27.389 (offset 20.222);
  divider 33.167 (offset 26). Ours: rect top 7, stereo baseline 16.333
  (offset 9.333 — IDENTICAL), name baseline 27.222 (offset 20.222 —
  IDENTICAL), divider 31 (offset 24). So the stereo row is 12 on both sides
  and the NAME row is 14 vs 12. Node height 42 vs 40 → graphviz re-centres
  (`rect/@y` 7.167 vs 7, the 0.167 seen on every header attribute), the second
  node shifts 2.167 and the connector picks up 1.84–2.158
  (`maxNumericDelta` 2.167). Cross-check: object `B` (16pt, above the floor)
  is byte-exact in both dimensions — exactly what a `< 10` clamp predicts.
- Ruled out: the brief's stated hypothesis — that the residue is the
  `FontParam.OBJECT_STEREOTYPE` lookup at `SkinParam.java:432-449` /
  `EntityImageObject.java:106` — is REFUTED. The jar's stereo run is
  `font-size="12" font-style="italic"`, our stereo row measures 12, and the
  stereo baseline offset from the box top is 9.333 on BOTH sides. The stereo
  row is already correct; the deficit is entirely in the name row.
  Also ruled out: the element/stereotype FontSize cascade landed correctly in
  `babcfa94` — `A` is 8pt and `B` is 16pt in our output, matching the jar.
  Separately, the fixture's one non-numeric diff is a real second defect,
  unrelated to size: `g[1]/rect[1]/@fill` ours `#F08080` (LightCoral) vs jar
  `#ADD8E6` — the stereotype-scoped `<<Foo1>> { BackgroundColor LightBlue }`
  never lands, i.e. `babcfa94` wired the stereo-scoped FontSize but not the
  stereo-scoped BackgroundColor.
- Verdict: fixable
- Shared with: — (only fixture in this cluster with a sub-10pt font; the pin's
  shared 0.055556 with fonulu/lisepi is stale, see below)

### fafozi-27-reja300
- Mechanism: DOT number formatting, not geometry. Our internal node width is
  IDENTICAL to the jar's (62.2125px); the two disagree only on how
  `62.2125 / 72 = 0.86406249999999995559` is printed to 6 decimals. Java's
  `%f` rounds the double's SHORTEST decimal representation ("0.8640625")
  HALF_UP → `0.864063`; JavaScript's `toFixed(6)` rounds the exact binary
  value → `0.864062`. Graphviz then lays out a node one thousandth of an inch
  narrower and the canvas comes out 1px short.
- Java origin: `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekUtils.java:99-102`
  (`final double v = pixel / 72.0; return String.format(Locale.US, "%6.6f", v);`),
  called from `.../svek/SvekNode.java:159-161`.
- Ours: `src/core/svek-dot-emit.ts:42` —
  `const inches = (px: number): string => (px / PX_PER_INCH).toFixed(6);`
- Causal chain: the ONLY two SVG diffs are `svg/@width` and `svg/@viewBox[2]`,
  194 vs 193. Every element coordinate inside the drawing matches exactly —
  which is itself the proof that the divergence is in the DOT text handed to
  graphviz, not in any sizing formula. `maxSizeDeltaIn` is 1.0e-6 in
  (0.00007px), the smallest representable difference at 6 decimals.
- Ruled out: (a) The earlier mission's "stacked-stereotype label splitting"
  hypothesis (`<<Bar>> <<Foo>>`) — both nodes' pre-format px widths are exact
  (74.875 and 62.2125) and both heights are exact (64, 58), so the stereotype
  stacking is already correct. (b) Any measurement difference — verified by a
  controlled experiment: a 4-line Java program printing
  `String.format(Locale.US,"%6.6f", 62.2125/72.0)` emits `0.864063` while
  `(62.2125/72).toFixed(6)` emits `0.864062` for the bit-identical double
  `0.8640624999999999555910790149937383830547332763671875`.
- Verdict: fixable
- Shared with: potentially every fixture in the corpus (any node dimension
  landing on an exact tie at the 7th decimal), but this is the only one where
  it is the sole remaining defect.

---

## Shared mechanisms, ordered by reach

**1. The compiled built-in theme table is lossy — 2 fixtures
(`fonulu-92-libi014`, `lunike-70-xipi897`), and by construction every
`!theme` fixture in every corpus.**
`src/core/themes-builtin-*.ts` (generated by `scripts/compile-themes.py`)
ingests each upstream theme's `<style>` block plus a small hand-copied set of
skinparams, and silently discards the theme file's `skinparam` blocks. Both
size defects here are a single dropped skinparam whose *consumer already
exists and is correct*: `skinparam CircledCharacter { Radius 9 }`
(crt-amber:106-110 → `SkinParam.java:548-551`) and
`skinparam object { AttributeFontSize 11 }` (aws-orange:451-458 →
`FromSkinparamToStyle.java:201`). Confirmed by experiment for fonulu: feeding
the one skinparam explicitly reproduces the oracle DOT byte-for-byte. This is
the highest-reach item in the cluster and the cheapest to verify.

**2. Object-specific sizing terms absent from `measureObjectClassifier` — 2
fixtures (`tobuka-93-jale775`, `tenalu-53-meri239`).**
Both are one missing clamp in the object dimension chain:
`PName.MinimumWidth` (`EntityImageObject.java:151-153`) and the `AtomText`
10px line-height floor (`AtomText.java:179-181`). The second is creole-wide,
so it reaches any text run below 10pt anywhere in the port, not just objects.

**3. Element-scoped style not reaching object bodies — 1 fixture
(`lisepi-64-mudo307`), plus the same family as item 1.**
`<style> object { FontSize N }` must flow into the member rows via
`getStyle()` → `MethodsOrFieldsArea.java:240`; ours hardcodes `theme.fontSize`
at `class-object-map-sizing.ts:229`/`:417`.

**4. Creole richness not built in class/object bodies — 1 fixture
(`pikuba-31-faxo766`).** `CreoleParser.java:91-100`'s table stripe. The port
already has `StripeTable`/`AtomTable`; the object/class body path just never
reaches them.

**5. Non-object leaf sizing under `allow_mixing` — 1 fixture
(`togixe-65-bepo490`).** `state` in the class engine must use
`EntityImageState.java:102-111` (`GeneralImageBuilder.java:130-142` dispatches
on `LeafType`, not on diagram type), and the correct constants already exist
in `src/diagrams/state/state-sizing.ts:134-136`.

**6. DOT six-decimal rounding — 1 fixture as sole defect
(`fafozi-27-reja300`), latent everywhere.** `SvekUtils.java:99-102` vs
`src/core/svek-dot-emit.ts:42`.

## The three "identical 0.055556" pins are NOT one mechanism

`size-backlog.json`'s `_doc` groups `fonulu-92-libi014`, `lisepi-64-mudo307`
and `tenalu-53-meri239` by their identical pin and asserts that identical
deltas signal a shared cause. Measured on this tree, that grouping does not
hold, on two independent grounds:

1. **The pin is stale for one of the three.** `tenalu-53-meri239`'s current
   `maxSizeDeltaIn` is 0.027778 (2px), not 0.055556 (4px) — it dropped when
   `babcfa94` landed the element/stereotype FontSize mechanism, and the pin
   was never lowered (the ratchet permits that). So only two fixtures actually
   sit at 4px today.
2. **The two that do sit at 4px arrive there by unrelated arithmetic.**
   `fonulu-92-libi014`'s 4px is 2 × (badge radius 11 − 9), applied to width AND
   height of a class/interface box by a dropped `CircledCharacter Radius`.
   `lisepi-64-mudo307`'s 4px is 2 member rows × (14pt − 12pt), a height-only
   term on an object box from a `<style> object { FontSize }` that never
   reaches the body. Different property, different Java origin, different
   file to change. Fixing either leaves the other at exactly 0.055556.

The mechanism they *do* share with a third fixture is a different pairing:
`fonulu-92-libi014` and `lunike-70-xipi897` (pins 0.055556 and 0.073351 — not
equal) are one bug in `scripts/compile-themes.py`. Equal pins were the wrong
grouping key; the sorted-pool metric that produces them (see the header) has
no notion of which node or which property moved.

## No `gvts-blocked` verdicts

All eight are attributable to node-size or markup mechanisms strictly upstream
of the layout engine. Every fixture is `structurallyEqual=true` against its
oracle DOT (node/edge counts, degree sequence, minlen, shapes, labels,
clusters, rankdir, nodesep, ranksep all match), so in each case the geometry
delta is fully accounted for by the size inputs handed to graphviz — nothing
was attributed to engine noise, and no colour or DOM-shape diff was.
