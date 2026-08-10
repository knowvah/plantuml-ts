# A5 ledger — per-fixture accounting for json / yaml / hcl

Originally T9's deliverable. **Re-measured 2026-08-09** after M2/M3/M4 landed
(the "structure pass"): every one of the 92 fixtures appears exactly once in
the index below, against a numbered mechanism. Measured with
`renderFixtureJson` + `compareSvg(…, 'deterministic')`.

## Outcome

| | at Batch 4 close | after the structure pass |
|---|---|---|
| fixtures | 92 | 92 |
| byte-conformant | 0 | **17** (10 json, 6 yaml, 1 hcl) — pinned |
| **element tally exact vs jar** | **0** | **75 / 92 (82 %)** |
| fixtures whose interior is COMPARED at all | 0 | 75 |
| total diffs | unmeasurable (all floors) | 13,178 |

Diff composition, now that there is one to compose:

| bucket | diffs | what it is |
|---|---|---|
| geometry (any numeric delta) | 12,804 | **M1** — the accepted layout divergence |
| value-text colour | 0 | was 957; the per-type divergence was retired and now matches upstream |
| document dimensions | 366 | **M1** again, at the root |
| everything else | 244 | the real remainder — 17 fixtures, all named below |

## The bar, redefined — this family is gated STRUCTURALLY

Maintainer decision, 2026-08-09, taken on the M1a measurement below.

A byte-exact bar measures something this family has decided not to control.
Of ~20,028 diffs across the corpus, ~19,760 are the accepted ADR-2b layout
divergence restated once per coordinate. That is not a conformance signal; it
is noise deep enough to hide real defects — and it did, for a whole mission.

The gate is now **structural**: every diff EXCEPT positional geometry. Same
elements, same order, same sizes, colours, fonts, weights, text and
`textLength` — everything the port controls once the engine has placed things.

- `tests/oracle/svg-conformance/json-family-structural.ts` — the metric, and
  the exclusion set with its rationale.
- `tests/oracle/svg-conformance/json-family-structural.test.ts` — the gate.
- `oracle/goldens/json-family-structural.json` — the shrink-only manifest.

**73 of 92 fixtures pass it today.** Reading fixtures straight from the
committed `test-results/dot-cache/`, so no goldens are duplicated.

Deliberately NOT excluded: node `width`/`height`, `rx`/`ry`, and every style
attribute. Sizing is this port's own and measured exact per node, so a
regression there must fail. Only PLACEMENT is out of scope.

Verified non-vacuous rather than assumed: changing `JSON_SKIN_BLACK` by one
digit fails 65 fixtures, and moving `CELL_MARGIN_X` from 5 to 6 fails 71.

Known limitation, stated rather than hidden: `points` and `d` are excluded as
position-bearing, so a defect in a path's SHAPE that changes no other
attribute would not be caught. The element tally still constrains how many
paths exist, and mission H1's handwritten output was verified against raw
bytes instead.

### The structural backlog — 266 diffs over 19 fixtures

What the reframing surfaces. Every one of these is a real gap in something
this port controls, previously buried under the geometry noise:

| diffs | attribute |
|---|---|
| 36 | `rect/@stroke-width` |
| 32 + 32 | `rect/@rx`, `rect/@ry` |
| 23 | `text/@textLength` |
| 22 | `text/@font-size` |
| 21 + 21 | `ellipse/@fill`, `ellipse/@stroke` |
| 17 + 13 | `rect/@width`, `rect/@height` |
| 12 | `line/@stroke-width` |
| 6 + 4 | `text/@font-family`, `text/@font-weight` |
| 3 + 3 | `rect/@fill`, `rect/@stroke` |
| 2 | `svg/@background` |

Worst fixtures: `json/timafu-94-bixe774` (47), `yaml/nuzaje-74-kenu009` (47),
`json/vogeku-38-soxe333` (28), `json/bitepo-72-vija933` (23). The shape of it —
thicknesses, corner radii, fonts and fills — reads as style resolution rather
than layout, which is the same surface mechanisms 3, 6 and 8 came from.

## A claim this file made, and how it was falsified

An earlier revision of this section argued that byte-conformance was **not
reachable** for the family: M1 moved the root dimensions on every fixture, the
per-type value colouring moved the text on most, and therefore a zero-diff
ratchet could never admit anything.

Both premises turned out to be soft.

- The value colouring was a divergence whose own justification did not survive
  measurement (all 20 built-in themes already discarded it). Retired; matched.
- **M1 was two mechanisms wearing one label.** Per-axis measurement: width
  varied (the real engine divergence), height was a constant +2 on 70 of 92 —
  which no layout difference explains. The height half was a defect in this
  port's document-dimension formula. Diagnosed and fixed (M1b).

13 fixtures are now byte-conformant. The lesson is the reusable part: **an
accepted divergence is a comfortable place for a defect to hide,** because
every diff it touches is pre-excused. Measure a divergence per axis, per
mechanism, before trusting it to explain anything.

The **element tally** (same elements, kinds, order — 0 → 75 of 92 this
session) remains a useful secondary metric for the fixtures M1a still blocks,
but it is no longer needed as a *substitute* gate.

## What the structure pass changed

M2, M3 and M4 are closed. Their joint effect was larger than the three
mechanisms themselves, because `compare.ts` stops recursing at a structural
mismatch: with the root mismatched on all 92 fixtures, **no fixture's interior
had ever been compared** and every previous diff count in this file was a
floor. That is why the total diff count went UP. It is the first honest number
this family has had.

Ported alongside them, each traceable to a branch rather than to a
measurement:

- `TextBlockJson#drawU`'s own draw order, element for element — highlight rect,
  top separator, column A, column B, per-row divider; node rect drawn first
  filled and last stroked (`TextBlockJson.java:260-320`).
- The column divider is drawn **per row**, spanning that row's height, inside
  `if (line.b2 != null)` (:310-314) — not one full-height line per node.
