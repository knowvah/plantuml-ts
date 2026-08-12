# T4a — heavy non-numeric cluster (9 fixtures)

Read-only investigation. No production file was modified.

Method: every row below was measured with the ratchet/census metric
(`DeterministicMeasurer` through `renderFixtureClass`, the same
`compareSvg` the baseline uses), then traced into the Java before any
claim about cause. Jar SVGs are the `ce8650ed` re-capture.

**Universal caveat — the diff counts here are FLOORS.** `compare.ts` stops
recursing into a `<g>` once its `childCount` differs (see memory note
"compare.ts childCount stops recursion"). Eight of these nine fixtures
carry `childCount` diffs, so the *unreported* diffs inside those groups
(text fills, x offsets, extra shapes) are real and additional. No verdict
below is sized on the diff count alone.

**Prior "gvts-blocked" filing is wrong for all nine.** Not one of these
non-numeric diffs is producible by a layout engine: a DOT/spline solver
does not choose `stroke`, `fill`, `@id`, `text-anchor`, `textLength`,
`rx/ry`, `@class`, or the number of children in a `<g>`. Where a fixture
*also* carries a residual numeric delta, that residue is named separately
and is not the subject of this audit.

---

### zebufu-01-pevo013
- Mechanism: A link's `<<stereo>>` is matched-and-discarded by the relationship regex, so the `.mystyle` style class never reaches the arrow's style signature; the arrow cascade also never reads `LineThickness` at all.
- Java origin: `~/git/plantuml/src/main/java/net/sourceforge/plantuml/classdiagram/command/CommandLinkClass.java:369-371` (`link.setStereotype(Stereotype.build(arg.get("STEREOTYPE", 0)))`), consumed at `.../svek/SvekEdge.java:817-822` (`getDefaultStyleDefinition(stereotype)` → `result.withTOBECHANGED(stereotype)`) and read at `.../svek/SvekEdge.java:874-876` (`styleLine.getStroke()` for LineThickness, `Rainbow.build(styleLine, …)` for LineColor). Subset matching that lets a bare `.mystyle` declaration match: `.../style/StyleSignatureBasic.java:213` (`element.key.snames.containsAll(declaration.key.snames)`) plus the stereotype fan-out at `:119-132` (`withTOBECHANGED`).
- Ours: `src/diagrams/class/class-relationship-parser.ts:144` (`REL_STEREO`) used non-capturing at `:166` and `:185` — the stereotype is consumed by the regex and thrown away. Cascade: `src/core/style-cascade-class.ts:326` (`cascadeHex(styleMap, ARROW_SNAMES, 'linecolor')` — no `stereotypeTags` argument, and no `linethickness` lookup anywhere). Consumption: `src/diagrams/class/renderer-edge.ts:168-170` (`strokeColor`) and `:198` (`strokeWidth: geo.strokeWidth ?? 1`).
- Causal chain: stereotype dropped at parse → `EdgeGeo` carries no stereotype → arrow cascade queried with zero tags → `.mystyle { linecolor: blue }` never matches → `path/@stroke` and `polygon/@stroke`,`@fill` stay `#181818` instead of `#00F`; `linethickness: 3` has no reader at all → `@stroke-width` stays `1` instead of `3`.
- Ruled out: **not** a `<style>` parse failure — `parseStyleBlock` stores `.mystyle` and `resolveStyleCascade` already implements upstream's two-subset match including `stereotypeTags` (`src/core/style-map-element.ts:325-346` doc, used by `resolveClassTagCascadeEntry` for classifier `.tag` selectors, which *do* work). **Not** the `-[#color]->` bracket path — `geo.colorOverride` is undefined here (no bracket in the source). **Not** geometry — the five diffs are `stroke`/`fill`/`stroke-width` string values; the accompanying ≤3px deltas come from the 1px-vs-3px stroke changing the box/edge extents, i.e. they are downstream of the same cause.
- Verdict: fixable
- Shared with: `style-stereotype-on-arrow-3` (byte-identical `.puml`), `style-stereotype-on-arrow-7`

