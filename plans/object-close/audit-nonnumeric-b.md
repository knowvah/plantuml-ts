# T4b — attribution for the 20 mostly-geometric fixtures carrying non-numeric diffs

Measured 2026-08-11 on `feat/object-close` @ `d78a1072`, oracle cache from the
pinned jar (`ce8650ed`). Every diff count below was re-measured through
`renderFixtureClass` + `DeterministicMeasurer` + `compareSvg` — the same metric
as the ratchet, census and `baseline-object.json`. All 20 counts reproduce the
brief's numbers exactly.

Read-only audit: no production file was modified.

---

## A load-bearing correction to the standing evidence

**The object DOT gate cannot see the largest mechanism in this set.** The jar
emits map/json/port-bearing classifiers as `ShapeType.RECTANGLE_HTML_FOR_PORTS`
— one `<TR>` per member row, each carrying `PORT="p<md5>"`
(`svek/SvekNode.java:132-135` dispatch → `appendLabelHtmlSpecialForLink`,
`svek/SvekNode.java:268-296`), and edges anchor to those ports
(`sh0006:p48c4…->sh0007:pcb85…`). Our emitter has no such branch: every
classifier goes out as `shieldTable` (`src/core/svek-dot-emit.ts:92-107`), a 3×3
protection table with a single `PORT="h"`, and every edge is emitted as
`sh0006:h->sh0007:h`.

`tests/oracle/svek-dot.ts` compares node **count + shape multiset** (`plaintext`
either way) and edge topology with ports stripped, so this divergence scores
EQUAL. "78/80 structurally EQUAL" is therefore **not** evidence that the DOT fed
to layout matches on these fixtures — it does not, in node footprint *or* in
edge anchoring. Verified by emitting our own DOT through `toSvekDot` for
`fusopu-05`, `sivapa-41`, `baloca-83`, `nitica-38` and diffing against the
cached `svek-1.dot`.

Consequence for rule 5: on every map/json fixture below, the large edge-path and
node-position deltas are **upstream of layout**, not engine noise. No
`gvts-blocked` verdict is issued anywhere in this audit.

---

### majake-62-pero492
- Mechanism: `skinparam objectBackgroundColor<<azerty>> green` is discarded to
  `acc.unknown` because the port models `<<stereo>>`-qualified skinparam keys as
  a per-key allowlist, while upstream splits the stereotype off *any* key
  generically and re-signs the resulting style with it.
- Java origin: `style/FromSkinparamToStyle.java:292-302` (constructor:
  `new StringTokenizer(key, "<>")` runs on the RAW key, before any registration
  lookup, so `key`=`objectbackgroundcolor`, `stereo`=`azerty`) →
  `:396-410` (`addStyle` re-signs `sig.addStereotype(s)` per `&`-part) →
  `style/StyleLoader.java:178-186` (`DELTA_PRIORITY_FOR_STEREOTYPE = 1000`).
  The key itself is registered at `style/FromSkinparamToStyle.java:198`
  (`addConvert("objectBackgroundColor", PName.BackGroundColor, SName.object)`).
- Ours: `src/core/skinparam-stereo-keys.ts:135-195` (`STEREO_KEY_MATCHERS` — no
  `*backgroundcolor<<…>>` entry); consumption point
  `src/diagrams/class/renderer-classifier-colors.ts:122-124`
  (`resolveElementBackground(theme, geo.kind)`).
- Causal chain: no matcher claims the key → no `…ByStereo` entry → `foo3`'s fill
  falls through to the *plain* `objectBackgroundColor red` bucket →
  `svg/g[1]/g[3]/rect[1]/@fill` = `#F00` where the jar writes `#008000`. Sole
  diff; geometry is byte-exact.
- Ruled out: NOT a colour-name resolution bug (`green`→`#008000` resolves
  correctly wherever the key IS claimed; the *plain* red key on the same fixture
  lands correctly, proving the `SName.object` bucket and the resolver both
  work). NOT the `<style>`/`.tagname` cascade — `FromSkinparamToStyle`'s
  tokenizer path is a skinparam-front-end mechanism, disjoint from
  `style-cascade-class.ts`.
- **Verdict re the brief's question — yes, this is cheap now.** The earlier
  finding (generic universal cascade, not a one-key extension) still holds and
  is re-verified above at `:292-302`. But `babcfa94` already built the matching
  *generic* front-end for FontSize:
  `skinparam-stereo-keys.ts:120` `ELEMENT_FONT_SIZE_STEREO_RE =
  ^(\w+)fontsize<<(.+)>>$`, scoped to `ELEMENT_BUCKET_SNAMES`, which already
  contains `object`/`map`/`json`
  (`src/core/skinparam-element-buckets.ts:91-93`), and the preprocessor already
  normalises both the flat and the `skinparam object { <<X>> { … } }` block
  spellings to one key. A `^(\w+)backgroundcolor<<(.+)>>$` sibling matcher +
  one `elementBackgroundByStereo` theme field + one lookup ahead of
  `renderer-classifier-colors.ts:123` is a direct copy of that landed shape.
  The "SEPARATE, larger mechanism, deferred" note at
  `skinparam-element-buckets.ts:86-90` and
  `renderer-classifier-colors.ts:119-121` is now stale.
- Verdict: fixable
- Shared with: —

### fajafu-44-cuve930
- Mechanism: `SvgGraphics#text`'s `monospaced` → `monospace` family rename is
  ported only into the NBSP half of the block; the attribute-emitting half on
  the shared shape seam never applies it.
