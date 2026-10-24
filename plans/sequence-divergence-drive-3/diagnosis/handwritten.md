# T8a diagnosis: the handwritten apply chain and the sequence UGraphic seam

Task T8a (diagnosis only), mission sdd3, tip `c40a67330`. Targets: the four
`handwritten true` rows jefoke-95-jara779 (ws 280), gepuce-64-pivu656 (241),
pafene-01-tedi758 (173), menoke-22-luxo044 (150). Nothing under `src/` or
`tests/` was written; the only other files are the jar renders the deliverable
asks for, in `diagnosis/handwritten-stripped/<slug>/{in.puml,in.svg}`.

## Verdict

The mechanism is the one T5b filed (M1), and it is exact: `skinparam
handwritten true` makes the exporter wrap the page graphic in
`UGraphicHandwritten`, whose `Random` is an instance field that every `apply`
restarts; the sequence renderer emits SVG strings per primitive, so no
primitive ever reaches a decorator. Everything else the four diffs contain is
that one cause: with `handwritten true` stripped, the jar and the port agree on
all four documents (compareSvg: 0 diffs each; sdd2's spot-glyph, stereotype
title, base64-sprite and document-chrome residuals do not appear — batches 1–7
cleared them).

The instrumented jar (not a model) says the **apply/draw topology is simple**:
of 568 draws on 558 instances in a probe, every one is the FIRST draw on its own
decorator instance except the two shapes of `ComponentRoseNote`
(`ComponentRoseNote.java:122,124`), which share one instance. So the seam must
guarantee (1) every shape is drawn through an `apply` chain whose last element
is an `apply` (so its RNG starts fresh) and (2) a note's body and fold corner
are two draws on ONE instance. Order between shapes is irrelevant to the jiggle.

Five findings change the batch-8 plan and need a ruling before T8b (section
"Findings that change the plan"):

1. **The byte-identical hash gate (stop 7) cannot hold for any move that draws
   through core's drivers.** Today's string emitters write presentation
   attributes (`stroke="…" stroke-width="…"`, `font-size` before `fill`); core's
   `Driver*Svg` write the jar's form (`style="stroke:…;"`, `fill` before
   `font-size`). A canonicalised hash (expand `style`, sort attributes) is
   insensitive to exactly that and to nothing else; measured: ours vs the jar
   are canonically identical on gepuce and pafene.
