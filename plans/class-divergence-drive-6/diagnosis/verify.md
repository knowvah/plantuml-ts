# cdd6 T0d — verification of the doubtful rows (D1)

Read-only diagnosis. Upstream read at `~/git/plantuml` HEAD `377fbd12dce`
(branch `dot-output`; `97a5992` is an ancestor, 2 files / 29 lines apart in
`src/main/java`, none on any path below). Real Graphviz = `/opt/homebrew/bin/dot`
16.1.0. dot-engine = `node_modules/@knowvah/dot-engine` 1.6.1. All numbers
below were measured in this run; scratch scripts live in the session
scratchpad `T0d/` (`our-dot.mts` captures every `layoutGraph` input through
`setLayoutInputObserver` and lays it out through the exact
`applyGraphAttrs/addNodes/addClusters/addEdges` builder path, then writes
dot-engine's `-Tdot`; `strip.sh` removes `bb/pos/lp/*_lp/lwidth/lheight` so
real `dot` re-lays the same graph from scratch; `engine-dot.mts` runs
dot-engine's own `parse` on the jar's cached `svek-1.dot`).

Render-diff baseline (`render-diff.mts`, this run): bizasu 0/2, meramo 0/2,
momada 0/2, zasuxe 0/35, rojida 0/204, beboke 0/50, febuli 0/4, fezaro 0/14,
xuloxo 36/4, miveni 0/182, rivino 0/175, soseka 0/179, josebu 0/6, tefeco 0/3;
c4/gikaju: compare throws (jar `in.svg` has a malformed comment at byte 1041 —
the jar error page).

## json canvas width Δ1 — unknown/bizasu-70-vaxa243, unknown/meramo-02-vasu175, unknown/momada-03-zeka599

**cdd5 claim.** svg `@width`/`viewBox[2]` Δ1; "dot-engine bb vs real dot",
unverified.

**Measured.**

| fixture | real dot on jar svek-1.dot | dot-engine on jar svek-1.dot | dot-engine on OUR DOT | real dot on OUR DOT (stripped) | jar width | our width |
|---|---|---|---|---|---|---|
| bizasu | bb 0,0,417.5,184 | 0,0,417.5,184 | 0,0,417.5,184 | 0,0,417.5,184 | 422 | 423 |
| meramo | 0,0,428,288 | 0,0,428,288 | 0,0,428,288 | 0,0,428,288 | 433 | 434 |
| momada | 0,0,428,288 | 0,0,428,288 | 0,0,428,288 | 0,0,428,288 | 433 | 434 |

Node positions agree too (bizasu, our DOT: dot-engine `56,144 211,144 56,22
364,144 204,22 347,22`; real dot `56.002,144 211,144 56.002,22 364,144 204,22
347,22` — the 0.002 is the 5-significant-digit `width=` round trip of the
stripped file). Every drawn `<rect>`/`<text>` in bizasu is byte-identical
jar vs ours (6 rects, 14 texts compared); only the canvas differs.

Instrumented (temporary `console.error` at `class-ink-box.ts:273`, reverted by
copying the saved original back; `git diff src/` empty afterwards): every
json leaf reaches `addClassifierBoxInk -> addRectInk` with
`bodyInkWidth === undefined`, so its max-x ink is `c.x + c.width`.
bizasu: rightmost leaf `myJsonTrue` x 310.5 w 91 -> box.maxX 401.5 = x+w,
box.minX -1 -> raw 402.5+15 = 417.5, +5 right margin = 422.5,
`(int)(422.5+1)` = 423. meramo/momada: rightmost `myJsonNumber` x 300 w 112
-> maxX 412 = x+w, minX -1 -> 413+15+5 = 433 -> 434.

**Mechanism.** A json leaf whose value is a primitive draws only
`URectangle` + two `UText`s; `LimitFinder#drawRectangle` bounds the rect at
`x + w - 1`, not `x + w`. Our ink walk gives json leaves the classifier
`UEmpty` rule `x + w` (`class-ink-shapes.ts#addRectInk`, `c.x +
(c.bodyInkWidth ?? c.width)`), 1px too far right; the jar's raw ink is 1px
narrower, so after `+15 +5` and `(int)(v+1)` its canvas is 1 smaller.

- Java: `svek/image/EntityImageJson.java:192` `ug.apply(stroke).draw(rect);`
  (rect = `URectangle.build(widthTotal, heightTotal)`, :160); the name block
  is `withMargin(..., 2, 2)` (:95-96) centered in `width = max(dimFields,
  dimTitle + 2 * xMarginCircle)` (:124, xMarginCircle 5) — so it stops 5px
  inside the right edge; a primitive value is `getTextBlock(tmp)`
  (`cucadiagram/TextBlockCucaJSon.java:88-91`), left-aligned text with no
  full-width line. `klimt/drawing/LimitFinder.java:184-186`
  `addPoint(x - 1, y - 1); addPoint(x + shape.getWidth() - 1 + ...)`.
  Arithmetic check: jar maxX 407.5 (317.5+91-1 in final coords), minX 6 ->
  401.5+15 = 416.5, `CucaDiagram` right margin 5 -> 421.5, `SvgGraphics.java:129-131`
  `(int)(x + 1)` = 422 = the jar's width.
- Port: `src/diagrams/class/class-ink-box.ts:273` (json falls through to
  `addClassifierBoxInk`) -> `src/diagrams/class/class-ink-shapes.ts#addRectInk`
  (`bodyMaxX = c.x + (c.bodyInkWidth ?? c.width)`); `class-ink-shapes.ts:81`
  documents json as "left unmeasured deliberately".
