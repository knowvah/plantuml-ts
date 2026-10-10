# isw-T2c-scale — report

## Commits (branch isw/T2c-scale, base 50b39c1ba)
- `b15b3eedf` fix(isw-T2c-scale): format scaled activity numbers once, after the scale (M1)
- `be5009ae7` fix(isw-T2c-scale): print scaled root width/height as format(maxX) (M2)
- (this notes commit)

## Owed rows cleared
- unknown/kakitu-70-kuvi013: diverged (36 x `textLength` +-0.001) -> **conformant**
  (own `--out` survey); every number token equals the jar after M1+M2.

## Surveys (own --out, /private/tmp/claude-501/isw-T2c-scale/{before,after,final}/)
- activity: 433/1/17 -> 433/1/17. 0 conformant losses.
- unknown: 370/54/401 -> 371/54/400 (before vs final after M2): only mover kakitu-70
  diverged -> conformant. 0 losses.
  activity final after M2: per-fixture identical to before.
- mindmap: 137/2/3 after (no own "before" survey; instead every mindmap + activity fixture
  rendered byte-for-byte at base 50b39c1ba vs HEAD: 593 renders, 2 byte movers, both onto
  the jar: mindmap/zebuzi-73 (root width/height attrs), activity/lisade-37).
- Scaled fixtures in every engine (103: activity, unknown, mindmap, class, component, state,
  sequence, json) rendered before/after: movers = activity/lisade-37-vuri519,
  unknown/kakitu-70-kuvi013, unknown/zovemu-18-keki646 (M1), + zebuzi/lisade/kakitu root
  attrs (M2). Every changed number now equals the jar's value: lisade 18/18, zovemu 58/58,
  kakitu 36/36 (before==jar 0 of them). No other engine moved.

## M1 — scaled activity numbers formatted once
- Java: `SvgGraphics.java:468-475` `format(xx)` = `%.3f` of `xx * option.getScale()`, once;
  the scale is the document UGraphic's (`TextBlockExporter.java:160-177`), resolved from the
  chrome-included dimension (`:198-209`).
- Ours before: every emitter rounded at 3dp, then `assemble-svg-activity.ts#scaleActivityBody`
  re-parsed and multiplied: 20.831 * 1.5 = 31.2465 -> 31.246 (jar fround(20.83125)*1.5 ->
  31.247).
- Fix (the factor is only known after chrome composes, so the scale stays a pass over the
  body; the rounding moves to it):
  - `src/core/svg-format.ts#withDeferredFormat` — scoped flag; inside it `formatDecimal`
    prints `String(x)` (lossless; exponent forms <1e-6 keep the ordinary path).
  - `src/core/scale-command.ts#isExportScaled` — scale directive or dpi != 96.
  - `layout/tile-layout.ts#layoutActivity` sets `geo.exportScaled`; `renderer.ts#renderActivity`
    draws inside the scope (split `drawActivityBody`) and sets `RenderFragment.numbersDeferred`.
  - `activity-warnings.ts#withWarningBanner`, `core/annotations/chrome.ts#applyChrome` draw
    deferred when the fragment is `numbersDeferred`.
  - `core/EmbeddedDiagram.ts#getInternalTextBlock` — nested `{{ }}` render always
    `withDeferredFormat(false)` (its own document/SvgGraphics).
  - `assemble-svg-activity.ts#finalizeActivityFragment` runs the scale pass at factor 1 too
    when deferred; `TextBlockExporter.ts#formatScaledFragmentBody` = `scaleFragmentBody`
    without the factor-1 fast path.
  - `layout/document-margin.ts#withActivityScale` uses `isExportScaled`.
- Vocabulary check: all 435 ACTIVITY-typed corpus docs rendered with `scale 1` inserted vs
  without — byte-identical except gradient-id seeds (source changed) and lidefe-01-vaki092,
  zejuso-92-kexo870, whose changed numbers ALL move onto the jar's values (see Not done #1).
  No lossless number leaks.
