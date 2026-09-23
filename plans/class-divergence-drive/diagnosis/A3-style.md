# A3 — STYLE / COLOUR / STROKE / FONT — diagnosis report

Bucket: 133 slugs (`bucket-A3_style.json`). Method: read Java, read TS, render
>=3 fixtures per mechanism via `render-one.ts` (production `renderSync`),
confirm zero/near-zero residual diffs. Every mechanism below cites
`file:line` on both sides. Comparator caveat honored: a diff inside a
fixture that is ALSO dominated by an ordering/childCount cascade
(cobumi-83-bapu892, delasa-80-jusu462) is still a real, distinct
single-attribute cause — it is just not "fully explained" for that fixture
because other, unrelated cascades own the rest of its diff count.

Coverage note: full 133-slug triage was not completed (time budget). What
follows is 9 mechanisms verified by render + source citation (reach ~40
slugs directly confirmed or grep-matched), plus explicit Cascade-only and
Unclassified lists. The remainder of the bucket was not individually
triaged; do not assume it is accounted for.

---

## M1 — Inline classifier decoration `line:`/`text:`/`line.bold|dashed|dotted` and `##[style]color` never consumed for border stroke, dasharray, stroke-width, or text fill

**Mechanism.** `extractDecorations` captures the WHOLE compound colour spec
(`#yellow;line:red;line.bold;text:red`, `##[dashed]blue`, `#back:red;line:00FFFF`)
into one `geo.color` string. Only `resolveBareOrBackColor` reads it back out,
and it deliberately extracts only the bare-colour/`back:` half — its own
doc comment says the `line:`/`text:`/`line.bold` remainder is "named
remainder, not yet consumed by any render-side field." `classBorder()`
resolves stroke colour purely from the theme cascade and its own doc
comment states explicitly: "No PER-CLASSIFIER inline `##linecolor` override
is threaded here … a SEPARATE, unsurveyed mechanism, out of this
iteration's scope." `classBorderStrokeWidth()` likewise never looks at
`geo.color`, so `line.bold`/`##[bold]` (should force stroke-width 2, solid)
and `line.dashed`/`line.dotted` (should force dasharray `7,7`/`1,3`, width 1)
both fall through to the flat default `0.5`, no dash. Text colour
(`text:red`) is never extracted into any field at all.

- TS origin: `src/diagrams/class/class-declaration-extractors.ts:72-107`
  (`extractDecorations`, combined `color` string built at 101-105);
  `src/core/color-override.ts:52-58` (`resolveBareOrBackColor`, doc
  comment 33-40 names the drop explicitly);
  `src/diagrams/class/renderer-classifier-colors.ts:170-183` (`classBorder`,
  doc comment 160-172 names the same drop for LINE);
  `src/diagrams/class/renderer-classifier-colors.ts:196-206`
  (`classBorderStrokeWidth`, no `geo.color`/lineStyle consultation at all).