### style-stereotype-on-arrow-3
- Mechanism: Identical to `zebufu-01-pevo013` — the two `in.puml` files are byte-for-byte the same source (`<style> .mystyle { linecolor: blue; linethickness: 3 }` + `object n0/n1` + `n0 -> n1 <<mystyle>> : label`), and the two baseline rows are identical (41 diffs, max delta 3.000, the same five non-numeric paths).
- Java origin: `CommandLinkClass.java:369-371` / `SvekEdge.java:817-822,874-876`
- Ours: `src/diagrams/class/class-relationship-parser.ts:144,166` / `src/core/style-cascade-class.ts:326`
- Causal chain: as above — `svg/g[1]/g[3]/path[1]/@stroke`, `@stroke-width`, `polygon[1]/@fill`, `@stroke`, `@stroke-width`.
- Ruled out: ruled out that these are two *different* fixtures with a coincidentally-equal signature — `diff` of the two `in.puml` files is empty. This is one duplicated corpus entry, not two independent data points.
- Verdict: fixable
- Shared with: `zebufu-01-pevo013`, `style-stereotype-on-arrow-7`

### style-stereotype-on-arrow-7
- Mechanism: Same as the two above; the only source difference is that the endpoints are `map n0 { }` / `map n1 { }` rather than `object n0/n1`, which changes nothing about the link's stereotype path.
- Java origin: `CommandLinkClass.java:369-371` / `SvekEdge.java:817-822,874-876`
- Ours: `src/diagrams/class/class-relationship-parser.ts:144,166` / `src/core/style-cascade-class.ts:326`
- Causal chain: identical five paths under `svg/g[1]/g[3]`.
- Ruled out: **not** map-specific. Verified by holding the fixture's own arrow line constant against `-3`'s: the five non-numeric paths and their ours/jar values match exactly; only the numeric residue differs (max 28.0 vs 3.0), which tracks the empty-map box sizing, not the arrow. That numeric residue is *not* covered by this mechanism and is named remainder.
- Verdict: fixable (non-numeric set); numeric residue (max 28.0 px, empty-`map` box extent) is separate and unattributed here
- Shared with: `zebufu-01-pevo013`, `style-stereotype-on-arrow-3`

---

