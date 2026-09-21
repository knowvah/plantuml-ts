# A2b — entity / cluster / note / root-group childCount divergences

Bucket split: `bucket-gg_count_all.json` holds 138 fixtures. Resolving every
`[childCount]` diff path against the **jar** SVG (`classify.py`, results in
`cc-classified.json`) shows 40 fixtures whose only mismatched `<g>` carries
`class="link"` — those belong to A2a. The remaining **98** are mine
(`mine.txt`). All 98 were re-rendered through production `renderSync`
(`out/<slug>.{ours,jar}.svg`, `batch-all.log`); `seq.json` holds both sides'
root-`<g>` child sequences with `data-qualified-name` and per-child counts.

Everything below was verified by reading the Java method body AND our TS body.
Nothing here is inferred from diff counts alone.

---

## E1 — `EntityImageClass`'s header-background split is not ported for `class`

**Mechanism.** When the resolved *header* BackGroundColor is not
`.equals()` the box's own body fill, upstream draws **four** shapes instead
of one: the full rounded rect (body fill), a rounded rect of header height in
the header fill, a `roundCorner/2`-tall square-cornered rect at
`dy = headerHeight - roundCorner/2` (squares off the header's bottom
corners), and finally the outer rect re-stroked with `HColors.none().bg()`.
We draw exactly one rect for a `class`, so every affected classifier is short
by **3 children**.

**Origin.**
- Java `net/sourceforge/plantuml/svek/image/EntityImageClass.java:216-234`
  (`drawInternal`, the `roundCorner != 0 && headerBackcolor != null &&
  backcolor.equals(headerBackcolor) == false` branch); header color resolution
  at `:192-208`; skinparam mapping at
  `net/sourceforge/plantuml/style/FromSkinparamToStyle.java:196`
  (`classHeaderBackgroundColor` → `element.class.header` BackGroundColor).
- TS `src/diagrams/class/renderer-classifier-box.ts:180-186` — the split is
  implemented (`headerBackgroundPath`, `:140-150`) but **gated to
  `geo.kind === 'object' | 'map' | 'json'`**, so `class` never reaches it.
  Also note the shape differs: object/map/json use `URectangle.halfRounded`
  (one path); class uses rect2+rect3+re-stroked rect (three elements).

**Verified on `nisune-86-faji869`** (`skinparam classHeaderBackgroundColor
#444`): jar's `classA` entity = `rect(h=62,#F1F1F1) rect(h=32,#444)
rect(y=36.5,h=2.5,#444) rect(h=62,fill=none) ellipse path text line line
text` = 10; ours = 7. `roundCorner=5` ⇒ rect3 height 2.5 and
`y = 7 + 32 - 2.5 = 36.5`, matching byte-for-byte.

**Second trigger — gradients.** `HColorGradient`
(`net/sourceforge/plantuml/klimt/color/HColorGradient.java:43`) does **not**
override `equals` (unlike `HColorSimple.java:85-89`), so
`backcolor.equals(headerBackcolor)` is identity comparison and is *always*
false for two separately-parsed gradients. Any diagram whose class background
is a gradient therefore gets the same 3 extra rects even with no header
skinparam at all — this is a jar quirk, and reproducing it is required for
parity.

**Reach (FULL for the childCount diff):** `nisune-86-faji869`,
`taceve-49-mezi408`, `fumalu-64-vude116` (explicit header colour);
`dizuse-83-dabi909`, `givofi-11-xumu978`, `popesa-39-sobe866`,
`mizupo-59-zala765`, `mexaka-52-gati860` (gradient-triggered — needs **E2**
first, otherwise there is no gradient object to compare).

**Fix shape.** `src/diagrams/class/renderer-classifier-box.ts` (render only,
no layout change — the extra rects are inside the existing box). Widen the
`geo.kind` gate to include `class`/`enum`/`interface`/`abstract` and add the
class-flavoured three-element form next to `headerBackgroundPath`. Risk to
the 412 conformant + 314 ratchet pins: **low** — the branch only fires when a
distinct header colour resolves, which is exactly the set that is already
non-conformant. **Confidence: HIGH** (both bodies read; geometry reproduced
by hand from the fixture).

---

## E2 — gradient `HColor` is emitted as a literal fill string, never as `<defs><linearGradient>`

**Mechanism.** `#c3d8f4\#6192d1`, `white\MyBlue`, `#FEFECE-FFFFFF`,
`#yellow/blue`, `#lightgreen|yellow` are `HColorGradient`s. The jar registers
one `<linearGradient>` per distinct gradient in `<defs>` and references it as
`fill="url(#…)"`. We emit `fill="#c3d8f4\#6192d1"` verbatim and leave `<defs/>`
empty.

**Origin.**
- Java `net/sourceforge/plantuml/klimt/drawing/svg/SvgGraphics.java:371` and
  `:415` (`document.createElement("linearGradient")`).
- TS: the machinery **exists** — `src/core/paint.ts:201-230` (`paintToSvg`
  builds the `<linearGradient>` + content-hash id) and
  `src/core/svg.ts:204-260, 457-510` (`resolvePaint` + the def-lifting/dedup
  pass), already consumed by `src/core/usymbol-shapes.ts:44`. The class box
  never uses it: `src/diagrams/class/renderer-classifier-colors.ts:108-128`
  (`classifierFill`) returns `resolveColorToSvgHex(override)` — a plain
  string — so the `a\b` / `a-b` / `a/b` / `a|b` grammar is never parsed into a
  `Paint`.

**Verified on `dizuse-83-dabi909`** (jar `<defs><linearGradient
x1="0%" y1="100%" x2="100%" y2="0%" id="g83f0s4o88dzd0"><stop
stop-color="#C3D8F4" offset="0%"/><stop stop-color="#6192D1"
offset="100%"/></linearGradient></defs>`, rect `fill="url(#g83f0s4o88dzd0)"`;
ours `<defs/>`, `fill="#c3d8f4\#6192d1"`). Also inspected jar `<defs>` for
`givofi` (2 gradients), `taceve` (5), `mexaka` (2), `mizupo` (1), `lozego` (1).

**Reach (FULL):** `dizuse-83-dabi909`, `givofi-11-xumu978`,
`popesa-39-sobe866`, `taceve-49-mezi408`, `mexaka-52-gati860`,
`mizupo-59-zala765`, `lozego-15-coci435`.
**Not this bucket:** `manube-50-xora983` (3 `<filter>` defs) and
`ziripa-77-zizo842` (1 `<filter>`) — those are sprite recolouring, see **E12**.

**Fix shape.** Parse the gradient separators in `core/color-override.ts` /
`renderer-classifier-colors.ts` into the existing `Paint` shape and route the
class box's `fill` through `core/svg.ts#resolvePaint` (which already lifts and
dedups the defs). Risk: **low-medium** — `resolvePaint` changes the emitted
`fill` string only for inputs that are currently literal garbage.
**Confidence: HIGH.**

