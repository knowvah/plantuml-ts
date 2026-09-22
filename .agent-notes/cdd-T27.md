# CDD T27 — nested `{{ }}` diagram renderer

## Diagnosis (mechanism, before any fix)

**Symptom:** moxobo-16-tipo829 / zikabo-17-gugi332 / gadufu-56-votu808 (class
BODY `{{ }}` embeds) diverge from the oracle by 1 structural + 43/43/3
numeric diffs (unchanged before/after this task — see "Readings" below).

**Mechanism, with `file:line`:** `src/diagrams/class/parser.ts
#handlePendingBodyLine` (~line 157-193) is the ONLY consumer of a line
inside an open `class C { ... }` body. It has no `getEmbeddedType`/embedded-
block detection at all — every line, including each line of a `{{ ... }}`
block, is parsed individually via `class-member-parser.ts#parseMemberLine`
(line 184: `const member = classifier.kind === 'object' ? parseObjectField
(line) : parseMemberLine(line)`). Confirmed directly: rendering
moxobo-16-tipo829 today emits
`<text ...>{{</text><text ...>file f</text><text ...>}}</text>` — three
literal text rows, one per source line, each with its own divider — not an
`<image>`.

**Origin:** `src/diagrams/class/parser.ts:165-193` (`handlePendingBodyLine`),
checked BEFORE `continueMultilineElement` in the main loop
(`parser.ts:305-309`), so a line inside an open BRACE body never reaches
`class-multiline-element.ts`/`class-embedded-block.ts` at all — those two
files (T27's assigned write-set) only fire for TYPE0/TYPE1 `[ ... ]`/
`as "..."` descriptive-leaf bodies (`state.pendingMultilineElement`, opened
by `tryOpenMultilineElement`), a DIFFERENT syntax from `class C { {{ ... }}
}`. Verified directly against `tests/unit/class/class-multiline-element-
embedded-block.test.ts`: even ON that covered path, the embedded region is
kept as raw, UNRENDERED display text (`expect(classifier(ast, 'A')
?.display).toBe('{{\nrectangle FailCase [\n...')`) — scanning only, never
rendering, confirming the write-set's two named files were never going to
produce an `<image>` regardless of which body-opening syntax reaches them.

**A second, independent finding, corroborating the first:** `core/
cucadiagram/MethodsOrFieldsArea.ts` (the file T27's brief and D9 both name
as "what a class-body embed reaches") is DEAD CODE for class-body
rendering. Grepped every real (non-doc, non-type-only) import of
`MethodsOrFieldsArea`/`BodyEnhanced1`/`BodierLikeClassOrObject` in `src/`:
the only production consumer is `src/diagrams/class/class-port-rows.ts:325`,
which reuses `MethodsOrFieldsArea.prototype.getElected` as a pure static
utility (the port-abbreviation algorithm) — it never constructs a
`MethodsOrFieldsArea` instance, never reaches `calculateDimensionSlow`/
`drawU`, and never touches `nestedDiagramRenderer`. `leaf-sizing-folder-
title.ts` imports only the CONFIG interface types (`import type`). Nothing
under `src/diagrams/` constructs `new MethodsOrFieldsArea(...)` in
production. This matches ADR-5 (`MethodsOrFieldsArea.ts:188,373`,
`BodierLikeClassOrObject.ts:200`, `Member.ts:24`, `class-shield-
helpers.ts:36`): "the class engine's parser.ts (ADR-5 — that fork is NOT
touched here)" is a standing, pre-existing project ruling, not something
this task discovered as new policy — it is the SAME fact this task's own
mechanism search re-confirms from a different angle (dead-code grep vs.
parser-flow trace).

**Ruled out:** that `class-embedded-block.ts`/`class-multiline-element.ts`
were simply mis-wired (they are not wired at all to brace bodies — verified
by reading `parser.ts`'s main loop, which checks `handlePendingBodyLine`
strictly before `continueMultilineElement`, so the latter never even sees a
line while `pendingBodyId !== null`); that `MethodsOrFieldsArea.ts` needed a
source change to accept a real renderer (it already accepts one —
`MethodsOrFieldsAreaConfig.nestedDiagramRenderer`, exercised with a MOCK in
`tests/unit/core/cucadiagram/MethodsOrFieldsArea.test.ts:249-268` — the gap
is that nothing in `src/diagrams/` ever constructs the config object at
all, confirmed by the import grep above).