### kavako-54-zipa815
- Mechanism: The inline entity LINE-colour decorations `##pink` and `#line:red` are parsed into `Classifier.color` but deliberately discarded by the only consumer, which extracts the background half and returns `undefined` for anything else; the border resolver has no per-entity override tier at all.
- Java origin: grammar `~/git/plantuml/src/main/java/net/sourceforge/plantuml/objectdiagram/command/CommandCreateMap.java:95` and `.../classdiagram/command/CommandCreateClassMultilines.java:118` (`RegexLeaf("##")` + `LINECOLOR`); binding `CommandCreateMap.java:218-227` and `CommandCreateClassMultilines.java:271-281` (`colors = colors.add(ColorType.LINE, lineColor)`, `entity.setColors(colors)`); the `#line:red` compound form is `.../klimt/color/ColorParser.java:45` (`PART2`, the `line` alternative); consumption at `.../svek/image/EntityImageMap.java:160,166-167` and `.../svek/image/EntityImageClass.java:193,200-201` (`borderColor = lineConfig.getColors().getColor(ColorType.LINE)` **first**, style `PName.LineColor` only as fallback), with the style-side plumbing at `.../style/Style.java:157-171` (`eventuallyOverride(Colors)` maps `ColorType.LINE` → `PName.LineColor`).
- Ours: `src/diagrams/class/class-color-override.ts:25` — `if (colorToken === undefined || colorToken.startsWith('##')) return undefined;` and `:27-28`, whose `back:`-only regex drops the `line:` component. Border resolution: `src/diagrams/class/renderer-classifier-colors.ts:152-160` (`classBorder` reads only tag-cascade → `classCascadeBorder` → `classBorder` → `theme.colors.border`; no geo-level field is consulted, and none exists — grep for `borderOverride` finds only `Cluster.ts`'s cluster-level one).
- Causal chain: `##pink`/`#line:red` survives parsing into `Classifier.color` → `resolveBareOrBackColor` returns `undefined` → `classBorder` falls through to the `#181818` default → all nine non-numeric diffs are `rect[1]/@stroke` + both divider `line/@stroke` on `g[2]` (`class x #white ##pink`, jar `#FFC0CB`), `g[3]` (`map commit2 #white ##pink`, jar `#FFC0CB`) and `g[4]` (`map commit3 #line:red`, jar `#F00`).
- Ruled out: **not** a colour-name resolution failure — `pink`→`#FFC0CB` and `red`→`#F00` are both resolvable by `HColorSet`; the port never asks. **Not** the `<style>`/skinparam cascade — this fixture has no `<style>` block and no skinparam. **Not** confined to `map` — `g[2]` is a `class`, and both command grammars carry the identical `LINECOLOR` group, so one fix covers both. `g[1]` (`map commit1 #white`, no `##`) is byte-correct on stroke, which isolates the `##`/`line:` token as the trigger.
- Verdict: fixable (non-numeric set); the ≤15 px positional residue on `g[2]`/`g[3]`/`g[4]` is a separate, unattributed sizing question
- Shared with: —

---

### gubene-80-zume167
- Mechanism: TWO independent causes. (1) A **bare top-level** `<style> header { … }` selector is dropped by the style-map parser, which only accepts the nested `<sname>.header` form — so neither the half-rounded header band nor the header FontColor is applied. (2) A `map` body's `key *-> dest` link is created with no `creationIndex`, which makes the uid plan's exact path bail and renumber everything densely entities-first.
- Java origin: (1) header style signature `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageObject.java:132-135` and `.../EntityImageMap.java:146-149` (`{root, element, objectDiagram, object|map, header}`); the band draw at `EntityImageObject.java:199-203` (`URectangle.build(widthTotal, dimTitle.getHeight()).halfRounded(roundCorner)`, gated on `backcolor.equals(headerBackcolor) == false`) and its resolution at `:174-177`; header FontConfiguration at `EntityImageObject.java:96-98`. Bare-selector matching is legal per `.../style/StyleSignatureBasic.java:213` (subset containment — `{header}` ⊆ `{root,element,objectDiagram,object,header}`). (2) `.../objectdiagram/command/CommandCreateMap.java:186-190` constructs the `Link` *inside* the map block's `executeNow`, so it burns the shared counter at `.../atmp/CucaDiagram.java:741-747` (`cpt1.addAndGet(1)`, one counter for `Entity.java:171` and `Link.java:135` alike) before any later entity.
- Ours: (1) `src/core/style-map-element.ts:197-199` — `if (selector.endsWith('.header')) { const sname = selector.slice(0, -7); if (!ELEMENT_BUCKET_SNAMES.has(sname)) continue; }`; a bare `header` selector yields prefix `''`, fails the set test, and is skipped. (2) `src/diagrams/class/class-map-commands.ts:344-366` builds the `Relationship` and pushes it at `:365` with no `creationIndex` field; `src/diagrams/class/renderer-uid.ts:115-119` (`isExact` requires `geo.edges.every(e => e.creationIndex !== undefined)`) therefore returns false and the fallback path numbers all entities before the edge.
- Causal chain: (1) `header { BackGroundColor palegreen; FontColor red }` dropped → no `<path>` header band emitted on `London`/`CapitalCity`/`user` → `g[1]`, `g[2]`, `g[3]` each report `childCount` one short (3/12/5 vs 4/13/6); the same drop leaves the title text at `#00F` (from the `object`/`map` bucket) where jar paints `#F00` — that diff is *suppressed*, not absent, because the `childCount` mismatch halts recursion. (2) no creationIndex on the map link → dense fallback → `user` gets `ent0003` (jar `ent0004`) and the link gets `lnk4` (jar `lnk3`).
- Ruled out: **not** the already-landed O4 Mechanism 2 (`plans/g3-object-svg/ledger.md:1413-1481`) — that mechanism is real and works, but it is keyed on the *nested* `object { header { … } }` selector; this fixture uses the bare form, which never reaches it. **Not** a uid-counter design flaw — the shared-counter model is correctly ported (`src/core/cucadiagram/CucaDiagram.ts:156-166`) and the exact path already handles far subtler phantom-slot burns; the single missing stamp on the map-body link is what disables it. **Not** graphviz — the `@id` values differ by *assignment*, and the ids present are the same set on both sides.
- Verdict: fixable (both causes)
- Shared with: `kagope-09-kubu001` (adjacent, not identical: that one is emission *order*, this one is uid *assignment*)

---

### kagope-09-kubu001
- Mechanism: Node emission order. Upstream draws every node — classifiers *and* notes — in one pass in creation order, then every edge in a second pass. The port interleaves: hosted notes are emitted immediately after their host classifier, and unhosted (freestanding) notes are emitted *after* all edges.
- Java origin: `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java:82-91` (`for (SvekNode node : …allNodes()) image.drawU(…)`) followed by `:97-101` (`for (SvekEdge svekEdge : …allLines()) svekEdge.drawU(…)`) — strictly two phases, no interleaving.
- Ours: `src/diagrams/class/renderer.ts:316-320` (`renderHostedNotes`, called from inside the classifier loop) and `:440-443` (`for (const note of geo.notes) { if (hostedNoteIds.has(note.id)) continue; … }` — after the edge loop at `:409-435`). The module's own comment at `:298-307` states the interleave is a heuristic chosen to avoid "a full creation-order re-sort"; this fixture is where the heuristic breaks.
- Causal chain: jar's `<g>` sequence is `ent0001, ent0002, ent0005, ent0007, ent0008, lnk3, lnk9, lnk10`; ours is `ent0001, ent0005, ent0002, lnk3, lnk9, lnk10, ent0007, ent0008`. Every one of the 18 diffs is a positional consequence: `g[2]`/`g[3]` swap `@id` (`ent0005`↔`ent0002`), `g[4]`/`g[5]` flip `@class` from `entity` to `link`, `g[6]`/`g[7]`/`g[8]` shift, and each shift drags a `childCount` mismatch with it.
- Ruled out: **not** uid assignment. The uid *set* and the uid *values* are already exactly right — `ent0001, ent0002, ent0005, ent0007, ent0008, lnk3, lnk9, lnk10` appear on both sides, gaps and all, meaning the creation-index bookkeeping (including the `GMN` phantom-slot and note-connector burns modelled in `renderer-uid.ts:150-183`) is correct here. **Not** rendering content: this is the one fixture in the cluster with *no numeric delta at all* — every coordinate, every colour, every path matches; only the DOM sequence differs. **Not** graphviz: a layout engine cannot reorder `<g>` emission, and the geometry it *does* control is byte-identical.
- Verdict: fixable
- Shared with: `gubene-80-zume167` (same "creation-rank bookkeeping" area, different defect: order vs. assignment)

---

### zicope-62-pica490
- Mechanism: A `map` row's key and value are measured and emitted as raw strings — they never pass through creole. Consequently (a) a `<font:monospaced.bold>…</font>` tag is emitted as literal text instead of becoming a `font-family` attribute, and (b) a `{{ … }}` embedded sub-diagram value is emitted as a `<text>` instead of the nested base64 `<image>` jar produces.
- Java origin: `~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/TextBlockMap.java:172-180` — **both** key and value go through `Display.getWithNewlines(…)` then `display.create0(fontConfiguration, HorizontalAlignment.LEFT, skinParam, wordWrap, CreoleMode.FULL, null, null)`. The `<font:…>` command is `.../klimt/creole/command/CommandCreoleFontFamilyChange.java:54-56` (`Splitter.fontFamilyPattern`). The `{{ … }}` → image conversion is `.../klimt/creole/legacy/CreoleParser.java:152-167` (`EmbeddedDiagram.getEmbeddedType(cs)` → `EmbeddedDiagram.createAndSkip(…)` as an `Atom`), with the sentinels at `.../EmbeddedDiagram.java:77-78`.
- Ours: `src/diagrams/class/class-map-sizing.ts:71-76` (`measureMapCell` calls `measurer.measure(text, fontSpec)` on the raw string) and `:147-155` (`buildOneMapRow` sets `text: row.key` / `text: row.value` verbatim). The creole command itself *is* ported (`src/core/klimt/creole/command/CommandCreoleFontFamilyChange.ts`) and wired into the builder (`src/core/klimt/creole/legacy/CommandCreoleBuilder.ts:110`) — the map cell path simply never calls it. There is no `EmbeddedDiagram` equivalent anywhere in `src/`.
- Causal chain: raw string → measured at full literal width (`textLength` 215.163 vs jar's 17.5) → box balloons to 707×92 vs jar's 184×176 → `text()[1]` contains the literal `<font:monospaced.bold>--></font>`, `@font-family` is empty vs `monospaced.bold`, and `text[3]`/`text[5]`/`text[7]` are `<text>` where jar has `<image>`. The 554.574 px max delta is entirely downstream of the un-stripped markup, not an independent geometry fault.
- Ruled out: **not** a `!procedure`/`%breakline()` preprocessor failure — the substituted row text arrives correctly (our literal output contains exactly the post-substitution string upstream also produces, `<font:monospaced.bold>--></font>`), so the preprocessor did its job. **Not** the object/class member path — object members already route through creole (`plans/g3-object-svg/ledger.md` O4 Mechanism 4, and commit `fca9762c`); it is specifically `class-map-sizing.ts`'s cell path that bypasses it. **Not** graphviz: the whole fixture is a single node with no edges at the outer level.
- Verdict: needs-maintainer-scoping — the `<font:…>` half is a contained fix (route map cells through the existing creole pipeline); the `{{ … }}` half requires a nested-diagram render-and-embed facility (`EmbeddedDiagram` + base64 SVG data-URI) that does not exist in this port at all and is a cross-cutting capability, not a map fix. Split the two before scheduling.
- Shared with: —

---

### gapisu-00-celo011
- Mechanism: Under `allow_mixing`, descriptive USymbol leaves are laid out correctly but only FOUR of upstream's ~37 USymbols have an icon renderer; every other keyword falls back to the plain classifier box, which additionally stamps a spurious class spot badge. Inside the four that *are* implemented, the icon renderer hardcodes `stroke-width: 1` (upstream's `element { LineThickness 0.5 }`) and draws its label through the generic centred node-label helper instead of the classifier text path.
- Java origin: the registry — `~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/symbol/USymbols.java:60-95` (37 `record(...)` entries: AGENT, ARTIFACT, BOUNDARY, CARD, CLOUD, CONTROL, FILE, FOLDER, FRAME, NODE, QUEUE, RECTANGLE, STACK, STORAGE, …). The draw path — `.../svek/image/EntityImageDescription.java:111-114` (`StyleSignatureBasic.of(SName.root, SName.element, getStyleName(), symbol.getSNames())`), `:171` (`final UStroke stroke = styleTitle.getStroke(colors)` — the stroke comes from the style, not a constant), `:203-210` (label is a real `BodyFactory.create3` TextBlock, left-anchored with `textLength`), `:213` (`symbol.asSmall(name, desc, stereo, ctx, stereotypeAlignment)`). The 0.5 constant: `~/git/plantuml/src/main/resources/skin/plantuml.skin:91-93` (`element { Shadowing 0.0; LineThickness 0.5 }`).
- Ours: `src/core/usymbol-shapes.ts:223-228` — `USYMBOL_ICONS` holds exactly `database`, `component`, `actor`, `usecase`; `renderUSymbolIcon` (`:234-240`) returns `undefined` for everything else, so `src/diagrams/class/renderer.ts:98-102` (`renderClassifier`) falls through to `renderClassifierBox`, and `src/diagrams/class/class-badge.ts:160-162` (`hasBadge` — true for every kind except object/map/json, so `descriptive` qualifies) adds the `#ADD1B2` spot ellipse + circled-character glyph. Within the four implemented icons: `src/core/usymbol-shapes.ts:59,97,116,157` hardcode `stroke-width`/`strokeWidth: 1`, and `:217` delegates the label to `renderNodeLabel`, which at `src/core/latex.ts:106-112` emits `text-anchor="middle"`, `fill: theme.colors.text` (`#181818`) and **no** `textLength`.
- Causal chain: 21 of the 25 entities are non-database/component/actor/usecase keywords → each emits `<rect …/>` + `<ellipse fill="#ADD1B2"/>` + a `C`-glyph `<path>` + `<text>` (4 children) where jar emits its symbol-specific shapes (`card` 2, `agent` 2, `artifact` 5, `boundary` 3) → the 14 `childCount` diffs. For `component` (`g[9]`) and `database` (`g[11]`), which *are* implemented: `@stroke-width` 1 vs 0.5 (×4 rects / ×2 paths), missing `@rx`/`@ry` 2.5 on the component rect, `text/@fill` `#181818` vs `#000`, `text/@text-anchor` `middle` vs absent, `text/@textLength` absent vs 69.213 / 57.575, and the resulting `@x` shift (358.85 vs 319.24). The 1.5 px `@y` offsets and the 39.610 max delta are the layout consequence of the stroke-width and label-metric differences.
- Ruled out: **not** a parse failure — every keyword is recognised (`data-qualified-name` and box widths match jar exactly, e.g. `card` 47.213×20 on both sides), so the descriptive-leaf command and sizing are right; only the emitter is wrong. **Not** the class-box renderer being buggy — it is doing its job correctly, it is simply the wrong renderer for these leaves. **Not** graphviz: colours, `text-anchor`, `textLength`, `rx/ry` and child counts are all emitter-side. The 39.610 figure is a pixel delta, **not** a colour misread as a number (checked: no `@stroke`/`@fill` value in this fixture parses to it).
- Verdict: fixable, but large — porting the remaining ~33 USymbol shapes plus routing the icon label through the classifier text path is a multi-task body of work, not a one-line fix. Recommend it be raised as its own tracked mission rather than absorbed into object-close.
- Shared with: `ruturo-47-kapi300`; and (owned by a sibling agent) `togixe-65-bepo490` / `lunike-70-xipi897` — see the linkage note at the end.

### ruturo-47-kapi300
- Mechanism: Identical to `gapisu-00-celo011`. Same `allow_mixing` keyword sweep with a slightly shorter keyword list (`card`, `file`, `package`, `queue`, `stack`, `usecase`-ordering differ); no new mechanism appears.
- Java origin: `USymbols.java:60-95`; `EntityImageDescription.java:111-114,171,203-213`; `plantuml.skin:91-93`
- Ours: `src/core/usymbol-shapes.ts:223-228,59,97,116,157,217`; `src/core/latex.ts:106-112`; `src/diagrams/class/class-badge.ts:160-162`; `src/diagrams/class/renderer.ts:98-102`
- Causal chain: the `g[9]` (component) and `g[11]` (database) diff blocks are attribute-for-attribute the same as `gapisu-00`'s (`@rx`/`@ry` empty vs 2.5, `@stroke-width` 1 vs 0.5 ×4, `@fill` `#181818` vs `#000`, `@text-anchor` `middle` vs absent, `@textLength` absent vs jar's, `@y` off by 1.5); the remaining `childCount` diffs are the unported symbols.
- Ruled out: ruled out that this is a *different* mechanism sharing a value — the 39.609 vs 39.610 max delta (one thousandth apart) is not the evidence; the evidence is that the two fixtures' non-numeric path lists are the same set modulo the four keywords `ruturo` omits (`card`, `file`, `package`, `queue`, `stack`), and the ours/jar values at each shared path are identical.
- Verdict: fixable, but large — same scoping recommendation as `gapisu-00-celo011`
- Shared with: `gapisu-00-celo011`, and the `togixe`/`lunike` pair