---

## E3 — a NON-EMPTY container keeps the default folder outline instead of its USymbol

**Mechanism.** `package X <<Node>> {`, `<<Database>>`, `<<Rectangle>>`,
`<<cloud>>` … and `rectangle X { … }` / `component X { … }` select the
container's **shape**. Upstream passes the group's `USymbol` into
`ClusterDecoration`, which draws `symbol.asBig(...)`. We only consume the
USymbol when the container turns out to be **empty** and is collapsed into a
leaf; a non-empty container always draws the folder (path + line + text = 3).

**Origin.**
- Java `net/sourceforge/plantuml/command/CommandPackage.java:179-181`
  (`USymbols.fromString(stereotype, …)` → `gotoGroup(..., usymbol)`),
  `net/atmp/CucaDiagram.java:358-359` (`ent.setUSymbol(usymbol)`),
  `net/sourceforge/plantuml/svek/Cluster.java:367-374` (`new
  ClusterDecoration(packageStyle, group.getUSymbol(), …)` → `decoration.drawU`),
  `net/sourceforge/plantuml/svek/ClusterDecoration.java:66-91`
  (`guess` + `symbol.asBig`).
- TS: the parse side is correct —
  `src/diagrams/class/class-container.ts:357-374` (`setNamespaceStereotype`
  stores the keyword in `state.descriptiveContainers`) and
  `src/diagrams/class/class-command-containers.ts:117-121` for the
  keyword form. The consumer is
  `src/diagrams/class/class-container.ts:186-190` (`closeContainer`), which
  **returns early unless `ns.classifiers.length === 0`**. The render side
  (`src/diagrams/class/renderer-group.ts#wrapCluster`,
  `class-namespace-folder-outline.ts`) has no USymbol input at all.

**Verified on `diroxo-41-zezo954`** (`package PetitBeurre <<cloud>> {`): jar's
cluster = `path(cloud outline) text` (2 children); ours = `path(folder) line
text` (3). On `sijisi-94-ripu606` (`rectangle "foo2" { rectangle "foo3" }`):
jar cluster = `rect text` (2); ours = folder triple (3) — and the nested empty
`rectangle "foo3"` is `rect text` (2) in the jar vs our class box with badge
(4). On `dativu-93-pona469` (`<<Node>>`): jar cluster = 5 children.

