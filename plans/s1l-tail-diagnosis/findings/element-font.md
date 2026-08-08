# Findings — `element-font` bucket (T3)

Five fixtures, **four distinct mechanisms**. The bucket label survives as
provenance only (ADR-3) and is **wrong for two of the five**: `gogamo-72` is a
dropped parser rule, `revusu-28` is `LineThickness`. Neither is a font defect.

All numbers below are from the pinned oracle DOT
(`oracle/goldens/description/<slug>/svek-1.dot`) versus the port measured
through `WidthTableMeasurer` + `setLayoutInputObserver`, the same seam
`scripts/measure-description-size-deltas.ts` uses. DOT inches; ×72 for px.

**How to read the delta.** `maxSizeDeltaIn` (`tests/oracle/svek-dot.ts:251-266`)
pools every node's width AND height into ONE sorted list per side and diffs
index-by-index — it is *not* a per-node error. Every arithmetic chain below
derives the reported figure from that pooling, so the numbers reconcile.

---

### gogamo-72-pibo470

- **bucketLabel:** element-font
- **delta:** 0.214833
- **status:** resolved
- **mechanism:** The description parser has no rule for
  `CommandCreateElementFull`'s no-SYMBOL / **unquoted**-CODE branch, so the
  declaration line `User << Human >>` is silently dropped; `User` survives only
  because it is a link endpoint, and endpoint creation carries no stereotype —
  so the actor's stereotype block is missing from the size *and* the ink.
- **originFileLine:** `src/diagrams/description/element-grammar.ts:170`
  (`RE_BARE_QUOTED_DECL` — anchored `^"[^"]+"`, so it only admits a QUOTED
  code; consumed as rule 15 at `command-table-containers.ts:174`)
- **causalChain:** Upstream's `SYMBOL` group is optional
  (`CommandCreateElementFull.java:84`) and `CODE1`/`CODE_WITH_QUOTE` admits the
  bare `[%pLN_.]+` alternative (`:126,:128`); `isForbidden`
  (`FORBIDDEN_PATTERN = ^[\p{L}0-9_.]+$`, `:134-138`) tests the **whole line**,
  so a pure `User` line is correctly refused while `User << Human >>` is
  accepted and yields a `STILL_UNKNOWN` leaf carrying `STEREOTYPE`, which
  `makeDiagramReady` mutes to `actor`. Jar actor = K2
  `mergeLayoutT12B3(stereo, drawing, label)` =
  `max(«Human» 60.725 + 2, stickman 27, "User" 29.575)` × `(14 + 60 + 14)`
  = **62.725 × 88.000** (the `+2` is `withMargin(stereo,1,0)`,
  `EntityImageDescription.java:198-201`). Ours: **29.575 × 74.000** — the
  stereotype line is absent from both the width max and the height sum.
  Pooled-multiset arithmetic: jar sorted `… 0.573152, 0.787985, 0.871181,
  0.879074, 1.214213, 1.222222 …` vs ours `… 0.410764, 0.573152, 0.787985,
  0.879074, 1.027778, 1.214213 …`; the largest index-wise gap is
  `|0.787985 − 0.573152| = 0.214833` ✓. **The sizer is not implicated:**
  `measureLeafNode` on the identical node WITH `stereotype: ['Human']` returns
  **62.725 × 88.000**, the jar's exact numbers.
- **ruledOut:**
  - *`skinparam actorFontName Courier` (the bucket label).* The jar's own SVG
    emits `<text … font-size="14" textLength="60.725" font-family="Courier">
    «Human»` — under `PLANTUML_DETERMINISTIC_TEXT` the advance comes from the
    width table, which is family-independent; our `WidthTableMeasurer` returns
    60.725 for `«Human»` at BOTH `Courier` and `SansSerif`. Family cannot move
    a DOT box here.
  - *Spaces inside the guillemets (`<< Human >>`).* Probed:
    `actor User << Human >>` → `stereo=["Human"]`, `(App) << Human >>` →
    `stereo=["Human"]`, `node n << Human >>` → `stereo=["Human"]`. Only the
    keyword-less, decoration-less bare form loses it.
  - *A usecase/ellipse-fit error.* All seven usecase ellipses match the jar
    exactly (`90.764×25.799`, `41.267×25.799`, `63.293×25.799`,
    `56.735×25.799`, `123.321×29.464`, `103.015×25.799`, `87.423×25.799`).
    The actor is the only divergent node.
  - *S1L-h's recorded attribution* (`plans/s1l-leaf-sizing/ledger.md:54` files
    this slug under "element font (per-USymbol)"). Re-verified per ADR-4 and
    **refuted**: the residual is a parser gap, not a font-threading gap.