- `rx`/`ry` are `RoundCorner / 2` (`DriverRectangleSvg.java:78`). Was `rx="10"`.
- Text is positioned by an absolute baseline and carries `textLength`; no
  `dominant-baseline`, no `text-anchor` (`HorizontalAlignment#draw`).
- A nested cell's display string is `"   "`, three spaces — `getShortString`
  falls through to it (:194). It is drawn AND measured; this port had `''`.
- A whitespace-only label has its spaces swapped for NBSP *before* measurement
  (`DriverTextSvg.java:115-116`, guarded by `matches("^\\s*$")` — ordinary
  labels keep real spaces). This is why the jar writes `textLength="11.55"`
  for a cell whose ASCII-space width is 0.
- This family's black: `skin/plantuml.skin:446` sets `FontColor black` /
  `LineColor black` for `yamlDiagram,jsonDiagram`. The port had the global
  `#181818`.
- Removed: the per-node `<clipPath>` and the key-column background rect (the
  jar has zero clipPaths here and `drawU` paints no such column), and the
  arrowhead `<marker>`. With all three gone the renderer generates **no ids at
  all**, so the id-determinism machinery went with them.

## Mechanisms

| # | mechanism | class | origin | fixtures |
|---|---|---|---|---|
| M1a | Horizontal layout geometry | **ACCEPTED DIVERGENCE** (ADR-2b) | upstream is Smetana-laid-out; this port uses dot-engine everywhere | 92 |
| M1b | Document-dimension formula, constant +2 per axis | **CLOSED** — oracle-instrumented, fixed | `json/layout.ts#documentDimensions` now mirrors the ink-walk → margins → truncating-`+1` chain | 0 |
| M2 | Root had many children; the jar has 2 | **CLOSED** | `json/renderer-shell.ts#assembleJsonShell` now wraps the body in one content `<g>` | 0 |
| M3 | `<defs>` carried an arrow `<marker>`; the jar's is empty | **CLOSED** | arrowhead is an inline filled `<path>` — `Arrow#drawArrow`, ported into `JsonCurve.ts#buildArrowHeadPath` | 0 |
| M4 | Root `<g>` attributes never applied | **CLOSED** | consequence of M2; `withRootGroupAttributes` now sees the single `<g>` it requires | 0 |
| M5 | Value text colour | **CLOSED** — matched to upstream, divergence retired 2026-08-09 | `renderer-style.ts`; DIVERGENCES.md entry marked RETIRED | 0 |
| M6 | Element tally still differs | PORT GAP | 17 fixtures, each with its own small delta — see the index | 17 |

### M6 — element tally: 17 → 1 fixture

Four mechanisms closed, each read out of a branch rather than fitted.

**1. An empty cell is not an absent cell.** `StripeSimple#getAtoms`
(`StripeSimple.java:124-129`) gives a stripe that collected no atoms a
single-space atom, which the whitespace-only rule then writes as NBSP. This
port skipped drawing an empty value entirely. Jar-verified: `{"a": ""}` emits a
value `<text>`, and `{}` — which `JsonDiagram.java:78-88` rewrites to an array
holding one empty string — emits exactly one text inside a 10×18 box. The
space measures 0 wide, so this adds an element without moving any geometry,
which is why that 10×18 box is a number no `MIN_WIDTH` produces.

**2. `StringUtils.trin`** (`DriverTextSvg.java:125`) trims chars ≤ U+0020 from
both ends of every emitted label. Ported into
`core/svg-shapes.ts#emittedTextForm`, AFTER the NBSP swap — the order is
load-bearing, since reversing it would trim json's three-space nested cell to
nothing. Verified applicable: across 12,521 jar `<text>` elements in the
json/yaml/class/state goldens, ZERO carry leading or trailing whitespace.
This also fixed a latent CLASS divergence — note atom runs were emitting
`'Yet '` where the jar emits `'Yet'` (`class/tenobo-24-liga464`).

**3. Background rect emitted when it should not be.** Two ways, both mine from
this mission's own shell: a non-solid background (`transparent` / `none` /
`#00000000`) got a rect, and a background that IS the default white but
spelled `#FFF` by a theme slipped past a string comparison. Now uses
`assembleDocumentShell`'s own solidity rule plus a `shortenColor` comparison.

**4. Not a mechanism — `json/nixaxa-46-muge983` is malformed JSON.** The jar
draws only the message text (`JsonDiagram#drawU`'s `root == null` branch), no
box; this port draws its own error box. See the remaining table.

### The SECOND NBSP rule — monospace, found and ported

`nixaxa`'s message is NBSP-joined despite not being whitespace-only, which the
already-ported `DriverTextSvg.java:115-116` guard cannot explain. There is a
second, independent substitution:

```java
if ("monospaced".equalsIgnoreCase(fontFamily))
    fontFamily = "monospace";
…
if (fontFamily.equalsIgnoreCase("monospace") || fontFamily.equalsIgnoreCase("courier"))
    text = text.replace(' ', (char) 160);
```
`SvgGraphics.java:720-728`

EVERY space becomes NBSP under a monospace/courier family. Three load-bearing
details: the comparison is `equalsIgnoreCase` on the WHOLE family (a CSS stack
like `"Courier, monospace"` does not qualify); `monospaced` is renamed to
`monospace` BEFORE the test, so it qualifies through the rename; and it runs in
`SvgGraphics#text`, AFTER `DriverTextSvg` computed `textLength` — so it is
emission-only and the width still reflects the space-bearing string.

Jar-verified on the error diagram, which mixes both families in one document:
`font-family="monospace"` texts carry NBSP (`'class\xa0Example'`,
`'Bob->Alice:\xa0Hello'`, `'license'`) while sans-serif ones keep real spaces
(`'Bob -> Alice : hi'`).

`core/klimt/drawing/svg/svg-graphics-elements.ts#applyTextFontFamily` ALREADY
had this rule, so the klimt-drawn engines were correct; the gap was in
`core/svg-shapes.ts#text`, the shared emitter class/state/object/json use.
Now ported there.

It exposed a separate, pre-existing divergence rather than fixing one: this
port's OWN inline error boxes (`class/index.ts`, `chart/renderer.ts` — non-jar
diagnostic surfaces by design) draw with `fontFamily: 'monospace'`, so their
message text now legitimately carries NBSP. And the jar draws the
allowmixing refusal in INHERITED sans-serif, not monospace, which this port
does not yet match. Not chased here; it is a property of those bespoke error
boxes, not of the json family.