**Reach (FULL for the cluster childCount):** `dativu-93-pona469`,
`daxeno-00-kasu166`, `diroxo-41-zezo954`, `dojanu-92-vizo468`,
`domeki-03-zaga732`, `giraca-14-xome136`, `mujopi-30-zadi566`,
`sijisi-94-ripu606`, `sijoba-16-rari847`, `tibatu-28-jiro743`,
`xenere-07-kuji864`, `xadado-92-lazo250`.
Partially: `jabama-09-kago823` (see E12 — the 4th child there is the
`<img:>` fallback text, not a symbol).
Note `xenere`/`sijoba` (7→3) and `dativu` (5→3) also carry a
`legend … end legend` INSIDE the package, which adds children.

**Fix shape.** Thread `descriptiveContainers`/`Namespace.usymbol` into layout
(`class-namespace-shape.ts`, `class-namespace-folder-outline.ts`,
`class-namespace-title-table.ts`) and render (`renderer.ts`'s cluster path),
reusing `src/core/decoration/symbol/USymbols.ts` + `core/usymbol-shapes.ts`
(already used by the description engine, and already gradient-aware). This
is a layout change (cluster margins differ per symbol), so risk to the
conformant set is **medium**: only diagrams with a symbol-naming container
stereotype or a container keyword change shape, but their geometry moves.
**Confidence: HIGH.**

---

## E4 — a package's `[[url]]` must wrap the cluster's contents in `<a>`

**Mechanism.** `Cluster#drawU` opens the url *inside* the
`<g class="cluster">` and before the decoration, so the jar's cluster has
exactly **one** child, an `<a>`, holding the outline/line/title. We drop the
package url entirely.

**Origin.** Java `net/sourceforge/plantuml/svek/Cluster.java:337-341`
(`ug.startGroup(uGroup); final Url url = group.getUrl99(); if (url != null)
ug.startUrl(url);`) and `:379-382` (`closeUrl` in the `finally`). TS: the
package regex in
`src/diagrams/class/class-command-containers.ts:69` matches `\[\[[^\]]*\]\]`
with a **non-capturing** group and discards it; `class-container.ts`'s
`openNamespaceBlock` has no url field, and `renderer-group.ts#wrapCluster`
(`:83-90`) emits no `<a>`. (The classifier-level `<a>` is already ported —
`src/diagrams/class/renderer-url.ts` / `class-url.ts` — so the emitter shape
exists.)

**Verified on `dopuzi-50-muxo994`**: jar
`<g class="cluster" …><a target="_top" href="http://www.google.com" …><path…/>
<line…/><text…>foo</text></a></g>`; ours has the three children bare.

**Reach (FULL):** `dopuzi-50-muxo994`, `vacole-77-vivo236`,
`rakuci-96-tuti371` (two clusters).

**Fix shape.** Capture the url in the package/namespace commands, store it on
`Namespace`, and wrap in `wrapCluster`. Parser + render only, no layout. Risk:
**very low**. **Confidence: HIGH.**

---

## E5 — `hide`/`show` by name: wrong separator strip, and groups are never hidden

Two independent defects, same file.

**(a) The leaf-name strip is unconditional.** Upstream strips the qualified
name only at `Plasma.MAGIC_SEPARATOR` (`"\u0001"`). A **class or object
diagram sets the namespace separator to `"."`**
(`net/sourceforge/plantuml/objectdiagram/AbstractClassOrObjectDiagram.java:65`
`setNamespaceSeparator(".")` → `net/atmp/CucaDiagram.java:144-148` →
`net/sourceforge/plantuml/plasma/Plasma.java:85-88`), so a namespaced leaf's
qualified name (`pack1.Foo1`, built at
`net/sourceforge/plantuml/plasma/Quark.java:57-66`) contains **no** magic
separator and the strip is a no-op: `hide Foo1` does **not** reach
`pack1.Foo1`. Only `set separator none` restores the magic separator and
makes the unqualified pattern match. Additionally `CucaDiagram#fixWhat`
(`net/atmp/CucaDiagram.java:638-646`) *prefixes* `what` with the enclosing
group's qualified name when a separator is set.
Java matcher: `net/sourceforge/plantuml/cucadiagram/HideOrShow.java:110-124`.
TS: `src/diagrams/class/class-directives-removal.ts:185-188`
(`matchEntityName`) always strips at `::`/`.` — its own doc comment states the
(incorrect) assumption: *"our ids qualify with `.`/`::` instead"*.

**(b) Groups are never matched, and hiding does not cascade.**
`Entity#isHidden` (`net/sourceforge/plantuml/abel/Entity.java:430-442`)
returns true when the **parent container** is hidden, and
`Cluster#drawU` (`net/sourceforge/plantuml/svek/Cluster.java:298-300`) returns
before emitting anything when `group.isHidden()`. TS
`class-directives-removal.ts:307-323` (`computeHiddenIds`) iterates only
`ast.classifiers` and `ast.notes` — `ast.namespaces` is never consulted, and
there is no parent-container cascade.

**Verified** (`data-qualified-name` lists, `out/*.svg`):
- `cicovi-23-zipe215` — `package pack1 { class Foo1 }` + `hide Foo1`: jar keeps
  `pack1`, `pack1.Foo1`, `Foo2`, `Foo3`; we drop `pack1.Foo1` → defect (a).
- `senece-96-fomu913` — `hide Foo1`/`hide Foo3`/`hide util`: jar keeps only
  `Foo2`; we still emit `util` and `util.util1` → defect (b).
- `verufu-58-jile750` — `hide $txn` on `package p1 $txn`: jar keeps `foo1`,
  `foo3`; we still emit `p1`, `p1.inside1` → defect (b).

**Reach:** FULL for `cicovi-23-zipe215`, `senece-96-fomu913`,
`verufu-58-jile750`. Partially explains (they carry other mechanisms too)
`delasa-80-jusu462`, `nijeli-04-ponu844`, `jakapi-64-tine258`,
`xifuza-00-paze682`, `gekope-01-ricu859`, `xogixe-78-zuro619`,
`cutasu-32-zete658`, `julixi-10-jide878`, `rulite-35-muno361`,
`lecelo-92-loma110`, `bijevi-38-duza931`.

**Fix shape.** `class-directives-removal.ts` (matcher + a namespace pass +
parent cascade) and the `set separator` state it needs (already parsed —
`CommandNamespaceSeparator` equivalent lives in `class-command-directives.ts`).
Parse/AST-level, no geometry maths, but it changes which nodes exist, so DOT
input moves. Risk: **medium** (any fixture using `hide <name>` re-lays-out).
**Confidence: HIGH.**

---

## E6 — a note's dashed connector must be its own `<g class="link">`, and a note anchored to a GROUP must not opalise

**Mechanism (a).** For a *plain* (non-opale) note the jar draws the note box
in `<g class="entity">` and the dashed connector as an ordinary edge, i.e. a
separate top-level `<g class="link">` (`<!--link GMN2 to dummy-->`). We push
the connector path into the note's own group.
TS: `src/diagrams/class/renderer-note.ts:354-363` — `renderPlainNote` builds
`parts = [box, corner]`, then `parts.push(path(connector, …))`, and the whole
array is wrapped by `renderer-group.ts#wrapEntity`.

**Mechanism (b).** `GraphvizImageBuilder` only opalises when the *other* end
has a `SvekNode`: `net/sourceforge/plantuml/svek/GraphvizImageBuilder.java:
245-259` guards every `line.setOpale(true)` with `if (other != null)`, and
`Bibliotekon#getNode` (`net/sourceforge/plantuml/svek/Bibliotekon.java:120-122`,
populated only by `createNode` at `:72-77`, which is never called for a group)
returns `null` for a package/namespace. So `note top of <package>` is **never**
opale and always gets a real link edge. `isOpalisable`
(`GraphvizImageBuilder.java:133-148`) additionally returns false under
`strictUmlStyle()` — that guard *is* ported
(`src/diagrams/class/note-layout-tip.ts:151-173`), the group guard is not:
`src/diagrams/class/note-layout-groups.ts:37-64` only distinguishes
`targetPort !== undefined` (member-anchored → invisible edge).

**Verified:**
- `fogexa-30-zupo141` (`skinparam style strictuml`, `note top of dummy`): jar
  root = `entity(4) entity(9) link(1)`; ours = `entity(4) entity(10)` — the
  connector is the 10th child of our note group. Mechanism (a), exactly.
- `pecabi-95-demu756` / `sanixi-31-nofa193` (`note top of <package>`): jar
  emits `<!--link GMN3 to oft_openflow_types-->`; our output has no link
  comment at all. Mechanism (b).
- `zepeki-75-pifo352`: jar `<!--link GMN2 to test-->`, ours none.

**Reach.** FULL: `fogexa-30-zupo141`, `pecabi-95-demu756`,
`sanixi-31-nofa193`, `zepeki-75-pifo352`.
Partial (these have jar-vs-ours link counts off by one or two and the same
note families, but also carry other mechanisms): `lejoga-79-poji465` (10→9),
`vudepo-27-cuvo793` (9→8), `pejone-71-tige404` (13→12),
`xonamo-50-podo529` (14→13), `temise-16-neco018` (8→9, assoc-class),
`fomofi-36-lova857` (a `----` rule, see E13).

**Fix shape.** `renderer-note.ts` (move the connector out of the note group)
+ `renderer.ts` (emit it via `wrapLink`) + `note-layout-groups.ts` (add the
"other end is a group ⇒ not opalisable" guard). Render-order sensitive, so
risk to the ratchet is **medium**: the new `<g class="link">` shifts every
positional index after it in any fixture with a plain note.
**Confidence: HIGH.**

---

## E7 — `{{ … }}` embedded sub-diagrams render as literal creole text

**Mechanism.** The jar rasterises the nested diagram and emits a single
`<image xlink:href="data:image/svg+xml;base64,…">`. We print the block's
source lines as `<text>` rows.

**Origin.** Java `net/sourceforge/plantuml/EmbeddedDiagram.java:75` (class),
`:97-115` (`createAndSkip`), `:126-195` (`calculateDimensionSlow`/`drawU`);
entry point `net/sourceforge/plantuml/klimt/creole/legacy/CreoleParser.java:
152-154`. TS: `src/core/EmbeddedDiagram.ts` is a full port **behind an
injected `NestedDiagramRenderer` seam**, and nothing in production supplies
one — the only construction site is
`src/core/cucadiagram/MethodsOrFieldsArea.ts:134-140`, which *throws* when
`config.nestedDiagramRenderer === undefined`; the class engine never reaches
it (`src/diagrams/class/class-embedded-block.ts` only *scans* the block so the
outer command does not terminate early —
`src/diagrams/class/class-multiline-element.ts:41`).

**Verified on `bixogo-47-xulu385`** (`legend` containing `{{salt …}}`): jar
legend = `rect + image(base64 svg)` (2 children); ours = `rect` + 9 `<text>`
rows containing `{{salt`, `{+`, `<b>an example`, … (10 children).
Also `moxobo-16-tipo829` / `zikabo-17-gugi332` (`{{ file f }}` /
`{{ node n }}` inside a class body) and `gadufu-56-votu808` (jar has
`image[]` where we have 5 `<text>`).

**Reach (FULL):** `bixogo-47-xulu385`, `roxosu-00-pini153`,
`moxobo-16-tipo829`, `zikabo-17-gugi332`, `gadufu-56-votu808`,
`xadado-92-lazo250` (also E3), `kacico-91-bati232` (also E13).

**Fix shape.** Wire a `NestedDiagramRenderer` (recursive `renderSync` +
`data:image/svg+xml;base64` wrapper) from the class layout/render entry point
through `BodyFactory`/`MethodsOrFieldsArea`, and give the legend/note text
paths the same seam. Sizing changes, so **medium** risk. **Confidence: HIGH.**

---

## E8 — `() "Name"` and `circle X` draw a full class box instead of the interface eye

**Mechanism.** `LeafType.CIRCLE` is drawn by `EntityImageDescription` with
`USymbols.INTERFACE`: an 8-px ellipse plus a label text *below* the ellipse
(2 children). We draw the normal classifier box (rect + badge ellipse + badge
path + text + 2 lines = 6).

**Origin.** Java `net/sourceforge/plantuml/svek/GeneralImageBuilder.java:
157-158` (`if (leaf.getLeafType() == LeafType.CIRCLE) return new
EntityImageDescription(...)`) with `net/sourceforge/plantuml/abel/Entity.java:
415` (`getUSymbol()` returns the interface symbol for `LeafType.CIRCLE`).
TS: `src/diagrams/class/class-command-containers.ts:139-146` correctly sets
`kind = 'circle'`, but `layout.ts`/`renderer-classifier-box.ts` treat `circle`
as an ordinary classifier — `src/core/decoration/symbol/USymbolInterface.ts`
exists and is unused on this path.

**Verified:** `conija-14-nuta580` — jar `<g … data-qualified-name="Does work
now"><ellipse cx="50.012" cy="142" rx="8" ry="8" …/><text x="6" y="169.889"
…>Does work now</text></g>`; ours emits a 120×48 class box.
`niduni-65-bujo175` — `circle A2`, identical shape difference.

**Reach (FULL for the entity childCount):** `conija-14-nuta580`,
`niduni-65-bujo175`.

**Fix shape.** Route `kind === 'circle'` to the description engine's
`USymbolInterface` sizing/drawing (both files already exist). Layout changes
(node size 16×16 + label), so **medium** risk, but only 2 class fixtures use
it. **Confidence: HIGH.**

---

## E9 — a collapsed EMPTY package is drawn twice

**Mechanism.** An empty `package p {}` / `package a.b {}` collapses to a leaf
folder, drawn ungrouped (path + line + text) — the jar does the same. We emit
that triple **twice, byte-identical**.

**Verified on `mujopi-30-zadi566`**: our output contains
`<path d="M8.5,103.389 … " fill="#F1F1F1" …/><line x1="6" y1="123.389" …/>
<text …>p1</text>` followed immediately by an *exactly equal* copy; same for
`p3`. jar root = `cluster(2) path line text entity path line text link×3`
(11); ours = the same with each triple doubled (17).

**Origin.** Not yet localised on the TS side (the duplicate is emitted by the
class renderer's collapsed-namespace path — `class-namespace.ts
#collapseEmptyNamespace` + `renderer.ts`'s leaf loop; both a `Namespace` and a
`Classifier` record survive the collapse). Java reference for the single draw:
`net/atmp/CucaDiagram.java:325-337` creates a PACKAGE group only when
`countChildren > 0`.

**Reach (FULL for the extra children):** `mujopi-30-zadi566`,
`pisobo-93-sipa138`, `cocube-46-tusu692`, `nijeli-04-ponu844`.
`pisobo`/`cocube` additionally emit a phantom `<g class="entity">` for the
**non-empty** package `foo1.foo2.foo3` because it is a link endpoint
(`boo1.boo2 +--- foo1.foo2.foo3`) — upstream links to the cluster, not to a
duplicate leaf. `runane-30-vena766` / `vusute-48-xono099` are the same family:
we emit one extra `g.entity` (`javax.sound.sampled.AudioFormat`) for a
namespace that upstream materialises only as a cluster.

**Fix shape.** `src/diagrams/class/class-namespace.ts` /
`src/diagrams/class/renderer.ts` — drop one of the two records at collapse
time. Render-only for the doubling; the phantom-leaf half is AST-level.
Risk: **low** for the doubling. **Confidence: HIGH for the duplication
(observed byte-identical); MEDIUM for the phantom-leaf half** (I did not
isolate which pass creates it).

---

## E10 — per-member `[[[url]]]` must produce one `<a>` per url region

**Mechanism.** The jar emits one `<a>` per url-bearing region inside the
`<g class="entity">`: the header bundle in the classifier's own `<a>`, then one
`<a>` per member row carrying `[[[url]]]`. We emit a **single** `<a>` wrapping
the entire entity body.

**Verified on `cutasu-32-zete658`**: jar `g[1]/g[2]` (entity) = nine `<a>`
children, the first holding `rect ellipse path text line`; ours = one `<a>`
holding all 13 primitives. Same on `xogixe-78-zuro619` (jar 50 `<a>`).

**Origin.** Java: `EntityImageClass.java:143-158` opens the classifier url
around the whole group; the per-member urls come from
`net/sourceforge/plantuml/cucadiagram/MethodsOrFieldsArea` (each member atom
carries its own `Url`, opened/closed by `UGraphicSvg` as separate `<a>`
elements). TS: `src/diagrams/class/renderer-url.ts` +
`renderer-classifier-box.ts`'s `UrlTaggedPrimitive` bundle — the header
primitive says *"The header never carries its OWN url … its effective url is
always the classifier's own fallback"*, and the grouping collapses adjacent
primitives that share a url into one `<a>`, including across rows with no url.

**Reach (FULL for the `a[1]` / entity childCount):** `cutasu-32-zete658`,
`xogixe-78-zuro619`.

**Fix shape.** `renderer-url.ts` — stop merging a run of primitives whose url
is the *classifier fallback* with the ones that carry a member url; emit one
`<a>` per row instead of one per contiguous equal-url run. Render only, no
layout. Risk: **low-medium** (changes `<a>` nesting in every url fixture).
**Confidence: HIGH.**

---

## E11 — `skinparam groupInheritance N`

**Mechanism.** With N or more children inheriting one parent the jar draws
**one shared triangle + stub lines at the root level, outside any group**, and
each `<g class="link">` then holds only its own path (1 child, not 2).

**Verified on `mefike-75-vova900`** (`skinparam groupInheritance 3`): jar root
= `entity(6) polygon line line entity×4 link(1) link(1) link(1) link(2)`;
ours = `entity×5 link(2)×4`.

**Reach (FULL for the root childCount):** `mefike-75-vova900`,
`jakapi-64-tine258`, `xifuza-00-paze682`, `lazeju-60-boki114`,
`pijiju-95-xexi872` (`groupInheritance 2`).

**Fix shape.** New feature in `class-dot-edges.ts` + `renderer-edge.ts`.
Java entry point not yet located (search `groupInheritance` in
`net/sourceforge/plantuml/`); this is a sizeable, separable mission.
**Confidence: MEDIUM** — the *observable* jar shape is proven, the Java
implementation was not read. Next instrument: grep `groupInheritance` /
`GroupInheritance` under `net/` and read the `SvekEdge`/`DotStringFactory`
branch that emits the shared head.

---

## E12 — inline `<img:…>`, sprites `<$name>`, openiconic `<&icon>` and emoji render as literal text

**Mechanism.** The jar turns these into `<image>` elements (or, for emoji,
into coloured `<path>`s; for a recoloured sprite, an `<image>` plus an
`<filter><feFlood>` def). We emit the raw markup as `<text>`.

**Verified:**
- `rotisi-30-loge424` — jar `<g class="title">` = `text image text image text
  image` (6); ours = `text` (1).
- `malara-55-moce209` — jar title `text text image` (3) vs our `text` (1); jar
  entity has `image[]` where we have a `<text>`.
- `lecelo-92-loma110` — jar entity = `rect path(#FFD983) path(#D99E82)
  path(#C1694F) text path(#8899A6) …` (11, emoji drawn as paths); ours =
  `rect text text text` (4) with the literal `<:label:>` / `<U+1F3F7>` text.
- `jabama-09-kago823` — `namespace "MyNamespaceName <img:HelloWorld.png…>"`:
  jar cluster = `path line text text` where the extra text is
  `(Cannot decode)`; ours = 3 children with the literal markup in the title.
- `manube-50-xora983` (3 `<filter>` defs) and `ziripa-77-zizo842` (1) — sprite
  recolouring, `<feFlood flood-color="#FF0000">`.

**Reach (FULL for their childCount diffs):** `rotisi-30-loge424`,
`malara-55-moce209`, `lecelo-92-loma110`, `jabama-09-kago823`,
`manube-50-xora983`, `ziripa-77-zizo842`, `gekope-01-ricu859`,
`lozego-15-coci435` (also E2).

**Fix shape.** Creole atom layer (`src/core/klimt/creole/`) plus the class
title/legend/member text paths. Large and separable. **Confidence: MEDIUM**
— the divergence and its shape are proven from both SVGs, but I did not read
the jar's `AtomImg`/`AtomSprite` bodies. Next instrument: read
`net/sourceforge/plantuml/klimt/creole/atom/AtomImg.java` and
`net/sourceforge/plantuml/klimt/sprite/`.

---

## E13 — creole `----` horizontal rule inside a note / legend / link label is not drawn

**Mechanism.** A `----`/`--` line inside a note, legend or edge label is drawn
by the jar as a `<line>` element. We swallow it.

**Verified:** `sodizo-26-salo123` note — jar children `path path text text
line text×5 line text×5` (16) vs ours with the two `line`s absent (14);
`xicipi-57-bibe032` (11 vs 9, two lines); `gujigi-63-roki030`'s link labels
(jar `path polygon text text line text` vs our `path polygon text text`);
`kacico-91-bati232`'s legend (6 `line`s); `fomofi-36-lova857` (one root-level
`line` we lack).

