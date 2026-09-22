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

## Follow-on filing

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
