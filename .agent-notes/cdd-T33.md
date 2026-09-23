# cdd-T33 — `skinparam mode dark`

Status: **executed**, worktree `cdd-t33` (branch `cdd/t33`, based on
`4626ccec`, which already contains T29+T30). `zirori-93-jefo337`
`diverged -> conformant` (0+0 exact, `compareSvg` structural+numeric).
Full gate: `npm test` 803 files, 22412 passed / 2 skipped / 6 todo, ONE
mechanised known-red (see below); typecheck (both tsconfigs)/lint/build
clean. Decision-journal rows 198-201; `next-missions.md` §5 filing.

## Mechanism

`SkinparamAccumulator.mode` (`'dark' | undefined`, `skinparam-key-
handlers-table-b.ts`, mirrors `SkinParam.isDark` — `skin/SkinParam.java:
114-116`, `"dark".equalsIgnoreCase(getValue("mode"))`) gates a NEW
`core/theme-dark.ts#DARK_MODE_DEFAULTS` table into the accumulator via
`skinparam-theme-builder.ts#buildThemePartial`'s new `applyDarkModeDefaults`
— a `??=` seed of `acc.background`/`acc.border`/`acc.text`/
`acc.classBackground`/`acc.classFontColor`/`acc.classAttributeFontColor`,
plus `acc.elements['spotclass']` when absent. Runs ONCE, after every
skinparam key has already been applied to `acc` — order-independent, and
an explicit skinparam/`<style>` value for the SAME field always wins
(mirrors upstream: `HColorSimple#darkSchemeTheme`, `klimt/color/
HColorSimple.java:236-239`, returns a user color UNCHANGED when it has
no baked `.dark` variant).

Five constants, each cited to its exact `.skin` line
(`~/git/plantuml/src/main/resources/skin/plantuml.skin`, the
`@media (prefers-color-scheme:dark) { ... }` block, `:563-776`):

| Field | Value | `.skin` line | Feeds |
|---|---|---|---|
| `background` | `#1B1B1B` | `document { BackGroundColor #1B1B1B }` (:572) | `theme.colors.background` — root SVG canvas |
| `border` | `#E7E7E7` | `root { LineColor #e7e7e7 }` (:567) | `theme.colors.border` (GENERAL, not class-specific — see below) |
| `text` | `#FFF` | `root { FontColor white }` (:566) | `theme.colors.text` (general); also reused for `classFontColor`/`classAttributeFontColor`/`elements.spotclass.font` |
| `classBackground` | `#313139` | `root { BackGroundColor #313139 }` (:568) | `theme.colors.graph.classBackground` |
| `spotClassBackground` | `#2E5233` | `spot { spotClass { BackgroundColor #2E5233 } }` (:644-646) | `theme.colors.elements.spotclass.background` |

## Design decisions verified against the Java/`.skin`, not assumed

1. **`border` routes through the GENERAL field, not `classBorder`.**
   Light mode has NO `theme.colors.graph.classBorder` default either —
   `renderer-classifier-colors.ts#classBorder(geo,theme)`'s own fallback
   chain (`tagBorder ?? classCascadeBorder ?? theme.colors.graph
   .classBorder ?? theme.colors.border`) already falls through to the
   GENERAL `theme.colors.border` (`#181818` light default) by design.
   `root { LineColor #e7e7e7 }` is upstream's OWN single root-level
   value, consumed by BOTH the classifier box's stroke AND the badge
   ellipse's own stroke (`class-badge.ts#resolveBadgeBorder`'s
   `defaultBorder` param is `theme.colors.border`, not a class field) —
   routing through the general field reproduces that shared-root shape
   exactly, and reaches the badge stroke for free (verified: zirori's
   badge `<ellipse>` stroke is `#E7E7E7`, the SAME value as the box).