---

## Distinct cascade mechanisms

**The nine fixtures reduce to SIX distinct mechanisms.** Two of the six are
shared across fixtures; four are singletons. One fixture (`gubene-80`)
carries two mechanisms at once, which is why the mechanism count is not
simply nine-minus-groupings.

| # | Mechanism | Slugs | Evidence for the grouping |
|---|---|---|---|
| **M1** | Link `<<stereo>>` never reaches the arrow style signature; arrow cascade also never reads `LineThickness` | `zebufu-01-pevo013`, `style-stereotype-on-arrow-3`, `style-stereotype-on-arrow-7` | `-3` and `zebufu` have **byte-identical** `.puml` and identical baseline rows. `-7` differs only in endpoint kind (`map` vs `object`) and has the same five non-numeric paths with the same ours/jar values. One parse-site fix (`class-relationship-parser.ts:144,166`) plus one cascade change (`style-cascade-class.ts:326`) resolves all three. |
| **M2** | Descriptive USymbol emitter: 4-of-37 icon coverage + hardcoded `stroke-width: 1` + centred/`textLength`-less label + spurious spot badge | `gapisu-00-celo011`, `ruturo-47-kapi300` | Non-numeric path sets are the same modulo the keywords `ruturo` omits; at every shared path the ours/jar pair is identical. Both trace to `usymbol-shapes.ts:223-228` (registry) and `latex.ts:106-112` (label). |
| **M3** | Inline entity LINE colour (`##color`, `#line:color`) parsed then discarded; `classBorder` has no per-entity tier | `kavako-54-zipa815` | Isolated by the fixture's own control: `map commit1 #white` (no `##`) has a correct stroke; the three entities that *do* carry `##`/`line:` are the three with wrong strokes. |
| **M4** | Bare top-level `<style> header { … }` selector dropped by the style-map parser (only `<sname>.header` accepted) | `gubene-80-zume167` (cause 1) | The nested form already works (ledger O4 M2, `soxufi-98-nita528`/`lijoda-62-teci632` pinned); only the bare form fails. `style-map-element.ts:197-199`'s `ELEMENT_BUCKET_SNAMES.has('')` test is the exact rejection point. |
| **M5** | Node/edge emission order: notes not folded into a single creation-ordered node pass that strictly precedes all edges | `kagope-09-kubu001` | Zero numeric delta — every coordinate and colour matches; only DOM sequence differs. The uid *values* are already exactly right on both sides, which excludes uid assignment and isolates order. |
| **M6** | `map` cell text bypasses creole entirely (`<font:…>` literal; `{{ … }}` embedded diagram unsupported) | `zicope-62-pica490` | `class-map-sizing.ts:71-76,147-155` measures and emits the raw string; the creole commands exist and are wired for other paths, so this is a missing call, not a missing feature — except for `{{ … }}`, which has no port at all. |
| **M7** | `map`-body `key *-> dest` link created with no `creationIndex`, disabling the exact uid path for the whole diagram | `gubene-80-zume167` (cause 2) | Ours yields `user=ent0003, lnk4`; jar yields `user=ent0004, lnk3`. Dense entities-then-edges fallback reproduces ours exactly, and `isExact` (`renderer-uid.ts:115-119`) requires every edge to carry a `creationIndex` — `class-map-commands.ts:365` pushes without one. |

