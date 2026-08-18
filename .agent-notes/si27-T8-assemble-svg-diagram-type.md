# T8 — assemble-svg diagramType dispatch

## Observation: D2's "body prep runs inside the engine's own renderer" is not
literally achievable for class's background/border-rect splice
- **Context**: Implementing T8 (collapse klimtShell/classShell/stateShell/
  jsonShell into RenderFragment.diagramType; core/assemble-svg.ts must not
  import diagrams/**).
- **Finding**: `class/renderer-shell.ts#assembleClassShell`'s
  `documentBackgroundRect`/`diagramBorderColor` splice must run AFTER
  `core/annotations/chrome.ts#applyChrome` has composed title/legend/
  caption/header/footer, because the rect must be sized to the FINAL
  (post-chrome) canvas and drawn as the content `<g>`'s first child ahead
  of the title band. Jar-verified fixture `xalaco-64-vuzu312` combines a
  title AND a non-default background — real corpus reach, not a
  hypothetical. `renderClass` runs strictly BEFORE chrome in the pipeline
  (`src/index.ts#renderSync`/`renderBlock`: `plugin.render` →
  `applyAnnotationChrome` → `assembleSvg`), so it structurally cannot see
  the post-chrome canvas size. `index.ts` is not in T8's write-set, so a
  new call site there was not an option.
- **Resolution**: kept the finalize step (background/border-rect splice,
  single-`<g>` wrap, json colour canonicalisation) inside
  `core/assemble-svg.ts` itself, dispatched by `fragment.diagramType`
  (a string already on the fragment — no per-engine boolean flag, no
  `diagrams/**` import). Verified every computation the four deleted
  shell files needed was ALREADY expressible from core-only primitives:
  `class/renderer-shell.ts#assembleClassShell`'s
  `applyClassDocumentMargin`/`computeClassBorderRectDims` reduce to
  `core/TextBlockExporter.ts#applyCucaDocumentMargin` + the four
  `core/atmp/CucaDiagram.ts` margin constants; `json/color-form.ts
  #canonicalColor` is a two-line composition of `core/svg-format.ts
  #shortenColor` + `core/klimt/color/HColorSet.ts#resolveColorToSvgHex`,
  both already core. So the "renderer-shell.ts files become engine-side
  helpers... or are folded into the renderers" framing in the task spec
  (and decisions.md D2's prose) undersold the real design: the correct
  fold target is `core/assemble-svg.ts`, not the per-engine renderer.
- **Impact**: future D2-shaped tasks (or a T10 close-out reading this
  ledger) should not take the "body prep before return" phrasing as a
  literal ordering constraint when a downstream pipeline stage (chrome)
  can still mutate the canvas the body prep needs to see. The manifest
  proved this out: full 2014-fixture render, 0 diff attributable to this
  commit (see decision journal / final report for the 4 state fixtures
  traced to T1's Display.getWithNewlines, not this change).
- **Confidence**: High (jar fixture citation + full manifest + targeted
  unit tests all corroborate).

## Observation: tests/oracle/svg-conformance/render-fixture-json.ts is a
functional (not just cosmetic) dependency on the RenderFragment shell flags
- **Context**: Same task; auditing every `jsonShell`/`classShell`/etc.
  reference in the tree before deleting the fields.
- **Finding**: this helper is OUTSIDE any batch-1a/1b task's write-set but
  constructs `{ ...renderJson(geo, theme), jsonShell: shellTypeFor(block) }`
  by hand (it calls `renderJson` directly, bypassing the plugin's own
  `render()` where production sets the field). Removing `jsonShell` from
  `RenderFragment` does NOT fail typecheck here (the object is assigned to
  an untyped `const` first, so TS's excess-property check never fires —
  only literal-argument or annotated-variable assignment triggers it), but
  it silently breaks BEHAVIOUR: `assembleSvg` would fall through to the
  generic `svgRoot` path instead of `assembleDocumentShell`, and the
  svg-json/svg-yaml/svg-hcl conformance suites (which import this helper)
  would fail loudly at their own assertions, not at typecheck.
- **Impact**: a future removal of a `RenderFragment` field should grep test
  helpers under `tests/` too, not just `src/`+`tests/unit/` — a field can be
  load-bearing in a hand-built test fixture with no compile-time signal.
- **Confidence**: Medium — verified by reading `assembleSvg`'s fallback
  branch (`fragment.diagramType === undefined` routes to `svgRoot`) and by
  the fix being present when `render-fixture-json.test.ts` + the three
  json-family golden-ratchet suites passed; did NOT empirically revert the
  one-line fix to watch it fail (the fix was already committed by the time
  this was written up, and reverting a committed shared-tree file to
  re-break it felt like the wrong kind of experiment to run here).