### M6 remainder — 3 fixtures

| fixture | signature | mechanism |
|---|---|---|
| `yaml/litife-43-novo083` | `ellipse+1 line+6 path-6 polygon-5 rect+4` | **not a json mechanism at all** — `skinparam handwritten true`. See below. |

`json/vogeku-38-soxe333` closed: wrap was gated on `valueType === 'string'`,
and upstream makes no such distinction — `getShortString` hands `getTextBlock`
a display string and the style's `wrapWidth()` applies whatever the JSON type
was. A boolean's display is `"☑ true"`, which contains a space and therefore
splits; the jar draws `'☑'`, NBSP, `'true'` as three elements. Its tally is now
exact, though the fixture is still blocked from conformance by the margin
finding below.

### litife is `skinparam handwritten true` — a subsystem, not a defect

The last tally mismatch is not a json gap. `JsonDiagram#drawU` opens with

    if (handwritten)
        ug = new UGraphicHandwritten(ug);

and that decorator replaces every primitive with a hand-drawn approximation
(`klimt/drawing/hand/`). The shape mapping, read off the golden:

| drawn | handwritten as |
|---|---|
| `URectangle` (node fill, node border) | `<polygon>` |
| `ULine` (separators, dividers) | `<path>` |
| `UEllipse` (the edge spot) | `<polygon>` |
| `UPath` (edge curve, arrowhead) | `<path>` |

which is exactly this fixture's signature: 4 rects + 1 ellipse become 5
polygons, 6 lines + 2 paths become 8 paths.

**It is all-or-nothing for byte-exactness, and that is measured rather than
asserted.** `UGraphicHandwritten` holds ONE `new Random(424242L)`
(`:54`) and threads that same instance into all six `*Hand` classes;
`HandJiggle#getRnd()` is `rnd.nextDouble()`, called once per emitted point, so
the stream is shared and sequential across every shape in the diagram. Port
five of the six and the sixth consumes no draws — every shape after it
desynchronises and nothing matches.

Size: **748 Java lines across 8 files**, plus a `java.util.Random` LCG port
(the seed is fixed, so the sequence must match bit-for-bit), plus an
indirection in `json/renderer.ts`, which emits SVG strings directly where
upstream decorates a `UGraphic`.

Scope note: `handwritten` is a global skinparam, so this is a FEATURE this
port does not support at all rather than a json defect — one fixture here, but
it would serve every diagram type. Proposed as its own mission; deliberately
not begun as a tail task.

### 10. A theme can change the diagram MARGIN — ported

`TextBlockExporter#calculateMargin` (`:510-516`) reads the merged style for
**`root.document`** and falls back to `TitledDiagram#getDefaultMargins()` —
`same(10)` — only when that style carries no `Margin`. `root` is a prefix of
`root.document`, which is why the themes' `root { Margin … }` reaches it.

28 built-in themes declare one; **21 restate the default 10 and 7 set 5**
(amiga, blueprint, crt-amber, crt-green, mimeograph, mono, plain). Under one
of those, the whole canvas shifts: `json/vogeku-38-soxe333` placed its first
node at `(10, 19)` here against the jar's `(5, 14)`. It now matches exactly.

The value is four-sided (`ClockwiseTopRightBottomLeft`, CSS-shaped 1/2/3/4
numbers, `:66-100`); only the uniform form occurs at this scope, and the other
three are ported so an upstream change cannot silently truncate.

Two things this exposed, neither of them the margin:

- **`deepMergeTheme` drops any field not on `OPTIONAL_SCALAR_KEYS`.** The
  first wiring looked correct and did nothing at all, because the whitelist
  never mentioned the new field. `diagramMargin` is the one non-scalar on that
  list, which is right: the merge is a whole-value replacement, and a theme
  that sets a margin replaces all four sides rather than blending.
- **`MANUAL` in `compile-themes.py` REPLACED the parse rather than overlaying
  it**, so every auto-extracted property was discarded for those themes —
  `black-knight` declares `root { Margin 10 }` and never saw it. Now an
  overlay; the manual keys are explicit and still win.

Corpus effect: fixtures with byte-exact document dimensions 47 → 48, document
diffs 124 → 116, total 20,185 → 19,806. No fixture regressed.

**`vogeku` is still not conformant, and the residual is 1px on each axis, not
the margin.** Its node extents differ from the jar's by 0.35px wide and 0.375
tall — M1a, the accepted engine divergence — and those land either side of an
integer boundary. Chasing it would mean fitting, so it is left measured.

### 9. The malformed-body page — CLOSED, byte-conformant

`JsonDiagram#drawU`'s `root == null` branch (`JsonDiagram.java:113-121`) draws
ONE monospace text and nothing else — no box, no border:

    Display.getWithNewlines(pragma, "Your data does not sound like " + type + " data")
    …create(monospace 14, HorizontalAlignment.LEFT, skinParam)
    TextBlockUtils.withMargin(result, 5, 2)

This port drew its own 640x80 red box, the same bespoke shape the class engine
used before its refusals were routed through the jar's page.

The document chain is the family's usual one with ONE difference worth
recording: a TEXT's ink is its box exactly (`LimitFinder.java:217-225`) — none
of the `-1` corner a rectangle contributes — and `TextBlockMarged` draws a
`UEmpty` of the full margined size, so the ink is `text + 2·5` by `text + 2·2`.
That predicts `trunc(230.388 + 10 + 20 + 1) = 261` by `trunc(14 + 4 + 20 + 1)
= 39`, which is exactly the golden's `viewBox="0 0 261 39"`.