2. **Text (and images, links) must move through the seam too**, or one
   `UGraphicSvg` per page (T8g's fold) is impossible. `UText` through
   `DriverTextSvg` reproduces today's `<text>` values exactly (prototype).
3. **Core prerequisites** the moves need: `UGraphicDelegator` does not forward
   `startGroup`/`closeGroup` (lifelines need it under the decorator);
   `HColors.transparent(WITH_FILL_OPACITY)` is not ported (lifeline hover rect →
   jar `fill="#000" fill-opacity="0"`); `UCenteredCharacter` / `CircledCharacter`
   / `DriverCenteredCharacterSvg` are not ported (the participant spot).
4. **Chrome is mostly INSIDE the decorator**, contradicting T8e's "chrome stays
   plain": only the background rect and the diagram border are outside
   (`TextBlockExporter.java:169-175`). The warning banner (the `rect[1]` in every
   handwritten diff) and title/legend borders are drawn through it.
5. **T5b's "handwritten is not inherited" is contradicted**: the jar's nested
   `{{ }}` diagram is handwritten (`TitledDiagram.java:106-118`); compareSvg
   exempts image `href` bytes, so it is invisible to the gates.

## Method and evidence base

- **Jar instrumentation** (shadow-class, `reference-shadow-class-oracle-
  instrumentation`): `UGraphicHandwritten.java` copied into a scratch dir under
  the same package with three gated insertions — an instance id and a parent id,
  an `System.err` line in `apply` (`APPLY id -> id' change=<class> @ <4 non-
  decorator frames>`) and one in `draw` (`DRAW id shape=<class> @ <frames>`) —
  compiled against `oracle/dist/plantuml-oracle.jar`, run with
  `-DPLANTUML_DETERMINISTIC_TEXT=true -cp <shadow>:<jar> net.sourceforge.
  plantuml.Run -tsvg`. **The instrumented render is byte-identical (`cmp`) to
  the cached golden on all four fixtures**, so the trace is the topology that
  produced the golden. (The patch is the whole recipe: insert `private static
  int COUNTER; final int id = ++COUNTER; int parent` after the `rnd` field, a
  `System.err.println` first in `draw(UShape)`, and in `apply` build the new
  decorator, set its `parent`, print, return it.)
- **A probe beyond the corpus**: a 70-line handwritten document using every
  component the teoz/rose tree can draw (all seven participant kinds, a box,
  title/header/footer/legend, async/cross/circle/half/self/multicast arrows,
  nested activation and destroy, all note shapes incl. `across`, delay, divider,
  `|||`, `alt/else`, `loop`, `par`, `ref`, `group`, create, exo arrows, a link
  anchor, `newpage`): 568 draws, 558 instances, 402 jiggled shapes.
- **Strip comparison**: the four sources with only the `handwritten true` line
  removed (gepuce keeps `shadowing true`), through `scripts/oracle-render.sh`
  and through the port (`renderFixtureSequence`, `sequenceFixtureOptions()`),
  compared with `compareSvg` (tolerance 0.01).
- **Prototypes** (scratch, never in the repo): the real `UGraphicSvg` +
  `UGraphicHandwritten` drawing a lifeline and a note in the jar's local-frame
  chain, compared byte-for-byte with the golden; one `UText` through
  `DriverTextSvg`; a canonicaliser.

## Java read (quoted)

`~/git/plantuml/src/main/java/net/sourceforge/plantuml/`

`core/TextBlockExporter.java:169-177`
```java
UGraphic ug = createUGraphic(dim, scaleFactor);        // :169
maybeDrawBorder(ug, dim);                              // :171  (outside the wrap)
ug = ug.apply(new UTranslate(margin.getLeft(), margin.getTop()));   // :173
if (isHandwritten)                                     // :174
    ug = new UGraphicHandwritten(ug);                  // :175
textBlock.drawU(ug);                                   // :177  (chrome + banner + diagram)
```
`klimt/drawing/hand/UGraphicHandwritten.java`
```java
private final Random rnd = new Random(424242L);                      // :54
public UGraphicHandwritten(UGraphic ug) { super(ug);
    if (!TeaVM.isTeaVM()) if (ug instanceof UGraphicSvg)
        ((UGraphicSvg) ug).enlargeClip(); }                          // :56-61
public void draw(UShape shape) {                                     // :64
    if (shape instanceof ULine) drawHand((ULine) shape);
    else if (shape instanceof URectangle) ...  else if (shape instanceof UPolygon) ...
    else if (shape instanceof UEllipse) ...    else if (shape instanceof DotPath) ...
    else if (shape instanceof UPath) ...
    else getUg().draw(shape); }                                      // :64-82
public UGraphic apply(UChange change) {                              // :114
    return new UGraphicHandwritten(getUg().apply(change)); }         // :115
```
`skin/AbstractComponent.java:142-148` — EVERY rose component starts with an apply:
```java
public final void drawU(UGraphic ug, Area area, Context2D context) {
    ug = ug.apply(new UTranslate(getPaddingX(), getPaddingY()));     // :143
    if (context.isBackground()) drawBackgroundInternalU(ug, area); else drawInternalU(ug, area); }
```
`skin/rose/ComponentRoseNote.java:121-124` — the ONE shared-instance site:
```java
ug = symbolContext.apply(ug);                       // :121  fore, back.bg(), stroke
ug.draw(polygon);                                   // :122  UPath
ug.draw(Opale.getCorner(x2, roundCorner));          // :124  UPath, same instance
```
`klimt/UPath.java:186-188` `closePath()` is an empty method (no segment), so
`UPathHand` (`:66-91`) never reaches its `else { this.path = source; return; }`
arm for a note; `SEG_ARCTO` becomes a `lineTo` (`UPathHand.java:83-87`).

`skin/rose/ComponentRoseLine.java:74-108` (lifeline) and
`ComponentRoseActiveLine.java:71-105`, `ComponentRoseArrow.java:80-262`,
`ComponentRoseSelfArrow.java:67-250`, `ComponentRoseParticipant.java:86-119`,
`ComponentRoseDestroy.java:60-65`, `ComponentRoseDivider.java:79-126`,
`ComponentRoseGroupingHeader.java:125-160`, `ComponentRoseGroupingElse.java:
103-113`, `ComponentRoseReference.java:93-137`, `ComponentRoseEnglober.java:
63-71`, `ComponentRoseNewpage.java:57-64`, `ComponentRoseNoteBox.java:80-106`,
`ComponentRoseNoteHexagonal.java:85-115`, `klimt/shape/CircledCharacter.java:
65-74`, `klimt/shape/TextBlockSprited.java:69-77`, `activitydiagram3/ftile/
Worm.java:119-190` (link anchor), `sequencediagram/teoz/Blotter.java:75-100`,
`LiveBoxesDrawer.java:105-150`, `LiveBoxes.java:374-420` (`:400` per-level
`dx((level-1)*width/2)`), `MutingLine.java:73-111` (`:111`
`comp.drawU(ug.apply(UTranslate.dy(y1)), area, context)`), `LivingSpace.java:
150-167,192-212` (`:209-211` `startUrl` / `comp.drawU(ug, area, context)`),
`CommunicationTile.java:324-390`, `PlayingSpace.java:109-134`,
`PlayingSpaceWithParticipants.java:196-227`, `UGraphicInterceptorTile.java`
(a delegator that re-wraps on `apply`; it neither jiggles nor draws).

`PlayingSpaceWithParticipants.java:212-227` — the pass order, and which `ug`:
```java
UGraphic ugBody = ug.apply(UTranslate.dy(headHeight - ymin));        // :212
playingSpace.drawBackground(ugBody);                                  // :218
livingSpaces.drawLifeLines(ugBody, fullHeight, context);              // :221
livingSpaces.drawHeads(ug, context, VerticalAlignment.BOTTOM);        // :223  plain ug
if (playingSpace.isShowFootbox()) livingSpaces.drawHeads(ug.apply(UTranslate.dy(pageHeight + headHeight)), ...); // :225
playingSpace.drawForeground(ugBody);                                  // :227
```
`TitledDiagram.java:106-118` — nested diagrams inherit every skinparam:
```java
if (previous != null) this.skinParam.copyAllFrom(previous);           // :109-110
public boolean isHandwritten() { if (skinParam.handwritten()) return true; ... }  // :115-118
```
`klimt/drawing/svg/DriverRectangleSvg.java:93` — fill carries its behaviour:
`svg.setFillColor(background.toSvg(mapper), background.transparentFillBehavior())`;
`DriverPolygonSvg.java:63`, `DriverPathSvg.java:71`, `DriverEllipseSvg.java:67`
call the same `applyFillColor`. `SvgGraphics.java:521-531` `WITH_FILL_OPACITY`
assigns `fill` unfixed (the `#00000000` becomes `fill="#000" fill-opacity="0"`).

## Mechanism

Upstream draws a sequence page through ONE `UGraphic` that `TextBlockExporter`
wrapped in `UGraphicHandwritten` (`:174-175`). The decorator restarts its
`Random(424242)` at every `apply` (`UGraphicHandwritten.java:54,114-116`), so
each shape is jiggled from the stream's start unless it shares an instance with
an earlier draw; in the rose/teoz tree that happens at one place only
(`ComponentRoseNote.java:122,124`). The port builds the page as `string[]`
concatenation (`renderer.ts#drawPaginated`), draws nothing through a
`UGraphic`, and never reads `theme.handwritten` (which is already `true` for
all four fixtures, brace form included — `build-theme` run on each).

## Origin

- Java: `core/TextBlockExporter.java:174-175` (wrap), `klimt/drawing/hand/
  UGraphicHandwritten.java:54,114-116` (RNG per instance), `skin/rose/
  ComponentRoseNote.java:121-124` (the single shared instance).
- Ours: `src/diagrams/sequence/renderer.ts:335-400` (`drawPaginated`: every
  child a string from `renderBoxBackground`, `renderEventPass`,
  `renderLifelinePass`, `renderParticipantBox`, `renderFooterBox`,
  `renderLinkAnchors`), `:402-442` (`renderPaginated`); the string emitters
  `renderer-lifeline.ts:100,207,283,361`, `renderer-participant-shapes.ts:
  247-312`, `renderer-message*.ts`, `renderer-arrowhead*.ts`,
  `renderer-note.ts:150-208`, `renderer-frame-*.ts`, `renderer-divider.ts:117`,
  `renderer-link-anchor.ts:61`, `sequence-text.ts:198-206`. `grep -rIil
  handwritten src/diagrams/sequence` is empty. The decorator is complete:
  `src/core/klimt/drawing/hand/UGraphicHandwritten.ts` (instance `JavaRandom`,
  `apply` re-wraps — a faithful port); `src/core/UgDiagram.ts:139-141` wraps it
  for the klimt-exported engines.

## Causal chain

`handwritten true` → `theme.handwritten` is set but unread → shapes are string
templates → no `UGraphicHandwritten` → `<rect>`/`<line>`/straight arrowhead
`<polygon>` where the jar has jiggled `<polygon>`/`<path>` → compareSvg charges
one structural diff per site: **21 / 21 / 12 / 13** for jefoke / gepuce / pafene
/ menoke, and the jar's jiggled draws in the OUTER documents are exactly 21 /
21 / 12 / 13 (the trace counts below; menoke's trace has 25: 13 outer + 12
inside the nested image). No other attribute differs (the diff lists contain
only `rect→polygon`, `line→path`, arrowhead `@points`, and menoke's note
`@d`).

### The jar's apply/draw sequences (from the instrumented jar)

Instance ids are the trace's. "fresh" means the first (here, only) draw on an
instance created by the preceding `apply`.

**One lifeline** (pafene, participant `:Main`; trace ids 22–31; every lifeline
piece, `MutingLine.java:111`):

| step | call (Java line) | instance |
|---|---|---|
| 1 | `ug.apply(dy(y1))` (`MutingLine:111`), `LivingSpaces:166` dx | 22→23 |
| 2 | `apply(translate(padX,padY))` (`AbstractComponent:143`) | 24 |
| 3 | `apply(color)` `:77`, `apply(stroke)` `:78` | 25, 26 (= C) |
| 4 | `C.startGroup(TITLE)` `:80` (delegates) | — |
| 5 | hover: `C.apply(stroke 0)→apply(transparent)→apply(transparent(WITH_FILL_OPACITY).bg())→apply(dx((w-8)/2))` `:103-106` | 27→30 |
| 6 | **`draw(URectangle 8×h)` on 30** (`:107`) — RNG at seed | 30, fresh |
| 7 | `C.apply(dx((int)(w/2)))` `:86` | 31 |
| 8 | **`draw(ULine.vline(h))` on 31** — RNG at seed | 31, fresh |
| 9 | `closeGroup()` | — |

**One participant head** (pafene `:Main`, ids 42–50; `LivingSpace.java:211`):
`apply(dx/dy)` (`LivingSpaces:143`), `apply(padding 0,0)` (`:143` in the
component), `apply(UTranslate(margin))` `:92`, `apply(fore)` `:95`,
`apply(back.bg())` `:97`, `apply(stroke)` `:98` → **`draw(URectangle)` (fresh)**;
then `apply(UStroke.simple())` `:112`, `apply(padding.getTranslate())` `:118`,
and the text block draws `UText` on its own children (`AtomText:229`,
pass-through). With a spot (jefoke): `TextBlockSprited:72` hands the SAME `ug`
to `CircledCharacter.drawU`, which does `apply(back.bg())` → **`draw(UEllipse)`
(fresh)**, `apply(fontColor)`, `apply(translate(r,r))` → `draw(UCenteredCharacter)`
(pass-through, `UGraphicHandwritten.java:80`), then `parent.drawU(ug.apply(dx(
w+6)))`. A `collections` head calls `ug.apply(dx(4)).draw(rect)` then
`ug = ug.apply(dy(4)); ug.draw(rect)`: two fresh instances.

**One message** (pafene `m -->> jr : create`, a create message; ids 71–93):
`CommunicationTile:327` `apply(dy(gaugeMin))` → `:364` `apply(dx(x1))` → `:366`
`livingSpace2.drawHead(ug.apply(dx(width)))` draws the created head (rectangle
fresh, text) → `:370 comp.drawU(ug, area, ctx)` → padding apply `:143` →
`ComponentRoseArrow:91` `A = ug.apply(foreground)` → dressing2: `:154
A.apply(UTranslate(pos2, …))` = D → async head: `ArrowConfiguration:263
applyThicknessOnly(D)` → **`draw(ULine)` (fresh, ids 88)**, second part
**`draw(ULine)` on a second child (id 89)** → shaft `:158
applyStroke(A, style).apply(UTranslate(start,posArrow)).draw(ULine(len,0))`
(fresh, id 91) → label `:179 textBlock.drawU(A.apply(UTranslate(textPos,
yText)))` (pass-through). Self message (gepuce): `A = ug.apply(fore)` `:80`,
`ug2 = applyStroke(A)` `:81` — ONE instance that is never drawn on — and then
three `ug2.apply(UTranslate).draw(ULine.hline|vline|hline)` (`:124-126`, three
fresh children), the head `A.apply(fore.bg()).apply(dx(x1)).draw(polygon)`
(`:172`, fresh).

**One note** (menoke, `a->b` + `note right`; ids 182–187): `CommunicationTile
NoteRight:137` draws the message tile first, then `:139 apply(dy)`, `:141
apply(dx(p))`, `AbstractComponent:143`, `ComponentRoseNote:121 symbolContext.
apply(ug)` = `Fashion:77 apply(fore)`, `:81 apply(back.bg())`, `:87
apply(stroke)` → instance **187**; **`draw(UPath polygon)` on 187 (`:122`) and
`draw(UPath corner)` on 187 (`:124`)** — the corner's jiggle continues the
polygon's stream; then `UGraphicStencil` children for the text. Byte-level
proof (prototype `proto-note2`): the real `UGraphicSvg`+`UGraphicHandwritten`
drawing `Opale`'s polygon then corner on ONE instance at translate
`(57.68125, 72)` reproduces the golden's two `<path d>` strings exactly; with the
corner on a fresh instance **no** translate in `57.6805..57.6815` matches.

**Not in the decorator**: `SvgGraphics`'s constructor background rect and
`maybeDrawBorder` (`TextBlockExporter.java:169-171`, before the wrap). **In the
decorator** (trace): the warning banner (`DiagramChromeFactory$WarningBannerBlock:
235` → `TextBlockExporter:177`, ids 2–5), title/header/footer/legend blocks
(`DecorateEntityImage:119-131`, a title's border `TextBlockBordered:137` is a
jiggled `URectangle`), `LinkAnchor` snakes (`Worm:162,170,183`).

### What ours emits today, per element

| element | today (file:line) | jar |
|---|---|---|
| lifeline piece | one string: `<g><title>…</title>` + `rect(centerX-3.5,y1,8,h,{fill:'#000',fillOpacity:0})` + `line(cx,y1,cx,y2,…)` + `</g>`, absolute coordinates (`renderer-lifeline.ts:100-141`) | `<g><title>` + `<polygon … fill-opacity="0">` + `<path … fill="none">` |
| participant head | `renderParticipantBlock` string: glyph via a private one-glyph `UGraphicSvg` (`renderer-participant-symbol.ts:392-420`) or `<rect>`; spot = string `ellipse()` + `spotGlyphPath` (`renderer-participant-shapes.ts:156-186`) | rect → `<polygon>`; spot ellipse → `<polygon>`; glyph `<path>` pass-through |
| message | `renderFlatMessageArrow`/`renderSelf*` strings (`line()`, `polygon()`, `ellipse()`), label via `sequenceText` (`renderer-message.ts:133-177`) | lines → `<path>`, arrowhead `<polygon points>` jiggled |
| note | `path(polygonNormal)` + `path(corner)` strings, absolute (`renderer-note.ts:150-160`) | two jiggled `<path>`, one stream |

## Ruled out (with evidence)

- **One random stream per diagram** (`json/renderer-pen.ts`'s model). Trace: 548
  of 558 instances in the probe carry exactly one draw (the other 10 are the note pairs); in the four fixtures the
  only instances with two are menoke's two notes' (the outer note and the one
  inside the nested diagram). Every rectangle's first jiggle offsets are
  identical (gepuce `+0.035,-0.069,+0.032,+0.067` per T5b), as a restart per
  instance predicts.
- **Other sharing sites.** `grep -n 'ug[0-9]*\.draw(' skin/rose/*.java` plus the
  local-variable draws in `teoz/`, `Worm`, `USymbol*`, `Actor*`, `Boundary`,
  `Control`, `EntityDomain`: only `ComponentRoseNote:122,124` draws twice on a
  variable with no `apply` between. Confirmed by execution: in the 568-draw probe
  the only `SHARED draw#1` rows are `ComponentRoseNote:124` (10 = 5 notes × 2
  pages). (`ComponentRoseDestroy:63,64`, `GroupingHeader:132/142/147`,
  `Reference:96/122`, `Database:73,76` look adjacent but the second draw is on an
  `apply` child — traced.)
- **Draw order between shapes matters for the jiggle.** No: each shape starts at
  the seed; only the note's pair is order-sensitive (polygon, then corner). The
  port's z-order is a separate, already-correct property.
- **Absolute vs local coordinates matter for the jiggle.** The hand shapes read
  only differences (`ULine(dx,dy)`, point-to-point), so translate-in-the-chain
  and absolute points agree to the last digit except through float association;
  the prototype lifeline `<path d>` is byte-equal to the golden, the hover
  polygon equal except one 3rd-decimal digit that traces to the hand-typed
  (rounded) translate. The seam still draws in the jar's local frame because
  `ULine` has no absolute form.
- **The decorator changes extents here / owns the canvas.** `svg/@width`,
  `@height`, `viewBox` are not in any of the four diffs. The jiggled polygon
  maxima (pafene 279.745) stay under the banner-driven canvas 292.
- **A second mechanism hiding behind the tag swaps.** Strip comparison: 0
  compareSvg diffs on all four; the handwritten diffs are exactly the jiggled
  sites. Counterfactuals on the real classes (lifeline, note) are byte-exact.
- **`UGraphicHandwritten.enlargeClip`** (`:56-61`). It widens a `UClip` by 1;
  this port has no `UClip` (`UGraphicHandwritten.ts` header). The jar clips only
  multi-page bodies (`PlayingSpaceWithParticipants.java:213-216`); none of the 4
  rows is paginated. Unowned for a handwritten + `newpage` document (none in the
  corpus).
- **T5b: "menoke's embedded diagram is not handwritten".** Contradicted, see the
  findings. **T5b: banner `<rect>` only differs in shape** — true, but it means
  the banner must be drawn through the decorator (finding 4), not that it needs
  nothing.

## Per-target table

| target | jiggled draws in the jar (outer) | handwritten compareSvg diffs | stripped: jar vs port compareSvg | stripped: canonical-form residual | note |
|---|---|---|---|---|---|
| jefoke-95-jara779 | 21 (10 rect, 5 line, 4 ellipse, 2 polygon) | 21 | **0** | 4 byte lines: spot-glyph `<path>` `L26.71` vs `L26.709` (and the `C` glyph's two `Q` values), trailing space after `Z` in the jar | sub-tolerance; platform glyph outline, owner below |
| gepuce-64-pivu656 | 21 (7 rect, 10 line, 4 polygon) | 21 | **0** | **0** (65 elements) | `scale 0.5`, `shadowing true`; brace-form banner cleared by T3d |
| pafene-01-tedi758 | 12 (7 rect, 5 line) | 12 | **0** | **0** (28 elements) | create message |
| menoke-22-luxo044 | 13 (+12 inside the nested image) | 13 | **0** | 1: the nested `<image>` payload (decoded: port draws it in attribute form) | nested diagram is handwritten in the jar |

Every remaining non-handwritten difference, with owner:

1. **Attribute form** (`style="stroke:…"` vs `stroke="…"`) and **attribute order**
   (`fill` before `font-size`): present on every moved element. Owner: the moves
   themselves (T8b–T8e) — they remove it by drawing through core's drivers; it is
   the reason for finding 1.
2. **`<?plantuml-src …?>` comment** absent in the port: compareSvg ignores PIs;
   not a drive target. No owner needed.
3. **jefoke spot-glyph numerics** (`26.71`/`26.709`, 1e-3) and the `Z ` trailing
   space: `core/spot-glyph-data.ts` is a scraped outline table (4-decimal
   rounding of a platform outline: a library-forced divergence by CLAUDE.md's own
   list). Within tolerance 0.01. If T8c ports `DriverCenteredCharacterSvg` it
   should emit the jar's `Z ` (`SvgGraphics#drawPathIterator`); the numerics stay.
4. **menoke nested image payload** (after handwritten: jiggled in the jar, plain
   in the port): comparator-blind (`compare.ts:366-376` exempts href bytes). Not
   owned by any batch-8 task; it needs the nested render to inherit the enclosing
   skinparams (`EmbeddedDiagram.render(source, skinParam)` receives them,
   `index.ts:322` drops them). **Spawn a task before T8f closes** (push-forward);
   it also covers every other skinparam a `{{ }}` should inherit.
5. **`!option handwritten true`** (`UgDiagram.java:117-120`, the `sketchy` theme):
   `theme.handwritten` comes from `skinparam` only; nothing in the sequence
   pipeline reads `PreprocessingArtifact.getOptions()`. No corpus row. Owner: T8f
   should wire it or journal it as a follow-on.
6. **Title/legend/mainframe borders under handwritten** (`TextBlockBordered:137`
   is jiggled in the jar): `core/annotations/chrome*.ts` are string splices. No
   corpus row has chrome with handwritten. Journal as a follow-on, not T8.

Rows 1–3 need no spawned task; 4 needs one (or an explicit ruling that nested
payload bytes stay a declared divergence, which `class-nested-diagram-renderer`
D9 already says for the encoding); 5–6 are out-of-corpus follow-ons.

## Findings that change the plan (decisions the orchestrator must take)

### F1. Stop 7 as worded (byte-identical hashes) cannot pass T8b–T8e

Evidence: `core/svg.ts#line/rect/polygon/path/ellipse` write presentation
attributes; core's drivers write the jar's form. Side by side on gepuce
(stripped), the same elements differ only as `stroke="#181818" stroke-width="0.5"`
vs `style="stroke:#181818;stroke-width:0.5;"`, and `<text x y font-size fill>` vs
the jar's `<text x y fill font-size>`. Drawing a line through `UGraphicSvg`
yields the jar form (prototype). `plans/…/tools/svg-hashes.mts` hashes the raw
string, so the first moved element flips every row that has one.

Measured fix: a canonical form — drop `<?plantuml-src?>`, expand each tag's
`style="k:v;…"` into attributes, sort the attributes — applied to both sides.
Port vs jar (stripped): **gepuce 65/65 and pafene 28/28 elements canonically
identical**; jefoke 4 (spot glyph) and menoke 1 (nested payload) differ for the
causes above, not for form. It is insensitive to nothing that renders
differently (element order, tag, every value, text, ids all remain).

Recommendation (orchestrator's call; the tools directory is its): add
`svg-hashes.mts --canon` with exactly that transform, snapshot canonical hashes
once from the pre-T8b tree, and amend stop 7 for T8b–T8e to *canonical sequence
hashes identical and raw all-engine hashes identical for every non-sequence
engine*. The raw sequence hash then moves by design and is reported, not gated.
Rejected alternative: a string-sink `UGraphic` over today's emitters (raw gate
passes by construction) — it is a second SVG driver set, a structural divergence
the port rules forbid, and it cannot host T8g's `ensureVisible` fold.

### F2. Text, images and links go through the seam

One `UGraphicSvg` per page is what makes T8g's fold (`maxX`/`maxY`) reachable and
what keeps document order. Anything left as a string cannot be interleaved with
drawn shapes. `UText` through `DriverTextSvg` (`ug.apply(UTranslate(17,27.889))
.draw(UText.build(':Main', fc))` with the layout measurer) produces
`<text x="17" y="27.889" fill="#000" font-size="14" textLength="34.213">` — the
jar's order, ours' values, canonically equal to `creoleRunText`'s output
(prototype). `core/svg.ts#text`, `sequence-text.ts#sequenceText` and `shapeSvg`
become dead once the last mover lands (T8e deletes them).

### F3. Core prerequisites, with their gates

Each is a pure addition proven neutral to every other engine by the raw
all-engine hash (no other engine reaches the new paths):

| gap | evidence | needed by |
|---|---|---|
| `UGraphicDelegator` forwards no `startGroup`/`closeGroup` (`UGraphicDelegator.ts:17-35` drops them; `u-graphic-svg.ts:237` has them) | `ComponentRoseLine:80` / `ActiveLine:78` open a titled group under the decorator | T8b |
| `HColors.transparent(TransparentFillBehavior)` / `HColorSimple.transparentFillBehavior` not ported (`HColorSimple.ts:25-27`); `Paint` has no representation (`driver-rectangle-svg.ts` header); `svg-graphics-core.ts:312-320` already honours `WITH_FILL_OPACITY` | the lifeline hover rect: jar `fill="#000" fill-opacity="0"` on a `<polygon>` (`pafene` golden) via `DriverPolygonSvg:63` → `applyFillColor` | T8b |
| `UCenteredCharacter`, `CircledCharacter`, `DriverCenteredCharacterSvg` not ported (`driver-svg-stubs.ts`, `DisplayCreole.ts:33`); the spot is a string today | `CircledCharacter.java:65-74`; the trace's `UCenteredCharacter` draws are pass-through | T8c |
| `SvgGraphicsCore.maxX/maxY` private, `ensureVisible` protected (`svg-graphics-core.ts:95-96,178`) | T8g | none: read the root `viewBox` through `extractViewBoxDims` (`document-shell-fragment.ts:40`), exact at scale 1 |

### F4. The decorator scope

Inside: banner, title/header/footer/legend/mainframe blocks, the diagram. Outside:
`SvgGraphics`'s background rect and `maybeDrawBorder`. T8e's "document chrome
stays plain" is right for `renderer-document.ts`'s background and border and
wrong for everything `core/annotations/` composes. For the four fixtures only the
banner matters: `core/skinparam-warnings.ts#withWarningBanner` draws it in a
private klimt document with no decorator, which is the `rect[1]` in every
handwritten diff (T5b). T8f must wrap that drawable too (core, all-engine gated).

### F5. Nested `{{ }}` is handwritten in the jar

The golden's decoded nested SVG carries jiggled `<polygon>`/`<path>`
(`menoke`, ids 86 in the trace are the nested diagram's note, a second root
decorator). `TitledDiagram.java:109-110` copies every skinparam of the enclosing
diagram into the nested one. The note's own text says the opposite; the Java
wins. The nested render in the port goes through `renderSync(source, options)`
and drops the skinparam argument (`index.ts:322`).

## The seam design (interface contract for T8b–T8e)

```ts
// src/diagrams/sequence/renderer-ug.ts  (new, landed by T8b)
export interface SequenceGraphic {
  /** The page's drawing context: a core `UGraphicSvg`, wrapped in
   *  `UGraphicHandwritten` when `theme.handwritten` (T8f). */
  readonly ug: UGraphic;
  /** Serialise once: `extractFlatContent(getSvgString())`, the minted shadow
   *  filter dropped and re-pointed at `sequenceShadow`, gradients hoisted (the
   *  `renderer-participant-symbol.ts#glyphContent` logic, generalised), and the
   *  `ensureVisible` fold read from the root `viewBox` (T8g). */
  finish(): { readonly body: string; readonly extraDefs: string; readonly maxX: number; readonly maxY: number };
}
export function openSequenceGraphic(
  theme: ScaledTheme,
  minDim: { readonly width: number; readonly height: number },
): SequenceGraphic;

/** Migration bridge, T8b–T8e only: draw one region on a throwaway graphic and
 *  return its markup. Deleted by T8g with the `render*` wrappers. */
export function drawToString(theme: ScaledTheme, draw: (ug: UGraphic) => void): string;

// every moved module exports, per element kind:
export function draw<X>(ug: UGraphic, geo: <X>Geo, theme: ScaledTheme): void;
```

How the pieces behave:

- **One graphic, one document.** `UGraphicSvg.build(seed, basicSvgOption({ scale:
  1, minDim }), VERSION_PLACEHOLDER, driverBounderOf(theme.measurer),
  theme.measurer)` — `renderer-participant-symbol.ts:392-404` already does this
  per glyph. `scale` is always 1: the page is drawn at `DRAW_SCALE = 1`
  (`renderer.ts:332`), so `theme.scaleK` is 1 and "paint scaled at emission" is
  an identity at the seam; the export scale stays the exporter's single
  `SvgGraphics#format` pass.
- **`withDeferredFormat`** (`svg-format.ts:70-135`, `renderer.ts:409`) is a
  module-level flag read by `formatDecimal`, which `SvgGraphicsCore#format`
  calls at draw time. Every `draw*` therefore runs, and `finish()` is called,
  inside the existing `withDeferredFormat(deferred, …)` scope. The deferred body
  is then multiplied by `exportTo`'s `scaleActivityBody`; its regexes cover `x y
  width height rx ry font-size textLength points d style` plus `cx cy x1 y1 x2
  y2 stroke-dasharray` (`TextBlockExporter.ts:168-269`), which is every
  attribute the drivers write, in both `style` and attribute forms. Jiggled
  coordinates are lossless doubles when deferred, so gepuce's `scale 0.5`
  multiplies the same numbers `SvgGraphics#format(x * scale)` would
  (T5b: jiggle in unscaled space, decorator inside the scale).
- **The chain rule** every `draw<X>` obeys: shapes are drawn as `ug…apply(…)
  .draw(shape)` with an `apply` last, in the jar's local frame — `ug.apply(
  UTranslate(x, y)).apply(Fore).apply(Back).apply(UStroke).draw(new
  ULine(dx, dy) | URectangle.build(w, h) | …)`. The ONE exception is the note:
  `const f = fashion(ug); f.draw(polygon); f.draw(corner)` on the same variable.
- **Text**: `drawRun(ug, run, ambient, dy?)` in a new `renderer-text.ts` (T8c)
  builds the `FontConfiguration` from the run's fields (`bold`, `italic`,
  `color`, `fontFamily`, `fontSize`, `decoration`, `textBackColor`,
  `extraLines`, `svgAttributes`) and draws `UText.build(run.text, fc)` at
  `(run.x, run.y + dy)` — the untrimmed text at the layout x: the driver does its
  own leading-space shift and trim (`DriverTextSvg.java:113-126`), the same
  function layout used for `drawDx`/`drawWidth`. Images: `UImage`; url:
  `ug.startUrl/closeUrl` (`UGraphicSvg.ts` already ports them) in place of
  `linkWrap`; a `shape` run: the run's recorded `apply` chain + `draw(shape)`.
- **Bridges while the page is part strings, part graphic.** `drawPaginated`
  keeps concatenating; each region a mover converts becomes
  `children.push(drawToString(theme, (ug) => draw…(ug, …)))`. Each region is its
  own `UGraphicSvg`, so ids minted by `SvgGraphics` are normalised in
  `finish`'s shared helper (as `glyphContent` does today) and the existing
  `collectDocumentDefs` collapses duplicates. After T8e the page is ONE
  `openSequenceGraphic(...)` and the bridges are dead (T8g deletes them).
  A moved module keeps its old string-returning export as a one-line bridge
  (`renderX = (…) => drawToString(theme, (ug) => drawX(ug, …))`) for callers
  not yet moved; the exception is `renderCreatedHead`, called from
  `renderer-message.ts` (T8d's file), which T8c leaves as a bridge and T8d
  replaces with `drawCreatedHead`.
- **Hash gate per move**: raw all-engine hashes identical for every non-sequence
  engine (4903 renders, `svg-hashes.mts --all`), and the sequence rows
  canonically identical (F1) on BOTH paths (ratchet and `renderSync`), 1143 rows;
  the raw sequence hash moves and is listed. Decision needed on F1 first.

### Per-element ordered chains (what each `draw<X>` must do)

Sources are the trace chains above and the rich probe; "fresh" = first draw on a
new instance.

| element (module) | chain (jar) | shapes |
|---|---|---|
| lifeline piece (`ComponentRoseLine`) | `translate(cx, y1)` → `fore`,`stroke` = C; `C.startGroup(TITLE)`; hover `C.apply(UStroke 0).apply(Fore transparent).apply(Back transparent(OPACITY)).apply(dx((1-8)/2))` → URectangle(8,h) iff h>0; line `C.apply(dx(trunc(1/2)=0))` → ULine.vline(h); `C.closeGroup()` | 2, each fresh |
| delay line (`ComponentRoseDelayLine`) | `translate` → `stroke` → `fore` → `apply(UAntiAliasing.OFF)` → `apply(dx(0))` → vline; no group | 1 fresh |
| activation bar (`ComponentRoseActiveLine`) | `translate(-5 + (level-1)*5, ya)`; `startGroup(TITLE "")`; `F = ug.apply(fore)`; closed: `F.apply(back.bg()).apply(dx(x))` → URectangle(10,h) (+`setDeltaShadow(1)`); open: `F.apply(back.bg()).apply(back).apply(dx(x))` → rect, `F.apply(dx(x))`/`F.apply(dx(x+10))` → vline, `F.apply(dx(x))` / `F.apply(UTranslate(x,h))` → hline; `closeGroup()` | 1–5 fresh |
| destroy cross (`ComponentRoseDestroy`) | `X = ug.apply(stroke).apply(fore)`; `X.draw(ULine(18,18))`; `X.apply(dy(18)).draw(ULine(18,-18))` | 2 fresh (first on X, second on its child) |
| participant box (`ComponentRoseParticipant`) | see the participant table above; glyph kinds: `Actor/Boundary/Control/Entity/Database/Queue` call the core glyph's `drawU(ug.apply(dx(delta)[,dy]))` (`ComponentRoseDatabase:90-93`); text BEFORE glyph for those kinds, glyph/rect first for `participant`/`queue`/`collections` (the port already orders so) | rect fresh; glyph shapes fresh per `ug.apply(…).draw` in the ported `USymbol*` / `Actor*` (verified: core mirrors `drawDatabase:73-77`) |
| spot (`CircledCharacter`) | `ug.apply(back.bg())` → UEllipse; `ug.apply(fontColor).apply(translate(r,r))` → UCenteredCharacter | ellipse fresh; glyph pass-through |
| head url | `ug.startUrl(url)`; `comp.drawU(ug, area, ctx)`; `ug.closeUrl()` (`LivingSpace:209-211`) | — |
| flat arrow (`ComponentRoseArrow`) | `translate(dy gaugeMin)`, `translate(dx x1)`, padding; `A = ug.apply(fore)`; dressing1 `A.apply(UTranslate(pos1, posArrow+incl1))` = D1: NORMAL → `D1.apply(fore.bg())` → UPolygon (reverse form); ASYNC → `thicknessOnly(D1)` → ULine.rotate ×≤2; CROSSX → `D1.apply(UStroke 2)` then `apply(UTranslate)` → ULine ×2; CIRCLE → `D1.apply(UStroke 1.5).apply(fore).apply(back.bg()).apply(UTranslate)` → UEllipse; dressing2 symmetric on `pos2`; shaft `applyStroke(A, style).apply(UTranslate(start, posArrow))` → ULine(len,0) (or `drawLine` for inclined); label `A.apply(UTranslate(textPos…))` | every shape fresh |
| self arrow (`ComponentRoseSelfArrow`) | `A = ug.apply(fore)`; `ug2 = applyStroke(A)` (never drawn on); three `ug2.apply(UTranslate).draw(ULine.hline|vline|hline)`; heads `A.apply(fore.bg()).apply(dx(x1)).draw(polygon.translate(0, textHeight))`; async/cross as above | every shape fresh |
| multicast (`CommunicationTile:373-390`) | `ug.apply(dy(posArrow)).apply(dx(min(x1,x2))).apply(dy(dy))` → arrow component | as flat arrow |
| label padder (`Padder`) | not read by T8a: **T8d reads `Padder.java:128-131`** and records its chain | 1 rect |
| note (`ComponentRoseNote`) | `ug.apply(dy)`, `apply(dx(p))`, padding; `f = fashion.apply(ug)` (fore, back.bg(), stroke); **`f.draw(UPath polygon)`, `f.draw(UPath corner)`** (shared); body text on stencil children | 2 on ONE instance |
| note box / hexagon | `f = fashion.apply(ug)`; `f.draw(URectangle.rounded)` / `f.draw(UPolygon)` | 1 fresh |
| connector (`CommunicationTileNoteBottomTopAbstract:130`) | `ug.apply(UTranslate(x1,y1)).apply(color).apply(UStroke(2,2,1))` → ULine; BOTH passes (`:70-79`) | 1 fresh |
| frame (`ComponentRoseGroupingHeader`) | background pass: `Blotter` bands `ug.apply(color).apply(color.bg()).apply(dy(y))` → URectangle|UPath each fresh (`Blotter:82`), then `symbolContext.applyStroke(ug).apply(fore)` → `ug.apply(background.bg())` → URectangle (`:129-133`); foreground: `symbolContextCorner.apply(ug)` → UPath corner (`:142`), `symbolContext.applyStroke(ug).apply(fore)` → URectangle (`:147`); texts | each fresh |
| else (`ComponentRoseGroupingElse`) | `ArrowConfiguration.stroke(ug,2,2,1).apply(groupBorder)`; `ug.apply(dy(1))` → ULine.hline; text | 1 fresh |
| ref (`ComponentRoseReference`) | `symbolContextBody.apply(ug)`; `.apply(dx(xMargin))` → URectangle; `symbolContextHeader.apply(ug)`; `.apply(dx(xMargin))` → UPath corner; texts | 2 fresh (different instances) |
| divider (`ComponentRoseDivider`) | `ug.apply(back.bg())`; `drawSep(ug.apply(dy(h/2)))`: `ug.apply(background)`, `apply(dy(-1))` → URectangle(w,3) under `UStroke.simple()`; `apply(UStroke(t/2)).apply(border)` → `apply(dy(-1))`, `apply(dy(2))` → ULine ×2; labelled: `rect` `ug.apply(xpos,ypos)` | each fresh |
| newpage (`ComponentRoseNewpage`) | `apply(stroke).apply(fore)` → ULine.hline | 1 fresh |
| box (`ComponentRoseEnglober:65-71`) | `symbolContext.apply(ug)` → URectangle; text | 1 fresh |
| link anchor (`Worm`) | `ug.apply(color).apply(color.bg()).apply(stroke)`; shaft `ug.apply(translate(x1,y1))` → ULine; head `ug.apply(UTranslate.point(p)).apply(UStroke.simple())` → UPolygon ×2 (`Worm:162,170`); label; drawn in BOTH passes | each fresh |

## Per-move write-sets (disjoint; `renderer.ts` is the serial seam file)

Every move: its tests; a 500-line pure-move split of a file it already owns
(journaled); gates = F1's amended stop 7 + targeted vitest +
`tests/oracle/svg-conformance/sequence.*` + typecheck + eslint; coverage 90/90/90
on what it touches. The first four moves change no row's classify score (the
ratchet and compareSvg are form-insensitive).

- **T8b — lifelines + live boxes + the seam.** New `renderer-ug.ts`
  (`openSequenceGraphic`, `drawToString`, the id normaliser lifted from
  `renderer-participant-symbol.ts#glyphContent`); `renderer-lifeline.ts`
  (`drawLifeline`, `drawLifelineSegments`, `drawDelayLine`, `drawActivation`,
  `drawOpenBar`, `drawCross`, `drawDestroyCrosses`, `drawLifelinePass`;
  `renderDestroyCrosses` stays a bridge for the foreground event pass);
  `renderer.ts` step 2 (`:362-369`) only; core prerequisites:
  `core/klimt/drawing/UGraphicDelegator.ts` (forward `startGroup`/`closeGroup`
  by duck typing, as `startUrl`/`closeUrl`), `core/klimt/color/HColors.ts` +
  `HColorSimple.ts` + `core/paint.ts` + `core/klimt/drawing/svg/driver-rectangle-
  svg.ts` (the `WITH_FILL_OPACITY` colour). Reads `Padder`-free: `MutingLine`,
  `LiveBoxes`, `LiveBoxesDrawer`, `ComponentRoseLine/ActiveLine/DelayLine/
  Destroy`.
- **T8c — participants + the text drawer.** `renderer-participant-shapes.ts`
  (`drawParticipantBox`, `drawFooterBox`, `drawCreatedHead`; `renderCreatedHead`
  remains a bridge), `renderer-participant-symbol.ts` (draw into the seam `ug`;
  delete `renderParticipantSymbol`'s private document and its
  `glyphContent`), new `renderer-text.ts` (`drawRun`), new core
  `klimt/shape/UCenteredCharacter.ts`, `klimt/shape/CircledCharacter.ts`,
  `klimt/drawing/svg/driver-centered-character-svg.ts` (table-driven from
  `core/spot-glyph-data.ts`, `Z ` as the jar writes it), `u-graphic-svg.ts`
  (register), `driver-svg-stubs.ts` (stub removed); `renderer.ts` steps 3–4
  (`:371-391`) only. The heaviest move (text + spot + glyph + url): split into
  T8c1 (boxes, glyph kinds, urls) and T8c2 (labels, spot, badges) if the
  canonical diff is not readable in one piece.
- **T8d — messages.** `renderer-message.ts` (`drawMessage`, `drawMulticast`,
  `drawMessageLabel`, `drawLabelPadder`, switch `renderCreatedHead` →
  `drawCreatedHead`), `renderer-message-self.ts`, `renderer-arrowhead.ts`,
  `renderer-arrowhead-glyph.ts` (head polygons as `UPolygon` in the jar's local
  frame: `getPolygonNormal/Reverse`, `translate(0, textHeight)`; asynchronous
  heads as `ULine.rotate`); `renderer.ts`: the `'message'` arm of
  `renderForeground` (`:245-246`) and `renderEventPass` only. Must read
  `Padder.java` and `ComponentRoseArrow.java:80-262`, `ComponentRoseSelfArrow.
  java:67-250`.
- **T8e — notes, frames, divider, link anchor, newpage, delay, box, ref, and the
  final composition.** `renderer-note.ts` (`drawNote`, `drawNoteBackground`,
  `drawConnector`, `drawBoxBackground`; `UPath` builders for `Opale.
  getPolygonNormal/getCorner`, `Opale.java:134-171`, with `arcTo` kept so
  `UPathHand` can turn it into a `lineTo`), `renderer-frame-header.ts`,
  `renderer-frame-blotter.ts`, `renderer-divider.ts`, `renderer-link-anchor.ts`,
  `renderer-document.ts` (only its drawn-extent seed; background + border stay
  strings, `finalizeSequenceBody`), `sequence-text.ts` (delete `sequenceText`,
  `shapeSvg`), and `renderer.ts` in full (`creoleRunText`, `styledRunsText`,
  `renderRefBody`, `renderFrame*`, `renderElse`, `renderNewpage`,
  `renderDelayText`, `renderEvent*`, `drawPaginated`): after this move
  `drawPaginated` is one `openSequenceGraphic` and a sequence of `draw…(g.ug, …)`
  calls in the five-pass order (`PlayingSpaceWithParticipants.java:218-227`).
  Likely 500-line split of `renderer.ts` into `renderer-events.ts` (pure move,
  journaled).
- **T8f — enable.** See below; write-set `renderer-ug.ts`, `core/skinparam-
  warnings.ts`, `diagrams/sequence/sequence-warnings.ts`, `diagrams/sequence/
  index.ts`, `tests/oracle/svg-conformance/render-fixture-sequence.ts` (the
  plugin mirror), the nested-renderer seam if the nested task is not spawned,
  unit tests pinning a jiggled coordinate and the note pair to the golden.
- **T8g — fold + cleanup.** See below; plus deletion of every bridge.

## T8f enablement point

- **Where it wraps.** Inside `openSequenceGraphic`, after the root graphic exists
  and before any draw: `ug = svg; if (theme.handwritten === true) ug = new
  UGraphicHandwritten(ug)` — `TextBlockExporter.java:174-175`'s position (after
  the margin; the margin here is baked into the geometry, and the jiggle is
  translation-invariant, so no translate is needed before the wrap).
  `UgDiagram.ts:139-141` is the same statement for klimt-exported engines; the
  sequence tail is the string-composing `exportTo(fragment, body)`, so the wrap
  cannot live there.
