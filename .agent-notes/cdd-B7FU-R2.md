# CDD B7FU-R2 — class body/nested residual round

Worktree `cdd/b7fu2` (`.claude/worktrees/cdd-b7fu2`), based on `7c5b695b`.

## Item 1 — `isEnhancedBody`'s missing `getEmbeddedType` disjunct

**Mechanism** (already diagnosed by T27FU, row 112; this task applied the
fix): `class-body-enhanced.ts#isEnhancedBody` (java-equivalent
`BodierLikeClassOrObject.java:93-100`, `isBodyEnhanced()`) is missing the
fourth OR-clause, `EmbeddedDiagram.getEmbeddedType(s) != null` (java:96) — a
bare `{{ }}` opener with no separator/tree line still makes a body
"enhanced" upstream. Fixed: one `|| getEmbeddedType(s) !== null` added to
the `.some()` predicate.

**Second mechanism found this task, NOT in any prior note** (diagnosis
before fix): once `isEnhancedBody` was fixed, moxobo/zikabo/gadufu all
newly hit a SIZING/DRAWING asymmetry in `EmbeddedDiagram#calculateDimensionSlow`
(`EmbeddedDiagram.java:126-152`) vs `#drawU` (`java:165-195`). Both branch on
`ug.matchesProperty("SVG")`: the LAYOUT pass's `StringBounder` never carries
that hint in this port's deterministic oracle-render environment (an
AWT/`PortableImage`-oriented measurer, `getImage`->`SImageIO.read`, always
throws headless) so `calculateDimensionSlow` ALWAYS falls to its `catch` ->
`(42, 42)` (java:150); the SEPARATE draw-pass `UGraphic` DOES carry the SVG
hint and ALWAYS succeeds, drawing the real recursively-rendered image.
**Origin**: `EmbeddedDiagram.java:129-133` (`matchesProperty("SVG")` check,
sizing pass) vs `:169-176` (same check, draw pass) — two independent checks
against contexts that disagree in this environment. **Causal chain**:
sizing pass fails -> (42,42); draw pass succeeds -> real image; box
geometry (width/height, and inter-embed Y-stacking) is computed from the
FAILED pass, so it stays small while the drawn image overflows it. **Ruled
out**: a bug in this port's own embed-extraction/rendering code (proven
wrong by first building `EmbeddedBlockGeo` from the REAL rendered
dimensions — moxobo's image landed byte-exact at 43x54, but the CLASSIFIER
BOX came out too big/wrong-shaped vs jar); a per-fixture inconsistency
(confirmed identical across THREE independent fixtures with a single
universal formula, zero fitting: box width == `42 + 2*BODY_ENHANCED_MARGIN_X`,
box height contribution == `42` per embed, always). **Confidence**: High
(3-fixture arithmetic match, T27's own prior gadufu-only finding
corroborates one instance of the same mechanism).