Everything else fell out of rules already ported: the message's spaces become
NBSP because the family is `monospace` (mechanism 6), and `textLength` is the
RAW width because upstream measures before that swap.

`json/nixaxa-46-muge983` is byte-conformant and pinned.

The message interpolates the diagram type upstream, so it can read YAML or HCL.
Only the json parser reports `parseError` today, so only JSON is reachable —
`JsonDiagramAST.diagramLabel` carries it anyway, and yaml/hcl set it, so the
message cannot silently say JSON if either learns to report a failure. That
yaml and hcl never report one at all is its own gap, not this one.

### 8. `MaximumWidth` now survives theme compilation

`yaml/vapoda-87-piku740` exercised mechanism 7 but never REACHED it: its wrap
width comes from `!theme amiga`, and `scripts/compile-themes.py` extracted
only background/foreground/line colour and font — no built-in theme set
`graph.json.maximumWidth`. Now carried, and `vapoda` is exact.

The scoping question that gated this is answered: the themes declare a
TOP-LEVEL `node { … }` inside `<style>`, a sibling of `root`/`document`, so it
is a bare ELEMENT selector that cascades to every signature containing `node`
— `root.element.jsonDiagram.node` included. The jar wrapping `vapoda`'s json
cells is the confirmation.

Extraction is depth-tracked rather than regex-scanned, because the naive
version is wrong three ways, each present in the corpus: `puml-theme-mono`'s
declaration is COMMENTED OUT (leading `'`); `puml-theme-carbon-gray` has two
`MaximumWidth 100`s nested inside `mindmapDiagram`/`wbsDiagram`, which must
not be taken; and an exhaustive scan of every theme confirmed NO theme scopes
one to `jsonDiagram`, so top-level-only is complete rather than merely
convenient. Six themes qualify: amiga, blueprint, crt-amber, crt-green,
mimeograph, plain.

**It also repaired the generator.** `themes-builtin-a-m.ts` says "do not edit
by hand" and had been hand-edited anyway — mission R2j carried `aws-orange`'s
`fontFamily`/`fontSize`/`defaultFontSize`/`classAttributeFontSize` directly
into the generated file, so simply re-running the script silently discarded
them. Those values now live in the script's own `MANUAL` table, and a
regeneration reproduces the committed file byte-for-byte apart from the six
intended additions. That was verified, not assumed.

### 7. Wrapping emits per-WORD atoms — ported

The largest remaining mechanism, and the one the corpus made look like several.

`SheetBlock1` hands each stripe to `Fission#getSplitted` (`Fission.java:63-101`),
which decomposes the atoms into **neutrons** — runs of same-type characters,
where the types are WHITESPACE, CJK_IDEOGRAPH and UNBREAKABLE
(`Neutron.java:120-127`) — and breaks between them at zero-width
`ZWSP_SEPARATOR` markers that `AtomText#getNeutrons` (`AtomText.java:278-315`)
places on BOTH sides of every whitespace or CJK run. Each surviving neutron
becomes its own `Atom`, and **each atom is drawn as its own `<text>`**.

So with wrap active the jar emits one element per word AND one per inter-word
space — `'This'`, `'\xa0'`, `'is'`, … — where this port emitted one per
wrapped line: 134 elements against 22 on `json/noleta-28-nutu456`. The space
element and the word after it share an `x`, because a space measures 0 under
deterministic metrics.

Ported to `json/Fission.ts` — `getNeutrons`, `addNeutron`, `slightyShorten`,
`removeFinalSpaces`, `isWhite` and the queue walk, including the detail that an
overflowing run with no break in it stays put rather than being cut. It
replaces `wordWrapLine`, a greedy re-join that could not produce per-atom
output at all.

**Wrap is the only thing that splits a line this way.** `getSplitted` returns
the stripe untouched when `maxWidth` is 0 (`:64-66`), so an unwrapped cell
stays one atom and one `<text>` — which is why none of the 16 already-conformant
fixtures moved.

Column A splits too: `getTextBlock` builds the key and the value from the same
style, `wrapWidth()` included (`TextBlockJson.java:341-349`). Keys were the
last two elements of `noleta`'s gap.

One deliberate approximation, named: `Character.isWhitespace` is approximated
by an explicit character class rather than a full Unicode table. It must NOT
match U+00A0 — Java's `isWhitespace` excludes NBSP precisely because it is
non-breaking, and json's nested cell is three NBSPs that have to stay one
unbreakable atom.

### What closed this round

**5. The `\n` split is on the ESCAPE, not the character.**
`Display.getWithNewlines3` (`Display.java:233-257`) walks the string once and
splits at the two-character `\` + `n`; a real U+000A falls to the `else`
branch and is appended verbatim. This port rewrote the escape to U+000A and
then split on U+000A, conflating them. ONE mechanism behind three fixtures:
a YAML block scalar's newlines must stay inside one `<text>`
(`yaml/ketunu-15-poli031`), and a JSON string ending in a real CR/LF is one
line whose trailing control characters `trin` removes at emission
(`json/gagebi-92-vere937`, `devime-19-toze896`). Ported as upstream's single
pass, including its treatment of an unrecognised escape (consume both
characters, append neither — which is why `\r` vanishes).

**6. The background rect, three separate bugs, all in this mission's own
shell.** It was skipped entirely for an ANNOTATED diagram, because the body
arrives pre-wrapped by `applyChrome` — inherited from `assembleStateShell`,
whose sampled corpus never combined a non-default background with chrome.
`yaml/tadari-70-nare798` (`!theme amiga` + `title foo`) shows the jar still
draws it, still as the first child of the content group. And the
default-background comparison was too shallow twice over: a theme may supply
`#FFF` rather than `#FFFFFF`, or the NAME `white` (`!theme plain`,
`json/vogeku-38-soxe333`). Now compared through `resolveColorToSvgHex` +
`shortenColor`, and the background is canonicalized BEFORE the document shell
— which class already did (`assemble-svg.ts`, G2 N4) and json did not, so a
themed `white` was reaching the root `style` verbatim.