- **How `theme.handwritten` reaches it.** `Theme.handwritten` (`theme.ts:157`) is
  already true for all four fixtures (`skinparam-theme-builder.ts:71`, brace form
  included; verified). `drawPaginated(geo, theme, measurer)` → `scaleSequenceTheme`
  → `ScaledTheme` carries it; `openSequenceGraphic(theme, …)` reads it.
- **Outside the wrap**: `renderer-document.ts`/`assemble-svg-sequence.ts`'s
  background rect and border (`TextBlockExporter.java:169-171`). **Inside**: the
  page, and the banner — `withWarningBanner(fragment, warnings, measurer, margin,
  uid)` gains a `handwritten` flag and its drawable does
  `let g = ug.apply(UTranslate(margin.left, margin.top)); if (handwritten) g =
  new UGraphicHandwritten(g)` (jar: ids 1→2…5 in the trace). Callers:
  `sequence-warnings.ts#withSequenceWarningBanner`, `sequence/index.ts:62,76`,
  and the harness mirror.
- **Nested `{{ }}`**: pass the enclosing `handwritten` (and the other skinparams)
  into the nested `renderSync` through `EmbeddedDiagram.render(source,
  skinParam)`'s argument; byte-only, so unit-test the decoded payload.
- **Acceptance evidence available now**: the four traces give the exact
  expected instance topology; the golden `in.svg` values are the byte targets.

