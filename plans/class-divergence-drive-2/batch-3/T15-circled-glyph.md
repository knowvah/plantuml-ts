# T15 — circled-character glyph family

**Agent:** typescript-pro (sonnet, effort high) · **Depends on:** T14

## Fixtures

befasi-62-vimu310, mububu-79-nalu431, ribove-58-tefu515,
soboro-52-pevi612, zakuta-81-pese010, ziruni-05-fona846, zosaxa-86-mora157

## Mechanisms · Write-set

From `diagnosis/C.md` (quoted into the prompt). T6 checked the code:

- **C-1** (HIGH; bbox ratios 1.41646–1.41670 vs 17/12 = 1.41667 on M, O,
  C-at-12) — `lookupSizedGlyph` (`class-badge-sized-glyphs.ts:233`) returns
  `undefined` for every letter but `'C'`, and `'C'` is captured only at
  sizes 13–22. The seven fixtures set `CircledCharacterFontSize 12`
  (+ `CircledCharacterFontStyle Bold`), so M/O/W/Q/A/C fall back to
  `BADGE_GLYPH_D` (captured at the default size 17,
  `FontParam.java:55`), which `badgeGlyphPath` only translates. Upstream
  draws a real AWT outline at the configured size
  (`DriverCenteredCharacterSvg.java:72-81`); there is no formula to port,
  so the fix is data: capture (letter, size 12, bold, family) outlines
  from the cached `in.svg` files and generalise `lookupSizedGlyph` beyond
  `'C'` (keep the existing variant-key scheme). Linear scaling was
  measured insufficient (module doc) — do not scale.

Write-set: `src/diagrams/class/class-badge-sized-glyphs.ts` (lookup), a
new data module (e.g. `class-badge-sized-glyphs-data.ts`) if the file
would pass 500 lines, `class-badge.ts` only if the call site must pass a
field it does not today; tests beside each. Record in the data module's
doc which fixture each capture came from.

## Read-set

`diagnosis/C.md`; `decisions.md` D4; prior mission push-forward "scrape a
glyph outline from an oracle SVG rather than compute it" (T21) — the same
choice is allowed here, with the source SVG and element path recorded in
the data file's comment.

## Acceptance criteria

- Given the seven fixtures, when they render, then all 818 (886) numerics
  match — or the residual has a diagnosis artifact
- Given glyph data added, when its test runs, then it asserts the outline
  for the exact skinparam combination (`CircledCharacterFontSize 12`,
  `Bold`, `Radius 8`) and names the oracle it was scraped from
- Given other engines drawing circled characters, when their suites run,
  then nothing moves, or each mover is journaled

## Observability · Rollback

N/A. Reversible.