**Fix**: `EmbeddedBlockGeo` now carries TWO dimension pairs —
`width`/`height` (the DRAWN `<image>`'s real dimensions) and
`sizingWidth`/`sizingHeight` (ALWAYS `EMBEDDED_FALLBACK_SIZE=42`, used for
box geometry AND inter-embed Y-stacking, matching
`MethodsOrFieldsArea#drawU`'s own `embedded.calculateDimension(...)
.getHeight()` re-read at translate time, java:436 — the SAME memoized/
fallback value, not the real one). `class-body-enhanced-layout.ts`'s
`embedsWidth`/`embedsHeight` now sum `sizingWidth`/`sizingHeight`, with the
SAME `BODY_ENHANCED_MARGIN_X*2` margin `sectionWidth` already bakes in for
member rows (algebraically: margin distributes over `Math.max` the same
whichever operand it's applied to first).

**Files**: `class-body-enhanced.ts`, `class-body-enhanced-embeds.ts`,
`class-body-enhanced-layout.ts`.

**Readings**: moxobo-16-tipo829 1+43 -> **0+0 CONFORMANT**. zikabo-17-
gugi332 1+43 -> 0+4 (box byte-exact; canvas-ink residual, see below).
gadufu-56-votu808 0+5 -> 0+4 (box height 168->114 now byte-exact; residual
is a DIFFERENT, already-named mechanism — the drawn image's own Δ12/Δ11,
an out-of-scope ACTIVITY-engine Cyrillic-text-measurement gap T27 already
identified, PLUS the same canvas-ink issue below).

## Canvas-ink-extent gap (zikabo/gadufu residual) — STOP 1, not fixed

**Mechanism**: the outer `<svg>` canvas width/height for a class diagram is
computed via a real `LimitFinder`-style ink walk (`class-ink-box.ts
#buildInkBox` + `class-ink-shapes.ts`'s per-shape `addXInk` rules,
consumed by `layout.ts#computeClassDocumentDims`), NOT from a full re-scan
of drawn primitives. `class-ink-shapes.ts#addRectInk` only reaches
`c.x + (c.bodyInkWidth ?? c.width)` for X (an EXISTING override field,
`ClassifierGeo.bodyInkWidth`, `class-geo-types.ts:284`) and `c.y + c.height`
for Y (NO override capability exists for Y at all). An embed that overflows
its own classifier box (per the sizing/drawing asymmetry above) is
therefore invisible to the ink walk on BOTH axes. **Origin**: `class-ink-
shapes.ts#addRectInk` (no embed-aware ink rule), `class-ink-box.ts`'s
per-classifier ink loop (never calls one), and `class-layout-generic-
classifier.ts` (never sets `bodyInkWidth` for a class engine's — as opposed
to object engine's — enhanced body with embeds; `class-object-sizing.ts:180`
already does this for OBJECT diagrams, `bodyInkWidth: enhancedBody.width` —
but `enhancedBody.width` is now ALSO sizing-only, so even the object path
would need a similar audit). **Causal chain**: canvas stays sized to the
classifier's own (correctly small) box, so the real drawn image is clipped/
overflows the canvas silently. **Jar's own formula** (jar-verified, not
fitted): canvas = (rightmost/bottommost real-image pixel) + 1 — zikabo:
image x=13,width=67 -> 80, canvas width 81 (81=80+1); gadufu: image y=75,
height=107 -> 182, canvas height 183 (183=182+1).

**Ruled out**: a bug in the embed drawing itself (image width/height/href
are byte-exact where reachable); a bug in `class-body-enhanced-layout.ts`'s
OWN sizing math (verified byte-exact against jar's box dimensions on all
three fixtures).

**Why not fixed here**: needs a NEW height-ink override capability (no
analog of `bodyInkWidth` exists for Y at all) plus a NEW ink rule in
`class-ink-shapes.ts`, wired from `class-ink-box.ts`'s per-classifier loop,
fed by a NEW value `class-layout-generic-classifier.ts` would need to
compute from `enhancedBody`'s embeds. None of `class-ink-box.ts`,
`class-ink-shapes.ts`, `class-layout-generic-classifier.ts` are in this
task's write-set. Per README stop condition 1 ("record the exact file and
need, finish the rest"), recorded here and in
`tests/unit/class/class-body-embedded-diagram-conformance.test.ts`'s
trailing `it.todo`, not edited.

## Item 2 — chrome `{{ }}` nested-renderer wiring (bixogo/roxosu)

