## Observation: the SVG golden re-baseline is a PORT, not a regeneration — 445/445 goldens change

- **Context**: acting on the tracked follow-up
  `oracle/pin.json:previousPin.svgSuitesNotRebaselined` ("the svg-* suites
  were NOT re-baselined with this bump -- two 'reduce SVG output size'
  commits are in range"). Measured the blast radius before touching
  anything, per the precedent the DOT pin advance set.
- **Measurement** (non-destructive; re-captured every committed golden with
  the CURRENT pinned jar into scratch and byte-compared):
  **SAME=0, CHANGED=445, FAILED=1.** Every single golden changes. One
  fixture, `svg-class/class-actor-bare-no-allowmixing`, produces NO svg
  from the jar at all — unrelated to the pin, worth its own look.
- **Cause**: two upstream commits, both inside the pin range
  (`59ddb531..11ed6720`), both touching
  `klimt/drawing/svg/SvgGraphics.java`:
  - `ba68279df92` ⚗️ reduce SVG output size (2026-06-24)
  - `4f3a0dcc63b` ⚗️ reduce SVG output size

### The six rules, read off the Java diff (this is the spec — do not re-derive)

1. **Decimal precision 4 -> 3.** New `SvgOption.decimal` field, **default
   `3`**, settable via `withDecimal(int)`; `FileFormatOption` carries it
   with a `-1` "unset" sentinel. `format(double)` becomes
   `String.format(Locale.US, "%." + option.getDecimal() + "f", x)` then
   `trimZeros`. The `x == 0.0 -> "0"` short-circuit is unchanged.
2. **`shortenColor`** — `#RRGGBB` -> `#RGB` when all three pairs have two
   identical digits. Length must be exactly 7 and start `#`; longer forms
   (`#RRGGBBAA`) and named/url colors pass through unchanged. Applied at:
   gradient `stop-color` (x3 sites), `style` `stroke:`, text `fill` (both
   the `fill.substring(0, 7)` and the plain `fill` sites).
3. **Common text attributes hoisted to the root `<g>`.** `gRoot` gets
   `font-family="sans-serif"` unconditionally and `lengthAdjust`
   (`spacing` / `spacingAndGlyphs`) per `option.getLengthAdjust()`.
   Per-`<text>`: `font-family` is emitted **only when it differs** from
   `sans-serif` (case-insensitive compare), and `lengthAdjust` is **no
   longer emitted at all** (inherited). `textLength` IS still per-`<text>`
   — it is not inheritable.
4. **`stroke-width` and `stroke-dasharray` suppressed when
   `stroke == "none"`.** Both move inside a single
   `if ("none".equals(stroke) == false)` guard.
5. **`textLength` skipped for single-character text** — the guard becomes
   `text.length() > 1 && (lengthAdjust == SPACING || SPACING_AND_GLYPHS)`.
   Rationale in upstream's own comment: one glyph has no inter-character
   spacing to adjust.
6. **`formatOpacity` / `formatPercent` reworked.** Both use
   `Math.max(option.getDecimal(), 2)` and then `trimZeros`. `formatOpacity`
   keeps its `<= 0 -> "0"` / `>= 1 -> "1"` short-circuits; the old
   `%.5f` (fill-opacity) and `%.4f` (percent/opacity) literals are gone.

### Why this cannot be done by regenerating goldens alone

`oracle/goldens/svg-*/<type>/<slug>/golden.svg` is the **jar's** output, and
the ratchet tests byte-compare OUR render against it
(`compareSvg(ours, golden, 'deterministic')`). Regenerating without porting
the emitter turns all 445 pinned assertions red at once.

### Blast radius on this repo

- 450 committed golden SVGs (445 pinned across 5 ratchet manifests:
  svg-class 313, svg-state 58, svg-description 51, svg-object 22,
  svg-skin 1; plus svg-conformance 4).
- Test files asserting the OLD format: 82 `stroke-width`, 77 with
  4-decimal literals, 66 `font-family`, 22 `lengthAdjust` (overlapping).
- `javaFixed4`/`javaRound4` (`src/core/number-format.ts`) has **28 caller
  files** and is deliberately klimt-independent — it is used outside SVG
  emission (e.g. `class-layout-helpers.ts` `textLength`). Changing its
  precision is NOT SVG-local; the decimal count wants to become a
  parameter, mirroring upstream's `SvgOption.decimal`, rather than a
  renamed constant.
- This changes the SVG bytes every consumer of the library receives.
- **Confidence**: High — every rule read directly off the upstream diff;
  the 445/445 figure is a measured byte-compare, not an estimate.