- Java origin: `klimt/color/Colors.java:95-124` (constructor — parses
  `line.dashed`/`line.dotted`/`line.bold` into `lineStyle`, and
  `text:`/`line:`/`back:` into the `ColorType` map);
  `decoration/LinkStyle.java:97-108` (`getStroke3`: DASHED→`(7,7,w)`,
  DOTTED→`(1,3,w)`, BOLD→solid width 2);
  `style/Style.java:322-327` (`getStroke(Colors)` — a non-null
  `colors.getSpecificLineStroke()` REPLACES the style-derived
  thickness/dash outright, doesn't merge with it);
  `svek/image/EntityImageClass.java:193-215` (`borderColor =
  lineConfig.getColors().getColor(LINE)`; `stroke =
  getStyle().getStroke(lineConfig.getColors())`).

**Reach (render-verified, zero residual).** `gojatu-01-jibo986` (32/32
structural), `sosono-24-vuro518` (27/27), `gojadi-30-tame684` (24/24),
`lukexe-74-moco323` (12/12). Grep-matched, not individually re-rendered but
same source shape (`line:`/`text:`/`line.bold|dashed|dotted`/`##[`):
`murotu-83-cebo380`, `najuxe-66-nuzi850`, `mexaka-52-gati860`,
`nuvake-96-gofe203`. `xoxuni-96-fere626` (8/8 structural) matches for the
stroke/text half; its `path/@fill exp=#00F act=#FEFFDD` diffs are the SAME
root cause reaching a lollipop/interface-notch shape's own `back:` field —
flagged MEDIUM confidence only (didn't read the notch renderer to confirm
the `#FEFFDD` fallback is that shape's own class-default, not a second bug).

**Fix shape.** Extend `extractDecorations`'s return (or a sibling
extractor) to expose `line`/`text`/`lineStyle` distinctly, thread `line`
into `classBorder()` (mirroring `resolveBareOrBackColor`'s precedent),
`lineStyle` into `classBorderStrokeWidth()` + a new dasharray resolver
(mirror `LinkStyle.getStroke3`'s three literal cases), and `text` into
`renderer-classifier-rows.ts`'s `fontColor` resolution (already has the
`fontColor ?? … ?? fallbackFontColor` chain at
`renderer-classifier-rows.ts:142-163`, insert a per-classifier tier ahead
of it). Risk: `resolveBareOrBackColor`/`geo.color` is shared with
`renderer-note.ts`'s note colour and `state-render-colors.ts`'s state
colour (per `color-override.ts`'s own doc comment) — a shared-seam change,
touch only the classifier call site's consumption, not the shared
extractor's grammar. Low risk to the 412 conformant fixtures (additive:
today's `undefined` line/text paths stay `undefined` unless a spec is
present).

**Confidence: HIGH.** Java mechanism read and matches every observed
value pair (7,7 / 1,3 / width 2) exactly; TS gap explicitly self-documented
in two places; 4 fixtures render zero-residual.

---

## M2 — `classFontColor` / `skinparam class { FontColor / AttributeFontColor }` have no skinparam-key handler at all

**Mechanism.** Unlike `classBackgroundColor`/`classBorderColor`/
`classArrowColor` (each has a dedicated entry in the key-handler tables),
`classFontColor` and `AttributeFontColor` (inside a `skinparam class {}`
block) have NO entry anywhere in `skinparam-key-handlers-table-a.ts` /
`-table-b.ts` — confirmed by exhaustive grep (`grep -rn "classFontColor"
src/` returns nothing outside comments). The value is silently dropped
during skinparam parsing; `theme.colors.graph.classCascadeFontColor` stays
`undefined`, and `renderer-classifier-rows.ts:251`'s
`fallbackFontColor = '#000000'` wins for every classifier name/attribute
row.

- TS origin (absence): `src/core/skinparam-key-handlers-table-a.ts`,
  `-table-b.ts` — no `classfontcolor`/`attributefontcolor` key anywhere
  in either table (compare `classbordercolor` at `-table-b.ts:67-71`,
  which DOES exist). Consumer:
  `src/diagrams/class/renderer-classifier-rows.ts:142-163,246-251`.
- Java origin: `FromSkinparamToStyle.java` registers a `classFontColor`
  → `PName.FontColor` mapping on the `class_` style signature (the
  bare/`skinparam class{}` legacy-to-style bridge upstream uses for every
  other `classXColor` key this port DOES implement) — this port's
  key-handler tables never built the equivalent entry.

**Reach (render-verified, zero residual).** `remanu-84-sega129` (6/6,
`skinparam classFontColor red`). `picija-82-jebu272` (14/14 — BOTH
`FontColor Yellow` on the name row and `AttributeFontColor gold` on every
member row are unwired, same missing-handler root cause).
`nijeli-04-ponu844`: 22 of its 43 structural diffs (`#333` vs `#000`, from
`skinparam classFontColor #333333`) are this mechanism; the other 21 are
THREE unrelated mechanisms in the same fixture (`packageFontName "Arial
Black"` unwired — 4 diffs; package `rx`/`ry` rounding — 4 diffs; an
edge-id/ordering cascade — the rest) — do not attribute those to M2.
Grep-matched, not rendered: `dizuse-83-dabi909`, `gabejo-44-juki791`,
`givofi-11-xumu978`. `nisune-86-faji869` uses `classFontColor automatic`
(a THIRD, harder variant — jar computes a contrast colour against the
header background; this port has no `automatic` handling either, but
that's a compounded gap on top of the same missing-handler root — kept
separate/lower confidence).

**Fix shape.** Add `classfontcolor`/`attributefontcolor` entries to
`skinparam-key-handlers-table-a.ts` or `-b.ts` writing into
`SkinparamAccumulator` fields feeding `classCascadeFontColor` (name row)
and a new `classCascadeAttributeFontColor` (member rows) — both already
have a consumption seam in `renderer-classifier-rows.ts:142-163`. Additive,
low risk: today's undefined path is unaffected for fixtures that never set
these keys.

**Confidence: HIGH.** Confirmed by exhaustive grep of the handler tables
(negative result), not just inference; 2 fixtures fully explained,
`nijeli`'s partial explained down to the exact remainder causes.

---

## M3 — Inline `package "X" #COLOR {` background override is grammar-captured then discarded (no AST field)

**Mechanism.** `NAMESPACE_COMMANDS`' regexes include a `NOTE_COLOR` capture
group on the `namespace .../package ... {` line, but neither `execute()`
handler reads that capture group (only the stereotype/brace groups are
consumed) — the doc comment on the match-index handling even says so for
the adjacent URL group ("no render path for it yet"), and the same is true
for colour. `openNamespaceBlock(state, id, display)` takes no colour
parameter, and `ast.ts`'s `Namespace` interface (91-107) has no `color`
field at all — the value is unreachable structurally, not merely
unconsumed downstream. `class-namespace-shape.ts`'s package fill always
reads the single GLOBAL `theme.colors.graph.packageBackground` skinparam,
never a per-declaration override.

- TS origin: `src/diagrams/class/class-container.ts:382-445`
  (`NAMESPACE_COMMANDS`, colour capture group present in the regex,
  unread in both `execute()` bodies) and `:82-83`
  (`openNamespaceBlock(state, id, display)` signature, no colour param);
  `src/diagrams/class/ast.ts:91-107` (`Namespace` interface, no `color`
  field); `src/diagrams/class/class-namespace-shape.ts:189-192,257,297`
  (fill always `theme.colors.graph.packageBackground`).
- Java origin: `descdiagram/command/CommandPackage.java` /
  `CommandPackageWithUSymbol.java` thread the parsed `Colors` onto the
  created `Entity` (`entity.setColors(...)`), read back at draw time —
  same shape as the classifier-declaration colour path M1 documents,
  applied to a group instead of a leaf.

**Reach (render-verified).** `garumi-63-vuze973`: exactly 1 structural
diff, isolated (`svg/g[1]/g[2]/path[1]/@fill exp=#DDD act=none`) — the
fixture's other numeric diffs are an unrelated geometry issue, out of A3
scope. `foxata-81-miva542`: 1 of 8 structural diffs is this fill; the other
7 are an entity-id/ordering cascade (A1_order territory), unrelated.
`cobumi-83-bapu892`, `delasa-80-jusu462`: same fill diff recurs many times
(one per `package … #DDDDDD {`) but both fixtures are dominated by a huge
unrelated structural/ordering cascade (500+ / 1200+ diffs) — the colour
cause is real but not "fully explained" for either fixture as a whole.
`ledepo-11-muto607` grep-matched, not rendered.

**Fix shape.** Add `color?: string` to `Namespace` (ast.ts), thread it
through `openNamespaceBlock`'s NAMESPACE_COMMANDS `execute()` bodies
(reuse `extractDecorations`'s bare/`back:` half via
`resolveBareOrBackColor`, same as M1's classifier path), and read it in
`class-namespace-shape.ts`'s fill resolution ahead of the global
`packageBackground` fallback. Additive; zero risk to fixtures without an
inline package colour (new optional field, existing calls unaffected).
No shared-seam risk — `Namespace` is class-diagram-only.

**Confidence: HIGH** on the mechanism (AST field genuinely absent, not a
precedence bug) and on `garumi`/`foxata`'s clean single-diff verification.
**MEDIUM** on `cobumi`/`delasa`'s full reach, since their totals are
cascade-dominated and not independently re-verified diff-by-diff.

---

## M4 — Two-colour gradient (`c1-c2`, `c1\c2`, `c1/c2`, `c1|c2`) is a fully general mechanism (`core/paint.ts`) that classifier-declaration colour and the "dedicated" `class*Color`/`icon*Color` skinparam keys bypass

**Mechanism.** `core/paint.ts` is a complete, working Gradient/Paint
implementation: `Gradient` type, `paintToSvg` emits a real
`<linearGradient>` into `<defs>`, and it IS wired for the generic
per-element bucket (`<sname>BackgroundColor`, e.g. `databaseBackgroundColor`)
via `parseColor` in `tryElementColorBucket`
(`skinparam-key-handlers.ts:58-67`, doc comment: "gradients become a
Gradient Paint"). But two OTHER colour paths never reach it:

1. A classifier's own inline declaration colour (`class X #c1-c2`) flows
   through `resolveBareOrBackColor` -> `classifierFill()` calling
   `resolveColorToSvgHex(override)` directly on the raw gradient token — a
   plain-string call, never `parseColor`/`Paint`.
2. The "dedicated" handler-table entries (`classbackgroundcolor`,
   `classbordercolor`, `iconprivatecolor`, etc.) receive their value as
   `resolveColor(value)` — a SEPARATE, deliberately-simpler helper whose
   own doc comment says: "PlantUML supports gradient specs … SVG does not
   understand this syntax, so we extract the end colour and use it as a
   solid fallback." Its regex `/^(.+)-([a-zA-Z]+|#[0-9A-Fa-f]{3,8})$/`
   ALSO only recognises the `-` separator — `\`, `/`, `|` gradients on
   these dedicated keys aren't even flattened correctly, they fail
   `isColorSpec`'s gradient branch differently per separator.

- TS origin: `src/core/paint.ts:201-236` (`paintToSvg`, works);
  `src/core/skinparam-key-handlers.ts:58-67` (`tryElementColorBucket`,
  the ONE wired path); `src/core/skinparam-key-normalize.ts:46-68`
  (`resolveColor`, the flatten-to-solid path, doc comment 55-63 names the
  divergence as deliberate); `src/core/skinparam-key-handlers.ts:120-127`
  (`applyNormalKey` — every dedicated-table handler receives
  `resolveColor(value)`, never `parseColor(value)`);
  `src/diagrams/class/renderer-classifier-colors.ts:151-154`
  (`classifierFill`'s `resolveColorToSvgHex(override)` call, plain-string
  only).
- Java origin: `klimt/color/HColorSet.java:78-119` (`parseColor` — the
  SAME parser handles a gradient for EVERY caller, no split between a
  "generic element" path and a "dedicated class/icon key" path upstream);
  `klimt/drawing/svg/SvgGraphics.java:357-399` (`createSvgGradient` — one
  emission path for every gradient regardless of which skinparam key
  produced it).

**Reach (render-verified).** `capode-04-jeka075` (4/4 structural —
`skinparam classBorderColor #FFBD42-white`: `defs` missing, box stroke
flattened to solid `white`->`#FFF` instead of `url(#…)`; the two INNER
divider lines expect flat `#FFBD42` (colour1) not the gradient — a
second-order detail: jar gives the box outline the true gradient paint but
divider lines a flat colour1, so the eventual fix needs that same split,
not just "thread Paint through"). `taceve-49-mezi408` (Test1-4, all 4
separators: `\`, `-`, `/`, `|` — 4/7 structural belong to this mechanism;
class fill `rect/@fill exp=none act=#FFF` on a DIFFERENT class in the same
fixture is unrelated). `dacixi-46-lina038` (namespace `#yellow\gold` — this
is the M3 namespace-colour-drop AND M4 gradient-drop stacked: even once
M3 threads the colour through, it would still need M4's gradient handling).
`popesa-39-sobe866`, `mexaka-52-gati860` (`Demo1 #back:lightgreen|yellow`)
grep/render-matched (popesa rendered earlier in session: fill/gradient-id
mismatch confirmed).

**Fix shape.** Route the dedicated-table handlers' value through
`parseColor` (producing a `Paint`, not always a hex string) instead of
`resolveColor`, and change the corresponding `SkinparamAccumulator`/
`ThemeGraphColors` fields (`classBorder`, `classBackground`, `iconPrivateColor`,
etc. — currently typed `string`) to `Paint`. This is a WIDER type change
than M1-M3 — `classifierFill`'s doc comment already flags this exact
widening as "out of this iteration's scope" for the `object`/`map`/`json`
Paint case, for the same reason: `classifierFill`/`classBorder`'s return
type is shared by 2-3 other callers expecting `string`
(`renderEnhancedBody`, `renderVisibilityUrlBackground`). Needs `svg.ts`'s
`resolvePaintAttrs` plumbing (already Paint-aware) threaded to
`renderer-classifier-box.ts`'s `path()`/`rect()` calls, which is mostly
mechanical since those callers already accept `Paint`-typed `stroke`/
`fill` per `svg.ts:33,49`. Medium risk: touches a widely-shared type
(`ThemeGraphColors.classBorder` etc.) — must audit all consumers before
widening, and the divider-line-gets-flat-colour1 exception needs its own
branch, not a blanket Paint substitution.

**Confidence: HIGH** that the mechanism (two parallel colour-resolution
paths, only one Paint-aware) is correct — verified by reading both
`resolveColor` and `parseColor`/`tryElementColorBucket` and confirming the
dispatcher (`applyNormalKey`) always calls the non-Paint one for dedicated
keys. **MEDIUM** on the exact fix shape's blast radius (shared-return-type
widening needs a fuller consumer audit than this diagnosis pass did).

---

## M5 — `icon*Color`/`icon*BackgroundColor` skinparam values bypass `resolveColorToSvgHex` entirely (named colour keyword survives verbatim)

**Mechanism.** `class-visibility-icon.ts`'s shape emitters
(`polygonTag`, `drawSquare`, `drawCircle`, `drawDiamond`, `drawTriangle`,
`styleAttr`) build `fill="…"`/`stroke="…"` (or a combined `style=` string)
by interpolating the resolved `theme.colors.graph.iconPrivateColor` etc.
value DIRECTLY, passing it only through `shortenColor()` — which shortens
an ALREADY-hex `#RRGGBB` to `#RGB` and passes anything else (including a
plain CSS keyword like `"black"`) through completely unchanged. Unlike
`classifierFill`/`classBorder`, these values never flow through `svg.ts`'s
`Paint`-typed `resolvePaintAttrs`/`paintToSvg`, so they never reach
`resolveColorToSvgHex`. The jar canonicalises every colour to hex before
SVG emission, so a bare keyword never survives to its output.

- TS origin: `src/diagrams/class/class-visibility-icon.ts:127-139`
  (`colorsFor`, returns the raw theme string), `:161-173` (`styleAttr`,
  `shortenColor(stroke)` only), `:176-226` (`polygonTag`/`drawSquare`/
  `drawCircle`/`drawDiamond`/`drawTriangle`, raw string interpolation).
  Contrast: `src/diagrams/class/renderer-classifier-box.ts:97,149,165`
  (`classBorder(geo, theme)` fed to `path()`/`rect()`'s `Paint`-typed
  `stroke`, which DOES reach `resolveColorToSvgHex` via
  `svg.ts:203-224`'s `resolvePaint`).
- Java origin: `klimt/color/HColorSet.java` resolves every `HColor`
  (including a bare `HColorSet.getColor("black")`) to its canonical form
  before `SvgGraphics` ever writes it — there is exactly one colour
  representation upstream by the time drawing happens, no "some callers
  normalise, some don't" split.

**Reach (render-verified, zero residual).** `tagofo-84-nuti362`: 36/36
structural diffs, ALL `fill="black"`/`stroke="black"` vs expected `#000`,
on visibility-icon rects/polygons/ellipses only (verified by grepping the
raw rendered SVG, not just the diff list — `fill="black"` literally
present 12 times). `rakopi-21-sufa571` grep-matched (icon colour skinparam
+ `##[bold]#B8860B` gradient-adjacent value), not independently rendered.

**Fix shape.** Route `colorsFor()`'s return values (and/or
`styleAttr`/`polygonTag`'s `fill`/`stroke` params) through
`resolveColorToSvgHex` before interpolation — a small, local, single-file
change. Very low risk: `resolveColorToSvgHex` is idempotent on
already-hex input (the common case today), so existing conformant
fixtures using hex icon colours are unaffected; only named-keyword icon
colours change output, and only toward the jar's own value.

**Confidence: HIGH.** Verified against the RAW rendered SVG text (not
just the structured diff), single fixture 100% clean, root cause read
directly (missing normalisation call, not a precedence or cascade issue).

---

## M6 — `skinparam mode dark` is not implemented (root background AND the entire default palette)

**Mechanism.** `zirori-93-jefo337` (`skinparam mode dark; class foo`) is
the ENTIRE fixture — no other skinparam, no `<style>` block — yet 9 of 10
structural diffs are colour: root `svg/@background` (`#1B1B1B` vs our
`#FFFFFF`), classifier fill (`#313139` vs our light-mode `#F1F1F1`),
classifier stroke (`#E7E7E7` vs our `#181818`), the `spotClass` badge
ellipse fill (`#2E5233` vs our `#ADD1B2`), and text fill (`#FFF` vs our
`#000`). Every one of these is the SAME light-mode default this port
already hardcodes elsewhere (`#F1F1F1` classBackground default at
`theme.ts:371`, `#181818` classBorder default, `#ADD1B2`-family badge
defaults) — none of them consult a dark/light mode flag at all, because
`mode dark` itself is never parsed into any accumulator field (absent from
both handler tables, same exhaustive-grep method as M2). This is a single
root cause (one missing skinparam key) with a WIDE blast radius (every
default colour constant in the theme), not 9 independent colour bugs.

- TS origin (absence): no `mode` / `skinparam mode` handling anywhere in
  `skinparam-key-handlers-table-a.ts`/`-b.ts` (grep negative); root
  background default hardcoded white in `theme.ts`/`index.ts`'s render
  options, never conditioned on a dark flag.
- Java origin: `SkinParam.java` (`setMode`/dark-mode flag) feeds
  `ColorMapper`/`HColorSet`'s dark-variant table — upstream's dark mode is
  a wholesale swap of the DEFAULT `HColorSet` lookup table (background,
  every `ColorParam` default), not a single background-colour override;
  confirms why the diff touches every default colour, not just `svg/@background`.

**Reach (render-verified).** `zirori-93-jefo337`: 9 of 10 structural
diffs (the 10th, `svg/g[1][childCount] exp=2 act=1`, is a separate,
unexplained structural gap — likely a badge/decoration element that dark
mode also suppresses/adds upstream; not chased further, flagged
Unclassified-within-fixture). `sadamo-18-siva346` does NOT use `mode
dark`; its `background exp=#000000 act=''` diff is a DIFFERENT, unrelated
single-diff case not yet traced — do not fold into M6. `luzive-62-zote562`'s
`background exp=#000000 act=#FFFFFF` also NOT dark-mode-sourced (its .puml
has no `mode dark`) — flagged Unclassified, needs separate instrumentation.

**Fix shape.** Requires a genuinely new subsystem (a dark-mode default
table), not a small patch — parse `skinparam mode dark` into a flag on
`SkinparamAccumulator`, and gate EVERY hardcoded default colour constant
(`theme.ts`'s `classBackground: '#F1F1F1'` and siblings, plus
`class-badge.ts`'s spot-colour defaults) on that flag, mirroring
upstream's ColorMapper dark table. This is the highest-effort item in this
report — flagging for a dedicated follow-up mission rather than a quick
fix; shared-seam risk is real (every diagram kind's default palette, not
just class).

**Confidence: HIGH** on the mechanism (missing skinparam key, confirmed
absent by grep) and its wide blast radius. **LOW** on the childCount
residual and on the two OTHER unrelated `svg/@background` mismatches
(sadamo, luzive) — explicitly not explained by this mechanism, flagged
Unclassified.

---

## M7 — Creole `<w>wave</w>` underline has no SVG `<filter>` implementation

**Mechanism.** `beruje-75-jimu270` (`<back:#FFF000>…</back>`, `<s>strike</s>`,
`<w>This is wave</w>`) renders `<back:>` and `<s>` correctly (neither
appears in the diff) but `<w>` (creole wavy-underline) needs an SVG
`<filter>` def (a displacement/turbulence filter, referenced via
`text/@filter="url(#…)"`) that the jar emits and this port doesn't.
Isolated: exactly 2 structural diffs, both directly attributable
(`defs[childCount] 1 vs 0`, `text[3]/@filter` missing).

**Reach (render-verified, zero residual).** `beruje-75-jimu270` (2/2).
NOT the same mechanism as `manube-50-xora983`'s superficially similar
`defs`/`@filter` diffs — manube's `<back:#FF0000> </back>` inside a
`legend`/table row renders as LITERAL TEXT
(`text()[1] act="|<back:#FF0000> </back>| Type A class |"`), i.e. creole
isn't parsed AT ALL inside legend table cells — a structural parsing gap,
not a missing-filter gap, and dominated by a 51-diff geometry cascade
besides. Do not conflate the two; manube is Unclassified for this bucket.

**Fix shape.** A new, self-contained filter emitter (find the SVG
`<filter>` jar emits for `<w>` in the creole atom / styled-string wave-
decoration path, port the def and the `@filter` attribute wiring on the
text element). Low risk — additive, narrow (creole `<w>` marker only), no
shared-seam exposure.

**Confidence: HIGH** on `beruje`'s isolated mechanism. Did not read the
Java filter-emission code (only inferred its existence from the oracle
SVG's `url(#…)` shape) — the EXACT filter primitive (turbulence vs a
squiggle path pattern) is UNVERIFIED; instrument next: read
`SvgGraphics.java`'s wave/filter emission before implementing.

---

## M8 — Creole monospace (`""text""`) font-family: two inconsistent code paths

**M8a: body/member text hardcodes literal `"monospace"`, ignoring
`skinparam defaultMonospacedFontName`.** `nesivu-99-cexu403`
(`skinparam defaultMonospacedFontName Forte; ""This is monospaced""` in a
member row): exactly 1 structural diff, `text[3]/@font-family exp=Forte
act=monospace` — the CSS generic keyword literal, not the configured font
name. Confidence: **HIGH** (1/1 clean, single attribute).

**M8b: classifier-name/title creole monospace (`class ""Test"" as foo4`)
applies no `font-family` at all**, where M8a's body-text path at least
applies the (wrong) literal keyword. `curupe-50-kibu120`: 3/3 structural
diffs, all `font-family exp=monospace act=` (empty) on declaration-name
text nodes for the `""…""`-quoted display names. This confirms the name/
title creole path and the member/body creole path are two SEPARATE call
sites with different (both incomplete) monospace handling. Confidence:
**HIGH** (3/3 clean).

**Fix shape.** M8a: thread `theme.colors.graph.defaultMonospacedFontName ??
'monospace'` (need to add this skinparam key too — same missing-handler
pattern as M2, presence/absence NOT yet confirmed, INSTRUMENT NEXT before
fixing) into the body-text creole-monospace emitter. M8b: find why the
title/name renderer's creole-monospace detection doesn't fire at all
(different code path than body text — likely
`class-declaration-extractors.ts`'s display-name handling vs
`class-member-creole.ts`'s body-text handling) and apply the same
font-family. Both narrow, additive, low risk.

**Confidence: HIGH on both symptoms' isolation; MEDIUM on the fix-shape
detail** (did not locate the title/name creole call site's exact
file:line — instrument next: `grep -n 'monospace' src/diagrams/class/
class-declaration*.ts`).

---

## Flagged, not resolved to mechanism (insufficient budget — report symptom only)

- **fijali-69-pina030** (11/11 structural, clean, single attribute:
  visibility-icon `+` ellipse `fill exp=#84BE84 act=none` on EVERY member
  row). All affected rows follow a `.. interface X ..` member-group
  separator in the source. Strong correlation, mechanism NOT verified —
  did not read `renderer-body-enhanced.ts`'s grouped-vs-ungrouped row code
  path to confirm which value differs. Confidence: **LOW**. Instrument
  next: trace `colorsFor()`'s caller for member rows that sit under a
  `.. label ..` separator vs a bare row.
- **filoxo-23-fafi328** (20/20 structural, but at least 3 independent
  causes tangled in one fixture): a `<style>visibilityIcon{protected{...}}
  </style>` selector not applying (fill/stroke `none`/`#B38D22` vs
  `#B8860B`); a `DarkGoldenRod`->`#B38D22` vs jar's `#B8860B` hex-precision
  drift (a colour-name-table rounding difference, possibly belongs to a
  different bucket entirely); redundant `font-family="SansSerif"` emission
  where the jar leaves the attribute empty (12-count pattern noted in the
  bucket stats, matches here); an unrelated deterministic-vs-static
  filter-id naming difference (`classShadow` vs a content hash — likely a
  `skin rose` skin-file loading detail, not style/colour). Not decomposed
  further. Confidence: **LOW**, needs a dedicated pass.
- **sadamo-18-siva346**, **luzive-62-zote562**: both show a lone
  `svg/@background` mismatch (`#000000` vs `''`/`#FFFFFF`) with NO
  `skinparam mode dark` or `backgroundColor` directive in source —
  confirmed NOT M6. Root cause unknown. Confidence: **UNKNOWN**.

## Cascade-only (zero style-relevant diff in the A3 bucket's own tagging; likely mistagged into A3 by the upstream classifier, real cause lives in another bucket)

`rifuzu-80-nixo780`, `xicipi-57-bibe032`, `zuduxu-90-kosi876`,
`xamule-03-jeda376` — none of their diffs touch `fill`/`stroke`/
`stroke-width`/`stroke-dasharray`/`font-weight`/`font-style`/`font-family`/
`background`/`filter`/`defs` at all (confirmed by scanning every diff's
attribute name across all 133 fixtures' full diff records). Owned by
another bucket (likely A1_order or A5_geometry).

## Unclassified (in-bucket, not individually triaged this pass)

The remaining ~100 A3 slugs not named above were grep/stat-bucketed by
attribute name (347 `fill`, 401 `stroke-width`, 228 `stroke`, 70
`stroke-dasharray`, 51 `font-weight`, 38 `font-style`, 38 `font-family`
diffs total across the bucket) but not individually rendered/root-caused.
Likely candidates for the SAME mechanisms above (M1/M2/M4/M5 especially —
their signature `#181818`/`#000` defaults and `0.5`/`1`/`1.5`/`2`
stroke-width literals recur heavily in the un-triaged remainder per the
aggregate frequency tables), but this was NOT verified fixture-by-fixture
and should not be assumed without rendering each one.

---

## Summary table

| Sub-bucket | Reach (verified/grep) | Confidence |
|---|---|---|
| M1 inline line:/text:/bold/dashed/dotted/##[] unconsumed | 4 fixtures 0-residual + 5 grep | HIGH |
| M2 classFontColor/AttributeFontColor unwired | 2 fixtures 0-residual, 1 partial, 3 grep | HIGH |
| M3 package "X" #color dropped (no AST field) | 2 fixtures 0/1-residual, 2 cascade-hosted | HIGH mech / MED reach |
| M4 gradient bypasses Paint (classifier + dedicated keys) | 2 fixtures near-0, 3 grep/partial | HIGH mech / MED fix-shape |
| M5 icon*Color bypasses hex normalization | 1 fixture 0-residual (36/36), 1 grep | HIGH |
| M6 skinparam mode dark unimplemented | 1 fixture 9/10-residual | HIGH mech / LOW residual |
| M7 creole <w> wave filter missing | 1 fixture 0-residual (2/2) | HIGH |
| M8a monospace ignores defaultMonospacedFontName | 1 fixture 0-residual (1/1) | HIGH |
| M8b title/name creole monospace font-family missing | 1 fixture 0-residual (3/3) | HIGH |
| fijali visibility-icon fill->none after ".." separator | 1 fixture 0-residual, cause unread | LOW |
| filoxo multi-cause (style-selector/hex-drift/font/filter-id) | 1 fixture, 4 tangled causes | LOW |
| Cascade-only (mistagged into A3) | 4 fixtures | n/a |
| Unclassified (not triaged) | ~100 remaining slugs | n/a |
