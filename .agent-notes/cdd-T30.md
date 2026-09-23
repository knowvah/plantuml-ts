# cdd-T30 — `skinparam dpi` core reader

Status: **executed + closed**, worktree `cdd-t30` (branch `cdd/t30`, based on
`8707dfaa` which already contains T29). Full gate green: `npm test` 802
passed / 1 skipped (803 test files, matches on-disk `find` count via both
the console summary and `--reporter=json`), coverage 96.4/91.89/97.42/97.41
(all ≥90), typecheck (both tsconfigs)/lint/build clean, DOT parity
711/712 (100% of the 711 non-oracle-blind) unchanged from pre-T30.

## Mechanism

`core/scale-command.ts#resolveScaleFactor` gained a 4th `dpi: number = 96`
parameter, applied as `dpiFactor = dpi / 96` AFTER the existing per-
`ScaleSpec.kind` `clampScale` — mirrors `core/TextBlockExporter.java:
205-209`: `computeScaleFactor = fromScale * dpi/96.0`, where `fromScale =
scale==null ? 1 : scale.getScale(dim.width, dim.height)` (the CLAMPED
strategy factor, or the unclamped default 1 when no `scale` directive is
present — so `dpi` multiplies EVEN WITH NO `scale` directive at all; this
widened the `spec === undefined` early return, not just added a parameter).

`dpi` is a new bare-numeric skinparam key (`SkinParam#getDpi()`,
`skin/SkinParam.java:649-656`: `getAsInt("dpi", 96)`; `isDigits` is `\d+`
only — no sign, no decimal point — else the 96 default; `dpi <= 0` also
falls to 96, reachable only via the literal string `"0"` since a minus
sign already fails `isDigits`). Threaded through the SAME
accumulator→theme-builder→`Theme` channel every other skinparam scalar
uses (`nodeSep`/`rankSep`/`wrapWidth` precedent):
`skinparam-key-handlers-table-a.ts` → `skinparam-accumulator.ts` →
`skinparam-theme-builder.ts` → `theme-merge.ts` → `Theme.dpi`/
`ThemeOverride.dpi`.

Wired at 3 of the 4 listed call sites: `description/renderer.ts`,
`sequence/renderer.ts` (`renderPaginated`), `class/layout.ts` (T29's SAME
`resolveScaleFactor` call, no second scale-resolution path — `scaleK`
carries `k * dpi/96` into the class renderers automatically via T29's
existing `ScaledTheme` thread, verified not assumed: paluca/fuxoju's
font-size and every classifier-box stroke-width scale correctly with NO
further renderer changes).

## The one surprise: json/yaml/hcl does NOT read `theme.dpi`

The brief's own read-set list implied `json/renderer.ts` should be wired
the same way. Wiring it that way regressed
`tests/oracle/svg-conformance/json-family-structural.test.ts >
json/kicati-76-guvi771` (`skinparam dpi 600` in its source). Root-caused
before any fix (diagnosis.md): `JsonDiagram`'s own `SkinParam` is built
from `StyleExtractor` (`jsondiagram/StyleExtractor.java:53-97`), a NARROW
extractor distinct from the generic multi-`Command` line-walk
`TitledDiagram` subclasses (description/sequence/class) use — it
recognises only `<style>`/`!assume`/`!pragma`/`hide`/`scale`/`title`/
`skin` among its leading directives; a `skinparam dpi N` line falls into
the generic `else if (s.startsWith("skinparam "))` arm
(`StyleExtractor.java:82-89`), which checks ONLY for `handwritten`+`true`
and a `{`-nested block, then discards the line outright.
`SkinParam#getDpi()` therefore ALWAYS returns 96 for every json/yaml/hcl
diagram, confirmed against the oracle: `kicati-76-guvi771/in.svg` has
`font-size="14"` (unscaled) despite `skinparam dpi 600` in `in.puml`.

This is the EXACT mechanism `json/parser.ts` already special-cases for
`scale` — its own comment: "remaining directives (skinparam, scale,
hide…) are silently ignored… except scale, which upstream DOES act on:
StyleExtractor.java:82-83". `dpi` has no such exception upstream, so
`json/renderer.ts`'s `resolveScaleFactor` call was left UNCHANGED (no 4th
argument), with a doc comment added citing the mechanism.

## Before/after (render-diff.mts, structural+numeric)