**Landed**: `class-nested-diagram-renderer.ts` gained a SECOND registration
slot (`registerChromeNestedDiagramRenderer`/`getChromeNestedDiagramRenderer`,
sharing `createNestedDiagramRenderer`'s render/strip-PI/measure/depth-guard
logic and its module-level recursion counter with the class-body slot — a
chrome legend embedding a class diagram whose body embeds another `{{ }}`
is one real recursion chain and must share one bound). `blocks-creole.ts
#blockedEmbeddedRenderer` now returns the registered renderer when present,
else the original unconditional throw (caught by `EmbeddedDiagram.ts`'s own
`calculateDimensionSlow`/`drawU`, degrading to `(42,42)`/draw-nothing,
matching upstream `EmbeddedDiagram.java:148-152/191-193`). `src/index.ts
#prepareBlock` registers BOTH slots via one new `registerNestedDiagramRenderers`
helper (kept `index.ts` at its pre-existing 516-line count exactly — the
hook's file-length check is directional, an already-oversized file may
still be edited as long as it doesn't grow past its prior size).

**Readings**: bixogo-47-xulu385/roxosu-00-pini153 UNCHANGED (1+4 both). NOT
a wiring failure: `{{salt ... }}` (a preprocessor-macro-expanded user
procedure, confirmed via direct instrumentation — the macro DOES expand
correctly to real salt markup before reaching the renderer) dispatches to
no engine (`this port has no salt engine`), `renderSync` returns an
"Error: unknown diagram type" page with NO `viewBox` attribute (a
DIFFERENT, simpler error-page shape than a normal diagram export), so
`readSvgDimensions` throws — caught by the SAME upstream
`EmbeddedDiagram.ts` catch, degrading to `(42,42)`, IDENTICAL to the
pre-wiring behavior (throw -> same catch -> same fallback). **Verified the
wiring itself is genuinely live and correct**: a synthetic legend embedding
a SUPPORTED type (`{{ file f }}`) draws a real, byte-exact `<image>` (unit
test `tests/unit/annotations-blocks-creole.test.ts`, new describe block).
**Residual**: named-open, "missing salt engine", jar's own `<image>` w/h is
the eventual target (not probed — no salt engine to compare against; would
need a NEW diagram engine, far outside this task).

## Item 3 — class NOTE `{{ }}` regions (xadado-92-lazo250)

**Mechanism**: identical sizing/drawing asymmetry as item 1's class-body
case, confirmed independently for NOTES: `note-layout-measure-rows.ts
#consumeEmbeddedRow`'s `UNWIRED_NESTED_RENDERER` (R2b's original,
deliberately-unwired stub) already produces exactly the `(42,42)` sizing
fallback upstream's own sizing pass produces in this environment — r2b's
2026-08-05 finding (jar box == `(42+6+15) x (42+13+2*5)`) is STILL
correct, matching the CURRENT cache's own `xadado-92-lazo250` box
dimensions (63x65) byte-exact — but the CURRENT cache's drawn images are
real (122x124 sequence render, 105x96 class render), NOT r2b's originally-
assumed full 42x42 placeholder. R2b's finding was about SIZING only; this
task's re-probe of the CURRENT cache shows drawing is real, exactly
mirroring item 1's class-body finding.