2. **Classifier name/member text reuses `classFontColor`/
   `classAttributeFontColor` (cdd-T19's fields), not a new theme field.**
   `renderer-classifier-rows.ts#terminalCascadeFontColor` has a
   HARDCODED `'#000000'` fallback — NOT `theme.colors.text` (confirmed:
   `theme.colors.text`'s light default is `#181818`, a DIFFERENT value,
   sourced from a different upstream role; the two do not converge in
   light mode). `classFontColor`/`classAttributeFontColor` already feed
   `classCascadeHeaderFontColor`/`classCascadeFontColor`, the tier
   `terminalCascadeFontColor` consults BEFORE its own hardcoded default,
   with EXISTING "explicit `<style>` wins" precedence
   (`skinparam-theme-builder.ts`'s own doc comment on `buildColorsOverride`
   for the analogous `classCascadeRoundCorner` field). Seeding these two
   accumulator fields reaches the header AND member rows with ZERO new
   `Theme`/`ThemeGraphColors` fields and ZERO changes to
   `renderer-classifier-rows.ts`.

3. **Badge glyph color reuses `ElementColors.font` on the EXISTING
   `elements['spotclass']` bucket**, not `theme.colors.graph
   .spotCascadeFont` (a DIFFERENT field, populated only by a `<style>
   root { FontColor } }` cascade pass outside the accumulator/
   `skinparam-theme-builder.ts` entirely — reaching it would have
   required a new accumulator field routed through
   `theme-graph-colors-b.ts`/`style-cascade-class.ts`, both outside
   T33's write-set). `class-badge.ts#resolveBadgeGlyphColor` already
   consults `spot?.font` (`theme.colors.elements['spotclass'].font`)
   ahead of `rootFallback` and the hardcoded default — setting `font` in
   the SAME `elements['spotclass']` object the badge-fill default
   already populates reaches BOTH the badge ellipse fill AND its glyph
   `<path>` fill with one seed, zero `class-badge.ts` changes.

Net: **zero changes to `theme.ts`, `theme-graph-colors-a/b.ts`,
`renderer-classifier-rows.ts`, `class-badge.ts`, or `renderer.ts`** — the
entire mechanism fits in one new file (`theme-dark.ts`) plus three
small, targeted edits.

## The 10th diff — DISPROVED as a missing second layer

The brief's own leading hypothesis (`svg/g[1][childCount] exp=2 act=1`
needing a NEW second `<rect>` layer in `renderer.ts`) was instrumented
and found to be the SAME single mechanism as every other zirori diff,
not a separate one. `renderer.ts:265-267`'s EXISTING
`documentBackgroundRect` gate (`canonicalBackground !== '#000000' &&
!== '#FFFFFF' && !== transparent`) already draws the background `<rect>`
as the root `<g>`'s first child whenever `theme.colors.background`
resolves to a non-default color — it simply never fired for `mode dark`
because `theme.colors.background` was never wired to anything but the
`#FFFFFF` default before this task. Once `acc.background` is seeded
(`#1B1B1B`, non-excluded), the pre-existing gate fires and childCount
becomes 2 with NO `renderer.ts` edit. `renderer.ts` is UNTOUCHED by
this task — confirmed via `git status --short` and the test asserting
rect-then-entity-group order.

## Wide-reach check (mode unset)

`npm run svg:survey -- class` isolated via `pin-diff.mts` (stash/pop
against the SAME `4626ccec`-based tree, comparing pre-T33 vs post-T33
surveys directly, NOT the stale on-disk `parity-class.json` which is
pinned to pre-T29/T30 and shows 5 UNRELATED transitions —
corine/jiramo/koxoco/vebini are `scale`, paluca/bavoxa/fuxoju are `dpi`,
all pre-existing T29/T30 work already merged into this branch's base):
**exactly ONE transition**, `zirori-93-jefo337: diverged -> conformant`.
No other class fixture moved. `bajotu-30-soku184` (a `mode`-free
regression fixture) pinned directly in `tests/unit/class/
mode-dark-t33.test.ts`, unaffected.

## Cross-engine movement — mechanised, one test left RED by design

`mode`'s key handler lives in the SHARED `skinparam-key-handlers-
table-b.ts`, so it reaches every diagram type through the same
`resolveSkinparam`/`buildThemePartial` pipeline. `grep -rl 'skinparam
mode' test-results/dot-cache/*/*/in.puml` found two non-class hits:

- `state/ketibo-84-juzo029` — **FALSE POSITIVE**. Its source is
  `skinparam model FOO` (typo: "model", not "mode") — a substring match
  on `mode`, not a real key. Confirmed unaffected: `compareSvg` diff
  count 6 before AND after (stash/pop isolation).
- `activity/levuma-67-cego489` — a REAL `skinparam mode dark` fixture.
  Moved 219 -> 216 `compareSvg` diffs (stash/pop isolation): `svg/
  @background` and `svg/g[1]/rect[1]/@fill` both went from `#FFFFFF`
  (wrong) to `#1B1B1B` (exact jar match), because activity's
  `assemble-svg.ts` feeds `theme.colors.background` through the SAME
  shared `core/svg.ts#svgRoot` bgRect gate T30 already established as a
  free-for-every-engine seam. The remaining 216 diffs are unrelated
  pre-existing activity issues (dot-engine layout geometry, an
  "option1" vs "yes" label mismatch, the diamond fill/text colors —
  activity's OWN dark defaults, explicitly out of T33's boundary).

  This trips ONE equality-pinned test: `tests/oracle/svg-conformance/
  activity.style-baseline.test.ts > levuma-67-cego489` (`rx { (absent):
  pinned 0 -> now 1 }` — the histogram now counts the newly-drawn,
  rx-less background `<rect>`). **Left RED, deliberately**:
  `scripts/repin-activity-baselines.ts`'s own header states
  "ORCHESTRATOR-ONLY... never per task, which would destroy the
  attribution D6 [of mission `activity-lane-capture`] exists to buy",
  and `oracle/goldens/svg-activity/*` is outside BOTH T33's write-set
  AND `batch-9/close.md`'s write-set (which only journals non-class
  movers per its own step 6, never re-pins them). Filed in
  `next-missions.md` §5 for `activity-lane-capture`'s own process.

## Write-set note (stop 1)

`src/core/skinparam-theme-builder.ts` is outside T33's literal
write-set (`theme.ts`/`theme-dark.ts`, `skinparam-accumulator.ts`,
`skinparam-key-handlers-table-a/b.ts`, `class-badge.ts`, `renderer.ts`
only) — it is the necessary, and only, wiring point (see "Mechanism"
above: it is the sole place with full, order-independent visibility
into every skinparam key a diagram declared). Flagged, not silently
expanded; `applyDarkModeDefaults`'s own doc comment in that file quotes
the same reasoning. A CCN-15 complexity-hook block on the first draft
of that function was resolved by a table-driven refactor
(`DARK_SCALAR_SEEDS`), mirroring the file's own pre-existing
`FieldTable`/`applyDefinedFields` pattern — no behavior change, verified
by the SAME test suite before/after the refactor.

## Not touched (confirmed out of scope, not oversight)

- `sadamo-18-siva346`/`luzive-62-zote562` (T32/T34's fixtures) — no
  `mode dark`, untouched, unread beyond the initial grep.
- `renderer.ts`, `class-badge.ts`, `theme.ts`, `theme-graph-colors-a/
  b.ts` — zero diff (see "Design decisions" above for why each was
  reachable without touching them).
- Activity's own dark defaults (diamond fill/border, text tertiary
  tier) — named, not built (boundary: "other diagram types' dark
  defaults are out of scope... name them in next-missions.md").