- **sharedCauseWith:** none
- **proposedWriteSet:** `src/diagrams/description/element-grammar.ts` (a new
  unquoted-CODE pattern mirroring `isForbidden`'s whole-line test),
  `src/diagrams/description/command-table-containers.ts` (widen rule 15),
  `src/diagrams/description/parse-state.ts` (emit `stillUnknown` rather than
  hardcoding `'actor'`, so `resolveStillUnknown` picks actor-vs-interface as
  upstream does)
- **sizeEstimate:** 3 files, small diffs — but the **highest blast radius of
  the five**: rule 15 is the last-resort line rule, and widening it to accept
  unquoted identifiers lets it swallow lines other rules should own. Verify on
  the full description corpus + the DOT-parity ratchet, not just this fixture.
- **confidence:** high

---

### loroto-06-fano471

- **bucketLabel:** element-font
- **delta:** 0.083333
- **status:** resolved
- **mechanism:** The sizer resolves exactly ONE font size per leaf —
  `ClassifyCtx.fontSizeFor` calls `resolveElementFontSize(theme, sname,
  'title')` and `buildSizingEntityParams` fills BOTH `fontTitle` and
  `fontStereo` from it — so a per-element **stereotype** font size never
  reaches the measure path, even though the renderer already resolves and draws
  it (role `'stereotype'`, `renderer-symbol.ts#textFont`).
- **originFileLine:** `src/diagrams/description/leaf-sizing-entity.ts:146`
  (`fontStereo: font` — the one-slot collapse; its own doc comment at :128-130
  names this gap: *"per-element stereotype font override is a separate,
  unlisted gap this task does not fix"*)
- **causalChain:** `<style> node { stereotype { FontSize 20 } }` resolves
  correctly — `theme.colors.elements.node.stereotypeFontSize === 20`, and
  `resolveElementFontSize(theme,'node','stereotype')` returns 20. It is then
  discarded twice: `layout.ts:436` asks only for role `'title'` (which returns
  `bucket.fontSize`, `undefined` here), and `BoxSizingOpts` has a single
  `fontSize` slot (`leaf-sizing-consts.ts:47`) feeding both font roles.
  Consequently both the label and the stereotype measure at `theme.fontSize`
  14. Arithmetic (node margin `[40,30]`, stereo block `+2` width):
  `nodefoo` jar `40 + max(«foo»@20 50.000 + 2, "nodefoo"@14 50.575)` ×
  `30 + 20 + 14` = **92.000 × 64.000**; ours `40 + max(«foo»@14 35.000 + 2,
  50.575)` × `30 + 14 + 14` = **90.575 × 58.000** → height short 6px.
  `nodebar` jar **91.363 × 54.000** (stereo @10); ours **91.362 × 58.000** →
  height long 4px. Pooled multiset: jar `0.750000, 0.888889, 1.268924,
  1.277778` vs ours `0.805556, 0.805556, 1.257986, 1.268924`; max gap
  `|0.888889 − 0.805556| = 0.083333` ✓ = 6px, the `nodefoo` height error.
  **Second, independent tier, required for a correct fix:** the
  per-stereotype-NAME override (`.bar { FontSize 10 }`) is dropped in BOTH
  paths. `parseStyleBlock` preserves the selector `node.stereotype..bar` →
  `fontsize 10`, but `theme.colors.elements.node` ends up holding only
  `stereotypeFontSize: 20`; our rendered SVG draws `«bar»` at **20** where the
  jar draws **10**. So this is the one fixture in the bucket where the renderer
  is ALSO wrong — for the second tier only.
- **ruledOut:**
  - *That the renderer is missing the base tier.* It is not: our SVG draws
    `«foo»` at font-size 20, byte-identical to the jar's. This is the
    canonical "renderer already resolves it, sizer never calls it" shape.
  - *That the LABEL font size is wrong.* `theme.colors.elements.node.fontSize`
    is `undefined`, `resolveElementFontSize(node,'title')` is `undefined`, and
    both jar and port draw `nodefoo`/`nodebar` at 14. Correct on both sides.
  - *The naive one-slot fix (just swap the role to `'stereotype'`).* Measured:
    `measureLeafNode(..., {fontSize: 20})` returns `112.250 × 70.000` for
    `nodefoo` and `113.375 × 70.000` for `nodebar` — **worse than today** in
    both dimensions, because the single slot would then also inflate the
    label. The fix must add a *second* slot, not repoint the existing one.
  - *`wrapWidth` / `guillemet` / `minimumWidth` / `componentStyle`.* None
    appears in the fixture; `theme.colors.elements` contains exactly
    `{ node: { stereotypeFontSize: 20 } }`.
  - *Prior recorded mechanism* (`plans/g1-description-svg/ledger.md:445-480`,
    "no `StereotypeFontSize` routing at all"). Re-verified per ADR-4: the
    **ink** half has since been fixed (SVG draws `«foo»` at 20); the **sizer**
    half and the `.bar` tier are both still open. The ledger entry is now only
    half-true and must not be carried forward as written.
- **sharedCauseWith:** `toxine-81-xofo986`
- **proposedWriteSet:** Tier 1 (sizer) —
  `src/diagrams/description/layout.ts` (`ClassifyCtx.stereotypeFontSizeFor`),
  `layout-dot-tree.ts`, `leaf-sizing-consts.ts`
  (`BoxSizingOpts.stereotypeFontSize`), `leaf-sizing.ts`,
  `leaf-sizing-entity.ts`. Tier 2 (per-stereotype-name, both paths) —
  `src/core/preprocessor.ts`, `src/core/skinparam-stereo-keys.ts`,
  `src/core/style-map-element.ts`, `src/core/theme-graph-colors.ts`,
  `src/core/theme-element-resolve.ts`, `src/diagrams/description/
  renderer-symbol.ts`.
- **sizeEstimate:** Tier 1 ≈ 5 files, mechanical thread, sizer-only (no ink
  change) — verifiable against the size ratchet alone. Tier 2 ≈ 6 more files
  across preprocessor/skinparam/style-map, changes INK as well, so it needs
  the SVG-golden ratchet too. Tier 1 alone does not close either fixture
  (`nodebar` would go from +4px to +10px error — see ruledOut); ship them
  together or the ratchet widens.
- **confidence:** high

---

### revusu-28-pexi248

- **bucketLabel:** element-font
- **delta:** 0.097222
- **status:** resolved
- **mechanism:** `BoxSizingOpts` carries no line thickness, so the sizer builds
  its `EntityImageDescription` params with a hardcoded
  `UStroke.withThickness(0.5)`; `ActorAwesome.getPreferredWidth/Height` — which
  ARE thickness-aware and correctly ported — therefore compute `+2×0.5` where
  the renderer draws `stroke-width:4`.
- **originFileLine:** `src/diagrams/description/leaf-sizing-entity.ts:144`
  (`stroke: UStroke.withThickness(DEFAULT_SIZING_STROKE_THICKNESS)`; the
  function's own doc at :157-161 lists `stroke` as "deliberately NOT threaded")
- **causalChain:** `<style> actor { LineThickness 4 }` →
  `theme.colors.elements.actor.lineThickness === 4`, and
  `resolveElementLineThickness` returns it — but nothing in
  `ClassifyCtx`/`BoxSizingOpts` transports it.
  `ActorAwesome.getPreferredWidth() = bodyWidth 54 + 2t`,
  `getPreferredHeight() = headDiam 32 + bodyHeight 28 + 2t`
  (`src/core/skin/ActorAwesome.ts:113-119`, `thickness()` reading
  `fashion.getStroke()`). K2 adds the label. jar: `(54+8)` ×
  `(32+28+8) + 15` = **62.000 × 83.000**; ours: `(54+1)` × `(32+28+1) + 15` =
  **55.000 × 76.000**. Error = `2 × (4 − 0.5) = 7px` in BOTH dimensions =
  `7/72 = 0.097222in` ✓ — exactly the reported delta (pooled multiset: jar
  `0.611111, 0.663715, 0.861111, 1.152778` vs ours `0.611111, 0.663715,
  0.763889, 1.055556`, two index-wise gaps of 0.097222).
- **ruledOut:**
  - *`skinparam actorStyle awesome` (the parity table's other actor GAP).*
    **Closed since that table was written.** Our port already returns
    ActorAwesome's `54/32/28` geometry (55×76, not the stickman 27×60); only
    the thickness term is wrong. `planning/sizer-renderer-parity.md`'s
    `actorStyle` row is stale — re-verified per ADR-4.
  - *`FontSize 15` (the bucket label).* Threaded and correct: our height
    carries the 15px label line (76 = 61 + 15), matching the jar's
    83 = 68 + 15. Our SVG draws `a` at font-size 15.
  - *`BackGroundColor` / `LineColor` / `FontColor` / `FontStyle italic`.*
    Colour and face only; `planning/sizer-renderer-parity.md` records these
    `size-neutral` with the reasoning, and the deterministic width table is
    style-independent.
  - *The renderer.* It already resolves the thickness — our SVG emits
    `stroke-width:4` twice, matching the jar's two `stroke-width:4`
    occurrences. Fourth consecutive instance of the renderer-ahead-of-sizer
    shape.
  - *`component b`.* Exact at `0.663715 × 0.611111` on both sides.
- **sharedCauseWith:** none *(no other slug measured in this bucket; this is
  the `LineThickness` `GAP` row of `planning/sizer-renderer-parity.md:38`,
  jar-proven there on the stickman family, so T8 should look for siblings in
  other buckets — I have no evidence naming one)*
- **proposedWriteSet:** `src/diagrams/description/layout.ts`
  (`ClassifyCtx.lineThicknessFor` → `resolveElementLineThickness`),
  `layout-dot-tree.ts`, `leaf-sizing-consts.ts`
  (`BoxSizingOpts.lineThickness`), `leaf-sizing-entity.ts:144`
- **sizeEstimate:** 4 files, ~10 lines, sizer-only — no ink change, so the
  size ratchet alone verifies it. The sibling `deltaShadow` GAP
  (`leaf-sizing-entity.ts:143`, same `sizingPaint` function, same missing
  `Theme` channel) is one more field on the identical thread and should be
  batched with it, but is a separate parity row and needs its own fixture.
- **confidence:** high

---

### tijexo-10-zipo222

- **bucketLabel:** element-font
- **delta:** 0.286979
- **status:** resolved
- **mechanism:** `measureNote` discards the incoming `fontSpec.size` and
  hardcodes `NOTE_FONT_SIZE = 13`, so `<style> note { FontSize 10 }` — which is
  resolved, threaded through `ClassifyCtx.fontSizeFor` and delivered into
  `BoxSizingOpts.fontSize` — is never READ on the note path.
- **originFileLine:** `src/diagrams/description/leaf-sizing.ts:221`
  (`const noteFont: FontSpec = { ...fontSpec, size: NOTE_FONT_SIZE };`)
- **causalChain:** `theme.colors.elements.note.fontSize === 10`;
  `resolveElementFontSize(theme,'note','title')` returns 10;
  `layout-dot-tree.ts:179` sets `BoxSizingOpts.fontSize = 10`;
  `leaf-sizing.ts:109` builds `fontSpec = {...baseFont, size: 10}`;
  `leaf-sizing.ts:129` hands it to `measureNote`; **line 221 overwrites the
  size with 13.** Ours = `maxLineWidth("note that is green"@13) 89.5375 +
  NOTE_MARGIN_H 21` × `1×13 + NOTE_MARGIN_V 10` = **110.538 × 23.000**;
  jar = `68.875@10 + 21` × `10 + 10` = **89.875 × 20.000**. Width error
  20.662px = **0.286979in** ✓ (the reported delta, and the largest pooled gap:
  `|1.248264 − 1.535243|`); height error 3px. Controlled experiment:
  `measureLeafNode(note, base14, m, { fontSize: 10 })` returns
  `110.538 × 23.000` — **byte-identical to the no-opts call**, proving the
  value is delivered and ignored rather than never delivered.
- **ruledOut:**
  - *The value not reaching `BoxSizingOpts`.* Disproven by the controlled
    experiment above (identical output with and without `fontSize: 10`), plus
    the theme probe showing `resolveElementFontSize(note,'title') === 10`.
  - *`NOTE_FONT_SIZE`'s VALUE being wrong.* 13 is upstream `FontParam.NOTE`'s
    real default (`leaf-sizing-consts.ts:215-218`) and is correct whenever no
    override exists. The defect is that it is **unconditional**, not that it is
    mis-fitted — do not touch the constant.
  - *`.green { BackgroundColor green }` and the `<<green>>` classifier.*
    Colour only; cannot move a DOT box.
  - *The other two leaves.* `node n` = `0.663715 × 0.611111` and `file f` =
    `0.331250 × 0.472222`, both exact against the jar. The note is the sole
    divergent node.
  - *The renderer.* Already correct — our SVG draws "note that is green" at
    font-size 10, identical to the jar's. Third consecutive instance of the
    renderer-ahead-of-sizer shape.
- **sharedCauseWith:** none *(same FAMILY as `loroto-06`/`toxine-81` — "a
  per-element font size the renderer honours and the sizer does not" — but a
  DIFFERENT origin and a disjoint fix: `measureNote` is not on the
  `measureEntityLeaf` route at all. Not an exact shared mechanism, so not
  linked.)*
- **proposedWriteSet:** `src/diagrams/description/leaf-sizing.ts` (only)
- **sizeEstimate:** 1 file, ~3 lines, sizer-only. **Trap to avoid:**
  `leaf-sizing.ts:109` collapses "no override" into `baseFont` (size 14), so by
  the time `measureNote` runs, `fontSpec.size` cannot distinguish "no override"
  (must measure at 13) from "override 14". Using `fontSpec.size` directly would
  regress every plain note by 1px. The fix must read `opts?.fontSize ??
  NOTE_FONT_SIZE`, i.e. thread `opts` into `measureNote` (or change line 109).
- **confidence:** high

---

### toxine-81-xofo986

- **bucketLabel:** element-font
- **delta:** 0.083333
- **status:** resolved
- **mechanism:** Identical to `loroto-06-fano471` — the sizer resolves one font
  size per leaf and fills both `fontTitle` and `fontStereo` from it, so the
  per-element stereotype font size never reaches the measure path. This fixture
  is the same diagram written in `skinparam` block form rather than `<style>`
  form.
- **originFileLine:** `src/diagrams/description/leaf-sizing-entity.ts:146`
- **causalChain:** `skinparam node { StereotypeFontSize 20 }` resolves to the
  SAME theme state as `loroto-06`'s `<style>` spelling —
  `theme.colors.elements === { node: { stereotypeFontSize: 20 } }` in both — so
  the two fixtures produce **byte-identical oracle DOT**
  (`sh0006 1.277778×0.888889`, `sh0007 1.268924×0.750000`) and **byte-identical
  port output** (`1.257986×0.805556`, `1.268924×0.805556`). Arithmetic and
  pooled-multiset derivation are `loroto-06`'s, unchanged: max gap
  `|0.888889 − 0.805556| = 0.083333` = the 6px `nodefoo` height shortfall.
  Second tier likewise: `skinparam node { StereotypeFontSize<<bar>> 10 }`
  reaches `resolveSkinparam`'s `key.includes('<<')` branch
  (`src/core/skinparam.ts:62-66`) → `applyStereoOverride`, which has no
  `<sname>stereotypefontsize<<label>>` pattern, so the 10 is discarded; our SVG
  draws `«bar»` at 20 where the jar draws 10.
- **ruledOut:**
  - *That the identical delta is coincidental.* Positively disproven, not
    merely assumed: the two fixtures' oracle DOT files are identical to six
    decimals on both nodes, their resolved `theme.colors.elements` are equal,
    and their measured port output is identical. Same mechanism, two spellings.
  - *A `<style>`-vs-`skinparam` parse divergence.* `toxine-81` yields an EMPTY
    `styleMap` and `loroto-06` yields two selectors, yet both converge on the
    same `theme` — so the two front-ends already agree and neither is the
    defect. (This also means the tier-2 fix must be applied on BOTH front-ends:
    `applyStereoOverride` for `skinparam`, and the `node.stereotype..bar`
    selector tier for `<style>`.)
  - Everything else ruled out for `loroto-06` (label font size, the naive
    one-slot fix at 112.250×70 / 113.375×70, `wrapWidth`/`guillemet`/
    `minimumWidth`, the renderer's base tier) applies here verbatim and was
    measured on this fixture too.
- **sharedCauseWith:** `loroto-06-fano471`
- **proposedWriteSet:** identical to `loroto-06-fano471`
- **sizeEstimate:** none additional — closing `loroto-06` closes this fixture,
  with the one caveat that tier 2 must land on the `skinparam` front-end
  (`skinparam-stereo-keys.ts`) as well as the `<style>` one, or this slug stays
  open while `loroto-06` closes.
- **confidence:** high

---

## Cross-cutting note for T8

Four of the five are the **same structural shape** at four different sites: a
value the RENDERER already resolves and draws with never reaches, or is never
read by, the SIZER. Verified renderer-side on each (`«foo»`@20, note text@10,
`stroke-width:4`) — so no record here claims a missing resolver.

The exception is `gogamo-72`, where the renderer is equally blind because the
declaration line never becomes a node at all.

`loroto-06`/`toxine-81` additionally carry the ONLY defect in this bucket that
is also present in the renderer: the per-stereotype-name (`.bar` / `<<bar>>`)
font-size tier, unimplemented on both paths and on both `<style>` and
`skinparam` front-ends.