## T8g fold

`openSequenceGraphic` seeds `minDim` with `(geo.totalWidth, geo.totalHeight)` —
the jar's `option.withMinDim(dim)` (`TextBlockExporter.java:284`), which
`ensureVisible`s to `trunc(dim)+1` exactly like `canvasOf` today. `finish()`
returns `maxX/maxY` from the root `viewBox` (`extractViewBoxDims`; scale 1).
`renderPaginated` then sets `width/height` from them instead of
`canvasOf(geo)`; `finalizeSequenceFragment` (`assemble-svg-sequence.ts:167-176`)
is unchanged (`Math.trunc`). Two couplings the design must carry, because the
page is shifted after it is drawn: (1) the exporter margin — draw under
`ug.apply(UTranslate(m.left - 5, m.top - 5))` so the fold sees final
coordinates, leaving `withExporterMargin` as dimension bookkeeping only;
(2) banner and chrome shift the body (`skinparam-warnings.ts:144`,
`annotations/chrome*.ts`) — the fold must travel with the body as
`RenderFragment.drawnMax{X,Y}` (core `dispatcher-types.ts`), shifted wherever
`shiftFragmentBody` shifts, and the finalize takes `max(seed composed from chrome
and margin, drawn fold)`. kaluna and gebeki (no chrome) are the acceptance rows;
the closed forms are in `drawn-extent.md`. Fallback if T8b–T8e cannot land: the
body-walk fold in that artifact, unchanged.

