# cdd3-T29 — error-page geometry (C-17)

## Diagnosis confirmation

C-17's proposed mechanism ("error-page line metrics were fitted to a
non-deterministic jar render") was confirmed by reading the Java, not by
re-running the cached probe (none was cached for this task beyond the
`diff.txt` files). Read in full:

- `klimt/shape/GraphicStrings.java`, `error/PSystemError.java#getGraphicalFormatted`
- `klimt/shape/TextBlockRaw.java`, `TextBlockVertical.java`, `TextBlockMarged.java`,
  `SingleLine.java`, `TileText.java`
- `klimt/drawing/font/StringBounderFromWidthTable.java`
- `klimt/drawing/svg/DriverTextSvg.java`, `SvgGraphics.java` (`text`, `ensureVisible`, `createXml`)
- `klimt/font/FontPosition.java`, `klimt/geom/XDimension2D.java`

Derived (and jar-verified against both fixtures' cached goldens) mechanism,
none of it fitted:

1. Under the deterministic `StringBounder`
   (`StringBounderFromWidthTable#calculateDimension`: `height = size`
   unconditionally), every line's box height is EXACTLY its font size — no
   ascent/descent ratio. `SingleLine#maxDeltaY` for a single-run line
   (`TileText`) then makes the baseline exactly `boxTop + size`.
2. `PSystemError#getGraphicalFormatted` builds five paragraphs
   (banner/band/allButLast/last/message) via `TextBlockRaw` +
   `TextBlockUtils.withMargin` + `mergeTB`, LEFT-nested
   (`result = mergeTB(result, resultN, LEFT)` repeated). `XDimension2D
   #mergeTB` is `width=max, height=sum` — associative, so the PAGE's overall
   width/height needs no tree walk. The green `[From … ]` band's own
   background rect is the ONE exception: `TextBlockVertical#drawU` sizes a
   backcolored child's rect to `dimtotal.getWidth()` of the SPECIFIC 2-child
   `TextBlockVertical` it is `b1` of — i.e. `max(bandWidth,
   bodyAllButLastWidth)`, not the whole page's width and not the band's own
   line width alone. Every other merge step's child carries no backcolor, so
   draws no rect (`TextBlockVertical`'s `if (back != null …)` guard) — only
   ONE rect on the whole page.
3. The final `<svg>` width/height/viewBox come from `SvgGraphics`'s own
   `maxX`/`maxY` accumulators (`ensureVisible`: `if (x > maxX) maxX = (int)
   (x + 1);`), NOT from any independently-computed dimension —
   `createXml` reads `maxX`/`maxY` straight into the root attributes
   (`SvgGraphics.java:801-813`). The constructor seeds this with `minDim` =
   the page's OWN declared `TextBlock` dimension
   (`SvgGraphics.java:143`), and for both luzive and sadamo that seed
   dominates every subsequent text run's own `ensureVisible(x+textLength,
   y)` call (the declared width IS the widest line, by construction) — so
   the canvas size reduces to `Math.trunc(declaredDimension + 1)`.
   Jar-verified against both fixtures (389×218, 602×190) — this is a
   real mechanism, not curve-fitting: it falls straight out of reading
   `SvgGraphics`'s constructor and `ensureVisible`.
4. `SingleLine.rawText`'s `if (text.length() == 0) text = " ";`
   substitution (applied BEFORE the line becomes a `TileText`) matters for
   more than layout: `DriverTextSvg`'s own whitespace-only branch converts
   that space to NBSP (U+00A0) for EMISSION. Missing this substitution in
   the port meant blank source lines rendered as an EMPTY `<text></text>`
   instead of the jar's `<text> </text>` — caught by hand-diffing the
   probe output against the byte content of the cached golden (`python3
   -c "...find(b'y=\"128\"')..."`), not by `render-diff.mts` (which diffs
   `text()[1]` and would have reported it as an "S" line, but I fixed it
   before running the diagnostic diff against this specific line).

## Scope decision (not in the task file, made during execution)

`error-renderer.ts`'s `Block`/`Line`/`lineAdvance`/`lineAscent` (the fitted
`LINE_ADVANCE_RATIO`/`ASCENT_RATIO` constants) are STILL used by
`blackOnWhite` (Welcome/Unsupported, via `Display`/Creole — a materially
different upstream composition, `GraphicStrings.createBlackOnWhite`) and by
the rare Welcome-stacked-on-error path (`source.length < 5`). Both are
OUTSIDE this task's fixture set (luzive/sadamo are both >= 5 lines) and
UNDIAGNOSED — no probe or diagnosis section covers them. Rather than assume
the same "height === size" rule applies there too (it might not: Creole/
`Stripe`-based line layout is a different code path with possibly different
real spacing, and the fitted ratios may have been reverse-engineered
specifically for IT), I left `blackOnWhite`/`errorBlockLegacy`/`drawBlocks`
completely untouched and added a SEPARATE, dedicated exact-geometry path
(`error-page-exact.ts#renderErrorPageOnly`) used ONLY when
`getTotalLineCountLessThan5() === false`. This is a zero-regression-risk
design: every fixture that could have exercised the OLD fitted path still
does, unchanged; every fixture that hits the new path is provably correct
against two independent jar goldens. Flag for a future task: whether
Welcome/Unsupported's OWN geometry has the same "declared width, not fitted
ratio" bug is now an open question this task did NOT verify either way.

## File split (complexity hook)

`error-renderer.ts` was already at 376 lines; the full C-17 addition
would have pushed it past the 500-line hook. Split into
`src/core/error/error-page-exact.ts`, which imports `Run`/`drawRun` and the
color/font/margin constants (now exported) from `error-renderer.ts`, and
`error-renderer.ts` imports `renderErrorPageOnly` back — a two-way import
between the pair, but no cycle at module-eval time (every cross-reference is
inside a function body); `tsc --noEmit` and the full suite are both clean
with it.

## Report

**Fixtures:**
- luzive-62-zote562: S11/N21 (pass=false) -> S4/N0 (pass=false — C-18
  proposed-accept identity lines only: `text[1]` banner string+textLength,
  `text[2]` band string+textLength). Every OTHER diff (textLength ×7, all
  14 baseline `y`s, canvas `width`/`height`/`viewBox`, band `rect`
  `x`/`y`/`width`/`height`) is now 0.
- sadamo-18-siva346: S11/N19 (pass=false) -> S4/N0 (pass=false — same two
  C-18 identity lines). Same closure shape.

Both fixtures remain "diverged" by verdict (C-18 keeps 4 structural diffs
open, proposed-accept per D6 — not chased) but every OTHER number matches
the jar exactly, jar-line-cited above.

**Movers:**
- Class-engine DOT-parity pin-diff (`b1.json` -> post): 0 transitions
  attributable to this task. `b1.json` (batch-1 close) predates
  `5f4f67906` (T14, this worktree's own base commit) landing, so it is
  stale relative to this branch regardless of T29; confirmed by pin-diffing
  `b1.json` against a render-all captured BEFORE any T29 edit (pure T14
  state) — the SAME 6 transitions (`dibinu-95-kavo178`, `nuxoni-26-xala894`,
  `pejone-71-tige404`, `puvono-84-doro361`, `sekame-22-meze147`,
  `xitobu-41-lame230`) appear either way. T29's own pre-vs-post render-all
  diff is 0 transitions.
- Cross-engine survey (26 engines): a rigorous pre-vs-post comparison (both
  runs on THIS branch — the pre run captured before any T29 edit, the post
  run after) is 0 movers on 25/26 engines; `chart` (pre run killed
  mid-flight by mistake) was instead compared against
  `/tmp/cdd3-b0-eng/parity-chart.json` — also 0 movers.
- Comparing the post survey against the mission's `/tmp/cdd3-b0-eng/parity-
  <e>.json` (T0) DIRECTLY, as the task file instructs, surfaces 2 apparent
  movers — `component/kokebo-27-vafi688` and `object/lecali-51-funo316`,
  both `structural-match -> conformant`. Both are FALSE POSITIVES: b0-eng
  predates this branch's base commit (`5f4f67906`, T14) landing, the same
  staleness already found in the class-engine `b1.json` comparison above.
  Confirmed two ways: (1) both fixtures' cached goldens carry
  `data-diagram-type="CLASS"` — a REAL class-diagram render, never routed
  through `error-renderer.ts` at all; (2) re-rendering
  `kokebo-27-vafi688.puml` with T29's changes reverted (patch-and-restore,
  no `git stash`) produces the IDENTICAL `height="65"` either way. The
  pre-vs-post comparison above (same branch, same measurement conditions)
  is the trustworthy number: 0.

**Commit:** `fix(cdd3-T29): exact deterministic error-page geometry
(C-17)`, on `wt/cdd3-T29`.