**Reach (FULL for the line count):** `sodizo-26-salo123`,
`xicipi-57-bibe032`, `gujigi-63-roki030`, `kacico-91-bati232`,
`fomofi-36-lova857`.

**Fix shape.** `src/core/klimt/creole/` horizontal-line stripe → a `<line>` in
the note/legend/label renderers. **Confidence: MEDIUM-HIGH** (both sides'
output compared element-by-element; Java `AtomHorizontalTexts`/
`StripeSimple` line branch not read).

---

## E14 — engine/feature divergences that are not defects in the class renderer

These explain their fixtures FULLY but are not "fix the class renderer" work.

| Sub-bucket | Mechanism | Reach |
|---|---|---|
| `!pragma layout elk` | jar runs the ELK engine: no `<g class="link">` wrappers, no clusters, flat `polygon`/`line`/`text` at root. We always use `@knowvah/dot-engine`. | `cadutu-02-lazu601`, `cirojo-62-dubo306`, `gokoru-18-daba136`, `lagudi-03-rucu383`, `rutefe-49-xeju709`, `tegefa-14-koxo759`, `temofi-63-vega763` |
| `newpage` | jar splits into pages; the oracle `in.svg` holds page 1 only. We render every page into one SVG. | `bufogi-69-naba929` (jar 1 entity / ours 2), `gevuci-69-fafe469`, `sadamo-18-siva346` |
| `mainframe` | jar draws the mainframe chrome (`rect path text`) before the diagram; we draw nothing. `src/core/klimt/document-shell.ts` mentions it but the class path never calls it. | `jakaja-15-faze022` (jar root 4 / ours 1) |
| `skinparam mode dark` | jar emits a root background `<rect>`; we emit none. | `zirori-93-jefo337` (jar root 2 / ours 1) |
| OUR error page | `sprite X jar:archimate/network` + `!include <tupadr3/…>` make **our** renderer emit the green-on-black error page (`plantuml-ts version 0.1.0 …`); the jar renders the diagram. | `bidusa-22-jutu505`, `cuzoga-39-tufu259`, `jevuvi-65-dipo437`, `ruliki-78-biji661` |
| JAR error page | the **jar** emits its syntax-error page (with the qrcode `Diagram source:` block); we render a diagram. A routing/refusal divergence, not a rendering one. | `luzive-62-zote562` (`<> diamond`), `zuduxu-90-kosi876` |