- Caveat for the fix (read, not measured on these rows): an OBJECT json body
  draws `ULine.hline(jsonTotalWidth)` per member (`TextBlockCucaJSon.java:168,174`)
  and an ARRAY with >= 2 elements draws `hline(arrayTotalWidth)` between
  elements (`:215-220`), both reaching `x + w`. So the rule is per body shape:
  primitive (and 1-element array) -> `x + w - 1`; object / multi-element
  array -> `x + w`. In these three fixtures the rightmost leaf is always a
  primitive, which is why they fail.

**Ruled out.**
- dot-engine: identical bb on the jar's DOT and on ours, identical to real
  dot on both (table above).
- Our DOT emission: real dot on our DOT gives the jar's bb (417.5 / 428).
- Drawn geometry: every rect/text x/y/width identical (bizasu), so node
  placement and SvekNode sizes are right.
- Jar rounding: the jar number is reproduced exactly from LimitFinder +
  margin + `(int)(v+1)`; ours reproduced exactly from `x + w`.

**Verdict.** AMENDED (dot-engine attribution was wrong; mechanism = json leaf
ink rule). **Confidence** HIGH (instrumented this run).

**Owner.** Not T3a (its write-set `graph-layout.ts` cannot reach it). Re-slot
to **T2b** (write-set already has `class-ink-box.ts`: dispatch `kind ===
'json'` before `addClassifierBoxInk`, using `ClassifierGeo.jsonBody` to pick
the primitive vs hline rule). Extension only if the fix is put in
`addRectInk` itself: `src/diagrams/class/class-ink-shapes.ts`.

## node order inside cluster `abc` — unknown/zasuxe-15-lugo662

**cdd5 claim.** Nodes in cluster `abc` ordered differently (component x 398
vs jar 22); "DOT structurally equal incl. node order"; dot-engine a
candidate, our DOT never fed to real dot.

**Measured.**
- Jar `svek-1.dot` declares, inside `cluster6p1`: `sh0010` (width 2.685764 =
  the component `abc-service`), then `sh0011`, `sh0012` (2.131944 = the two
  empty packages `def`, `ghj`).
- Our DOT (captured input `clusters[0].nodeIds`): `["abc.def", "abc.ghj",
  "abc.abc-service"]` — packages first, component last. (Our top-level
  `nodes[]` order is `abc.abc-service, abc.def, abc.ghj`; only the cluster
  membership order is wrong, and that is the order the builder emits inside
  the subgraph.) So the DOT is NOT order-equal; `dotEqual` does not see
  intra-cluster declaration order.
- Real dot on the jar DOT: `sh0010 129,72 · sh0011 337,72 · sh0012 525,72`
  (component leftmost), bb 822x177. dot-engine on the jar DOT: identical.
- dot-engine on our DOT: `def 109,72 · ghj 297,72 · abc-service 505,72`,
  bb 822x177. Real dot on our DOT: identical positions, bb 822x177.
  (Instrument caveat: dot-engine's `-Tdot` writer omits `label=""` on the
  `cluster0p0`/`cluster0p1` wrappers, so the stripped file first gave real
  dot bb height 210 — the wrappers inherited the title table. Restoring
  `label=""`, which our input graph does carry per the 177 result, gives 177.)

**Mechanism.** Upstream emits a group's own leaves FIRST and its muted empty
child packages AFTER them: `svek/GraphvizImageBuilder.java:431-433`
`this.printEntities(stringBounder, g.leafs()); printGroups(stringBounder, g);`
with `printGroups` doing `g.muteToType(LeafType.EMPTY_PACKAGE);
printEntity(stringBounder, g);` (:416-418). The port collapses an empty
package at its parse-time close and pushes its id onto the parent's
`classifiers` in SOURCE order — `src/diagrams/class/class-namespace.ts:117`
`remaining.find((n) => n.id === parentId)?.classifiers.push(nsId);` — and
`src/diagrams/class/class-dot-clusters.ts:81` copies `ns.classifiers`
verbatim into `nodeIds`. `def`/`ghj` are declared before `[abc-service]`, so
they precede it in the subgraph; dot's initial mincross order follows
declaration order, so both engines put the component rightmost.

**Ruled out.**
- dot-engine: identical positions to real dot on both DOTs.
- Layout nondeterminism / rank constraints: same bb, same rank (y 72) for all
  three in every run; only the declaration order differs between the inputs.
- Draw-side translation: the Δ376 x on the component equals the layout
  position difference (505-129 = 376).

**Verdict.** AMENDED (not dot-engine; our DOT emission order). **Confidence**
HIGH.

**Owner.** Not T3a (`graph-layout.ts` preserves the given `nodeIds` order; the
wrong order arrives from the class engine). Re-slot to **T3d**, which already
owns `class-dot-clusters.ts`: order `nodeIds` as the group's non-collapsed
leaves, then `collapsedGroup` leaves in `printGroups` (child-group) order.
Write-set extension only if the fix is made at the push site instead:
`src/diagrams/class/class-namespace.ts`. Regression watch: `collapsedGroup`
draw order (`class-leaf-order.ts`, xitobu/daxeno) is a separate, draw-side
order and must not move.

## (+3,+1) shift — unknown/rojida-14-fuli428