### The SECOND NBSP rule — monospace, found and ported

`nixaxa`'s message is NBSP-joined despite not being whitespace-only, which the
already-ported `DriverTextSvg.java:115-116` guard cannot explain. There is a
second, independent substitution:

```java
if ("monospaced".equalsIgnoreCase(fontFamily))
    fontFamily = "monospace";
…
if (fontFamily.equalsIgnoreCase("monospace") || fontFamily.equalsIgnoreCase("courier"))
    text = text.replace(' ', (char) 160);
```
`SvgGraphics.java:720-728`

EVERY space becomes NBSP under a monospace/courier family. Three load-bearing
details: the comparison is `equalsIgnoreCase` on the WHOLE family (a CSS stack
like `"Courier, monospace"` does not qualify); `monospaced` is renamed to
`monospace` BEFORE the test, so it qualifies through the rename; and it runs in
`SvgGraphics#text`, AFTER `DriverTextSvg` computed `textLength` — so it is
emission-only and the width still reflects the space-bearing string.

Jar-verified on the error diagram, which mixes both families in one document:
`font-family="monospace"` texts carry NBSP (`'class\xa0Example'`,
`'Bob->Alice:\xa0Hello'`, `'license'`) while sans-serif ones keep real spaces
(`'Bob -> Alice : hi'`).

`core/klimt/drawing/svg/svg-graphics-elements.ts#applyTextFontFamily` ALREADY
had this rule, so the klimt-drawn engines were correct; the gap was in
`core/svg-shapes.ts#text`, the shared emitter class/state/object/json use.
Now ported there.

It exposed a separate, pre-existing divergence rather than fixing one: this
port's OWN inline error boxes (`class/index.ts`, `chart/renderer.ts` — non-jar
diagnostic surfaces by design) draw with `fontFamily: 'monospace'`, so their
message text now legitimately carries NBSP. And the jar draws the
allowmixing refusal in INHERITED sans-serif, not monospace, which this port
does not yet match. Not chased here; it is a property of those bespoke error
boxes, not of the json family.

### M6 remainder — 9 fixtures, each diagnosed

| fixture | signature | mechanism |
|---|---|---|
| `json/nixaxa-46-muge983` | `rect+1` | malformed JSON: `JsonDiagram#drawU`'s `root == null` branch draws a bare monospace message at the normal cell origin, NO box. This port draws its own `renderErrorBox`. (The NBSP-joined spaces in that message are no longer a mystery — see below; that half is now ported.) |
| `json/vogeku-38-soxe333` | `rect+1 text-12` | `!theme plain`; residual after the background fix |
| `yaml/tadari-70-nare798` | `rect-1` | has a `title`; chrome interaction |
| `json/gagebi-92-vere937` | `text+1` | value ends `\r\n`; we emit a trailing empty line the jar does not |
| `json/devime-19-toze896` | `text+5` | same, ×5 |
| `yaml/ketunu-15-poli031` | `text+4` | **the jar does NOT split on a literal newline.** Its golden carries ONE `<text>` whose content contains real U+000A characters (`"def func(x) do\n…"`). `Display.getWithNewlines` splits on the authored escape `\n`, not on U+000A, so a YAML block scalar's newlines survive into the SVG. This port splits on U+000A. |
| `yaml/vapoda-87-piku740` | `text-4` | unexamined |
| `json/noleta-28-nutu456` | `text-112` | large; `MaximumWidth` wrap case |
| `yaml/litife-43-novo083` | `ellipse+1 line+6 path-6 polygon-5 rect+4` | **not a json mechanism at all** — `skinparam handwritten true`. See below. |

### M1a is genuine — checked for a hidden defect, found none

M1 turned out to be hiding M1b, a real defect of ours, so M1a was re-examined
the same way rather than trusted. It survives.

| what was measured | result | reads as |
|---|---|---|
| node SIZES | Δw ≈ 0.00, Δh ≈ 0.00 per node | our sizing port is correct |
| overall ENVELOPE | origin 10 and y-span 216.00 on both, x-span within 0.56 | the graph occupies the same box |
| node y | **191 of 276 exactly equal**; the rest scattered both ways | no systematic shift |
| node x | 108 negative, 128 positive, 40 exact | no systematic bias |

The aggregate `mean |Δw| 3.05` reported by `scripts/json-node-oracle.ts
--summary` is an ARTEFACT: 8 fixtures return COUNT-MISMATCH because that
script extracts node rects from the jar's SVG, and those fixtures now draw
polygons (handwritten), no rects (parse failure), or a background rect it
miscounts. Per-fixture, widths are exact.

What differs is the interior arrangement, and not as a permutation — the
multiset of y positions itself differs (`cilemo-38-fafi313`: the jar places
nodes at 104/113/142/158/162/182/185.5, this port at
118/127/145/159/167/172/177/197/199.13, both inside the same 10..226). That is
within-rank coordinate assignment: `position.c`.

**So closing M1a is not a bug fix — it is a version-matching exercise.**
Smetana is a transpile of graphviz **2.38**; `@knowvah/dot-engine` is a port of
**modern** graphviz. Two different upstreams, both correct for their version.
Making them agree means reproducing 2.38's positioning, which is precisely
what CLAUDE.md's standing ruling forbids: *"Never chase a Smetana-specific
number… dot-engine's answer stands. Record the delta and move on."*

Reversing that ruling is a maintainer decision, not a defect to fix. The
measurement above is what it should be reversed (or upheld) on.

### M1 is TWO mechanisms, and only one of them is the accepted divergence

Measured 2026-08-09, after the value-colour match made the interiors legible.
Document-dimension delta (jar − ours) across all 92 fixtures:

| axis | delta | fixtures |
|---|---|---|
| **height** | **exactly +2** | **70 / 92** |
| width | +2 | 47 / 92 |
| width | anything else (+1, +3, +6, −12, +21, …) | 45 / 92 |

