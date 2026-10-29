# Diagnosis: json/yaml title chrome offset (T1c, D6)

**Verdict: PORT-CONTROLLED.** The json producer applies `TextBlockExporter`'s
document margin itself, before chrome runs, and never says it did. No
`src/core/` change is needed and no json-only branch in core
(`documentMarginOf` already honours `RenderFragment.documentMargin`). A second,
separate defect turned up on the way: `scale` + `title` (see "Out of T2a").

## Symptom (reproduced 2026-10-28, worktree `ddc-T1c`, base `4f4822ee5`)

```
npx tsx plans/data-diagram-conformance/tools/diff-one.mts json babico-87-soxo095   # title this is a title / {"a": 61}
svg/@viewBox[2]  ours=94  jar=115
svg/@width  ours=94  jar=115
svg/g[1]/g[1]/text[1]/@x  ours=10  jar=20          <- title
svg/g[1]/g[1]/text[1]/@y  ours=20.889  jar=30.889  <- title
svg/g[1]/rect[1]/@x  ours=24.35  jar=34.85         <- body, plus 5 more body x's at +10.5
diffs: 10        (--structural: 0, --survey: 0)
```

All of these diffs are positional, so the structural gate and the survey both
report 0 diffs. That is why `babico-87` sits in `json-family-structural.json`
`clean` but is not byte-pinned.
`tests/unit/json/unwind-u1-jar.test.ts:45-59` (`TITLE_CHROME_OFFSET`) pins the
same offset on 5 authored fixtures as "positional only, by count".

Rows measured (jar via `scripts/oracle-render.sh`; ours via `renderFixtureJson`
and `renderSync`, which give byte-identical output on every row):