**cdd5 claim.** (+3,+1) whole-diagram shift, "mechanism not isolated"
(T4d residual 6); T5e: package excluded from description ink
(`class-layout-description-leaf-ink.ts:102`, deliberate).

**Measured.** It is NOT a whole-diagram translate. Diff (0/204): the two
upper packages (Application, ClientInterface) move (+3,+1); LibraryInterface
(+1.03,+1); LibraryImplementation, the leftmost, (+1,+1); canvas jar 475x382
vs ours 382x393. Three independent mechanisms, each measured:

1. **Uniform (+1,+1) — ink min corner.** Instrumented `addClassifierInk`
   (temporary log at `class-ink-box.ts:218`, reverted, `git diff src/` empty):
   all four packages arrive as `kind: descriptive, usymbol: package`, with no
   `folderTab` and no `symbolInk`, so they take `addRectInk`'s `(x-1, y-1)`.
   Raw minima: LibraryImplementation x 0 -> ink -1; Application y 0 -> ink -1.
   The jar's minima are the folder outline itself: its leftmost ink is the
   LibraryImplementation title line at x1 = 6 and its top is Application's
   path at y = 6 (both land on `JAR_INK_MARGIN`), ours land at 7.
   Java: `decoration/symbol/USymbolFolder.java:104-123` draws a `UPath` from
   (0,0) to (width,height) (`roundCorner != 0` branch — the jar emits
   `<path>`), bounded by `klimt/drawing/LimitFinder.java:164-166`
   `addPoint(x + shape.getMinX(), ...)` — no `-1`. Port: `src/diagrams/class/
   class-layout-description-leaf-ink.ts:102-110` (`'folder'`, `'package'` in
   `DESCRIPTION_LEAF_INK_EXCLUDED_SYMBOLS`) -> `class-ink-box.ts:273` ->
   `class-ink-shapes.ts#addRectInk` `addPoint(box, c.x - 1, c.y - 1)`.
2. **Extra +2 x on the upper row, +0.03 on LibraryInterface, height 393 —
   leaf SIZE.** Instrumented `measureFolderLeaf` (temporary log at
   `leaf-sizing-folder.ts:89`, reverted): the `{{ ... }}` label is measured as
   literal text lines, `lineH` 14: `labelH` 42 for the 3-line embeds, 56 for
   the 4-line ones; `labelW` 115.06 for LibraryInterface (`"  interface
   interface1"`). Resulting nodes: LibraryInterface 145.0625x93, Library-
   Implementation 180.425x93 (ours) vs jar `svek-3.dot` 139.125x79 and
   180.425x79 (1.932292 / 2.505903 x 1.097222 in). The jar's 79 = 14 title +
   42 embed + 23 margin, and 139.125 = max(109.125 title, 42) + 30: the embed
   is sized 42x42 (`EmbeddedDiagram.java:126-152`, the `catch` returning
   `new XDimension2D(42, 42)` for the non-SVG sizing bounder — T4d's
   finding), reached through `EntityImageDescription.java:188-191`
   `BodyFactory.create3(entity.getDisplay(), ...)` -> `CreoleParser.java:152-154`
   `EmbeddedDiagram.createAndSkip`. The 3-line embeds match only by
   coincidence (3 x 14 = 42). Port: `src/core/svek/image/leaf-sizing-folder.ts:82`
   `folderTextBlock(labelText, ...)` measures `node.display` as plain lines.
   Layout check: real dot on jar `svek-3.dot` puts Application/ClientInterface
   at x 187.21, LibraryInterface 285.21, bb 354.78x357; real dot on our DOT
   189.21 / 288.21, bb 360.75x371; dot-engine on each input matches real dot
   on that input (354.78x357 and 360.74x371). 189.21-187.21 = +2, +1 from (1)
   = +3; LibraryInterface left edge 288.21-72.53 = 215.68 vs 285.21-69.56 =
   215.65, +0.03, +1 = +1.03. Every numeric in the diff is accounted for.
3. **Canvas 475x382 — drawn embed not in the canvas.** Drawn images are
   identical (4 images, same w/h, ours offset by the shifts above). Jar width
   = LibraryInterface image 231.65 + 243 = 474.65 -> 475; height = image
   bottom 311 + 70 = 381 -> 382: `klimt/drawing/svg/SvgGraphics.java:1033-1034`
   `ensureVisible(x + image.getData("width"), y + image.getData("height"))`,
   `:129-131` `(int)(x + 1)`. Ours stops at the node ink (382 wide; 393 tall
   from the 93px nodes). This is cdd5's desc-embed-ink-missing: the canvas
   counts only class-body embeds (`class-ink-box.ts#addEnhancedBodyEmbedInk`
   / `drawnEnhancedBodyEmbeds`), never a description label embed.

**Ruled out.** dot-engine (identical positions to real dot on both inputs);
our DOT emission beyond node size (same ranks/edges/minlen; only
LibraryInterface/LibraryImplementation width/height differ); the draw of the
embed itself (image w/h identical); a uniform translate (per-node offsets
differ: 3, 3, 1.03, 1).