---

## Unclassified (10)

Root-child counts match; the residual `[childCount]` sits deep inside a
classifier or a `<text>` and I could not pin a single mechanism without
further instrumentation.

| Slug | First structural diff | Note / next instrument |
|---|---|---|
| `foxiki-17-kosa114` | `svg/g[1]/g[1]/text[3][childCount] 0→1`; entity 34→33 | jar emits an **empty** `<text …></text>` where we emit one with content; jar has one extra `text`. `creole_tree` (`|_ ` tree rows). Instrument: dump both `<text>` runs for the tree block. |
| `juxora-90-fisu720` | same shape, entity 32→31 (×2) | same creole-tree family as `foxiki`. |
| `nucite-98-kuga991` | `text[3] 0→1`, entity 23→9 | `<style>` block + creole; likely E13 + the empty-text shape above. |
| `nufini-44-jofo787` | `text[2] 0→1`, entity 24→8 | same. |
| `ponono-25-fevo574` | alternating `text[55] 0→1`, `text[56] 1→0`, … | an off-by-one in the empty-vs-filled `<text>` sequence of a long note — one blank creole line handled differently. |
| `sumocu-27-vubo674` | identical to `ponono` | same. |
| `zubevi-64-fume582` | entity 10→8 | generics `<T>`: jar has 3 `<text>` after the corner `rect[#FFF]`, we have 1. Read `EntityImageClassHeader`'s generic-corner block. |
| `bijevi-38-duza931` | entity 3→5 | `hide … members`: jar `rect text text`, ours `rect text text rect[#FFF] text` — we draw a generic corner box the jar suppresses. |
| `julixi-10-jide878` / `rulite-35-muno361` | entity 8→7 | inverse of the above: jar has one extra `text` after `rect[#FFF]`. Same generic-corner mechanism, opposite direction. |
| `guxode-39-dobi371` | root 25→26 (one extra `g.link`), several entity counts | `skinparam style strictuml` + an extra edge; the per-entity lists are IDENTICAL element-for-element, so those diffs are positional fallout of the link count. Root cause is the extra link — hand to A2a. |
| `delasa-80-jusu462` | root 508→514 | 6 extra root children (`path`, `line`, `text` ×2) — E9's collapsed-package doubling at scale, plus E5(b) (`hide` + `package_color`). Needs re-check after E5/E9 land. |