**Fix**: kept `consumeEmbeddedRow`'s SIZING (`dim`/`row.width`/`row.height`)
UNCHANGED (still the `UNWIRED_NESTED_RENDERER` fallback, matching jar's own
sizing-pass failure) and ADDED a real DRAWING atom: `buildEmbeddedNoteImageAtom`
calls the SAME registered `getClassNestedDiagramRenderer()` (module-level
singleton T27FU/this task's item 1-2 already populate) to build ONE
`{kind:'image', href, width, height}` `MemberRenderAtom`, reusing
`renderer-note.ts`'s ALREADY-EXISTING generic `'image'`-atom draw branch
(no renderer-side change needed — that file already handles this atom
kind, just was never fed one for an embedded-diagram region).

**Files**: `note-layout-measure-rows.ts` only.

**Readings**: xadado-92-lazo250 3 structural/340 numeric -> 1 structural/344
numeric. Both CLOSED structural diffs were exactly the two missing
`<image>` elements (jar childCount 4/4 for the two note entities, ours was
3/3 before, now 4/4); both images' own WIDTH/HEIGHT are byte-exact (122x124,
105x96) — the +4 numeric is the two images' OWN X/Y position, which
inherits the SAME pre-existing, large (Δ11-Δ109), UNRELATED positional
drift affecting EVERY other element in this fixture (a component-cluster/
DOT-layout divergence that predates this task and is out of its write-set
— `class-dot-graph.ts`/`class-namespace-*.ts` own that area, neither
listed). xadado is NOT ratchet-pinned (`oracle/goldens/svg-class/
ratchet.json` has no entry) — no rise risk. The remaining 1 structural diff
(`g[1]` cluster childCount 5 vs 3) is that SAME unrelated cluster issue,
confirmed pre-existing (present before this task's change too).

## Item 4 — rotisi-30-loge424

**(c) Row-baseline bottom-anchoring — FIXED, numeric 9 -> 0.** Diagnosis:
`class-body-enhanced-layout.ts#buildRowsBlockRows`'s row `y` (text
baseline, which `renderer-classifier-rows.ts#renderRowAtoms`'s sprite atom
placement ALSO anchors off of via its own `lineBottomY = y + fontSize/4.5`
formula) was computed `rowTop + baselineOffset` — a FLAT, TOP-anchored
offset that assumes every row is exactly `fontSpec.size` tall. A2s R2i
already fixed the row HEIGHT to be atom-aware (`MemberRowBuild.height`,
taller for a 15px sprite scaled `fontSize/13`=16.1538, shorter for a 2x2
`$point` sprite scaled the same way=2.1538) but left `y` on the OLD flat
formula, so a row whose real height differs from `fontSpec.size` still
baselines as if it were exactly that tall. **Origin**:
`class-body-enhanced-layout.ts:229` (pre-fix). **Causal chain**: the
row-height fix changed inter-row SPACING (divider-to-divider gaps, already
byte-exact both before and after this task, confirmed) but not the row's
OWN internal baseline, so any atom whose draw position derives from `y`
(here, every sprite `<image>`) lands off by exactly `height - fontSpec.size`.
**Ruled out**: a row-height/stacking bug (divider Y positions matched jar
byte-exact BEFORE this fix too — only the sprite `<image>` Y, i.e. the
POSITION WITHIN the row, was wrong); a per-sprite-size-dependent constant
(the SAME single formula, `y = rowTop + height - (fontSize -
baselineOffset)`, explains BOTH an over-shoot direction for the six
16.1538-tall rows (Δ+2.1538 needed) and an under-shoot direction for the
one 2.1538-tall row (Δ-11.8462 needed), zero fitting, one rule).
**Fix**: bottom-anchor `y` to the row's own real height instead of a flat
offset — identical to the old formula whenever `height === fontSpec.size`
(every text-only row, zero behavior change; full 149-file class unit-test
suite green after the change, 2425 tests).