## Confidence

| section | level | backing |
|---|---|---|
| Mechanism (jar: wrap + per-instance RNG) | HIGH | source read; byte-identical instrumented render of all four goldens |
| Topology (every shape fresh; note shares) | HIGH | 3 traces + 568-draw probe + exhaustive source grep; byte-exact lifeline and note prototypes |
| Strip comparison (0 diffs) | HIGH | `compareSvg` on four fresh jar renders |
| F1 (form vs hash) and the canonical gate | HIGH on the cause, MEDIUM that the canonical gate suffices for every row | demonstrated on 2 fixtures exactly; not run on all 1143 (the tool does not exist) |
| F2 (text through `UText`) | MEDIUM | one run prototyped; styled/linked/leading-space/`<math>` runs unproven |
| F3 prerequisites | HIGH that they are missing, MEDIUM on their size | greps + ports read; `Paint` change not designed |
| F5 (nested is handwritten) | HIGH | decoded golden payload + `TitledDiagram.java:106-118` |
| Per-element chains | HIGH (traced) except `Padder` (not read) and `ComponentRoseReference` header/body split (traced once) | listed |
| Write-sets and move order | MEDIUM | file-level reading; T8c/T8d/T8e may need the splits named |
| T8g coupling design | MEDIUM | design from `drawn-extent.md` + the shift sites; not prototyped |