- Tests: `tests/diagrams/activity/isw-T2c-scale.test.ts` + jar fixture
  `tests/fixtures/isw-T2c-scale/scale-text-length.{puml,svg}` (one-JVM oracle-render.sh);
  `tests/unit/core/svg-format.test.ts` (withDeferredFormat); 
  `tests/unit/core/assemble-svg-activity-scale.test.ts` (+3 cases).
- Production-visible: scaled activity diagrams (`scale ...` or `skinparam dpi` != 96) print
  every number as format(x * scale) — last-digit changes (+-0.001) on any value whose 3dp
  rounding sat on a boundary, incl. title/legend chrome and warning banner.

## M2 — scaled root width/height attributes
- Java: `SvgGraphics.java:800-813` `finalizeRootAttributes`: style/viewBox use
  `(int)(maxX * scale)`; root `width`/`height` attrs are `format(maxX) + "px"` (scaled, 3dp).
- Ours before: `klimt/document-shell.ts#assembleDocumentShell` printed the truncated int for
  both. Fix: `RenderFragment.scaledCanvas` / `ShellFragment.scaledCanvas`, set by
  `finalizeActivityFragment` (scaled branch) and `TextBlockExporter.ts
  #finalizeTitledDiagramFragment` (mindmap chrome path, width = maxX * scale);
  `rootSizeAttributes` formats them.
- Test: `assemble-svg-activity-scale.test.ts` "prints the root width/height attributes...".
- Production-visible: scaled activity documents and chromed scaled mindmaps: root
  `width="946.5px"` instead of `946px` (kakitu-70, lisade-37 501.713x329.318, zebuzi-73
  1329.01x741.495 — all now the jar's).

## Tests run
tests/unit/core, tests/unit/*.test.ts, tests/diagrams/activity, tests/unit/activity,
tests/unit/mindmap, tests/integration/annotations.e2e, tests/architecture/isw-measurer:
green except the 3 worktree npm-pack files (4 tests) and one load timeout
(tests/unit/core/tim/unwind-u3-jar-fixtures.test.ts, 15/15 alone). typecheck + eslint clean.
No existing expectation was changed.

## Not done / open (with mechanism)
1. Unscaled activity double-rounding, hidden by compare's 0.01 tolerance: lidefe-01-vaki092
   (`text x` 209.346, jar 209.347) and zejuso-92-kexo870 (17 x/points values, e.g. 422.168 vs
   jar 422.169). Rendering them deferred (format once) gives exactly the jar's values, so some
   unscaled translate is applied to an already-3dp string (shiftFragmentBody of a rounded
   sub-body). Fix = format activity once at export ALWAYS (drop the `exportScaled` gate);
   not done because `renderActivity`'s body would then carry lossless numbers, which many unit
   tests on `renderActivity` output pin at 3dp. Follow-on.
2. Root width/height attrs (M2 mechanism) still truncated for: mindmap NO-chrome scaled
   (cufaxi-14, dojilo-60, gafupu-88 193 vs 193.5; kuzura-59; zirabo-51 943 vs 943.75) —
   owner `src/diagrams/mindmap/index.ts` (set `scaledCanvas` when its width is maxX*scale);
   class (11 scaled), json (timafu-94 100 vs 100.078), sequence, state, description —
   each engine's own width/finalize path (outside write-set); several there are larger
   size divergences, not just this.
3. `svg-shapes.ts#strokeAttrsOf` / `svg-graphics-core.ts#styleMe` test `format(w) === "0"`;
   the jar's format includes the scale. Under deferral a stroke 0 < w*scale < 0.0005 would
   emit a style the jar omits (exact 0 unaffected). No corpus case.
4. Other engines' scale paths checked: sequence scales geometry before emission
   (`sequence/renderer.ts:434-436`), description draws through klimt with `option.scale`
   (`description/renderer.ts:211-216`) — single rounding, no change needed. Mindmap chrome
   strings still double-round in `scaleChromedBody` (only zebuzi has chrome; 0 token diffs).

## Orchestrator actions
- `npm run catalog` (new exports: `withDeferredFormat`, `isExportScaled`,
  `formatScaledFragmentBody`; new fields `numbersDeferred`, `scaledCanvas`).
- Ratchet/pin candidate: unknown/kakitu-70-kuvi013 (now conformant).
- No baseline/DIVERGENCES changes.