| row | construct | raw diffs | the offset |
|---|---|---|---|
| json/babico-87-soxo095 | title, title wider than body | 10 | title +10/+10, body x +10.5, width 94→115 |
| yaml/tadari-70-nare798 | `!theme amiga` (document `Margin 5`) + title | 25 | title y +5 (= the theme's margin, not 10) |
| scratch t1 json / t4 yaml | `title this is a title` / `{"a": 61}` / `a: 61` | 10 / 10 | same as babico (yaml identical to json) |
| scratch t10 | `title Hello` (title block 53.0 wider than body 44.4) | 10 | title +3.83/+10, body x +4.33 |
| scratch t2 | title narrower than the body | 2 | title x −0.5, title y +10 |
| scratch t3 | same body, no title | **0** | control: identical body |
| scratch t12 / t13 | `skinparam handwritten true` with / without title | 159 / **0** | the same +10.5 shift on every jiggled point |
| unwind-U1 json-title, json-title-quoted, yaml-title | title | 10 each | as babico |
| unwind-U1 json-title-only, yaml-title-only | title + `root == null` error page | 2 each | title y +10, x −0.5 |
| scratch t5–t8 | caption / header / footer / legend | 0 | not chrome here: the jar draws its error page |

## Mechanism

`renderJson` hands chrome a fragment whose body is already translated by the
document margin and whose `width`/`height` are the final canvas
(`ink + 2·margin + 1`). It declares no margin-less block
(`preChromeWidth`/`preChromeHeight`/`documentMargin`), so `applyExportedChrome`
composes the title around that canvas as handed over and never re-applies the
margin. The title therefore lands at the document origin instead of one margin
inside it. It is also centred against `W + 2m + 1` instead of the block width
`W`.

**Origin:** `src/diagrams/json/renderer.ts:457-462` (the `renderJson` return,
`...dims` = canvas). The same applies to `renderParseFailure`'s return at
`renderer.ts:355` and to `handwrittenDims` at `renderer.ts:376-379`. The margin
itself is baked in at `src/diagrams/json/layout.ts:407` (`marginsOf(theme)`),
`:455` → `:361-362` (node x/y `+ margin.left/top`) and `:459` →
`document-dimensions.ts:122-128` (`+ margin.x`, `+ ENSURE_VISIBLE_BUMP`).

## Causal chain (jar ↔ ours)

1. **Raw block.** Jar: `UgDiagram.java:124` `getTextBlock` →
   `JsonDiagram.java:140-142` returns `this`, sized by
   `JsonDiagram.java:130-137` (`TextBlockUtils.getMinMax(this, …)`, ink only,
   no margin). Ours: `layout.ts:455,459` + `renderer.ts:457-462` return the
   margined canvas (t1: `width 65.362 = 44.362 + 20 + 1`, body `<rect x="10"
   y="10">`, `preChromeWidth undefined`, traced).
2. **Chrome.** Jar: `UgDiagram.java:128` `addChrome` → `TitledDiagram.java:471-476`
   → `DiagramChromeFactory.java:123-135` → `addTitle` `:363-376` →
   `DecorateEntityImage.addTop` (`DecorateEntityImage.java:68-69`). Its
   `drawU` (`:103-125`) draws the title at `(xText1, 0)` and the original at
   `(xImage = (dimTotal.w − dimOriginal.w)/2, yImage = dimText1.h)`. Ours:
   `src/index.ts:193` `applyExportedChrome` → `chrome-export.ts:43-46`.
   `documentMarginOf` (`document-margin.ts:88-91`) returns `undefined`
   because `preChromeWidth` is unset (and `JSON`/`YAML` are not in the table at
   `:76-81`), so it calls `applyChrome(fragment, …)` on the canvas →
   `chrome.ts:141-156` `decorateEntityImage`. That is the same arithmetic as
   the jar, but `original` is the 65.362-wide canvas instead of the 44.362
   block.
3. **Export margin.** Jar: `UgDiagram.java:138-139` `builder.styled(this)` →
   `TextBlockExporter.java:492` `margin = calculateMargin(diagram)` (`:510-516`:
   style `Margin`, else `TitledDiagram.java:275-277` `same(10)`). `exportTo`
   (`:159-177`) translates the whole chromed block by `(margin.left,
   margin.top)` (`:173`) and sizes `dim + margins` (`:199-203`). Ours: this
   never happens to a json fragment. `applyDocumentMargin` runs only when
   `documentMarginOf` returns a margin (`chrome-export.ts:46-47`).
4. **Numbers (t1).** The title block is 35 high and 94.063 wide (text 73.063
   plus `title { Padding 5; Margin 5 }`, `plantuml.skin:30-38`; identical on
   both sides).
   - Title x: jar `10 + 0 + 10 = 20`, ours `0 + 0 + 10 = 10`.
   - Title y: jar `10 + 10 + 10.889 = 30.889`, ours `20.889`.
   - Body x: jar `10 + (94.063 − 44.362)/2 = 34.85`, ours
     `(94.063 − 65.362)/2 + 10 = 24.35`.
   - Width: jar `trunc(94.063 + 20 + 1) = 115`, ours `trunc(94.063) = 94`.
   - Height is equal (75) only by coincidence: both are `35 + 40`, because the
     top margin moved from above the title to below it.
   - t2 (body widest): ours `(352.45 − 34.3)/2 + 10 = 169.075` against jar
     `10 + (331.45 − 34.3)/2 + 10 = 168.575`. The −0.5 is the baked
     `ensureVisible` +1 halved.
   - tadari-70: Δy = 5 = amiga's document `Margin`. The offset follows
     `calculateMargin`, not any title constant.

**yaml shares it**: `yaml/index.ts` imports `layoutJson`/`renderJson`. t4 and
yaml-title give byte-for-byte the same diffs as their json twins, and tadari-70
is yaml. **hcl cannot reach it**: `HclDiagramFactory.java:86-92` has the
`setTitle` block commented out (unwind-U1 `hcl-title` is clean).

## Counterfactual (proves the mechanism)

This was a temporary probe, not committed. It renders ours unchanged, then
sets the margin-less block on the json fragment and routes it through the
existing `applyExportedChrome` (remove margin → chrome → `applyDocumentMargin`):
`preChromeWidth = width − (m.left + m.right) − 1`,
`preChromeHeight = height − (m.top + m.bottom) − 1`, and
`documentMargin = theme.diagramMargin ?? same(10)`.

- **Result:** raw diffs dropped to 0 on t1, t2, t4, t10, t12 (handwritten),
  babico-87, json-title, json-title-quoted, yaml-title, json-title-only and
  yaml-title-only.
- **tadari-70:** 25 → 24. The title-y diff is gone. What remains is the
  manifest's ADR-2b ceiling: dot-engine places the child at 128.237 where the
  jar has 128, and the width goes from 183 to 184. The title x residual of
  0.119 is half of that 0.237 node delta.

## Ruled out

- **Smetana geometry.** Control t3 (same body, no title) gives 0 raw diffs, so
  dot-engine and Smetana produce identical body dimensions and positions here.
  With the title added, the body moves by one uniform translation (t1 +10.5;
  t2, body widest, 0 body diffs). Changing only the chrome composition then
  gives 0 diffs. A layout delta could not be removed that way.
- **Title block style/size.** Resolved `styles.title` = padding 5, margin 5
  (traced); `textLength` and font are identical; the counterfactual changes
  only placement.
- **Harness vs production.** `renderSync` bytes `===` `renderFixtureJson` bytes
  on every row. The harness's direct `applyChrome`
  (`render-fixture-json.ts:116`) and production's `applyExportedChrome` give
  the same result only because `documentMarginOf` is `undefined`.
- **`scale`.** The offset reproduces with no `scale` line (every row above).
- **Handwritten path.** t13 (no title) gives 0 diffs. t12 shows the same shift,
  and the counterfactual takes it to 0.
- **caption / header / footer / legend / mainframe.** The jar does not treat
  these as chrome: `StyleExtractor.java:63-101` recognises only `title `,
  `scale `, `skin `, `skinparam `, `<style>`, `!assume`, `!pragma` and `hide`.
  Anything else is payload, so the jar draws the `root == null` page
  (`JsonDiagram.java:116-122`). Ours matches (t5–t8: 0 diffs).
- **The shared chrome code (`src/core/annotations`).** The unwind-U1 comment
  at `:48-52` blames it, but it composes correctly once it is handed the jar's
  block (counterfactual = 0). The fault is in the producer's contract.

## Proposed T2a write-set (3 files, none in `src/core/`)

1. `src/diagrams/json/renderer.ts:457-462` (`renderJson` return) and `:355`
   (`renderParseFailure` return). Declare the block
   `JsonDiagram#calculateDimension` measures (`JsonDiagram.java:130-137`):
   `preChromeWidth/Height` = canvas − margins − the `ensureVisible` +1. That is
   `geo.finalDimension − margin.x/y` on the plain path, the ink span on the
   handwritten path (`handwrittenDims`, `:376-379`), and the error block
   (`layout.ts:246-247` minus margin and bump) for the parse failure. Also
   declare `documentMargin = theme.diagramMargin ?? same(10)`
   (`TextBlockExporter.java:510-516`, `TitledDiagram.java:275-277`). Use an
   existing `DEFAULT_MARGIN` (`renderer.ts:60-61`); no new literal. A fragment
   with no annotations is unaffected: `applyExportedChrome` returns it `===`
   (`chrome-export.ts:44`), and `finalizeJsonFragment` reads neither field.
2. `tests/oracle/svg-conformance/render-fixture-json.ts:116`: `applyChrome` →
   `applyExportedChrome`, matching production (`src/index.ts:193`). Delete the
   doc-comment claim at `:21-25` that the margin re-application is a
   guaranteed no-op.
3. `tests/unit/json/unwind-u1-jar.test.ts:45-59, 103-109` (TDD red first):
   delete `TITLE_CHROME_OFFSET`, so json-title, json-title-quoted, yaml-title,
   json-title-only and yaml-title-only must compare clean against their jar
   SVGs.

Expected after T2a: babico-87 raw 10 → 0 (pin candidate); tadari-70 25 → 24
(the ceiling only); the 5 unwind-U1 rows go to 0; no structural count changes
(all of this was positional).

## Out of T2a — the second mechanism (`scale` × `title`)

Scratch t11 (`scale 2` + title) gives 2 **structural** diffs: title
`font-size` 14 vs 28 and `textLength` 73.063 vs 146.125. The cause is the same
inversion, applied to scale: `renderer.ts:419-420` resolves and applies the
factor inside the producer, before chrome. The jar scales the whole chromed
block at `TextBlockExporter.java:165` (after `UgDiagram.java:128`), and
resolves the factor against the post-chrome dimension (`:160`, `:205-209`).

- **Counterfactual (temporary probe 2):** an unscaled raw block → chrome →
  core `exportTo` with `exportMargin` + `scaleSpec` takes t11 from 20 raw
  diffs to 5.
- **The 5 residuals:** all come from core's regex scaler. `<line>` `x1`/`y1`
  are not in `SCALABLE_ATTR_RE`, and `textLength` gets rounded twice
  (146.126).
- **What a fix needs:** `src/core/` (`TextBlockExporter.ts` scaler or a
  `drawBodyAt`/`numbersDeferred` json path, plus `assemble-svg.ts
  finalizeJsonFragment`). That is stop 4, and more than 3 files.
- **Corpus reach:** zero (no json/yaml/hcl corpus row has both `title` and
  `scale`).

T2a's margin fix leaves this exactly as it is: still 2 structural diffs, raw
count unchanged.

## Open questions (orchestrator)

- Should the `scale` × `title` mechanism get its own tracked item? It needs
  core.
- `oracle/goldens/json-family-structural.json:104` says tadari-70's "title
  chrome is now exact". It is not (title y Δ5). Reword the entry when it is
  re-pinned.
- Unrelated and not diagnosed: t14 (`scale 2`, no title) has 2 positional
  diffs (`text[1]/@x` 25 vs 30, `text[2]/@x` 60.575 vs 65.575), a scaled-cell
  text offset in `scale-geo.ts`. It goes away under probe 2's post-hoc scale.
- T1e could author jar fixtures for title + handwritten (t12), title narrower
  than the body (t2) and title + `scale` (t11). The pairs are in
  `/private/tmp/claude-501/-Users-scottseely-git-knowvah-plantuml-ts/230bd7be-75c7-49b1-aca7-4e7c17386b93/scratchpad/ddc-T1c/`.