## Unexplained / next instrumentation

- **End-to-end exactness is inferred, not measured.** T5b pushed the port's
  primitives through the decorator (all four rows numerically exact); I measured
  the lifeline and note byte-exactly and the topology exhaustively. The first
  point where a moved port could still depart is float association in a long
  translate chain (jar sums ~12 `UTranslate`s, `AbstractCommonUGraphic.apply`
  `compose`); the prototypes cannot show it. Next instrument: after T8b, diff
  the real lifeline `points` against the golden at full precision.
- **`HColors.transparent(WITH_FILL_OPACITY)` through `Paint`** is the one core
  design with no precedent here; the golden proves what it must emit
  (`fill="#000" fill-opacity="0"` on a polygon, no `style`), not how `Paint`
  carries it.
- **`Padder` (`teoz/…`) and `UAntiAliasing`**: not read; the antialias `apply`
  creates a fresh instance and changes nothing drawn.
- **Handwritten + `newpage`**: `enlargeClip` and the jar's clip-based pagination
  (`PlayingSpaceWithParticipants.java:213-216`) vs the port's geometric
  pagination are untested together. No corpus row.
- **Creole-drawn shapes** (`----`, tables, vector sprites) replay as
  `apply(translate).apply(fore).apply(back).apply(stroke).draw(shape)` — fresh per
  shape. Whether any creole atom draws two shapes on one instance is not read
  (`AtomHorizontalTable`, `CreoleTable`); the probe has no such atom.

## Reproduction

```
# jar topology (scratch, outside the repo)
javac -cp oracle/dist/plantuml-oracle.jar -d cls <patched UGraphicHandwritten.java>
java -DPLANTUML_DETERMINISTIC_TEXT=true -cp cls:oracle/dist/plantuml-oracle.jar \
     net.sourceforge.plantuml.Run -tsvg -o . in.puml 2> trace.txt
# stripped renders
scripts/oracle-render.sh $PWD/plans/sequence-divergence-drive-3/diagnosis/handwritten-stripped/<slug> <slug>/in.puml
```
`compareSvg` on the port's render of each stripped `in.puml` against its `in.svg`:
0 diffs ×4. Handwritten originals: `npx tsx plans/sequence-divergence-drive-3/tools/
diff-one.mts <slug>` → 21 / 21 / 12 / 13 lines.