The **width** spread is the genuine ADR-2b divergence: horizontal placement is
what the two layout engines disagree about. The **height** constant is not —
height follows the node stack, which this port reproduces exactly. Three
fixtures (`json/bidire-98-kege137`, `giduve-36-xuvo448`, `karaju-04-caxi838`)
are byte-identical to the jar on every drawn coordinate and differ ONLY in the
four root dimension attributes, both axes +2.

**So M1 has been carrying a defect of ours under an accepted-divergence
label.** Splitting it:

- **M1a — horizontal layout geometry.** ACCEPTED (ADR-2b). Unchanged.
- **M1b — the document-dimension formula.** OURS, and fixable. A constant +2
  per axis.

#### M1b — mechanism, as far as it is established

The jar does not size the document from the drawn extent. The chain is:

1. `JsonDiagram#calculateDimension` (`JsonDiagram.java:130-137`) is an INK
   WALK — `TextBlockUtils.getMinMax(this, stringBounder, true)` — not a
   geometry sum.
2. `LimitFinder#drawRectangle` (`LimitFinder.java:184-188`) contributes
   `(x-1, y-1)` and `(x+w-1, y+h-1)` per rectangle, and ignores `UStroke`
   entirely. `initToZero=true` seeds the box at `(0,0,0,0)`
   (`MinMax.java:71-76`), so the ink dim depends on the drawing's ABSOLUTE
   position, not just its size — `getDimension()` is `maxX-minX`
   (`MinMax.java:151-153`).
3. `TextBlockExporter#calculateFinalDimension` (`:199-203`) adds
   `TitledDiagram#getDefaultMargins()` = `same(10)` (`TitledDiagram.java:275-277`)
   and hands the result to `SvgOption.withMinDim` (`:284`).
4. `SvgGraphics`'s constructor calls `ensureVisible(minDim…)` (`:143`), which
   stores `maxX = (int)(x + 1)` (`:129-134`) — a TRUNCATING +1.
5. `maxX`/`maxY` ARE the emitted `width`/`height`/`viewBox`
   (`SvgGraphics.java:799-811`).

`json/layout.ts` models none of this: it computes
`max(node.x + node.width) + CANVAS_PAD` directly.

**Ruled out, with the evidence:**

- *Border stroke width.* `LimitFinder` never inspects `UStroke`.
- *A margin of 11 rather than 10.* `getDefaultMargins` is `same(10)`, and a
  constant float offset is inconsistent with the observed float deltas
  (1.425 / 1.612 / 2.000) — those are consistent with `trunc(x + 22)` against
  our `trunc(x + 20)`.
- *The Smetana/dot-engine divergence,* for the height axis: the three fixtures
  above match the jar on every drawn coordinate.

#### M1b — CLOSED, both `+1`s attributed

Closed by instrumenting the oracle (the method mission G2/N46 used for the
class equivalent): a throwaway local build of the pinned fork with `printf`s in
`JsonDiagram#calculateDimension`, `TextBlockExporter#calculateFinalDimension`
and `SvgGraphics#ensureVisible`. The instrumentation was reverted; only
`oracle/dist/plantuml-oracle.jar` remains, untouched.

For `json/bidire-98-kege137` (one node, 24 × 18, drawn at 10,10):

```
[DBG] JsonDiagram.getMinMax = (-1.0,-1.0)->(24.0,18.0)  dim = 25.0 x 19.0
[DBG] calculateFinalDimension: textBlock=25.0x19.0  margins L=10 R=10 T=10 B=10  -> 45.0x39.0
[DBG] ensureVisible(45.0, 39.0)  maxX 10 -> 46   maxY 10 -> 40
```

The two `+1`s:

1. **The ink box's MIN corner is `(-1, -1)`**, not `(0, 0)`.
   `LimitFinder#drawRectangle` records `addPoint(x - 1, y - 1)`
   (`LimitFinder.java:185`), and `MinMax#getDimension` is `maxX - minX`
   (`MinMax.java:151-153`) — so that corner adds exactly 1 to each axis. This
   is the one that was missing; `initToZero` seeds the box at `(0,0,0,0)` but
   the rect's own `-1` pushes the min below zero. **Reasoning about it from
   the source had produced the wrong answer twice** — the ink dim is neither
   the node size nor node+stroke.
2. `ensureVisible`'s `(int)(x + 1)` (`SvgGraphics.java:129-134`).

Verified on five fixtures spanning 46px to 1356px wide, single- and
multi-node: the min corner is `(-1.0,-1.0)` in every case, and
`trunc(rawExtent + 1 + 20 + 1)` reproduces the jar's emitted dimensions
exactly.

**Result: 13 fixtures byte-conformant** (7 json, 5 yaml, 1 hcl), all pinned.
Height delta is now 0 on the same 70 of 92 fixtures that carried the +2.

### M1 — accepted, with its measurement