**Verdict.** AMENDED (three mechanisms; cdd5's "shift" was 1 + 2 combined).
**Confidence** HIGH (both instrumented, layout re-run in both engines).

**Owner.** **T2b** — (1) and (2) are in its write-set
(`class-layout-description-leaf-ink.ts` / `class-ink-box.ts` for (1),
`leaf-sizing-folder.ts` for (2)); (1) needs `src/diagrams/class/class-ink-shapes.ts`
only if fixed inside `addRectInk`. (3) is NOT an ink point: the drawn embed
must stay OUT of the LimitFinder ink (see tefeco (a): the jar's ink pass draws
nothing for it) and enter only as a draw-time ensureVisible max
`(int)(x + w + 1)` — extension `src/diagrams/class/layout-ink-extent.ts`
(T3b's file; batch 2 lands first) or wherever T2b puts that channel. Note for T2b: (2)
must route the folder label through the embed's 42x42 sizing (the same
`EmbeddedDiagram` catch T4d used for `leaf-sizing-entity.ts`), not measure a
fixed 42 — a single-line embed must still hit the catch. Fixing (1) alone
moves rojida only by the uniform 1px.

## empty `usymbol { }` containers — unknown/beboke-62-zofu377, unknown/febuli-89-dusi249, unknown/fezaro-08-nopo877

**cdd5 claim.** Empty `usymbol { }` containers built by `class-container.ts` /
`class-geo-builders.ts` never reach `tryMeasureDescriptionLeaf`; canvas
overstated; "not diagnosed beyond the path".

**Measured.**
- Jar: every row has a `svek-1.dot` with one node (beboke 0.763889x0.333333,
  febuli 2.417361x0.805556, fezaro 1.255903x0.472222 in) — the jar runs
  graphviz. Ours: `setLayoutInputObserver` captured **0** layout inputs for all
  three — we skip graphviz.
- Instrumented `degenerateSingleClassifier` (temporary log at
  `class-geo-builders.ts:472`, reverted): `rawNamespaceCount 0,
  relationships 0, classifiers [[code, descriptive, queue, collapsedGroup
  true]]` (febuli: frame, fezaro: stack, both `collapsedGroup true`). So the
  degenerate gate fires.
- Probe (temporary one-line gate edit `if (rawNamespaceCount !== 0 ||
  ast.classifiers.some((c) => c.collapsedGroup === true)) return undefined;`,
  render-diff, reverted, `git diff src/` empty): febuli 0/4 -> **pass**,
  fezaro 0/14 -> **pass**, beboke 0/50 -> 0/2 (`path[2]/@d[9]` exp 30 act 18,
  `@d[10]` exp 56 act 51).

**Mechanism A (all three) — degenerate gate.** Upstream's gate reads the
group count BEFORE the empty-group mute:
`dot/DotData.java:69-70` `return entityFactory.groups().size() == 0 &&
getLinks().size() == 0 && getLeafs().size() == nb;`, consulted at
`svek/GraphvizImageBuilder.java:211-223`, while the mute to `EMPTY_PACKAGE`
happens later in `printGroups` (`:416-418`); a `queue/frame/stack X { }` is a
GROUP until then, so `groups().size() == 1` and the jar lays it out through
svek (then draws it via `GeneralImageBuilder.java:201-203` `EMPTY_PACKAGE`
with a USymbol -> `EntityImageDescription`). T4a made the port read
`ast.namespaces.length` pre-collapse (`src/diagrams/class/layout.ts:274-287`),
but a USymbol container is collapsed at PARSE time
(`src/diagrams/class/class-container.ts:198-204`, `collapseEmptyNamespace`
in `closeContainer`), so it is already gone from `ast.namespaces`; the gate
`src/diagrams/class/class-geo-builders.ts:472` `if (rawNamespaceCount !== 0)
return undefined;` then passes and the degenerate canvas/placement is used
(beboke: uniform (+1,+1) and 75x44 vs 76x45; febuli: 194x78 vs 195x79;
fezaro: x +1.5, height 103 vs 105).

**Mechanism B (beboke only) — queue closing cap.** Jar path
`M56,6 C51,6 51,18 51,18 C51,30 56,30 56,30`; ours `... C51,18 51,30 56,30`.
Java `decoration/symbol/USymbolQueue.java:87`
`closing.cubicTo(width - dx * 2, height, width - dx, height, width - dx,
height);`. Port `src/core/decoration/symbol/USymbolQueue.ts:67`
`closing.cubicTo(width - QUEUE_DX * 2, height / 2, width - QUEUE_DX * 2,
height, width - QUEUE_DX, height);` — deliberately fitted to the older
`1.2026.7beta3` jar (its doc comment, lines 32-47). The current oracle draws
the source form everywhere: scanning every cached jar `in.svg` of a
`queue`-using fixture, 25 closing caps are source-form, 0 beta3-form
(component/butebe, bisedo; object/gapisu, togixe; unknown/gukibi, bafega,
beboke, safuke, ...). The fitted form is stale.

**Ruled out.** Container ink / `tryMeasureDescriptionLeaf` (cdd5's lead):
with only the gate changed, febuli and fezaro are byte-conformant, so the
svek-path ink/sizing for frame/stack is already right; the queue shape body
(`path[1]`) is identical once the gate is fixed; DOT/dot-engine (not reached
in our current path; no layout to compare).

**Verdict.** AMENDED (not an ink defect: a degenerate-gate miss, plus a stale
queue cap). **Confidence** HIGH (instrumented + probe this run).

**Owner.** **T2c** for A (`class-geo-builders.ts` is in its write-set; count
`collapsedGroup` leaves as groups in the gate). B needs a write-set extension:
`src/core/decoration/symbol/USymbolQueue.ts` + `tests/unit/core/decoration/
symbols-solids.test.ts` (its `QUEUE_GOLDEN` is the beta3 capture). B is
cross-engine: it moves every queue in component/object/unknown/sequence
(sequence imports `USymbolQueue` for participants) — all toward the jar per
the 25/0 scan, but the other-engine movers must be counted at close.

## C4 `>>` head + `$bl()` split — unknown/xuloxo-85-vibu502 (+ c4/gikaju-64-bari602)

**cdd5 claim.** Routes DESCRIPTION (jar CLASS): the class parser lacks the
`>>` head (`LinkDecor.java:87`; `class-relationship-parser.ts:116`), and C4
`$bl()`-joined skinparam lines are collected unsplit (`BlockUml.java:153`
vs `preprocessor.ts:306-308`).

**Measured.**
- Jar preprocessed text (`java -DPLANTUML_DETERMINISTIC_TEXT=true -jar
  oracle/dist/plantuml-oracle.jar --preproc -pipe`, scratch only): xuloxo
  3760 lines; the body ends
  `__instance__2__class__Renderer_rendering -->> __instance__3__class__Renderer_rendering : **Label**\n...`;
  gikaju body starts `WebAppContainer -->> someContainer : **relation**`. The
  C4 skinparam blocks are separate lines (e.g. `skinparam rectangle<<boundary>> {`
  at line 195, `skinparam database<<boundary>> {` at 201,
  `skinparam rectangle<<person>> {` at 452).
- Our `preprocess()` on xuloxo (scratch `c4/pre.mts`, same include store as the
  survey): 2432 body lines, 0 contain `BLOCK_E1_BREAKLINE`, no `skinparam`
  line leaks into the body; but 10 of 35 `skinparam` map entries carry
  breakline-joined blobs, e.g. key `rectangle<<boundary>>` => `{<BL> FontColor
  #444444<BL> BackgroundColor transparent<BL> ... }<BL>skinparam
  database<<boundary>> {<BL> ...`. Same body arrow as the jar.
- Routing probes (ours, `renderSync`): `rectangle a {}` / `rectangle b {}` +
  `a --> b` -> CLASS; the same with `a -->> b` -> **DESCRIPTION**; `class a` /
  `class b` / `a -->> b` -> **Syntax Error**. Jar (`scripts/oracle-render.sh`,
  scratch): both `-->>` probes -> CLASS. Full fixtures: xuloxo ours
  DESCRIPTION (jar CLASS); gikaju ours DESCRIPTION (jar: CLASS error page
  "Use 'allowmixing' ... (Assumed diagram type: class)").

**Mechanism 1 (routing, both rows) — `>>` head.** Java
`decoration/LinkDecor.java:87` `ARROW_TRIANGLE(decors1("<<"), decors2(">>"),
10, true, 0.8)`; port `src/diagrams/class/class-relationship-parser.ts:116`
`HEAD2_CHARS` has `>` and `_>` but no `>>`, so `-->>` is not a class link;
the class engine refuses and the dispatcher falls to DESCRIPTION. This alone
decides routing (probes above: flipping only `-->>` to `-->` flips the route).

**Mechanism 2 (xuloxo styling, not routing) — `$bl()` split.** Java
`BlockUml.java:153` `Jaws.mutateExpands1(tmp);` ->
`jaws/Jaws.java:59-63,65-...` `mutateExpandsBreakline` splits every
`BLOCK_E1_BREAKLINE` outside `{{...}}` into separate lines BEFORE any command
sees them. Port: `src/core/preprocessor.ts:306-308` runs
`StyleAndSkinparamCollector.accept` on the unsplit `context.getResultList()`;
the split exists (`src/core/uml-source-lines.ts:43`
`mutateExpandsBreakline`) but is applied only on the `umlSourceSeedLines`
path (`:118`). The C4 `rectangle<<person>>` / `<<container>>` /
`<<system>>` / boundary blocks therefore never become skinparams; once
routing is fixed, xuloxo's C4 colours will be wrong without it.

**Ruled out.** Preprocessor body divergence as the routing cause (identical
arrow line; no skinparam text leaks into the body); allow_mixing /
`rectangle ... { }` groups (the `-->` probe with the same groups routes
CLASS).

**Incidental (non-class, not scheduled).** `render-diff` on c4/gikaju throws
before comparing: OUR description render emits `<!--entity
azureCloud\u0000someContainer-->` (the qualified-name separator inside an
XML comment, byte 1041) — invalid XML. It disappears for this row once it
routes CLASS; the description-side emitter is not pinned here (lead:
`core/abel/EntityBase.ts` holds the `\u0000` separator).

**Verdict.** VERIFIED (both mechanisms, as cdd5 stated; mechanism 1 is the
sole routing cause). **Confidence** HIGH.

**Owner.** Mechanism 1 -> **T1d** (in write-set). Mechanism 2 -> **T1e**
(`preprocessor.ts` in write-set; apply `mutateExpandsBreakline` to the result
list before the collector). No extension. gikaju closes on T1d alone (it
must then match the jar's allowmixing error page).

## mainframe svek not normalized — unknown/miveni-64-rexo238, unknown/rivino-95-midu088, unknown/soseka-43-riru110

**cdd5 claim.** Under a mainframe `SvekResult`'s `moveDelta` never runs, so the
body keeps raw svek coordinates and `BigFrame` sizes from the raw ink max;
the port frames an already ink-normalized, margin-dimensioned fragment.
Confirm `SvekResult.java:130-135` is the whole story.

**Measured (rivino, the minimal row).** Diffs: class `a` rect x jar 11 / ours
17, y 43 / 42; frame rect height 204 / 212; canvas height 230 / 238 (width
equal: the title dominates). miveni and soseka show the same body offset
(+6 x, -1 y) and frame height +8; miveni's width +15 (its long class name
makes `ww`, not the title, the frame width). Real dot on the jar `svek-1.dot`:
`<svg width="48pt" height="164pt">`, node `a` polygon `0..39.79 x -156..-108`,
`b` `-48..0`; so the jar's raw svek coords (`DotStringFactory.java:385-398`,
`YDelta(fullHeight)`: `y + 164`) are a (0, 8), b (0, 116), 39.7875x48 each.
Our raw classifiers (instrumented `addClassifierInk`, reverted): a (0,0),
b (0,108) — origin-normalized, then shifted so ink min = 6 (rect at 7).

Jar reproduced exactly from raw coords with NO `moveDelta`, style
`plantuml.skin:85-89` (`mainframe { Padding 1 5; LineThickness 1.5; Margin
10 5 }`), `dimTitle.height` 14 (the tab path `L5,27` = `getYpos` 17 = 14+3):
- body x = margin.left 5 + padding.left 5 + delta.dx 1 (LimitFinder rect ink
  min x = 0-1 < 0) + raw 0 = **11**; body y = margin.top 10 + (padding.top 1 +
  14 + 10) + delta.dy 0 (ink min y 7 >= 0) + raw 8 = **43**;
- frame height = effectivePadding.top 25 + dimTitle 14 + hh (raw maxY 8+108+48
  = 164) + padding.bottom 1 = **204**.
Ours: body = 5+5+7 = 17 and 10+25+7 = 42 (normalized rect at 7); frame height
= 25 + 14 + **172** + 1 = 212, where 172 = our `svekDimension` height (ink
164-7 = 157, +15 `INK_DELTA`) — the margin-dimensioned body, not the raw maxY.

**Mechanism.** Nothing calls `SvekResult#calculateDimension` on the mainframe
path, so its `moveDelta(6 - minX, 6 - minY)` (`svek/SvekResult.java:130-135`)
never runs: `UgDiagram.java:124-128` builds the raw `SvekResult`
(`GraphvizImageBuilder.java:288-290` returns it without sizing it) and wraps it
through `DiagramChromeFactory.java:129` `decorateWithFrame` (innermost, before
legend/title/caption/header/footer, :128-133). `BigFrame` sizes the body with
`TextBlockUtils.getMinMax(original, ...)` (`BigFrame.java:80,88`: `ww =
minX >= 0 ? maxX : width`), a LimitFinder DRAW pass, never
`calculateDimension`; the wrapper's `calculateDimension` asks only
`frame.calculateDimension` (`DiagramChromeFactory.java:317-321`) and draws
`original` at `margin + padding + delta` (`:301`, `computeDelta` :332-337). The
outer legend/title/backcolor wrappers (`UgDiagram.java:132`
`TextBlockUtils.addBackcolor`) only ever size the frame wrapper. So the body
is drawn in raw svek coordinates and framed by raw ink max. Port:
`src/core/klimt/shape/big-frame.ts:165-174` takes `originalDim` (the class
fragment's pre-chrome width/height = `svekDimension`, +15) as `ww`/`hh` and
drops `delta` (:70-77 asserts minX/minY >= 0); `chrome.ts#addMainframe`
feeds it the ink-normalized fragment (`index.ts` class chrome branch).

**Ruled out.** dot-engine / layout (a->b spacing 108 in both, raw svek coords
reproduce the jar to the pixel); title metrics (tab path and title x identical;
width equal on rivino/soseka); legend/title/caption composition (rivino has
none and shows the full defect; soseka's extra chrome shifts both sides
equally). `SvekResult.java:130-135` IS the whole story for these three rows —
every diffed number follows from "no moveDelta + raw LimitFinder extents".

**Verdict.** VERIFIED. **Confidence** HIGH (jar numbers reproduced from raw
svek coords this run).

**Owner.** **T3b** (write-set `big-frame.ts`, `chrome.ts`,
`layout-ink-extent.ts`, `index.ts` covers it: under a mainframe hand BigFrame
the class body's raw, un-shifted geometry and LimitFinder extents, with
`delta`). No extension found; if the raw-geometry hand-off must come from
the class layout rather than `layout-ink-extent.ts`, the next file is
`src/diagrams/class/layout.ts`.

## nested renders — unknown/josebu-55-seje426

**cdd5 claim.** Nested sequence `queue "<$sprite>"` drawn as text; owner line
to be named in `renderer-participant-symbol.ts`.

**Measured.** Outer diff 0/6 is ALL image/canvas size: jar image 92x162,
canvas 115x190; ours image 107x87, canvas 129x114. Nested source rendered
standalone (`!include <cloudinsight/tomcat>` + `queue "<$tomcat>" as cmds`):
jar SEQUENCE 92x162 with two `<image>` (the 52x52 PNG sprite, head + foot);
ours SEQUENCE 107x87 with two `<text>` `&lt;$tomcat>` (textLength 66.15) =
exactly the outer image sizes. Isolation probes (ours): `participant`,
`queue`, `database`, `actor` with `"<$tomcat>"` -> 0 images, 3 literal
texts each; an INLINE `sprite $foo [4x4/16] {...}` in a participant -> literal;
`p -> p : <$tomcat>` (message label) -> literal; the same include in a
DESCRIPTION `rectangle "<$tomcat>"` -> 1 `<image>`. So the sprite is
registered and resolvable; the sequence LABEL path refuses sprite atoms for
every component, not the queue symbol.

**Mechanism (a) — sequence labels drop sprite atoms to literal text.** Java:
every sequence label is `display.create0(fc, ..., CreoleMode.FULL, ...)`
(`skin/AbstractTextualComponent.java:80-92`), whose `<$name>` becomes an
`AtomSprite` (`klimt/creole/legacy/StripeSimple.java:228-235`
`atoms.add(new AtomSprite(...))`). Port:
`src/diagrams/sequence/sequence-creole.ts:347-350` — `if (atoms.some((a) =>
a.kind !== 'text' && a.kind !== 'latex')) { const literal = ...; return
[textAtomRun(literal, ...)]; }`, a documented remainder (":60-72"): sequence
geometry has no image-carrying run for an `'inline'` atom. NOT
`renderer-participant-symbol.ts` — the queue shape draws correctly around
whatever block it is given. (The nested queue's closing cap also shows the
stale beta3 form — see the empty-usymbol section, mechanism B; it lives in the
image bytes, which the comparator does not diff.)

**Mechanism (b) — degenerate canvas, 1px (after (a)).** josebu is a single
leaf, no links, no groups -> degenerate in both (no `svek-*.dot` in the jar
cache). Jar canvas = `SvgGraphics.java:1033-1034,129-131` on the drawn image:
`(int)(22 + 92 + 1)` = 115, `(int)(27 + 162 + 1)` = 190. Ours
(`src/diagrams/class/class-geo-builders.ts:426-430`) folds the LimitFinder
`symbolInk` (image `x + w - 1`) into `Math.floor(inkRight) + 1`: 22+107-1 = 128
-> 129 (height 27+87-1 = 113 -> 114). Once (a) fixes the image to 92x162 this
leaves 114x189 vs 115x190. Same shape as cdd5-T5e's circle-interface finding
(ensureVisible channel != LimitFinder ink). Inferred from the measured values
(129/114 are reproduced only by the `-1` rule), not separately instrumented.

**Ruled out.** Sprite registration / include store (description resolves the
same sprite); the queue USymbol (all participant kinds fail identically);
outer frame sizing (frame rect 82x72 identical in both).

**Verdict.** AMENDED (the owner line is `sequence-creole.ts`, not the
participant-symbol renderer; plus a 1px degenerate-canvas residual).
**Confidence** HIGH for (a); MEDIUM for (b) (arithmetic, not instrumented).

**Owner.** (a) non-class, sequence-wide (every sequence label with `<$...>`,
`<img>`, `<&icon>`, `<:emoji:>`): **T3e only with a write-set extension**
`src/diagrams/sequence/sequence-creole.ts`, `sequence-text.ts`,
`sequence-layout-participant-sizing.ts` (the participant head must grow to the
sprite: jar 162 tall), with sequence-corpus movers counted at close; if that is
too wide for T3e, **open -> cdd7** (sequence inline-image runs; `latexAtomRun`
/ `TextRun.image` is the in-repo precedent). (b) **T2c**
(`class-geo-builders.ts`, in write-set): the degenerate ensureVisible channel
must use the drawn image corner `x + w`, not `symbolInk`'s `x + w - 1`.

## nested renders — unknown/tefeco-12-rato895

**cdd5 claim.** Nested description note not opale ("MEDIUM", not isolated).

**Measured.** Outer diff 0/3: canvas width 267 vs 279 (Δ12), embed image width
209 vs 208 (Δ1). Nested source standalone (`cloud cloud` + `note right:
cloud's note`): jar DESCRIPTION 209x70 draws the note as an opale path
(`M108.488,15.195 L108.488,22.695 L73.918,26.695 ...`) + fold path, no
separate link; ours 208x70 draws a plain `<rect x=108.488 w=86.406>` + text +
a separate link path `M73.918,26.695 C...108.248,26.695`. Probe: `note right:`
on `cloud`, `rectangle`, `component`, `node` in our DESCRIPTION engine -> never
opale (jar `rectangle`: 1 rect + 2 paths; ours: 2 rects + 1 path).
Outer canvas: instrumented `buildInkBox` (temporary log, reverted, `git diff
src/` empty): the label leaf `artifact.card.label` (62x62 box) carries
`symbolInk {minX 10, maxX 217, ...}` — 217 = 10 + 208 - 1, i.e. the drawn
embed image through LimitFinder's `drawImage` rule; box -41..217 -> 258+15+5 =
278 -> 279. Jar: the embed image right edge is 57 + 209 = 266 -> 267 by
`SvgGraphics` ensureVisible, and the jar's svek ink (without the image:
note path max 245.276, min 6 -> 254.3+15+5 -> 260) is below it — so the
jar's LimitFinder did not see the image.

**Mechanism (a) — outer canvas Δ12: the embed enters the LimitFinder ink.**
Java: `LimitFinder.java:99-100` `matchesProperty` delegates to the
StringBounder, which for the oracle is `false` (T4d:
`StringBounder.java:43-45`), so in the ink pass `EmbeddedDiagram#drawU` takes
the raster arm (`EmbeddedDiagram.java:180` `getImage(...)`) which throws into
`:191` `catch` and draws nothing; the image reaches the canvas only through
`UGraphicSvg` -> `SvgGraphics.java:1033-1034` ensureVisible. Port:
`src/core/svek/image/EntityImageDescriptionDelegates.ts:150` `drawU: (ug) =>
drawn.drawU(ug)` draws unconditionally, so `leaf-sizing-entity.ts:416-419`'s
LimitFinder walk (`new EntityImageDescription(params).drawU(finder)`) records
it into `symbolInk`. Same family as rojida (3) and josebu (b).

**Mechanism (b) — nested width Δ1: description notes are never opalised.**
Java `svek/GraphvizImageBuilder.java:245-257` (`isOpalisable` ->
`EntityImageNote#setOpaleLine`, `line.setOpale(true)`) and
`svek/image/EntityImageNote.java:235-243` draw the note as an `Opale`
outline and suppress the link. Port: the description engine has no opale
path at all — `src/diagrams/description/renderer-entity.ts:364-373`
`drawNoteFallback` -> `drawFallbackBox` (plain rect, its own doc comment calls
the Opale shape "out of scope ... separately-ledgered"), and the link is
drawn. `parse-state.ts` (T3e's named file) parses the note correctly (note +
link exist in our output); it is not the defect. The 1px: rect ink `x + w - 1`
vs the opale `UPath` max `x + w` (arithmetic, consistent with 208 vs 209).

**Ruled out.** Outer class note / artifact / card geometry (all rect/path/text
coordinates identical); nested cloud shape (identical path); `parse-state.ts`
note parsing (note and its link both present).

**Verdict.** AMENDED (the Δ12 canvas — the bulk — is desc-embed-ink, not the
nested note; the nested note is a description-engine-wide opale gap).
**Confidence** HIGH for (a) (instrumented) and for "never opale" (4 probes);
MEDIUM for (b)'s 1px attribution.

**Owner.** (a) **T2b**, extension `src/core/svek/image/
EntityImageDescriptionDelegates.ts` (an SVG-only draw arm) — plus the
draw-time ensureVisible max for the drawn embed, which for a non-degenerate
class canvas lives in `src/diagrams/class/layout-ink-extent.ts` (T3b's file;
batch 2 lands first). (b) non-class, description-wide: **open -> cdd7**
(port `isOpalisable`/`EntityImageNote` opale into
`src/diagrams/description/` layout + `renderer-entity.ts`); T3e's
`description/parse-state.ts` cannot reach it.

## dot-engine

No row carries a dot-engine defect: on every graph compared this run
(bizasu, meramo, momada, zasuxe, rojida main graph; jar DOT and our DOT each)
dot-engine and real dot 16.1.0 agree on bb and node positions. No
`docs/graphviz-issues/` draft. Instrument note for future runs: dot-engine's
`-Tdot` writer omits `label=""` on sub-cluster wrappers, so a round trip of its
output through real dot must restore those labels (zasuxe, 210 vs 177).

## Summary

| tree/slug | verdict | owner | write-set extension |
|---|---|---|---|
| unknown/bizasu-70-vaxa243 | AMENDED (json leaf ink `x+w` vs rect `x+w-1`; not dot-engine) | T2b (re-slot from T3a) | none (`class-ink-box.ts`); `class-ink-shapes.ts` only if fixed in `addRectInk` |
| unknown/meramo-02-vasu175 | AMENDED (same) | T2b (re-slot from T3a) | same as bizasu |
| unknown/momada-03-zeka599 | AMENDED (same) | T2b (re-slot from T3a) | same as bizasu |
| unknown/zasuxe-15-lugo662 | AMENDED (our cluster `nodeIds` order; real dot agrees with dot-engine) | T3d (re-slot from T3a) | none (`class-dot-clusters.ts`); `class-namespace.ts` if fixed at the push |
| unknown/rojida-14-fuli428 | AMENDED (ink `x-1` on package leaf + `{{ }}` sized as text + embed canvas) | T2b | `layout-ink-extent.ts` for the ensureVisible canvas; `class-ink-shapes.ts` optional |
| unknown/beboke-62-zofu377 | AMENDED (degenerate gate misses parse-collapsed group + stale queue cap) | T2c | `src/core/decoration/symbol/USymbolQueue.ts` + `tests/unit/core/decoration/symbols-solids.test.ts` (cross-engine) |
| unknown/febuli-89-dusi249 | AMENDED (degenerate gate; probe -> pass) | T2c | none |
| unknown/fezaro-08-nopo877 | AMENDED (degenerate gate; probe -> pass) | T2c | none |
| unknown/xuloxo-85-vibu502 | VERIFIED (`>>` head = routing; `$bl()` split = styling) | T1d + T1e | none |
| c4/gikaju-64-bari602 | VERIFIED (`>>` head) | T1d | none |
| unknown/miveni-64-rexo238 | VERIFIED (no moveDelta under mainframe) | T3b | none (`class/layout.ts` if raw geometry must come from there) |
| unknown/rivino-95-midu088 | VERIFIED (same; jar reproduced exactly) | T3b | same |
| unknown/soseka-43-riru110 | VERIFIED (same) | T3b | same |
| unknown/josebu-55-seje426 | AMENDED (sequence labels drop sprite atoms, `sequence-creole.ts:347-350`; + 1px degenerate canvas) | T3e (a, with extension) or open -> cdd7; T2c (b) | `sequence-creole.ts`, `sequence-text.ts`, `sequence-layout-participant-sizing.ts` |
| unknown/tefeco-12-rato895 | AMENDED (outer Δ12 = embed in LimitFinder ink; nested note never opale in description) | T2b (a); open -> cdd7 (b) | `EntityImageDescriptionDelegates.ts`, `layout-ink-extent.ts` |