---

## Summary

| Sub-bucket | Reach | Confidence |
|---|---|---|
| E1 class header-background split | 8 (3 header-colour, 5 gradient-driven) | HIGH |
| E2 gradient → `<defs><linearGradient>` | 7 | HIGH |
| E3 container USymbol for non-empty groups | 12 (+1 partial) | HIGH |
| E4 package `[[url]]` → `<a>` in cluster | 3 | HIGH |
| E5 hide/show separator + group cascade | 3 full, 11 partial | HIGH |
| E6 note connector as its own `<g class="link">` | 4 full, 6 partial | HIGH |
| E7 `{{ }}` embedded diagram | 7 | HIGH |
| E8 `()`/`circle` interface eye | 2 | HIGH |
| E9 empty package drawn twice (+phantom leaf) | 4 full, 2 related | HIGH / MEDIUM |
| E10 per-member `[[[url]]]` → one `<a>` per row | 2 | HIGH |
| E11 `skinparam groupInheritance` | 5 | MEDIUM |
| E12 inline `<img:>`/sprite/openiconic/emoji | 8 | MEDIUM |
| E13 creole `----` rule not drawn | 5 | MEDIUM-HIGH |
| E14 engine/feature divergences (elk, newpage, mainframe, dark, error pages) | 18 | HIGH |
| Unclassified | 10 | — |