graphviz pads every `shape=record` field: `XPAD` = 4·GAP = 16, `YPAD` =
2·GAP = 8 (`~/git/graphviz/lib/common/macros.h:27-29`). Upstream compensates
only the `YPAD` half (`SmetanaForJson`'s `colAwidth - 8`), which is correct for
Smetana because Smetana does not apply `XPAD`. This port compensates both,
because its engine applies both — verified against the installed `dot` 15.1.1,
which returns byte-identical record geometry for the same label.

Recorded in `DIVERGENCES.md`, "Smetana-backed diagram types".

### Two upstream DOT attributes this port does not set

`SmetanaForJson.java:221-223` sets `arrowsize=.75` and `arrowhead=normal` on
every json edge. This port's layout sets only `tailport`, and
`core/graph-layout.types.ts#DotInputEdge` has no field for either. Consequence:
the engine neither reserves nor shortens for the arrowhead, so the spline
terminates where the jar's does not.

Related, and the reason the arrowhead's depth is approximated rather than
read: **`@knowvah/dot-engine` does not expose a spline's `sp`/`ep`.**
`EdgeGeometry` carries only the bezier control points, so
`JsonCurve.ts#endPointOf` extrapolates the endpoint by one arrow length
(graphviz `ARROW_LENGTH` 10 × upstream's `arrowsize` .75) instead of reading
the value the engine already computed. Filed in `docs/graphviz-issues/`.

### Not observed, and worth stating

- **No `@knowvah/dot-engine` layout defect was found.** Record sizing and field
  ports match real graphviz byte-for-byte on the case tested.
- The engine warning `in routesplines, Pshortestpath failed` (with
  `lost <tail> <head> edge`) DOES reproduce, on every json-family census run.
  See `docs/graphviz-issues/`.

## Per-fixture index

Every fixture, exactly once. **† = the element tally still differs, so
`compare.ts` stops recursing and this fixture's diff count is a FLOOR.** The
75 rows without a † are fully compared, top to bottom, for the first time.

| fixture | diffs | element tally vs jar |
|---|---|---|
| json/babico-87-soxo095 | 13 | exact |
| json/bavize-88-jumu158 | 31 | exact |
| json/bidire-98-kege137 | 5 | exact |
| json/bitepo-72-vija933 | 6 † | `rect+1` |
| json/bogiku-88-nano204 | 538 | exact |
| json/cazuru-97-jala040 | 5 † | `text-1` |
| json/cilemo-38-fafi313 | 5 † | `text-4` |
| json/civofu-04-loku952 | 1754 | exact |
| json/conigu-03-cuzu022 | 37 | exact |
| json/dapinu-10-dida560 | 44 | exact |
| json/debako-68-sice023 | 183 | exact |
| json/derele-19-poni229 | 51 | exact |
| json/devime-19-toze896 | 5 † | `text+5` |
| json/dometa-86-jepe218 | 192 | exact |
| json/gagebi-92-vere937 | 5 † | `text+1` |
| json/gavomi-49-koco364 | 5 † | `text-2` |
| json/gejena-99-veme626 | 515 | exact |
| json/gibego-39-pelu609 | 522 | exact |
| json/giduve-36-xuvo448 | 5 | exact |
| json/jaramo-16-doxa994 | 18 | exact |
| json/jekaju-28-gulo479 | 93 | exact |
| json/jidata-48-kire666 | 107 | exact |
| json/json-escaped | 93 | exact |
| json/karaju-04-caxi838 | 5 | exact |
| json/kicati-76-guvi771 | 184 | exact |
| json/kidoki-70-fala224 | 1156 | exact |
| json/kusule-69-jada088 | 55 | exact |
| json/letada-23-sisi815 | 184 | exact |
| json/lipuxo-26-susi944 | 7 | exact |
| json/lulofe-05-dasu529 | 7 | exact |
| json/moseba-10-naza079 | 110 | exact |
| json/mudumo-73-foli040 | 350 | exact |
| json/najixi-88-javo178 | 33 | exact |
| json/nanegu-88-boba399 | 18 | exact |
| json/nixaxa-46-muge983 | 5 † | `rect+1` |
| json/nofuvo-36-muxe040 | 826 | exact |
| json/noleta-28-nutu456 | 5 † | `text-112` |
| json/nopoku-31-cisi925 | 1368 | exact |
| json/nujuke-14-nabo073 | 5 † | `text-1` |
| json/nuviro-48-sice969 | 39 | exact |
| json/pijume-87-gufu868 | 108 | exact |
| json/rutofu-66-kivu935 | 9 | exact |
| json/sevaji-38-xita618 | 6 † | `rect+1` |
| json/tacizo-43-dige090 | 5 † | `text-1` |
| json/timafu-94-bixe774 | 125 | exact |
| json/tivuru-65-vezu313 | 150 | exact |
| json/vogeku-38-soxe333 | 6 † | `rect+1 text-12` |
| json/xajini-72-rora309 | 5 | exact |
| json/zasitu-09-lise302 | 538 | exact |
| json/zevaka-35-zova441 | 353 | exact |
| yaml/YAML-attribute-hierarchy | 51 | exact |
| yaml/YAML-list-key-value-pair | 23 | exact |
| yaml/YAML-space-indent | 81 | exact |
| yaml/bafemu-96-luji978 | 1918 | exact |
| yaml/bedega-54-romu926 | 10 | exact |
| yaml/coxima-79-gano159 | 5 | exact |
| yaml/finofu-94-daso450 | 7 | exact |
| yaml/gabalo-23-tefe408 | 136 | exact |
| yaml/gatuva-87-futo104 | 58 | exact |
| yaml/gipoxa-19-bico146 | 12 | exact |
| yaml/gobavi-45-guna544 | 23 | exact |
| yaml/jozapu-14-datu953 | 5 † | `text-1` |
| yaml/jukejo-54-pope427 | 137 | exact |
| yaml/ketunu-15-poli031 | 5 † | `text+3` |
| yaml/kotize-70-nuze855 | 68 | exact |
| yaml/lelofi-17-cafo004 | 68 | exact |
| yaml/lifuxe-66-maxu442 | 6 | exact |
| yaml/lipoka-75-rigo326 | 58 | exact |
| yaml/litife-43-novo083 | 23 † | `ellipse+1 line+6 path-6 polygon-5 rect+4` |
| yaml/medosa-24-jugi124 | 54 | exact |
| yaml/mudeno-46-rado553 | 206 | exact |
| yaml/najoba-05-nino350 | 80 | exact |
| yaml/nuzaje-74-kenu009 | 125 | exact |
| yaml/polela-38-mopu631 | 68 | exact |
| yaml/poxedu-72-bite327 | 218 | exact |
| yaml/sozafu-05-xeka661 | 68 | exact |
| yaml/sudabi-56-dedu341 | 28 | exact |
| yaml/tadari-70-nare798 | 3 † | `rect-1` |
| yaml/vaceci-80-lezo436 | 129 | exact |
| yaml/vapoda-87-piku740 | 5 † | `text-4` |
| yaml/vugalo-43-mose807 | 32 | exact |
| yaml/vuzosu-08-pake421 | 7 | exact |
| yaml/xacali-26-mazu431 | 56 | exact |
| yaml/xatato-75-mora801 | 7 | exact |
| yaml/xofilu-53-tazi162 | 81 | exact |
| yaml/xubife-72-runi076 | 228 | exact |
| yaml/zebapi-77-zasu051 | 54 | exact |
| yaml/zeduse-06-fidi174 | 51 | exact |
| yaml/zomime-61-sase339 | 100 | exact |
| hcl/citoda-80-dimi195 | 6 | exact |
| hcl/jubete-32-sutu417 | 130 | exact |
| hcl/vocago-35-xodu446 | 47 | exact |

---

## M7 — document dimensions (RESOLVED 2026-08-09; the original entry was WRONG)

### Retraction

The first version of this entry reported the jar at 204x93 against this port's
194x85 and called it a pre-existing defect. **That measurement was invalid.**
It was taken with a hand-typed `java -jar … -tsvg`, omitting
`-DPLANTUML_DETERMINISTIC_TEXT=true`, so it compared this port's
`DeterministicMeasurer` render against the jar using REAL platform font
metrics. Every text-derived number differed for that reason alone.

Re-measured correctly on the same input:

| | jar | this port |
| --- | --- | --- |
| node sizes | 86.238x54, 48.85x36 | **identical** |
| node 2 `x` | 133 | 133.237 |
| viewBox | 193 x 85 | 194 x 85 |

1px in width, and it is the ADR-2b engine delta (dot-engine places the child
0.237 further right than Smetana), not a defect. The commit that filed M7 has
been superseded, and CLAUDE.md now carries "Always render the oracle
deterministically" plus `scripts/oracle-render.sh` so the flag cannot be
omitted again.

### The real finding underneath it

Chasing the bogus number did surface a genuine bug, now fixed. Upstream carries
TWO dimension notions and this port had conflated them:

- `TextBlockExporter#calculateFinalDimension()` (:199-202) — ink extent plus
  both margins. This is what `computeScaleFactor(dim)` (:165) divides by.
- `SvgGraphics`'s `maxX`/`maxY` — the same value seeded through
  `ensureVisible(minDim)` (:142-143), i.e. `(int)(x + 1)`. This is what becomes
  `width`/`height`/`viewBox` (:799-811).

`documentDimensions` returned only the second and `renderJson` resolved `scale`
against it, so `scale max W*H` divided by a number 1 larger than the jar's.
Verified against the jar's own arithmetic: `181.85 - 10 + 1 + 20 = 192.85`,
which is exactly the scale dimension back-solved from `timafu`'s rect height.
`JsonGeometry` now carries `finalDimension` alongside `width`/`height`.

`json/timafu-94-bixe774`: 47 -> 37 structural diffs, and its per-value error
fell from 0.64% to 0.12%. The residual 0.12% is the 0.237px placement delta
propagated through `scale max`'s division — the accepted divergence, amplified.
It is pinned with a ceiling under `divergent`, not chased.

---

## Close-out of the structural backlog (2026-08-09)

266 -> 4 residual diffs. 85 fixtures required structurally clean, 5 pinned as
bounded divergences, 1 genuine defect left open and named.

### Bounded divergences (`divergent` in the manifest, each with a diff ceiling)

| fixture | ceiling | why |
| --- | --- | --- |
| `json/bitepo-72-vija933` | 23 | skinparam honored in this family (DIVERGENCES.md) |
| `json/sevaji-38-xita618` | 1 | same |
| `json/timafu-94-bixe774` | 37 | ADR-2b engine delta amplified by `scale max` |
| `yaml/najoba-05-nino350` | 1 | ADR-2b engine delta crossing an integer boundary |
| `yaml/tadari-70-nare798` | 1 | same |

The last three are one measurement: node sizes and document HEIGHT match the
jar exactly, and dot-engine places the child node 0.237px right of Smetana.
On `najoba` that moves the ink right edge 176.85 -> 177.087, which rounds the
document width 183 -> 184. On `timafu` the same delta divides into
`scale max 100*100`'s factor and becomes a uniform 0.12% on every number.
Never chased: a Smetana geometry number is not a target.

### Still open — `json/nujuke-14-nabo073` (1 diff, a childCount)

NOT the engine delta, and not closed. A `childCount` mismatch stops `compare`
recursion, so its inner diffs remain masked. Two known causes, both wanting the
same missing piece:

- the jar emits NO `<text>` for the `\t` row. `SvgGraphics#text` has no
  empty-string guard, so the suppression happens earlier, in the atom layer;
- the node measures 66 wide against this port's 13.85. `DeterministicMeasurer`
  returns ZERO width for both `' '` and `'\t'`, where the jar's contributes
  ~56px.

Both need the tab-measurement mechanism, which is a measurer question rather
than a json one. Do not fit a width to close it.

### Also open — `yaml/vapoda-87-piku740` (1 diff, document width)

Found while closing najoba; NOT the engine delta, and not in that batch's
scope. Measured with the deterministic flag:

- every node size identical to the jar (10x36, 141.275x54, 134.363x54);
- document HEIGHT identical (138);
- only the third node's `x` differs, 55.456 vs 55.5 — 0.044px, immaterial;
- yet the document WIDTH is 200 here against the jar's 204.

The widest node's right edge is 193.275 in BOTH, so the jar's ink reaches
~197 from something that is not a node. `layout.ts#documentDimensions` walks
`nodes` only, where upstream's `JsonDiagram#calculateDimension` is
`TextBlockUtils.getMinMax(this, …)` — a LimitFinder walk over EVERYTHING
drawn, edges and arrowheads included, with `drawUPolygon` padding its bounds
by `HACK_X_FOR_POLYGON = 10` in x. That is the likely mechanism and it is
NOT yet confirmed; confirm before changing anything.

It stays unpinned: a defect, not a divergence.