- Java origin: `klimt/drawing/svg/SvgGraphics.java:720-725` — the rename runs
  BEFORE the `DEFAULT_FONT_FAMILY` comparison that decides whether to emit
  `font-family` at all.
- Ours: `src/core/svg-shapes.ts:117-121` (`textFontFamily` — compares the raw
  family to `ROOT_FONT_FAMILY` and returns it verbatim). The rename exists two
  functions below, at `src/core/svg-shapes.ts:237`, inside `nbspIfMonospace`,
  and again on the klimt path at
  `src/core/klimt/drawing/svg/svg-graphics-elements.ts:263`. That file's own doc
  comment (`svg-shapes.ts:224`) states the rename must happen "BEFORE the test"
  — it was ported for the NBSP test and not for the attribute.
- Causal chain: creole `""monospaced""` → `Parser.MONOSPACED` = the literal
  string `monospaced` → emitted verbatim as `font-family="monospaced"` on
  `svg/g[1]/g[1]/text[4]`. Nothing else moves: x, y, font-size, fill and
  `textLength="80.15"` are byte-identical to the jar.
- Ruled out: NOT a measurement/metrics bug (identical `textLength` on the same
  element). NOT the NBSP rule (the run is the single word `monospaced`, no
  spaces to substitute — so the already-ported half is inert here and cannot be
  the source). NOT the klimt seam, which already has the rename — the class/
  object engine emits through `svg-shapes.ts`, not through it.
- Verdict: fixable
- Shared with: `pavizi-27-xupe815`

### pavizi-27-xupe815
- Mechanism: identical to `fajafu-44-cuve930` — the un-renamed `monospaced`
  family on the shared shape seam. **Yes, one shared cause; here is the
  evidence:** the two fixtures' `object user` bodies are character-identical
  (`pavizi-27` merely appends an unrelated `class Testclass`), both produce
  exactly one diff, and both diffs are the same path
  `svg/g[1]/g[1]/text[4]/@font-family` with the same ours/jar pair
  `monospaced`/`monospace`. The added class contributes zero diffs, which also
  shows the mechanism is family-string-only and not object-kind-specific.
- Java origin: `klimt/drawing/svg/SvgGraphics.java:720-725`
- Ours: `src/core/svg-shapes.ts:117-121`
- Causal chain: as above.
- Ruled out: NOT anything to do with the added `class Testclass` (it renders
  byte-exact, so the class body path is unaffected); NOT a per-diagram-kind
  divergence.
- Verdict: fixable
- Shared with: `fajafu-44-cuve930`

### donoki-79-riku189
- Mechanism: the note's creole bullet-list header is modelled as a *width-only
  spacer* — the layout is right, but no bullet GLYPH is drawn, so an empty
  `<text>` sits where the jar draws an ellipse (order 0) or a rect (order ≥1).
- Java origin: `klimt/creole/atom/Bullet.java:58-69` — order 0:
  `UTranslate.dx(3)` + `UEllipse.build(5,5)`; order n≥1: `dx(1 + 8*order)` +
  `URectangle.build(3.5,3.5)`. Built by
  `klimt/creole/StripeStyle.java:59-62` (`getHeader` → `new Bullet(fc, order)`
  for `LIST_WITHOUT_NUMBER`).