Counting: M1–M7 is seven rows, but M4 and M7 are the two halves of the
single fixture `gubene-80`. Counting *independent code defects* the answer
is **seven**; counting *distinct mechanism families* the answer is **six**,
because M5 and M7 are the same family (creation-rank bookkeeping in the
class/object uid+emission layer) attacked from two sides — M7 is a missing
rank stamp, M5 is a missing sort by the ranks that already exist. Fixing
one does not fix the other, but they land in adjacent code
(`renderer-uid.ts` / `renderer.ts:316-320,440-443` /
`class-map-commands.ts:365`) and should be scheduled together.

### Cost ordering (cheapest first)
1. **M7** — one field stamp on the map-body `Relationship`.
2. **M4** — one branch in `style-map-element.ts:197-199` to accept an empty sname prefix.
3. **M1** — capture the link stereotype, thread it as `stereotypeTags`, add a `linethickness` lookup. Cheaper than it was: `resolveStyleCascade` already implements upstream's two-subset match, and commit `babcfa94` established the generic `<<stereo>>`-to-style precedent (`FromSkinparamToStyle.java:292-302,396-410`, `StyleLoader.java:178-186`). **Note the scope boundary**: this cluster's colour diffs are `<style>`-class-driven, *not* tag-scoped skinparam keys, so the `babcfa94` skinparam-side work does not itself resolve them — it is precedent for the shape of the fix, not the fix.
4. **M3** — add a border-override tier to `classBorder` and stop discarding `##`/`line:`.
5. **M5** — merge notes into one creation-ordered node pass ahead of edges.
6. **M6 (`<font:…>` half)** — route map cells through the existing creole pipeline.
7. **M2** — port ~33 USymbol shapes and re-route the icon label. Own mission.
8. **M6 (`{{ … }}` half)** — `EmbeddedDiagram` nested render + base64 embed. Own mission.

### Linkage for the merge step
`gapisu-00-celo011` (39.610) and `togixe-65-bepo490` (39.610) share a max
delta to three decimal places, and `lunike-70-xipi897` (87.635) sits in the
same `allow_mixing`/descriptive-USymbol family. On the evidence here, the
shared 39.610 is the **stroke-width 1-vs-0.5 plus centred-label metric**
signature of M2, not a coincidence — a sibling agent owning `togixe`/
`lunike` should check their `@stroke-width`, `@text-anchor` and `@textLength`
values against `usymbol-shapes.ts:59,97,116,157` and `latex.ts:106-112`
before opening an independent line of enquiry. If they match, all four
fixtures collapse into M2 and the cluster's true mechanism count for the
combined T4a+sibling set stays at six.

### Verdict summary
No fixture in this cluster is `gvts-blocked`. Every non-numeric diff
traces to a port-side emitter, parser or cascade defect with a named
`file:line` on both sides. Where a numeric residue survives the named
mechanism (`style-stereotype-on-arrow-7` 28.0 px, `kavako-54-zipa815`
15.0 px), it is called out in that fixture's row as unattributed remainder
rather than absorbed into the verdict.