**(a) Class-name-as-sprite header text draws `<text> </text>` (a space),
not an `<image>` — STOP 1, not fixed.** Mechanism: `class-layout-header-
creole.ts#buildHeaderLine` calls `buildLineAtoms(line, font,
CreoleMode.FULL_BUT_UNDERSCORE)` for the classifier's NAME line; for
`class "<$bug16>" as foo1`, the resolved header row's `atoms` field comes
back `undefined` (not an `'image'`-kind atom), so `renderer-classifier-
rows.ts#renderRowText` (this task's OWN write-set, already CORRECT: `if
(row.atoms !== undefined) return renderRowAtoms(...)`) falls to its plain-
text branch with `row.text = ' '` (a blank-row placeholder). **Origin**:
`class-layout-header-creole.ts#buildHeaderLine` / `class-layout-header-
geo.ts#computeHeaderNameGeo` (neither in this task's write-set) — the
header-name creole build path does not resolve a sprite-only name into an
image atom the way `class-member-creole.ts#buildMemberRow` already does for
member/enhanced-body text. **Ruled out**: a renderer-side bug (`renderRowText`/
`renderRowAtoms` already dispatch correctly on `atoms !== undefined`,
proven by every OTHER sprite atom in this SAME fixture, e.g. the enhanced
body's own six sprite rows, all now byte-exact per item (c) above).

**(b) `<<($bug16,red)>>` stereotype sprite badge draws the DEFAULT
circled-checkmark badge instead — STOP 1, not fixed.** Mechanism:
`src/core/stereotype-decoration.ts#parseCircledSpriteDecoration` (a
correctly-ported `StereotypeDecoration#buildComplex`'s `mCircleSprite`
branch, java:190-201, already handles the sprite+colour combined form) is
called from `class-layout-header-creole.ts:91` (LAYOUT/sizing only) but the
resulting sprite-badge geometry is never copied from `MeasuredClassifier`
into `ClassifierGeo` (`class-geo-types.ts` has `badgeChar`/`badgeColor`,
the CHAR-badge fields, but no sprite-badge equivalent) and never drawn —
`renderer-classifier-box.ts#buildHeaderPrimitive` (this task's OWN
write-set) unconditionally calls `renderBadge(geo, theme)` (the DEFAULT
green-circle-checkmark badge) whenever `hasBadge(geo.kind)`, with no check
for whether a sprite-badge decoration should draw INSTEAD. **Origin**:
`class-layout-header-geo.ts`/`class-geo-builders.ts` (neither in write-set
— the missing field-copy step) is the root; `renderer-classifier-box.ts:251`
(in write-set) is where the WRONG default badge gets drawn regardless.
**Why not fixed here**: closing this needs a new field threaded through
`class-layout-header-geo.ts` -> `class-geo-builders.ts` (copies
`MeasuredClassifier` -> `ClassifierGeo`, not in write-set) before
`renderer-classifier-box.ts` could even conditionally suppress/replace the
default badge — a partial fix (suppress-only, no replacement) would trade
one wrong-shape structural diff for a same-magnitude missing-element diff,
not a genuine improvement, so left unattempted per CLAUDE.md ("never fit a
value" / do not paper over with a worse partial change).

**Readings**: rotisi-30-loge424 2 structural + 9 numeric -> **2 structural
+ 0 numeric**. Both remaining structural diffs pre-date this task and are
independently diagnosed above (a, b) — NOT movers from this task's own
change (verified: the row-baseline fix at (c) touches only `y`, not
`atoms`/`text`, on any row).

## Item 5 — nucite-98-kuga991 / nufini-44-jofo787 (`MaximumWidth` wrap)

**Mechanism, fully diagnosed, NOT fixed (stop 1)**: BOTH fixtures'
ENTIRE residual is the classifier NAME/header text failing to word-wrap at
`<style> class { MaximumWidth N }`, while MEMBER-row wrap (already ported,
`class-member-creole.ts#buildWrappedMemberRows`, the Fission engine) and
NOTE wrap (already ported, `note-layout-measure.ts`) are BOTH already
correct — confirmed by identifying every entity in each fixture (`C1`
header-only, `C2` member-wrap, `GMN3`/`N1` notes) and finding the survey
diff concentrated ENTIRELY in `C1`'s own header group; `C2`/`GMN3`/`N1` are
byte-identical to the jar already. **Origin**: `class-layout-header-
creole.ts#buildHeaderLine` (java target already cited in this file's OWN
doc comment: `EntityImageClassHeader.java:107-108`,
`display.create8(fontConfigurationName, CENTER, skinParam,
CreoleMode.FULL_BUT_UNDERSCORE, wrapWidth)` — note the `wrapWidth`
PARAMETER the citation itself names) calls `buildLineAtoms(line, font,
CreoleMode.FULL_BUT_UNDERSCORE)` with NO wrap-width argument at all — the
upstream signature's `wrapWidth` term is simply never threaded through.
**Ruled out**: a `<style>` cascade-resolution bug (member/note wrap prove
the `MaximumWidth` VALUE itself resolves correctly elsewhere in the SAME
fixture); a `class-member-creole.ts` gap (that file's OWN
`buildWrappedMemberRows`/Fission engine already does this correctly for
member rows — the header path never calls it at all, a separate,
un-threaded call site, not a shared, broken primitive).
**Why not fixed here**: `class-layout-header-creole.ts`/`class-layout-
header-geo.ts` (where `computeHeaderNameGeo` would need to resolve/pass a
`maxWidth` the SAME way `class-body-enhanced-layout.ts#buildRowsBlockRows`
already receives one for enhanced bodies) are not in this task's write-set.
The fix shape (for whoever owns those files): reuse `class-member-
creole.ts#buildWrappedMemberRows`'s existing Fission-based wrap engine,
called from `computeHeaderNameGeo` with the classifier's own resolved
`MaximumWidth` cascade value, mirroring how member rows already receive
theirs.

**Readings**: nucite-98-kuga991 10+7 -> **10+7 unmoved** (as expected —
`class-body-enhanced*.ts`/`note-layout-measure*.ts` were read, not edited,
for this item; confirmed no incidental change from items 1/3/4's edits).
nufini-44-jofo787 8+5 -> **8+5 unmoved**, same reason.

## Item 6 — gadufu-56-votu808, named-open (no fix, per the brief)

Recorded per the brief's own instruction. T27's original mechanism
(`.agent-notes/cdd-T27.md`, "Remaining gadufu residual") still holds for
the DRAWN image's own size: jar's `<image>` is 133x107 (a real ACTIVITY-
engine render of Cyrillic text, `:Использовать;`), ours draws 121x96 (the
SAME activity engine, byte-exact structurally, differing only in its own
internal Cyrillic-text measurement) — an ACTIVITY-engine gap, outside this
task's (class-engine) write-set, not chased. This task's OWN fix (item 1)
already resolved gadufu's BOX-height mismatch (168->114, now byte-exact)
by applying the sizing/drawing asymmetry fix uniformly; the residual
image-size Δ12/Δ11 plus the (newly-visible, same-mechanism-as-zikabo)
canvas-ink-extent gap are what remain, both named above.

## Bonus finding, NOT fixed (outside this task's items, write-set-blocked)

**`class-member-rows.ts#buildSectionRows`'s CLASSIC (non-enhanced-body)
member-row baseline has the IDENTICAL bottom-anchoring bug item 4(c) fixed
for the enhanced-body path** — `y = sectionTop + SECTION_MARGIN_TOP +
rowTop + baselineOffset` (line 308), the SAME flat top-anchored formula
`class-body-enhanced-layout.ts` carried before this task's fix. Found via
T26's own row 127 journal entry ("malara-55-moce209... 2 remaining numeric
diffs (`text[3]/@y`, `image[1]/@y`, both Δ11.846)... a pre-existing,
unrelated row-height cascade... named, not chased") — Δ11.846 matches
EXACTLY the same undershoot magnitude item 4(c) derived for a small
(shorter-than-font) sprite row (`class Foo { Test <$bug16>\nTest <$demo>
}`, no separator/tree/embed line, so this is the CLASSIC compartment path,
not the enhanced-body one this task's item 4 already fixed). Re-measured
on this task's tree: malara-55-moce209 UNCHANGED (0 structural / 2 numeric,
both Δ11.846), confirming item 4(c)'s fix (scoped to `class-body-enhanced-
layout.ts` only) does not reach this path, as expected.

**Not fixed**: `SectionRowContext` (`class-member-rows.ts`, in this task's
write-set) has no `fontSpec`/font-size field to compute the SAME
`bottomAnchor = fontSize - baselineOffset` term with — the ONE caller that
constructs it, `class-layout-generic-classifier.ts:356`, is NOT in this
task's write-set, so widening the interface would need a change outside
it. Recorded here rather than attempted partially (an optional field
defaulting to "no change" would be dead code no caller ever sets).
**Fix shape for whoever owns `class-layout-generic-classifier.ts`**: add a
`fontSize`/`fontSpec` field to `SectionRowContext`, thread the SAME
`fontSpec.size` already available at that call site (it already resolves
`baselineOffset` from the SAME header/stereo geometry), and apply `y =
sectionTop + SECTION_MARGIN_TOP + rowTop + build.height - (fontSize -
baselineOffset)` in `buildSectionRows`, mirroring `class-body-enhanced-
layout.ts`'s own fix exactly.

## Cross-cutting non-class-engine check

Ran the full suite (`npm test`) after all edits — see the commit-by-commit
gate log below. No non-class golden/ratchet/census file changed; the
touched files (`blocks-creole.ts`, `src/index.ts`, `EmbeddedDiagram.ts`
untouched) are shared by state/sequence/description chrome, so this was
specifically checked, not assumed.