## Consequence: task premise vs. write-set (stop condition 1)

D9's stated mechanism ("`core/cucadiagram/MethodsOrFieldsArea.ts:134-140`
throws" when it "meets" a class-body embed) is accurate for
`MethodsOrFieldsArea.ts` in isolation, but the task brief's claim that
moxobo/zikabo/gadufu "reach `MethodsOrFieldsArea` directly" is FALSE — they
never reach it, because the class engine's `parser.ts` fork never
constructs one. Supplying a `NestedDiagramRenderer` to
`MethodsOrFieldsAreaConfig` (task item 4) is therefore necessary-but-not-
sufficient: the config the brief describes wiring has NO real producer to
wire it into anywhere in `src/diagrams/class/`.

Making moxobo/zikabo/gadufu actually render one `<image>` per `{{ }}` block
needs edits to files OUTSIDE this task's write-set:

1. **`src/diagrams/class/parser.ts#handlePendingBodyLine`** (~line 165-193):
   needs a `getEmbeddedType`/`scanEmbeddedElementBlock`-style check BEFORE
   the `parseMemberLine`/`parseObjectField` call, mirroring
   `continueMultilineElement`'s own check, to detect an embedded-block
   opener while `state.pendingBodyId` is set, consume the whole region
   (reusing `class-embedded-block.ts#scanEmbeddedElementBlock`, already in
   this task's write-set and already correct for this purpose), and push
   ONE marker (a new `Member` variant, or a dedicated field on `Classifier`)
   instead of N raw members.
2. **At least one class-body geometry/render file** — `class-body-enhanced-
   geometry.ts`/`class-body-enhanced-layout.ts` (sizing) and `renderer-
   body-enhanced.ts`/`renderer-classifier-box.ts`/`class-member-rows.ts`
   (drawing) — needs to recognize that marker and emit an `<image>` sized
   from a REAL nested render, instead of a text row.
3. **A renderSync-injection seam above the class engine.** `renderSync`
   (`src/index.ts:394`) sits ABOVE the class engine in the module graph (it
   imports the class engine via the plugin registry to dispatch `@startuml`
   class bodies); nothing under `src/diagrams/class/` can import
   `src/index.js` directly without a real circular import
   (`class/*.ts -> index.js -> plugin registry -> class/*.ts`). The
   renderer this task built (`class-nested-diagram-renderer.ts`) already
   solves this by taking `renderFn` as an injected parameter rather than
   importing `renderSync` itself — but SOMETHING above `src/index.ts` in
   the call graph must construct `createNestedDiagramRenderer(renderSync)`
   and thread it down through `layoutSync`/`prepareBlock` to wherever (1)
   and (2) live. `src/index.ts` itself is the natural place to do this
   (constructing the renderer once per render call, closing over its own
   `renderSync`), but `src/index.ts` is not in this task's write-set either.

This is "genuinely large AND separable" (CLAUDE.md's own bar for a
deferral): three files spanning the parser, the layout/render pipeline, and
the top-level render entry point, none of which this task's write-set
lists. Filed as a follow-on (see `next-missions.md` filing below) rather
than edited here, per README stop condition 1 ("record the exact file and
one-line change, do not edit it") and the task's own boundary note (same
instruction, given for the narrower "avoiding a circular import" case —
applied here to the wider finding it turned out to describe).

## What WAS built and verified in-write-set

- `src/diagrams/class/class-nested-diagram-renderer.ts` (new file,
  explicitly pre-authorized by the task brief: "a new file under
  `src/diagrams/class/` is inside your write-set by the spec's intent").
  A REAL `NestedDiagramRenderer` (`core/EmbeddedDiagram.ts`'s seam):
  renders the collected lines through an INJECTED `renderFn`
  (`renderSync`-shaped, never imported directly — avoids the circular
  import described above), strips `<?plantuml ...?>` PIs
  (`EmbeddedDiagram.java:199`), and wraps the result as a `data:image/
  svg+xml;base64` `<image>` sized from the nested render's own `viewBox`.
- `EmbeddedDiagramDepthError` + `MAX_NESTED_DIAGRAM_DEPTH` (=24, a
  port-introduced safety net — no upstream citation exists; upstream has no
  equivalent bound and would simply overflow the JVM stack). Recursion is
  guarded via a closure-scoped depth counter, incremented before calling
  `renderFn` and decremented in `finally`.
- `tests/unit/class/class-nested-diagram-renderer.test.ts` (8 real tests,
  all passing, using REAL `renderSync` — not mocks):
  - dimension extraction matches `renderSync`'s own `viewBox`;
  - `drawU` emits exactly one `<image>` whose href decodes to the exact
    PI-stripped nested SVG, width/height matching;
  - wired through a REAL `EmbeddedDiagram` instance (the exact seam
    `MethodsOrFieldsArea.ts` consumes) — proves the full contract with no
    mock;
  - recursion guard: throws `EmbeddedDiagramDepthError` at the configured
    bound, names itself correctly, reports the bound in its message, resets
    cleanly after a caught error (proven via call-count accounting), and
    the default bound is `MAX_NESTED_DIAGRAM_DEPTH`.
  - Two `it.todo()` entries (this repo's established precedent,
    `tests/unit/creole-url-sprite-scale.test.ts:207`) documenting exactly
    what full `renderSync(moxobo source)` conformance and a real
    self-embedding `.puml` fixture would need — NOT marked passing, NOT
    silently dropped.
- `DIVERGENCES.md`: new entry "Embedded `{{ }}` sub-diagrams — SVG source,
  not a re-encoded raster (deliberate, CDD T27)", mirroring the "Sprite and
  `img` rasters" entry's shape, including an explicit "Status" paragraph
  stating the renderer is unwired as of this task.

## Readings (before -> after, `render-diff.mts`)

Identical before and after — this task added no code to any file in the
production render call graph (the new renderer file has zero production
importers); `MethodsOrFieldsArea.ts`/`class-embedded-block.ts`/
`class-multiline-element.ts` were read but not edited (no in-write-set
change was needed or possible without the out-of-scope wiring above).

| slug | structural | numeric | verdict |
|---|---|---|---|
| moxobo-16-tipo829 | 1 | 43 | unchanged; class-body embed, needs the wiring above |
| zikabo-17-gugi332 | 1 | 43 | unchanged; class-body embed, needs the wiring above |
| gadufu-56-votu808 | 1 | 3 | unchanged; class-body embed (tree/subsection), needs the wiring above |
| bixogo-47-xulu385 | 1 | 47 | unchanged; legend/chrome path, pending T28 (unaffected by this task, as instructed) |
| roxosu-00-pini153 | 1 | 47 | unchanged; legend/chrome path, pending T28 (unaffected by this task, as instructed) |

None of the five fixtures' dimensions can be compared against the jar's
per-embed geometry yet, because none of them currently construct an
`EmbeddedDiagram`/nested render at all (moxobo/zikabo/gadufu render three
literal text rows instead; bixogo/roxosu never reach a `{{ }}` detector on
the legend/chrome path per T28's own scope). The renderer built here DOES
produce jar-shaped geometry when driven directly (proven in the new test
file against `renderSync`'s own output), but "does the WIRED renderer match
the jar's per-fixture width/height" cannot be answered until the follow-on
wiring lands — recorded here as an explicit open question, not a false
conformance claim.

## Correcting `.agent-notes/r2b-embedded-42x42.md` (stale)

r2b's finding — "the jar takes the 42x42 catch fallback in the oracle
env, so class goldens encode the FALLBACK size, not a real nested render"
— was true for the OLDER cache it probed (xadado-92-lazo250, R2b/A2s
round 2, 2026-08-05) but is FALSE for the CURRENT cache used by this
mission. Direct evidence, this task: `test-results/dot-cache/class/
moxobo-16-tipo829/in.svg` contains `<image width="43" height="54" x="13"
y="43" xlink:href="data:image/svg+xml;base64,...">`; base64-decoding that
payload yields a REAL nested SVG (`<svg height="54" width="43" ...><g
...><!--entity f--><g class="entity" data-qualified-name="f" ...><path
.../><text ...>f</text></g></g></svg>`) — a genuine `file f` render (a
folder/artifact-shaped entity glyph plus its label), not a fixed 42x42
box. Cross-checked zikabo (67x64 at 13,57) and gadufu (133x107 at 13,75)
similarly. See the corrected journal row below. The mechanism r2b
documented (the `catch` -> `XDimension2D(42, 42)` fallback,
`EmbeddedDiagram.java:150-152`) is still correctly ported
(`core/EmbeddedDiagram.ts:409-421`, exercised by
`tests/unit/core/EmbeddedDiagram.test.ts`'s "a renderer failure degrades to
the fixed (42, 42) placeholder" test) — it is simply not what THIS cache's
class-body fixtures exercise; `xetase-70-zaza808`
(`.agent-notes/xetase-embedded-diagram-label.md`) is the fixture that
genuinely does hit the fallback (an unterminated `{{` in a state edge
label), and remains correctly out of this task's scope.

## Follow-on filing (SUPERSEDED by CDD T27FU below — kept for history)

Filed to `next-missions.md`-style scope (recommend a new task, e.g.
"cdd-T27fu — wire the class-body embedded-diagram renderer"), write-set:
`src/diagrams/class/parser.ts`, `src/diagrams/class/class-body-enhanced-
geometry.ts` and/or `class-body-enhanced-layout.ts`, one of `renderer-
body-enhanced.ts`/`renderer-classifier-box.ts`/`class-member-rows.ts`,
`src/index.ts` (renderer construction + threading), plus the three
fixtures' test files. This task's renderer
(`class-nested-diagram-renderer.ts`) and its `NestedDiagramRenderer`/
`EmbeddedDiagramDepthError` exports are ready for that task to consume
without modification.

---

# CDD T27FU — resumed: wire the mechanism end-to-end

Stop 1 accepted and resolved (journal row 111, main tree): write-set
extended with `src/diagrams/class/parser.ts` (narrowly — see below),
`class-member-rows.ts`, `class-body-enhanced-layout.ts`, `class-body-
enhanced-geometry.ts`, `renderer-body-enhanced.ts`, `renderer-classifier-
box.ts`, and a `renderSync` seam in `src/index.ts`. EXCLUDED: `class-body-
enhanced.ts`, `class-member-creole.ts` (T24 editing concurrently).

## Corrected mechanism: the jar's REAL dispatch, read from `BodyEnhanced1.java`

The coordinator's brief (and my own earlier note above) named
`MethodsOrFieldsArea.java:109-123/141-152/429-440` as "the jar's
mechanism" — accurate in isolation, but I initially assumed that meant
`MethodsOrFieldsArea` is used DIRECTLY by the class-body render path for
an embed-bearing classifier. Reading `BodyEnhanced1.java` (java:122-195,
`getArea`/`buildTextBlock`) directly disproves that: `BodierLikeClassOrObject
#getBody` (java:214-255) routes to `BodyEnhanced1`/`BodyFactory.create1`
whenever `type.isLikeClass() && isBodyEnhanced()` — and `isBodyEnhanced()`
(`BodierLikeClassOrObject.java:93-100`) is TRUE for ALL THREE of moxobo/
zikabo/gadufu, because `EmbeddedDiagram.getEmbeddedType(s) != null` is
ONE of its four OR-conditions (java:96) — a `{{ }}` block alone makes a
body "enhanced," with NO separator/tree line required. `BodyEnhanced1
#buildTextBlock` (java:189-195) then constructs, PER ROWS-BLOCK (not per
classifier), `new MethodsOrFieldsArea(display, skinParam, align, entity,
style)` — THAT is where the java:109-123/141-152/429-440 mechanism
actually runs. This port's analog of "one rows-block" is `class-body-
enhanced-layout.ts#buildRowsBlockRows`, confirmed by its own pre-existing
doc comment already citing `BodyEnhanced1.java:186-190` for the SAME
reason (from T23's own investigation, unrelated to embeds) — i.e. the
mechanism's home was already correctly identified in this codebase before
this task; I re-derived it independently from the Java per CLAUDE.md
rather than trusting that citation on sight.

## `isEnhancedBody`'s missing disjunct (confirmed, still excluded)

`class-body-enhanced.ts#isEnhancedBody` (java:94-97 read literally):
`rawLines.some((s) => isBlockSeparatorLine(s) || isTreeStartLine(s.trimStart()))`
— MISSING both `CreoleParser.isTableLine` (out of scope, unrelated) and
`EmbeddedDiagram.getEmbeddedType(s) != null` (java:96, THE disjunct this
task needs). Consequence, confirmed empirically: moxobo/zikabo (no
separator/tree line, ONLY a bare `{{ }}`) still route to the CLASSIC
(non-enhanced) member-list path today — `isEnhancedBody` returns `false`
for them, so `computeEnhancedBodyGeo` (`class-layout-generic-classifier-
sections.ts:124`) returns `undefined` and the classic path never touches
my new embed-extraction code at all. gadufu (`-- subsection --` present)
ALREADY returns `true` and is fully live today.

**One-line fix needed, recorded not applied (EXCLUDED file):**
`src/diagrams/class/class-body-enhanced.ts`'s `isEnhancedBody` (lines
94-97) needs `|| rawLines.some((s) => getEmbeddedType(s) !== null)` added
to its `.some()` predicate (importing `getEmbeddedType` from
`../../core/EmbeddedDiagram.js`), matching `BodierLikeClassOrObject.java:96`
exactly.

## What landed (in-write-set)

1. **`src/diagrams/class/class-nested-diagram-renderer.ts`** — extended
   from T27's original: `EmbeddedRenderer` now has BOTH `render` (the
   `NestedDiagramRenderer`/`TextBlock` contract, unchanged, for
   `core/cucadiagram/MethodsOrFieldsArea.ts`'s consumer) and `renderImage`
   (a NEW plain-`{width,height,href}` contract for the class engine's own
   plain-data model — that engine has no `TextBlock`/`UGraphic` at all).
   Both funnel through ONE `guardedRender` closure sharing ONE recursion
   counter. Added the module-level registration slot
   (`registerClassNestedDiagramRenderer`/`getClassNestedDiagramRenderer`)
   `src/index.ts` populates.

   **A real bug caught and fixed before it shipped:** my first draft kept
   the depth counter `let depth = 0` CLOSED OVER PER `createNestedDiagram
   Renderer` CALL. Since `src/index.ts#prepareBlock` re-registers the
   renderer on EVERY `renderSync` call (needed so a nested render sees the
   ambient `options`/measurer — see below), every recursive embed would
   have gotten a BRAND NEW renderer instance with a FRESH `depth=0`,
   permanently defeating the guard (true infinite recursion would run
   until a raw JS stack overflow, not `EmbeddedDiagramDepthError`). Fixed
   by moving `depth` to MODULE scope (`embedDepth`), shared by every
   instance — safe because `renderSync` is fully synchronous, single-
   threaded, and every real recursion chain fully unwinds the counter back
   to 0 (via `finally`, throw included) before any top-level `renderSync`
   call returns. Caught by manually tracing a depth-2 self-embedding probe
   BEFORE writing the "real fixture" test, not by the test itself — worth
   flagging since this exact bug would NOT have been caught by the
   ORIGINAL 4 unit tests (they each build ONE renderer instance per test,
   so the per-instance-vs-module-level distinction was invisible until a
   REAL multi-call chain was probed).

2. **`src/diagrams/class/class-body-enhanced-embeds.ts`** (NEW — a sibling
   split of `class-body-enhanced-layout.ts`, same 500-line-cap reason
   `class-body-enhanced-geometry.ts` already documents for the SAME parent
   file; not a scope choice). Ports `MethodsOrFieldsArea`'s constructor
   loop (java:109-123, `extractEmbeds`, reusing `class-embedded-block.ts
   #scanEmbeddedElementBlock`'s already-correct nesting-aware scan rather
   than a second copy of the algorithm) and its dimension/draw split
   (java:141-152/429-440, `stackEmbeds`). `renderEmbed`'s catch mirrors
   `EmbeddedDiagram.java:148-152`'s `(42,42)` fallback for a missing/
   failing renderer, EXCEPT it re-throws `EmbeddedDiagramDepthError`
   rather than swallowing it — the original brief's own `// on-call`
   comment ("no runbook — fix the fixture") means a self-embedding block
   is malformed input to surface, not a transient failure to hide.

3. **`class-body-enhanced-layout.ts`**: `buildRowsBlockRows` now calls
   `extractEmbeds` first (separating `{{ }}` regions from surviving member
   lines), builds member rows from the SURVIVORS only, then `stackEmbeds`
   below them. `EnhancedLayoutCtx` gains an OPTIONAL `nestedRenderer` field
   (DI override of the module singleton — no forced change to `class-
   layout-generic-classifier-sections.ts#computeEnhancedBodyGeo`, which
   builds `EnhancedLayoutCtx` as an object literal and simply never sets
   the new optional field). `EnhancedRowsPart` gains an optional `embeds`
   array (omitted when empty — zero behavior change for every existing
   fixture with no `{{ }}` content). `translateEmbeds`/`rowsPart` mirror
   the existing `translateRows` helper for the origin-then-shift pattern
   `layoutPlainDividerRows`/`layoutTitledDividerRows` already use.

4. **`renderer-body-enhanced.ts`**: `buildRowsPartPrimitives` now also
   calls `buildEmbedPrimitives`, drawing one `<image>` per embed (via
   `core/svg.ts#image`, the SAME low-level builder the sprite/img inline-
   atom path uses — NOT that path's own `renderRowAtoms` 'image'-atom
   branch, which is BOTTOM-aligned-to-a-text-line positioning for a small
   inline icon, a DIFFERENT upstream mechanism (`AtomImg`/`AtomSprite`)
   from `EmbeddedDiagram`'s own TOP-anchored whole-block stacking — reusing
   it would have positioned the image at the wrong Y). `x` is
   `geo.x + BODY_ENHANCED_MARGIN_X` (=6, already-imported constant,
   jar-verified against moxobo's own `image x="13"` = `rect x="7"` + 6). A
   `href`-less embed (the fallback) draws nothing, matching `EmbeddedDiagram
   .java:191-193`'s own independent `drawU` catch.

5. **`src/index.ts#prepareBlock`**: registers the renderer with `(source)
   => renderSync(source, options)`, closing over the CURRENT call's own
   `options` — see "The measurer bug" below for why this specific line is
   load-bearing, not cosmetic. `prepareBlock` is shared by `renderPagesSync`
   AND the async `render()`/`renderPages()` path (`renderBlockPages`), so
   this fixes both without a second call site. Runs for EVERY diagram
   type's `prepareBlock` call (harmless — a pure closure reassignment on a
   singleton the class engine alone reads).

6. **`class-member-rows.ts#isMethodMember`** (mid-task addition, journal
   row 83 diagnosis): ported `BodierLikeClassOrObject#isMethod`'s missing
   URL-bracket strip (`URL_PATTERN.matcher(s).replaceAll("")`,
   java:104-116, `URL_PATTERN = Pattern.compile(UrlBuilder.getRegexp())`)
   before the raw-fallback paren scan — a NEW un-anchored (find/replace-all)
   `URL_BRACKET_RE` reproducing `UrlBuilder.java:52-88`'s 5-alternative
   grammar (the SAME one `class-url.ts` already ports for STRICT
   whole-bracket matching, un-anchored here since a bracket can sit
   anywhere in a raw-fallback line, not just fill it). Fixes
   `sejuzo-42-fini523` (a field's `[[url{tooltip}]]` had `(pagename)` in
   its tooltip, misbucketing the field as a method and shifting both
   dividers down by the empty-methods-compartment's 8px). Unrelated to
   embeds; landed in the same commit series per the coordinator's
   instruction.

## The measurer bug (found via arithmetic, fixed, verified)

First render-diff pass after wiring: gadufu went from 1 structural/3
numeric (baseline) to 0 structural/49 numeric — the `<image>` now drew
where expected, but at 200x96 instead of the jar's 133x107. Decoding the
drawn payload showed `data-diagram-type="ACTIVITY"` — CORRECT dispatch (the
embed's content, `start`/`:Использовать;`, IS activity syntax) — so this
was not a dispatch bug. Root cause, found by direct probe: `src/index.ts`'s
FIRST draft registered the renderer ONCE at module load
(`registerClassNestedDiagramRenderer((source) => renderSync(source))`,
no options), so every nested render used `renderSync`'s DEFAULT measurer
instead of the OUTER call's `WidthTableMeasurer` (`render-diff.mts`'s own
`renderFixture` passes `{ measurer: new WidthTableMeasurer() }`). Probed
directly: the SAME embed source measured 200x96 with the default measurer,
121x96 with `WidthTableMeasurer` explicitly — matches upstream's own
architecture (`EmbeddedDiagram`'s nested `Diagram#exportDiagram` shares the
enclosing `FileFormatOption`, i.e. the SAME measurement context, never a
fixed default). Fixed by moving the registration into `prepareBlock`
(closing over that call's own `options`) — see item 5 above. After the fix:
gadufu 0 structural / 5 numeric (down from 49).

## Remaining gadufu residual (5 numeric diffs) — traced to a jar-side asymmetry, NOT fixed

After the measurer fix, gadufu's image is 121x96 vs jar's 133x107 (Δ12/Δ11)
— and the classifier's OWN box height is 168 (ours) vs 114 (jar), a MUCH
larger Δ54 that does not match the image Δ alone. Traced with arithmetic,
not guessed: jar's OWN classifier height (114) is CONSISTENT with its
`MethodsOrFieldsArea`-equivalent block using the `(42, 42)` fallback
(java:150-152) for the embed's CONTRIBUTION TO BOX HEIGHT specifically —
`114 - header(32) - block1(field row, ~22) = 60`, and `42 (fallback) +
~18 (decorate()'s own divider/title margin) = 60` EXACTLY — while jar's
DRAWN image (the SEPARATE `drawU` call) is a real 133x107 render that
visually OVERFLOWS the box it was sized for (`75 + 107 = 182`, matching
the jar's OWN total canvas height of 183 almost exactly — the canvas's
real driver is the image's overflow ink, not the declared box). This is
consistent with r2b's ORIGINAL finding (the jar's `calculateDimensionSlow`
NPEs and falls back to `(42,42)`) being CORRECT for THIS fixture's SIZING
PASS specifically, even though row 99's correction (moxobo/zikabo/gadufu's
DRAWN images are real, not `(42,42)`) is also correct — the two calls
(`calculateDimensionSlow` vs `drawU`) can and DO diverge for gadufu's
embedded ACTIVITY content: sizing fails (fallback), drawing succeeds (real
image), an internally-inconsistent UPSTREAM RENDERING QUIRK for this
specific embed kind/environment combination. Per CLAUDE.md ("preserve...
behavior that looks like a bug... never fix an apparent upstream bug
inline") and the coordinator's own explicit instruction ("the delta
belongs to that engine: record it... do not patch other engines"), this is
recorded, not reproduced — faithfully replicating "sizing silently fails
while drawing silently succeeds, for this one upstream/environment
combination" is not something D9's "dimensions are the target" scope
commits this task to chase, and doing so would require detecting an
environment-specific AWT/graphviz failure this port has no analog of.
Residual width/height delta on the `<image>` itself (Δ12/Δ11) is a
SEPARATE, smaller likely-Cyrillic-text-measurement gap in the ACTIVITY
engine, also out of scope per the same instruction.

## The self-embedding recursion fixture — a MORE PRECISE finding than expected

The recursion guard is real and proven at the UNIT level (4 tests,
`class-nested-diagram-renderer.test.ts`, real depth accounting via a
`renderFn` that calls back into the renderer). Building a REAL end-to-end
`renderSync` fixture that trips it turned out to be blocked for a reason
MORE SEVERE than "isEnhancedBody's missing disjunct": `src/diagrams/
class/parser.ts#handlePendingBodyLine` tests EVERY line of an open class
body against the bare-`}`-closes-the-body regex (`/^\}\s*$/`)
UNCONDITIONALLY, with NO embedded-block awareness at parse time at all
(unlike the TYPE0/TYPE1 `[ ... ]` path, which `class-multiline-element.ts`/
`class-embedded-block.ts` already solve for exactly this class of bug —
see that file's own module doc comment, "so an embedded region's own
interior... never prematurely closes the OUTER... block"). Any NESTED
class declaration's OWN closing `}`, sitting inside a `{{ }}` region, is
therefore indistinguishable from the OUTER class's own closer — verified
by direct probe: `class C {\n--\n{{\nclass C {\n--\n{{\nfield\n}}\n}\n}}\n}`
renders a `"Syntax Error?"` refusal box (the INNER class's `}` closes the
OUTER body two lines early), not a nested render, REGARDLESS of
`isEnhancedBody` or the depth guard. A single-line, brace-free embed
(`file f`, `node n`, `start`/`:text;`) never hits this — confirmed working
for moxobo/zikabo/gadufu's OWN content — so genuine MULTI-LEVEL recursion
through the class-engine's own embed mechanism is unreachable at ANY depth
>= 2 today, for a DIFFERENT and larger reason than the `isEnhancedBody`
gap alone. Filed precisely as an `it.todo` (`class-body-embedded-diagram-
conformance.test.ts`) rather than forced or silently dropped.

## Readings, updated (before T27FU -> after)

| slug | before (T27) | after (T27FU) | verdict |
|---|---|---|---|
| moxobo-16-tipo829 | 1/43 | 1/43 (unchanged) | mechanism proven byte-exact (43x54) when called directly; blocked end-to-end on `isEnhancedBody` (excluded) |
| zikabo-17-gugi332 | 1/43 | 1/43 (unchanged) | mechanism proven byte-exact (67x64) when called directly; same block |
| gadufu-56-votu808 | 1/3 | **0/5** | `<image>` now drawn correctly-positioned; residual is the jar's own sizing/drawing asymmetry (see above), not this mechanism |
| bixogo-47-xulu385 | 1/47 | 1/47 (unchanged, as instructed) | legend/chrome path, T28 |
| roxosu-00-pini153 | 1/47 | 1/47 (unchanged, as instructed) | legend/chrome path, T28 |
| sejuzo-42-fini523 (mid-task addition) | 3/0 | **0/0 (pass=true)** | `isMethodMember` url-bracket strip |

moxobo/zikabo's mechanism-level proof (called directly via `measure
EnhancedBody`, bypassing the blocked gate): moxobo sizes its `{{ file f }}`
embed to EXACTLY 43x54 (jar target); zikabo's `{{ node n }}` sizes to
EXACTLY 67x64 (jar target), with the `- field` member row correctly
surviving extraction and stacked above it. Both hrefs decode to real
`data-diagram-type="DESCRIPTION"` renders of the actual embedded content.
See `tests/unit/class/class-body-embedded-diagram-conformance.test.ts`.

## Follow-on filing (current)

Two items remain, both requiring `class-body-enhanced.ts`
(EXCLUDED) and/or `parser.ts` beyond this task's narrow grant:
1. `isEnhancedBody`'s missing `getEmbeddedType` disjunct (one line, exact
   fix given above) — unblocks moxobo/zikabo end-to-end.
2. `handlePendingBodyLine`'s complete lack of embedded-block awareness at
   PARSE time (a `class-multiline-element.ts`-shaped fix: detect an
   embedded-block opener while `state.pendingBodyId` is set, swallow the
   WHOLE region via `scanEmbeddedElementBlock` before testing for the
   bare-`}` closer) — unblocks genuine multi-level self-embedding
   recursion and any future fixture that embeds a diagram containing its
   own `{ }`-braced declarations.
