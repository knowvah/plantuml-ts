# F3-diag — `fariba-82-xolu802` `sh0006` residual

Sub-diagnosis of the +2px `sh0006` gap SYNTHESIS §4 recorded as the mission's
one open sub-diagnosis. Schema: `../../s1l-tail-diagnosis/findings/SCHEMA.md`
(block copied verbatim). **Docs-only, ADR-2 — no `src/` file changed.**

Measured on `82d0d015` (Batch 3 in flight: `F3-seam` landed, `F3-fix` partially
applied — neither perturbs the numbers below; the `sh0006` height read
126.000000px identically before and after `F3-fix`'s first edits appeared).

---

### fariba-82-xolu802

- **bucketLabel:** container-cluster (misfire, unchanged from T1 — the
  `<style>` block's `file {` selector matched the container-opener regex)
- **delta:** 0.194444 (current tree, post-E1). Node-level: `sh0007` (`policy`)
  ours 2.434896 × 2.027778in vs oracle 2.434896 × 2.222222 = **0.194444**
  (E2, tab expansion — F4-c's target); `sh0006` (`user`) ours 1.462500 ×
  1.750000in vs oracle 1.462500 × 1.722222 = **0.027778** (this record).
  Backlog pin is 0.388889 (pre-E1); widths are bit-identical on both nodes.
- **status:** resolved
- **mechanism:** `awslib/AWSCommon.puml:35-37` sets `skinparam rectangle {
  StereotypeFontSize 12 }`, so the jar measures `sh0006`'s `«User»` row at
  12pt while we measure it at 14pt — exactly 2px of extra height. **Two
  independent defects each force the 14, and both must be fixed for the node
  to close.** (M1) `buildStyleMapPartialTheme` replaces `theme.colors
  .elements` wholesale with the `<style>`-derived buckets, so the fixture's
  `<style> file { … }` block *deletes* the skinparam-derived `rectangle`
  bucket that carried `stereotypeFontSize: 12`. (M2) The leaf sizer passes one
  `FontConfiguration` to both `paint.fontTitle` and `paint.fontStereo` and
  only ever resolves the `'title'` role, so a surviving `stereotypeFontSize`
  would still not reach the stereotype row (this is G4 — `F3-fix`'s tier 1,
  landing in this same batch).
- **originFileLine:** `src/core/style-map-theme.ts:141` (M1 —
  `...(extras.hasElements ? { elements: extras.elements } : {})` inside
  `buildStyleMapPartialTheme`; `deepMergeTheme`'s `colors: { ...base.colors,
  ...partial.colors }` at `src/core/theme.ts:428-430` is a shallow spread, so
  this key is a full replacement, not a merge).
  M2's origin: `src/diagrams/description/leaf-sizing-entity.ts:146`
  (`fontStereo: font`, the same `sizingFontConfig(fontSpec)` used for
  `fontTitle` at `:145`; the diagram-wide size arrives via
  `src/diagrams/description/layout.ts:455`'s
  `fontSizeFor: (sname) => resolveElementFontSize(theme, sname, 'title')` —
  that line number is against the in-flight `F3-fix` tree and will move; the
  stable handle is `ClassifyCtx.fontSizeFor`'s construction in `runLayout`).
- **causalChain:** `User(user, "Trusted user", "")` expands (via
  `AWSCommon.puml`'s `AWSEntity`) to `rectangle "==…\n$AWSImg(User)\n//<size
  :12>[…]</size>//" <<User>> as user`, symbol `rectangle`, stereotype
  `«User»`. `USymbolRectangle` is a K1 margin box, `[20,20]`
  (`planning/usymbol-composition.md`), and its content is
  `dimStereo.mergeTB(dimLabel)` — max-width / **sum-height**. Label block is
  92px on both sides (16pt heading 16 + `<img>` 64 + 12pt italic 12). Jar:
  20 + 12 + 92 = **124px = 1.722222in**. Ours: 20 + **14** + 92 = **126px =
  1.750000in**. The whole residual is the one stereotype row, so it is
  width-invariant (both sides emit 1.462500in) — exactly the
  "independent of label width" property T1 observed.
  The 14 is forced twice over: `preprocess` *does* produce
  `rectanglestereotypefontsize = "12"` (verified: it is in
  `PreprocessorResult.skinparam` for this fixture), Stage 2's
  `resolveSkinparam` *does* build `elements.rectangle = { stereotypeFontSize:
  12 }`, and then Stage 3c's `applyStyleMap` overwrites `colors.elements` with
  `{ file: { font: "blue" } }` — the `rectangle` bucket is gone before either
  path can read it (M1). With the `<style>` block removed the bucket survives
  and our **renderer** immediately draws `«User»` at 12 (`<text … font-size=
  "12" …>«User»</text>`) — but the **sizer** still returns 126px, because
  `sizingPaint` never asks for the `'stereotype'` role (M2).
  Upstream does not have M1: `StyleBuilder.muteStyle`
  (`~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/
  StyleBuilder.java:86-104`) copies the existing storage and then merges each
  incoming style **per `StyleSignatureBasic`** with
  `MergeStrategy.OVERWRITE_EXISTING_VALUE`, so a `file` signature cannot evict
  a `rectangle` signature.
- **ruledOut:**
  (a) *The `$User [64x64/16z]` sprite + label stack* — T1's own `nextStep`
  named this, and it is **wrong**. Ruled out by a sprite-free, img-free,
  single-line reproduction: `skinparam rectangle { StereotypeFontSize 12 }` +
  `rectangle "Trusted user" <<User>> as u` + throwaway `rectangle "qq"` + one
  edge measures jar **0.638889in (46px)** vs ours **0.666667in (48px)** — the
  identical +2px, with no sprite anywhere in the diagram. Dropping the
  skinparam from that same probe gives jar 0.666667 = ours 0.666667, delta 0.
  Widths agree (1.314410in) in all four readings.
  (b) *Anything in `sh0006` other than the stereotype row* — ruled out by a
  discriminating control on the real awslib element: re-declaring `skinparam
  rectangle { StereotypeFontSize 14 }` **after** the awslib includes makes the
  jar emit `sh0006 [… width=1.462500,height=1.750000]`, i.e. **bit-identical
  to ours**. Forcing one variable to our value collapses the entire residual
  to zero, so the sprite, the `<img>` atom, the `==` heading, the
  `<size:12>` inline size and the `[20,20]` margin are all already exact.
  (c) *E1 (multiline-open stereotype capture, F1-b)* — ruled out: `sh0006` is
  not a `keyword code <<st>> [` form, its stereotype IS captured (we render
  `«User»`), and the +2px is measured on the current tree *after* E1 landed
  (fixture headline moved 0.388889 → 0.194444; `sh0006` stayed 126px).
  (d) *E2 (`\t` tab-stop advance, F4-c)* — ruled out: `sh0006` contains no
  tab; the E2 gap is entirely on `sh0007`, whose 0.194444in is the current
  headline. Truncating `sh0007`'s body to a single tab-free line (`p3` probe)
  leaves `sh0006` at exactly 126 vs 124.
  (e) *`skinparam wrapWidth 200`* — ruled out: probe (b)'s reproduction sets
  no `wrapWidth` at all and still shows the same 2px; and a `wrapWidth 200` +
  `StereotypeFontSize 12` probe leaves the element bucket intact, so
  `wrapWidth` is neither cause nor confounder.
  (f) *The `<style> file { HorizontalAlignment left / FontColor blue }`
  declarations themselves* — ruled out as *content* levers (T1 already showed
  deleting the block leaves both nodes' dims unchanged on both sides). What
  matters is only that the block **exists and is element-scoped**: bisection
  shows `skinparam rectangle { StereotypeFontSize 12 }` alone → bucket
  present; `+ skinparam wrapWidth 200` → present; `+ skinparam
  rectangle<<stereo>> { … }` → present; `+ <style> file { … }` → **bucket
  gone**. Any element-scoped `<style>` selector triggers it.
  (g) *Stale golden* — ruled out twice: T1 regenerated `svek-1.dot`
  byte-identically with `-DPLANTUML_DETERMINISTIC_TEXT=true`, and this task
  independently re-derived `height=1.722222` from the jar on a reduced variant
  of the same source.
  (h) *`AWSEntityColoring`'s unsubstituted macro parameter* — the fixture's
  skinparam map really does carry the literal keys
  `rectanglebackgroundcolor<<stereo>>` / `rectanglebordercolor<<stereo>>`
  (the `!definelong AWSEntityColoring(stereo)` argument is not substituted,
  where upstream yields `rectangle<<User>>`). Ruled out **for this delta**:
  both are `BackgroundColor`/`BorderColor`, colour-only and size-neutral per
  `planning/sizer-renderer-parity.md`'s colour rows, and probe (f)'s `+
  skinparam rectangle<<stereo>> { … }` step leaves the bucket and the
  dimensions untouched. It is a real, separate preprocessor defect worth its
  own record; it is not this one.
- **sharedCauseWith:** M2 is **the same mechanism as G4** (`SYNTHESIS.md`
  G4 / `F3-fix` tier 1) — this fixture is an unlisted G4 member, so `F3-fix`
  fixes half of it for free. M1 has no other named fixture yet, but its
  trigger is generic: **any diagram that sets a per-element skinparam AND
  contains an element-scoped `<style>` selector**. Four description goldens
  match that shape by literal source grep (`cusubu-18-xacu379`,
  `kagapo-72-cofe085`, `revusu-28-pexi248`, `vajaxu-62-poto986`); the grep
  undercounts, because `fariba-82` itself is invisible to it (its skinparams
  arrive through `!include <awslib/AWSCommon>`). The class/state/object
  engines read the same `buildTheme` stages, so M1 is cross-engine.
- **proposedWriteSet:** M1 — `src/core/style-map-theme.ts` (merge
  `base.colors.elements` per-`sname` with `extras.elements` instead of
  replacing, mirroring `StyleBuilder.muteStyle`'s per-signature
  `mergeWith`); possibly `src/core/theme.ts` if the merge is better expressed
  in `deepMergeTheme`. M2 — already in `F3-fix`'s write-set
  (`src/diagrams/description/{layout,leaf-sizing-consts,leaf-sizing-entity}
  .ts`, `src/core/theme-element-resolve.ts`). **`style-map-theme.ts` is in NO
  task's write-set in this mission** (Batch 3 overview lists
  `style-map-element.ts`, a different file).
- **sizeEstimate:** M1 is 1 file, ~10 lines, but its blast radius is every
  engine's theme resolution — it changes which element buckets survive for
  any diagram mixing `skinparam` with `<style>`, so it needs all four size
  ratchets plus the full `npm test` (some goldens may have been captured
  against the current replace-semantics). M2 is already sized inside `F3-fix`.
- **confidence:** high — the control in `ruledOut` (b) drives the jar to our
  exact number by moving one variable, and the closed-form arithmetic
  (20 + 12 + 92 = 124 vs 20 + 14 + 92 = 126) matches to the pixel.

---

## What this means for `F4-c` and the mission count

**`fariba-82-xolu802` does NOT close on `F4-c`'s tab-stop fix alone, and it
does not close on `F4-c` + `F3-fix` either.**

| after | `sh0007` (E2) | `sh0006` | fixture delta |
|---|---|---|---|
| today (`82d0d015`) | 0.194444 | 0.027778 | **0.194444** |
| `F3-fix` (G4/M2) lands | 0.194444 | 0.027778 — M1 still deletes the bucket | 0.194444 |
| `F4-c` (E2) lands too | 0 | **0.027778** | **0.027778** — still > 0.01 |
| `F4-c` + M1 + M2 | 0 | 0 | **conformant** |

So `F4-c` should proceed — its own mechanism is diagnosed, correct, and worth
0.194444in — but it must **not** book the +1 or delete
`fariba-82-xolu802`'s backlog pin. Instead it should re-pin the shrunken
delta at 0.027778 (ADR-1: report, do not write `size-backlog.json`) and hand
M1 forward. On the mission's running count that is **346, not 347**, unless
M1 is also scheduled — which is a decision for the orchestrator, since
`src/core/style-map-theme.ts` is outside every current task's write-set and
stop condition 1 applies.

Note the one genuinely good piece of news: M2 is not new work. It is G4,
already in flight as `F3-fix`. The only unowned item is M1.
