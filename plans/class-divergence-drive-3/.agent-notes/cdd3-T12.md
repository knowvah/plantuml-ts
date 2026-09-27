# cdd3-T12: rectangle usymbol icon (sijisi-94-ripu606)

## Observation: a `rectangle` leaf never routed through `EntityImageDescription`
- **Context**: sijisi-94-ripu606's `rectangle "foo2" { rectangle "foo3" }`
  under `allow_mixing` — `foo3` drew as a full class box (visibility-icon
  ellipse badge, members divider) instead of a plain rounded rect.
- **Finding**: `EntityImageDescription.java` draws EVERY descriptive leaf
  through the SAME `symbol.asSmall(...)` path regardless of which `USymbol`
  `getUSymbol(entity)` resolves (`EntityImageDescription.java:217-224`'s
  unconditional fallback to `componentStyle().toUSymbol()`); `rectangle`
  resolves to `USymbols.RECTANGLE` (`new USymbolRectangle(SName.rectangle)`)
  exactly like `component` resolves to `USymbols.COMPONENT2`. This port's
  `EntityImageDescription.ts`/`USymbolRectangle.ts`/`USymbols.ts` were
  already faithful (verified by reading each; no changes needed there). The
  actual gap was the CLASS ENGINE's OWN dispatch gate,
  `renderer-usymbol-entity.ts#usesClassUSymbolEntity`, which allowlisted
  only `usecase`/`circle`/`actor`/`component`/`database` — `rectangle` fell
  through to `renderer.ts#renderClassifier` -> `renderClassifierBox`, the
  generic name+members class box.
- **Second mechanism**: `EntityImageDescription.java:168`'s `roundCorner`
  is computed UNCONDITIONALLY from `styleTitle.value(PName.RoundCorner)`
  for every leaf (classDiagram's `element { RoundCorner 5 }` cascade,
  `plantuml.skin:193-197`) — it's just that only shapes which actually READ
  `SymbolContext#getRoundCorner()` (`USymbolComponent2#drawComponent2`,
  `USymbolRectangle#drawRect`) show it. The port's `buildUSymbolEntityParams`
  had hardcoded this to `symbolKeyword === 'component' ? 5.0*scaleK : 0`;
  widened to include `'rectangle'` too (renamed `COMPONENT_ROUND_CORNER` ->
  `ELEMENT_ROUND_CORNER` to reflect the shared, not component-specific,
  scope). Verified via `sijisi-94-ripu606`'s golden `foo3` rect:
  `rx="2.5" ry="2.5"` (5.0 halved at serialization,
  `driver-rectangle-svg.ts`'s `rx/2`).
- **Ruled out**: `USymbolRectangle.ts`, `USymbols.ts`'s `RECTANGLE` record,
  `EntityImageDescription.ts`/`Support.ts`'s symbol-resolution seam,
  `core/usymbol-shapes.ts` (the fallback-only icon map for hand-built test
  fixtures with no `StringMeasurer` — genuinely has no `rectangle` icon
  entry in the jar either; `EntityImageDescription` handles it, not a
  per-shape icon renderer) — all already correct, confirmed by reading each
  file in full before touching anything.
- **Impact**: fixes every class-diagram `rectangle` leaf (and any
  `allow_mixing`/unknown-bucket diagram routed through the class engine
  with a bare `rectangle` keyword), not just sijisi.
- **Confidence**: High — render-diff, unit tests, and two independent
  full-corpus surveys (class render-all + unknown-bucket svg:survey,
  isolated pre/post-fix) all corroborate.

## Fix
- `src/diagrams/class/renderer-usymbol-entity.ts`:
  - `usesClassUSymbolEntity`: added `classifier.usymbol === 'rectangle'`.
  - `buildUSymbolEntityParams`: `roundCorner` condition widened to
    `component || rectangle`; constant renamed `ELEMENT_ROUND_CORNER`.
  - Doc comments updated (both functions + `resolveSymbolKeyword` +
    `renderClassUSymbolEntity`'s module doc) citing
    `EntityImageDescription.java:168,217-224` and
    `USymbolRectangle.java:65-71`.
- `src/core/usymbol-shapes.ts`: unchanged — confirmed it needs no
  `rectangle` entry (its four icons are the fallback path for hand-built
  `ClassifierGeo` test fixtures with no real `StringMeasurer`; the
  production path for `rectangle` is `EntityImageDescription`/
  `USymbolRectangle`, same as `component`/`database`/`actor` already are).

## Movers (pin-diff plans/class-divergence-drive-3/measurements/b0.json
vs /tmp/cdd3-T12.json, class render-all, 723 fixtures)
12 transitions total; 11 are T7/T9/T11's already-merged closes (bejeli,
gabejo, jubobo, julixi, rulite, xosiza -> conformant [T7]; sugifi, sumule,
xumofu, rojoxi -> conformant [T9]; nafiki -> structural-match [T11]).
Only NEW mover: **sijisi-94-ripu606: diverged -> conformant** (structural
2->0, numeric 2->0). Zero rises.

## Movers (svg:survey component/usecase/object/state vs /tmp/cdd3-b0-eng)
0 transitions each — this fix is class-engine-only (`renderer-usymbol-
entity.ts` has no other engine caller), verified by survey.

## Movers (svg:survey unknown vs /tmp/cdd3-b0-eng/parity-unknown.json)
10 raw transitions; isolated the T12-caused subset by diffing a pre-fix
`git stash` run against the post-fix run (both against the SAME worktree
HEAD, so T7/T9/T11's already-merged movers cancel out):
- **copono-56-kuci969**: diverged -> conformant
- **gasevo-58-ciso782**: diverged -> structural-match (residual: `svg/
  @height` off by 1px, unrelated mechanism, not chased — out of scope)
- **pevefe-09-zaro044**: diverged -> conformant
- **rizisu-50-liza998**: diverged -> structural-match (residual: a large
  `text/@x` delta, unrelated mechanism, not chased — out of scope)
All four contain a bare `rectangle KEYWORD [...]`/`rectangle NAME {}`
leaf (grep-verified against `~/git/pdiff`'s sources) — same mechanism as
sijisi, routed through the class engine's unknown-bucket path.
The other 6 raw transitions (xadudi/gemepu/kupofu — T9's, named in its
own commit; lazuxa/pocube/vajaru structural-match->conformant) are
pre-existing in the worktree baseline (present identically in the
pre-stash run) — not caused by this task, excluded per the task brief.