| fixture | before | after |
|---|---|---|
| paluca-39-desa696 (dpi 300) | 10+106 | 0+1 (Δ0.013, negligible pre-existing DOT sub-pixel residual, amplified by the CONSTANT 3.125x — not dimension-dependent the way T29's `max width` residuals were) |
| ziparo-17-joku307 (dpi 300) | 40+286 | 8+72 (named residual, below) |
| fuxoju-95-xuko052 (dpi 300) | 6+92 | **0+0 exact** |
| bavoxa-34-keje375 (dpi 200) | 42+396 | **0+0 exact** |
| kicuna-39-riki626 (dpi 300 + svek) | 32+520 | 2+129 (named residual, below) |

Acceptance criteria confirmed directly against the oracle: `font-
size="43.75"` (=14×3.125), `font-size="29.167"`/`"25"` (=14×2.0833/
12×2.0833), stroke-widths `stroke-width="1.042"`/`"1.563"`/`"2.083"`/
`"3.125"`/`"4.688"` — every one an exact citation of `dpi/96` × the
unscaled `renderer-classifier-colors.ts`/`renderer-classifier-box.ts`
defaults T29's `ScaledTheme` thread already carries.

## Two named residuals (NOT fixed — outside T30's write-set)

Both are render-time pixel-literal constants T29's own residual list
already flagged as unreached ("Not reached by the 7 fixtures" — none of
T29's 7 fixtures had member visibility modifiers or an aggregation `*--`
edge, so neither gap was exercised until T30's fixtures):

1. `class-visibility-icon.ts:165` `const STROKE_WIDTH = 1` — the `+`/`#`/
   `-`/`~` member-visibility glyphs never read `theme.scaleK`. Ziparo:
   `exp=3.125|act=1` on all 4 glyphs, plus `renderer-note.ts:130`'s
   `NOTE_STROKE_WIDTH=0.5` (`exp=1.563|act=0.5`, its two note boxes) — the
   entirety of its 8 structural diffs (confirmed via `compareSvg`: every
   `@stroke-width` diff's `actual` is exactly `1` or `0.5`).
2. `renderer-arrowhead.ts:398` `const MIDDLE_STROKE_WIDTH = 1.5` — the
   `*--` aggregation diamond's `drawMiddleDecorShape` (kicuna's
   `E *-- F`). `exp=4.688|act=1.5` — kicuna's only 2 structural diffs.

Both are exactly the "same unscale/rescale pattern as the main extremity
fix would apply here too" T29 already named as a follow-on. A follow-on
task should thread `scaleK` through `class-visibility-icon.ts`/
`renderer-note.ts`/`renderer-note-lines.ts`/`renderer-arrowhead.ts
#drawMiddleDecorShape` together. `tests/unit/class/layout-dpi.test.ts`
pins both residuals directly (asserts every remaining stroke-width diff's
`actual` is the unscaled literal) so a future fix flips these assertions
rather than silently un-pinning them.

## Pre-authorised 500-line-cap splits (stop-1, three files)

`theme.ts` was ALREADY 600 lines (pre-existing, over cap, committed
before this task) before `dpi`'s 8 lines pushed it to 608 — split
`colors`/`sequence`'s inline object-type-literal fields to new
`theme-colors-fields.ts`/`theme-sequence-fields.ts` (pure move,
re-exported), landing at 495. One forced follow-on fix (not a behavior
change): `skinparam-theme-builder.ts#buildColorsOverride`'s
`Record<string,unknown> as Theme['colors']` cast started failing (TS2352)
once `Theme['colors']` became a NAMED interface — TS's implicit-index-
signature inference (which permits the cast) applies only to fresh object
type literals, never `interface` declarations. Fixed with the same `as
unknown as X` double-cast `buildGraphOverride` (one function above)
already uses for the identical reason.

`src/diagrams/json/renderer.ts` (525→528 after the dpi doc comment) split
its `#highlight`-class cluster (7 functions, ~91 lines) to
`json-renderer-highlight.ts`, landing at 429.

`src/diagrams/sequence/renderer.ts` (535→537) split `renderDivider` + 2
private helpers (~66 lines) to `renderer-divider.ts`, importing
`creoleRunText` back FROM `renderer.ts` (now exported) — a deliberate
two-way import between sibling modules. No cycle risk: both are pure
functions called at render time, never at module-init time; confirmed by
running all 1277 sequence unit tests with no init-order error.

## Not chased

- The Δ0.013 numeric residual on paluca (lollipop-connector path) — below
  visual significance, a pre-existing (unrelated to dpi) sub-pixel DOT-
  layout divergence, amplified uniformly by the correct 3.125x factor.
  Chasing it would reopen the class-layout dot-engine diagnosis, out of
  this task's write-set.
- `oracle/goldens/svg-class/*`/`parity-class.json` were NOT regenerated —
  fuxoju-95-xuko052 and bavoxa-34-keje375 are new exact-conformance
  candidates for a future re-pin, but pinning is outside T30's write-set
  and outside D12's boundary on touching the oracle-adjacent pin state.