- Ours: `src/diagrams/class/note-layout-measure.ts:365`
  (`const spacer: MemberRenderAtom = { kind: 'text', text: '', … width:
  bulletWidth }`); the klimt sibling explicitly throws at
  `src/core/klimt/creole/StripeStyle.ts:84-86` ("a bullet-list header …
  not yet supported", citing `Bullet.java`).
- Causal chain: the spacer renders as `<text x="12" …></text>` at the exact
  slot the glyph belongs in → `svg/g[1]/g[2]/text[1]`, `…/text[3]`,
  `…/text[5]` mismatch element kind against the jar's `ellipse`, `ellipse`,
  `rect`. All 3 diffs are that; there are no numeric diffs at all.
- Ruled out: NOT "bullet-list markup unbuilt" in the broad sense the earlier
  filing implied — **the geometry IS built and is exact.** `Bullet
  #calculateDimensionSlow`'s 12 / `8+8*order` widths are already honoured
  (`note-layout-measure.ts:69-72`), and the following text x-positions (24, 24,
  28) match the jar to the digit. NOT the object's own member rows: `* ABullet
  list` inside `object demo` is parsed as the `IE_MANDATORY` visibility modifier
  by BOTH sides and already renders byte-exact (`<g
  data-visibility-modifier="IE_MANDATORY"><ellipse …>`) — the gap is confined to
  the creole path used by notes. Jar's own numbers confirm the Java: `cx=17.5
  rx=2.5` = box x 12 + dx 3 + r 2.5; `rect x=21 w=3.5` = 12 + (1 + 8·1).
- Verdict: fixable (three shapes, all constants already in the file)
- Shared with: —

### jocamu-71-nuvo330
- Mechanism: an entity-level URL (`object … [[http://…]]`) is not wrapped in the
  `<a>` element upstream opens around the whole entity image.
- Java origin: `svek/image/EntityImageObject.java:186-187` (`if (url != null)
  ug.startUrl(url);`) and `:211-212` (`ug.closeUrl()`), wrapping the rect, the
  header text, the divider and the field rows.
- Ours: `src/diagrams/class/renderer-group.ts:78` emits the entity `<g>` with
  no url-derived `<a>` child.
- Causal chain: jar's `g[2]` has exactly ONE child (the `<a>`, which itself
  holds the 4 shapes); ours has 4 → `svg/g[1]/g[2][childCount]` 4 vs 1. The 4
  wrapped shapes are otherwise byte-identical. Separately, the two 1.0px diffs
  (`@width`, `viewBox[2]`, 212 vs 211) come from the classifier ink max-corner
  rule — see `sajege-04-zuce784` — not from the url.
- Ruled out: NOT a layout/engine effect — both entity `<rect>`s are byte-
  identical (`x=7,y=10,w=77.788,h=34` and `x=120,y=7,w=77.788,h=40`), so node
  placement agrees exactly and only the canvas total differs. NOT the note/
  comment markers, which `compareSvg` ignores. NOT `data-source-line`, likewise
  ignored.
- Verdict: fixable
- Shared with: `sajege-04-zuce784` (the 1px ink rule only)

### bepafe-03-teda035
- Mechanism: `TextBlockCucaJSon`'s per-JSON-object full-height column separator
  is not drawn; and the map/json DOT node is emitted with the wrong shape (see
  the correction section), which is what moves the canvas 16px.
- Java origin: `cucadiagram/TextBlockCucaJSon.java:163-167` —
  `ug.apply(UTranslate.dx(width1)).draw(ULine.vline(height))`, drawn ONCE per
  JSON object over the object's whole height (not per row). Node shape:
  `svek/image/EntityImageJson.java:241` (`RECTANGLE_HTML_FOR_PORTS`) →
  `svek/SvekNode.java:268-296`.
- Ours: json body rows in `src/diagrams/class/class-json-sizing.ts` /
  `renderer-classifier-box.ts` emit only horizontal rules; DOT node shape at
  `src/core/svek-dot-emit.ts:150-152`.
- Causal chain: jar's `g[2]` (json `A`) carries two vlines — `x1=258.025,
  y1=25→151` (outer object) and `x1=303.025, y1=115→151` (nested `user`) — that
  ours omits → `svg/g[1]/g[2][childCount]` 23 vs 25. The 16px `@width` /
  `viewBox[2]` delta is node spacing: both boxes are the *same* width
  (143.025 / identical), only their x differs (ours 193.2, jar 209).
- Ruled out: NOT box sizing (`rect@width` matches exactly on both entities).
  NOT the row text (every `<text>` x/textLength inside the body matches once the
  16px shift is removed). NOT graphviz noise: the jar's `svek-1.dot` node
  footprint for a map/json is the per-row port table, ours is the 3×3 shield
  table with 16px pad rows — the inputs differ, so the placement difference is
  upstream of layout.
- Verdict: fixable
- Shared with: `baloca-83-nadu916`, `maxosa-84-juci042` (json vline);
  `fusopu-05`, `vimavu-26`, `guzojo-14`, `satuco-50`, `sivapa-41`,
  `nitica-38`, `baloca-83`, `maxosa-84` (DOT node shape)

### meloxo-38-jeti489
- Mechanism: a dotted `namespace a.b.c` declares only the LEAF group in this
  port; upstream materialises every intermediate quark that has children as a
  real `GroupType.PACKAGE` entity, so the jar draws 5 nested clusters where we
  draw 2.
- Java origin: `net/atmp/CucaDiagram.java:325-337`
  (`eventuallyBuildPhantomGroups`: for every quark with `getData() == null` and
  `countChildren() > 0`, `createGroup(location, quark, GroupType.PACKAGE)`).
  Group creation itself: `net/atmp/CucaDiagram.java:349-364` (`gotoGroup`).
- Ours: `src/diagrams/class/class-namespace.ts` + `class-container.ts`
  (registers the declared namespace only; the ported
  `src/core/cucadiagram/CucaDiagramBase.ts:289
  #eventuallyBuildPhantomGroups` is on the CucaDiagram path, which the class/
  object engine does not run).
- Causal chain: jar emits clusters `classic`, `classic.collections`, `net`,
  `net.sourceforge`, `net.sourceforge.plantuml`; ours emits only
  `classic.collections` and `net.sourceforge.plantuml` →
  `svg/g[1][childCount]` 7 vs 10. Each missing wrapper adds its own margin and
  title band, which is the entire 97px width / 147px height delta.
- Ruled out: NOT a DOT-topology or namespace-nesting *engine* problem, which is
  how this was previously filed ("awaiting-maintainer, DOT-topology namespace/
  package nesting"). The gap is at PARSE time — the phantom groups never exist
  as entities, so no cluster is ever requested from the layout engine. Jar's own
  uid ordering proves the late pass: `classic` is `ent0003`, allocated AFTER
  `classic.collections` (`ent0001`) and after the leaf `Object` (`ent0002`),
  exactly as a post-parse sweep over the quark table would allocate them. NOT
  `set namespaceSeparator .` handling (the separator is honoured — ours splits
  the qualified names correctly, it just does not create the parents).
- Verdict: fixable
- Shared with: `tusiri-92-catu943`

### tusiri-92-catu943
- Mechanism: same as `meloxo-38-jeti489` — intermediate namespace quarks are
  never materialised as package groups.
- Java origin: `net/atmp/CucaDiagram.java:325-337`
- Ours: `src/diagrams/class/class-namespace.ts` / `class-container.ts`
- Causal chain: jar draws the `classic` and `net`/`net.sourceforge` wrappers
  around the two declared namespaces; ours draws neither →
  `svg/g[1][childCount]` 9 vs 11, and the wrappers' margins account for the
  68px width / 114px height deltas.
- Ruled out: as `meloxo-38`. Additionally NOT dependent on `set
  namespaceSeparator` — this fixture never sets it and shows the identical
  signature, which confirms the mechanism is the default `.` separator's quark
  tree, not the directive.
- Verdict: fixable
- Shared with: `meloxo-38-jeti489`

### zuvila-56-nuda425
- Mechanism: a creole `{{ … }}` embedded diagram inside a legend is rendered as
  literal text lines instead of being compiled to a nested diagram and emitted
  as a base64 `<image>`.
- Java origin: `sourceforge/plantuml/EmbeddedDiagram.java:75-77`
  (`class EmbeddedDiagram … implements Line, Atom`,
  `EMBEDDED_START = "{{"`), reached from
  `klimt/creole/Display.java:190-195`.
- Ours: `src/core/klimt/creole/Display.ts:185` recognises `EMBEDDED_END` for
  trimming, but no `Atom` is built — `src/core/klimt/creole/SheetBuilder.ts`
  passes the raw text through.
- Causal chain: jar's legend is `rect` + one `<image width="184" height="260"
  … data:image/svg+xml;base64,…>` (2 children); ours is `rect` + 8 `<text>`
  lines carrying the un-evaluated `{{`, `map "Arrows legend " as arrows {`,
  `\n<font:monospaced.bold>…` source →
  `svg/g[1]/g[1][childCount]` 10 vs 2. The literal source lines are what make
  the box 759px wide against the jar's 202px, and the nested diagram's real
  260px height is what makes the jar 288px tall against our 175px.
- Ruled out: NOT the `!procedure $arrow(…)` preprocessor (the substitution DID
  happen — our text shows the expanded `-[dashed]->` / `-[dotted]->` bodies, so
  the macro engine works). NOT map sizing: no map entity is created at all on
  our side, because the whole legend body stays text.
- Verdict: needs-maintainer-scoping (a nested-diagram compile + SVG-to-data-URI
  embed is a new pipeline stage, not a class/object-engine change)
- Shared with: —

### maxosa-84-juci042
- Mechanism: the `<style> json { … } map { … }` property block is applied only
  for `BackGroundColor` and `FontColor`; `MaximumWidth` (word wrap), `FontSize`,
  `FontStyle`, `LineColor` and `LineThickness` are all dropped — and the json
  column vline is missing (as `bepafe-03`).
- Java origin: `cucadiagram/TextBlockCucaJSon.java:180-190` (`getTextBlock`
  builds each cell with `display.create0(…, CreoleMode.FULL, …)` under the
  style's `wrapWidth()`); `cucadiagram/BodierJSon.java:83-85` and
  `cucadiagram/BodierMap.java:100-106` both pass `style.wrapWidth()` /
  `style.getHorizontalAlignment()` from the merged `SName.json` / `SName.map`
  style; vline at `cucadiagram/TextBlockCucaJSon.java:167`.
- Ours: `src/core/style-map-theme.ts#applyStyleMap` (the `<style>` block →
  theme bridge) and `src/diagrams/class/class-json-sizing.ts` /
  `class-map-sizing.ts` (no wrap-width input).
- Causal chain: with no `MaximumWidth 200`, the 122-character `"text"` value
  stays on one line → box 751.587px wide (jar wraps it into 15 word runs, box
  257.75px) → `@width` 1622 vs 621, `@height` 238 vs 295, and
  `svg/g[1]/g[1][childCount]` 33 vs 70, `svg/g[1]/g[2][childCount]` 18 vs 54.
  `FontSize 15` / `FontStyle italic` / `LineColor blue` / `LineThickness 2.0`
  are visible in the jar's own markup (`font-size="15"`,
  `font-style="italic"`, `stroke:#00F;stroke-width:2`) and absent from ours.
- Ruled out: NOT `Margin 50` / `Padding 100`, which the earlier filing named —
  **the jar does not honour them either** (its box still starts at x=7,y=7 and
  its rows still start at x=12), so they are inert on this path and must not be
  built. NOT `MinimumWidth 100` (both boxes exceed it). NOT the background/font
  colour half, which we already apply correctly (`#F0F8FF` / `#00F` match).
- Verdict: fixable (with the property set corrected to
  MaximumWidth/FontSize/FontStyle/LineColor/LineThickness)
- Shared with: `bepafe-03-teda035`, `baloca-83-nadu916` (json vline)

### sajege-04-zuce784
- Mechanism: `Link#getInv()` constructs a *second* `Link`, and the `Link`
  constructor consumes a tick of the diagram's shared uid counter — so a
  left/up-directed link burns one `lnk` number that is never rendered.
- Java origin: `classdiagram/command/CommandLinkClass.java:363-364`
  (`if (dir == Direction.LEFT || dir == Direction.UP) link = link.getInv();`)
  → `abel/Link.java:145-146` (`getInv` calls `new Link(...)`) →
  `abel/Link.java:135` (`this.uid = cucaDiagram.getUniqueSequence("lnk")`) →
  `net/atmp/CucaDiagram.java:745-746` + `:129` (`cpt1`, the ONE counter shared
  with `ent` via `getUniqueSequenceValue`, `abel/Entity.java:171`).
- Ours: `src/diagrams/class/renderer-uid.ts:145-233` (`Ranked` sequence — one
  tick per surviving link, no inversion tick).
- Causal chain: jar's ids are `ent0001…4, lnk5, lnk7, lnk8` — `lnk6` is the
  discarded pre-inversion `Link` for `S1 -[#blue,bold]le-> S3`; ours emits
  `lnk5, lnk6, lnk7` → `svg/g[1]/g[6]/@id` and `g[7]/@id` each off by one.
  The 1.0px `@width`/`@height`/`viewBox` deltas are the separate ink rule below.
- Ruled out: NOT an off-by-one in our counter start (`lnk5` matches exactly, and
  the third link's `lnk8` is +2, not +1 — only an *extra consumption* between
  links 1 and 2 explains both). NOT the `-r` direction on link 3
  (`Direction.RIGHT` takes no `getInv()` branch, and link 3's id is consistent
  with exactly one skipped number, not two).
- Secondary mechanism (the 1px numeric): all four `<rect>`s are byte-identical
  to the jar, yet the canvas is 1px larger on BOTH axes.
  `klimt/drawing/LimitFinder.java:184-187` insets a rectangle's ink max corner
  to `(x+w-1, y+h-1)`; our `addRectInkEmptyBody`
  (`src/diagrams/class/class-ink-box.ts:122-125`) applies `x+w-1` but
  deliberately keeps `y+h`, and its gate
  (`class-ink-box.ts:277` — `kind === 'object' && dividerYs.length === 0`) is
  narrower than the rule. `jocamu-71`'s width-only 1px is the same rule with a
  *populated* box as the max-X contributor, which the gate excludes entirely.
- Verdict: fixable
- Shared with: `jocamu-71-nuvo330` (the 1px ink rule only)

### baloca-83-nadu916
- Mechanism: the json body's full-height column separator is not drawn, and the
  json node's DOT footprint is the shield table rather than upstream's row
  table, which shifts the sibling object 6.529px.
- Java origin: `cucadiagram/TextBlockCucaJSon.java:163-167`
  (`ULine.vline(height)` at `dx = width1`, once per object);
  `svek/image/EntityImageJson.java:241` → `svek/SvekNode.java:268-296`.
- Ours: json row emission in `src/diagrams/class/renderer-classifier-box.ts`;
  DOT shape at `src/core/svek-dot-emit.ts:150-152` / `:92-107`.
- Causal chain: jar's `g[1]` json entity holds 6 children including
  `<line x1="24.788" y1="25" x2="24.788" y2="43"/>`; ours holds 5 →
  `svg/g[1]/g[1][childCount]` 5 vs 6. Separately the object box sits at
  x=116.181 (jar 122.71): the inter-node gap is ours 35.243 ≈ `nodesep`
  exactly, jar 41.772 — because the jar's json node is a bare 73.9375×36 row
  table while ours is a 3×3 shield table with 1px side cells and 16px pad rows.
  That 6.529px propagates to `rect@x`, `text@x`, `line@x1`, `line@x2` and 6px
  of `@width`.
- Ruled out: NOT box sizing — both rects are 73.938 and 85.575 wide, exactly.
  NOT the `allowmixing` directive (both entities are created on both sides with
  matching uids). NOT dot-engine noise: the DOT node label we feed graphviz is
  structurally different from the jar's, which is upstream of layout.
- Verdict: fixable
- Shared with: `bepafe-03-teda035`, `maxosa-84-juci042` (json vline); the whole
  DOT-node-shape group

### fusopu-05-loxo960
- Mechanism: map key/value cells are not built through creole, so `__method1__`
  renders as literal markup instead of an underlined `method1`; and the
  empty-value row's placeholder cell + its column vline are suppressed; and the
  edge loses its per-row port anchor.
- Java origin: `cucadiagram/TextBlockMap.java:171-180` (`getTextBlock` →
  `display.create0(fontConfiguration, LEFT, skinParam, wordWrap,
  CreoleMode.FULL, null, null)` — **FULL**, so `__…__` underlines);
  `cucadiagram/TextBlockMap.java:145-152` (`drawU` draws
  `value.drawU(...)` and `ULine.vline(heightOfRow)` for EVERY non-`Point`
  value, empty string included); ports at
  `svek/image/EntityImageMap.java:245-247` → `svek/SvekNode.java:268-296`.
- Ours: `src/diagrams/class/class-map-sizing.ts` (cell text) and
  `src/core/svek-dot-emit.ts:150-152` (node shape).
- Causal chain: `__method1__` measures 85.575 in ours vs the jar's underlined
  `method1` at 54.425 — **exactly the 31.15px by which our `Interface` box is
  wider** (131.3 vs 100.15), which is the whole numeric story. The empty
  `method3 => ` / `method2 => ` rows lose a `<text> </text>` and a `<line>`
  each → `g[1][childCount]` 4 vs 6 and `g[2][childCount]` 8 vs 10. The edge:
  jar's DOT is `sh0006:p48c4…->sh0007:pcb85…` and its spline ends at
  `(113,138)` on the `method1` row's right edge; ours is `sh0006:h->sh0007:h`
  and goes straight down to the box top → `g[3]/path[1]/@d` mismatch.
- Ruled out: NOT the layout engine — the DOT we emit differs from the jar's in
  node width (131 vs 100.15), node table structure, and edge port anchors, all
  three upstream of graphviz. NOT `textLength` rounding (the delta is exactly
  the four extra underscore glyphs).
- Verdict: fixable
- Shared with: `vimavu-26-civo110`, `guzojo-14-muxa584`, `satuco-50-vusa163`,
  `sivapa-41-sebu112`

### vimavu-26-civo110
- Mechanism: identical to `fusopu-05-loxo960`. **Yes, one shared cause; the
  evidence is stronger than the count coincidence:** the two sources differ only
  by a `+` visibility modifier on `+__method1__`, which upstream strips into the
  visibility column before the creole cell is built — so the cell text reaching
  `TextBlockMap#getTextBlock` is the same `__method1__` in both. Both fixtures
  produce the identical 17-diff set with the same max delta 48.473, the same
  three non-numeric diffs (`g[1]`/`g[2]` childCount and `g[3]/path[1]/@d`), and
  the jar's `@d` string is **byte-identical between them**
  (`M57,44 C57,79.75 94.69,73.44 107,107 …`).
- Java origin: `cucadiagram/TextBlockMap.java:171-180`, `:145-152`;
  `svek/image/EntityImageMap.java:245-247`
- Ours: `src/diagrams/class/class-map-sizing.ts`;
  `src/core/svek-dot-emit.ts:150-152`
- Causal chain: as `fusopu-05` (our path anchor differs only in x, 76.763 vs
  fusopu's 72.65, from the `+` column).
- Ruled out: NOT a visibility-modifier bug — the `+` renders identically on
  both sides; it changes only our own box's internal x offsets, none of which
  appear as diffs beyond the shared set.
- Verdict: fixable
- Shared with: `fusopu-05-loxo960`, `guzojo-14-muxa584`, `satuco-50-vusa163`,
  `sivapa-41-sebu112`

### guzojo-14-muxa584
- Mechanism: same as `fusopu-05` / `vimavu-26`; the extra 9 diffs come from the
  link target being spelled `Interface::+__method1__`, which makes the port key
  differ and so exposes the port-anchor gap on both endpoints.
- Java origin: `cucadiagram/TextBlockMap.java:171-180`, `:145-152`;
  `cucadiagram/BodierMap.java:72-82` (`addFieldOrMethod` — the key stored for
  the port is the raw left-hand text);
  `objectdiagram/command/CommandCreateMap.java:176-191`
  (`link.setPortMembers(key, null)`).
- Ours: `src/diagrams/class/class-map-sizing.ts`;
  `src/core/svek-dot-emit.ts:150-152`
- Causal chain: as `fusopu-05`, plus the additional per-row x/y shifts that the
  wider un-creoled key produces on the second map.
- Ruled out: NOT a distinct mechanism from `fusopu-05` — the two non-numeric
  diffs are the same `g[1]`/`g[2]` childCount pair with the same 4-vs-6 /
  8-vs-10 values.
- Verdict: fixable
- Shared with: `fusopu-05-loxo960`, `vimavu-26-civo110`

### nitica-38-cere665
- Mechanism: the `entity` classifier's circled-badge letter falls through to the
  class default `'C'` instead of `'E'`.
- Java origin: `svek/image/EntityImageClassHeader.java:229-242` (`getCircledChar`
  — `case ENTITY: return 'E';`).
- Ours: `src/diagrams/class/class-badge.ts:365-372` (`badgeLetter` — cases for
  interface/abstract/enum/annotation, `default: return 'C'`; `'entity'` IS a
  valid `ClassifierKind`, `src/diagrams/class/class-classifier-ast.ts:63`).
- Causal chain: `badgeLetter('entity')` → `'C'` → `BADGE_GLYPH_D['C']`, a
  curve-rich outline, is emitted at `svg/g[1]/g[1]/path[1]/@d`
  (`M37.261,125.143 Q36.68,…`) where the jar writes the straight-segment `'E'`
  (`M37.934,129.5 L30.215,129.5 …`). The remaining 34 numeric diffs (max
  5.330px) are the DOT-node-shape family: jar's `map example` node is the
  per-row port table, ours the shield table, so `B` lands at y=103 vs 107.
- Ruled out: NOT a missing glyph capture — `'E'` is already in
  `BADGE_GLYPH_D` (`class-badge.ts:322-325`) with the jar-captured outline, so
  this is a one-line dispatch gap. NOT the badge colour (`#ADD1B2` matches) and
  NOT the badge radius/position (`cx` differs only by the shared 0.468px node
  shift).
- Verdict: fixable
- Shared with: the DOT-node-shape group (numeric half)

### kiluja-96-pado371
- Mechanism: `frame G` is drawn with the folder/package outline (one notched
  `UPath` + a `ULine`) instead of upstream's `USymbolFrame` composition (a plain
  rounded `URectangle` plus a separate 4-point corner `UPath`).
- Java origin: `decoration/symbol/USymbolFrame.java:68-96` (`drawFrame`:
  `ug.draw(URectangle.build(width,height).rounded(roundCorner))`, then a
  `UPath` `moveTo(textWidth,0) → lineTo(textWidth, textHeight-cornersize) →
  lineTo(textWidth-cornersize, textHeight) → lineTo(0, textHeight)` with
  `cornersize = 10` when the title is non-empty).
- Ours: `src/diagrams/class/class-namespace-shape.ts` (cluster outline builder).
- Causal chain: jar's cluster group is `rect` + `path` + `text`; ours is
  `path` + `line` + `text` → `svg/g[1]/g[1]/path[1]` (ours `path`, jar `rect`)
  and `svg/g[1]/g[1]/line[1]` (ours `line`, jar `path`). Jar's tab path
  `M86.35,7 L86.35,14 L76.35,24 L65.5,24` reproduces the Java exactly
  (textWidth = 65.5 + 20.85, cornersize 10, textHeight 17), confirming the
  citation. The 34 numeric diffs are the shifted cluster geometry plus the
  map `M`'s DOT node shape.
- Ruled out: NOT a stroke/colour issue (both draw `#181818`-family strokes; ours
  uses `#000` at width 1.5 vs jar `#181818` at 1, a *consequence* of taking the
  package rather than the frame style signature, not an independent cause). NOT
  a cluster-margin arithmetic bug in isolation — the shape family is wrong
  first.
- Verdict: fixable
- Shared with: — (shape); the DOT-node-shape group (numeric half)

### satuco-50-vusa163
- Mechanism: two map entries with an EMPTY key both land under `""` in
  upstream's `LinkedHashMap`, so the second REPLACES the first — we keep both
  rows; plus the map cell/vline and port-anchor gaps of the `fusopu-05` group.
- Java origin: `cucadiagram/BodierMap.java:54`
  (`private final Map<String,String> map = new LinkedHashMap<>()`) and
  `:72-76` (`map.put(s.substring(0,x).trim(), s.substring(x+2).trim())`).
  Cell/vline: `cucadiagram/TextBlockMap.java:145-152`.
- Ours: `src/diagrams/class/class-object-map-sizing.ts` /
  `class-map-sizing.ts` (rows kept as a list, not a keyed map).
- Causal chain: `=> uuuu` and `=> yyyy` both have key `""` → jar keeps ONE row
  (`<text> </text>` + `yyyy`), we keep two → `CCCC` is 90px tall vs the jar's
  72px (exactly one 18px row) and `svg/g[1]/g[2][childCount]` is 16 vs 14. The
  `g[4]/path[1]/@d` diff is the port-anchor gap.
- Ruled out: NOT the `left to right direction` directive (`rankdir=LR` is
  present in both DOTs). NOT row-height arithmetic — every surviving row is 18px
  on both sides; the delta is exactly one whole row. NOT a parse rejection of
  the keyless entry (both entries ARE parsed by both sides; upstream's loss is
  in storage, at `map.put`).
- Verdict: fixable
- Shared with: `fusopu-05-loxo960` group (map cells + ports)

### sivapa-41-sebu112
- Mechanism: the map-to-map port link is emitted without its per-row port
  anchors, so the edge is routed box-to-box instead of row-to-row.
- Java origin: `svek/image/EntityImageMap.java:245-247` (always
  `RECTANGLE_HTML_FOR_PORTS`) → `svek/SvekNode.java:132-135, 268-296`
  (one `<TR PORT="…">` per `Ports` entry from
  `cucadiagram/TextBlockMap.java:93-105`); the edge's ports are set at
  `objectdiagram/command/CommandCreateMap.java:191`
  (`link.setPortMembers(key, null)`).
- Ours: `src/core/svek-dot-emit.ts:150-152` (`portTable`/`shieldTable` only —
  no `RECTANGLE_HTML_FOR_PORTS` branch), so the DOT reads
  `sh0006:h->sh0007:h`.
- Causal chain: the jar's cached `svek-1.dot` is
  `sh0006:pb9db…->sh0007:p8f60…` and graphviz routes a looping spline
  `M40,44 C40,65.94 63.73,61.49 71.5,82 C76.38,94.89 91.28,113 77.5,113`; ours
  emits a straight `M40.188,43.114 C… 40.188,72.695` →
  `svg/g[1]/g[3]/path[1]/@d`. The 30 numeric diffs are the same node-footprint
  difference (shield table + 16px pads vs the jar's bare row table).
- Ruled out: NOT graphviz-vs-dot-engine spline divergence — I compared the DOT
  we emit against the cached oracle DOT directly; the port suffixes and the node
  table structure differ, so the two engines are not being given the same
  problem. The `svek-dot.ts` structural comparator strips ports and compares
  only shape names, which is why this scores EQUAL on the DOT gate.
- Verdict: fixable
- Shared with: `fusopu-05-loxo960`, `vimavu-26-civo110`, `guzojo-14-muxa584`,
  `satuco-50-vusa163`, `nitica-38-cere665`

### lecali-51-funo316
- Mechanism: `note on link` is unbuilt — upstream merges the note's TextBlock
  into the LINK'S OWN LABEL block, so the note both draws inside the link `<g>`
  and enlarges the DOT edge label.
- Java origin: `svek/SvekEdge.java:308-327` — `final CucaNote note =
  link.getNote(); … new EntityImageNoteLink(note.getDisplay(), …)` then
  `TextBlockUtils.mergeLR/mergeTB(noteOnly, labelOnly, …)` by
  `note.getPosition()`. The note is attached at `abel/Link.java:328`
  (`getNote()`).
- Ours: `src/diagrams/class/class-edge-geo.ts` (`edgeGeo.label` carries the text
  label only; no note block is merged) and `src/diagrams/class/renderer-note.ts`
  (free notes only).
- Causal chain: jar's `lnk3` `<g>` holds 6 children — path, polygon, the `foo`
  label, then the note's two `<path>`s and its `<text>note red</text>`; ours
  holds 3 → `svg/g[1]/g[7][childCount]` 3 vs 6 and `g[8][childCount]` 3 vs 7
  (the second note has two text lines). Because the merged block is what the
  edge reports as its label size, every downstream coordinate moves — that is
  the remaining 219 numeric diffs (max 124.560px) and the third non-numeric
  `g[9]/path[1]/@d`.
- Ruled out: NOT free-note rendering (`note left: this is left` on `foo`
  renders as its own entity on both sides, with matching uids `ent0008`). NOT
  entity/link uid allocation — every uid matches the jar exactly
  (`ent0001…ent0010`, `lnk3/lnk5/lnk11`), which also rules out a phantom
  entity for the notes. NOT the layout engine: the note's absence changes the
  DOT edge label dimensions we emit, upstream of routing.
- Verdict: fixable
- Shared with: —

---

## Shared mechanisms, ordered by reach

**1. `ShapeType.RECTANGLE_HTML_FOR_PORTS` — the DOT node shape and per-member
port anchors are entirely unbuilt.** 10 of the 20 fixtures.
`svek/SvekNode.java:132-135` → `appendLabelHtmlSpecialForLink`
(`svek/SvekNode.java:268-296`), selected by
`svek/image/EntityImageMap.java:245-247` (always),
`EntityImageJson.java:241` (always), `EntityImageObject.java:249-253` and
`EntityImageClass.java:254-258` (when `getPortShortNames().size() > 0`); the
`Ports` come from `cucadiagram/TextBlockMap.java:93-105` /
`TextBlockCucaJSon.java:103`. Ours: `src/core/svek-dot-emit.ts:150-152` has only
`portTable` (`PORT="P"`) and `shieldTable` (`PORT="h"`).
Slugs: `fusopu-05`, `vimavu-26`, `guzojo-14`, `satuco-50`, `sivapa-41`,
`nitica-38`, `kiluja-96`, `baloca-83`, `bepafe-03`, `maxosa-84`.
*This group is invisible to the object DOT gate — see the correction section.*

**2. Map/JSON cell construction.** 8 fixtures, three sub-parts that land
together: cells built through `CreoleMode.FULL`
(`cucadiagram/TextBlockMap.java:171-180`, `TextBlockCucaJSon.java:180-190`); the
unconditional empty-value cell + `ULine.vline(heightOfRow)`
(`TextBlockMap.java:145-152`); and the JSON per-object full-height
`ULine.vline(height)` (`TextBlockCucaJSon.java:163-167`).
Slugs: `fusopu-05`, `vimavu-26`, `guzojo-14`, `satuco-50`, `sivapa-41`
(creole + row vline); `baloca-83`, `bepafe-03`, `maxosa-84` (json vline).

**3. Namespace phantom groups.** 2 fixtures.
`net/atmp/CucaDiagram.java:325-337#eventuallyBuildPhantomGroups` — every
childful data-less quark becomes a `GroupType.PACKAGE` entity. The class/object
engine has its own namespace model and never runs this pass.
Slugs: `meloxo-38`, `tusiri-92`.

**4. Classifier ink max-corner `-1`.** 2 fixtures, 1px each.
`klimt/drawing/LimitFinder.java:184-187` insets to `(x+w-1, y+h-1)`; our
`src/diagrams/class/class-ink-box.ts:122-125` applies `x+w-1` only, and its gate
at `:277` (`kind === 'object' && dividerYs.length === 0`) excludes populated
boxes whose HEADER sets the width. Node rects are byte-identical on both
fixtures — only the canvas differs. Touching this moves the whole class corpus;
re-measure the class census alongside.
Slugs: `sajege-04` (both axes), `jocamu-71` (width only).

**5. `monospaced` → `monospace` family rename.** 2 fixtures.
`klimt/drawing/svg/SvgGraphics.java:720-725`; ours has it in
`svg-shapes.ts:237` (NBSP half) but not in `svg-shapes.ts:117-121` (attribute
half). Single-line fix, no geometry moves.
Slugs: `fajafu-44`, `pavizi-27`.

**6. Singletons.** `majake-62` — generic `<<stereo>>` skinparam cascade for
BackgroundColor (`style/FromSkinparamToStyle.java:292-302, :396-410`), now cheap
on `babcfa94`'s landed FontSize pattern. `donoki-79` — creole `Bullet` glyph
atom (`klimt/creole/atom/Bullet.java:58-69`); geometry already exact.
`jocamu-71` — entity `<a>` url wrapper
(`svek/image/EntityImageObject.java:186-187`). `sajege-04` — `Link#getInv()`
uid tick (`classdiagram/command/CommandLinkClass.java:363-364` →
`abel/Link.java:145-146, :135`). `satuco-50` — `BodierMap`'s
`LinkedHashMap` empty-key collision (`cucadiagram/BodierMap.java:54, :72-76`).
`nitica-38` — `entity` badge letter `'E'`
(`svek/image/EntityImageClassHeader.java:229-242`); the outline is already
captured. `kiluja-96` — `USymbolFrame#drawFrame`
(`decoration/symbol/USymbolFrame.java:68-96`). `lecali-51` — `note on link`
merged into the edge label (`svek/SvekEdge.java:308-327`). `maxosa-84` —
`<style> json/map { MaximumWidth, FontSize, FontStyle, LineColor,
LineThickness }`; `Margin`/`Padding` are inert in the jar too and must NOT be
built. `zuvila-56` — `{{ }}` embedded diagram
(`sourceforge/plantuml/EmbeddedDiagram.java:75-77`), the one
needs-maintainer-scoping verdict here.

**No `gvts-blocked` verdict is issued for any of these 20 fixtures.** Every
non-numeric diff has a named non-layout mechanism, and every large numeric delta
was traced to a DOT input (node table structure, node width, edge port anchor,
edge label size) that differs before graphviz is called.
