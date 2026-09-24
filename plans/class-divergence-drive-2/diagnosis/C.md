# Group C — circled-character glyph family

| mechanism-id | fixtures | files | est. size |
|---|---|---|---|
| C-1 | befasi-62-vimu310, mububu-79-nalu431, ribove-58-tefu515, soboro-52-pevi612, zakuta-81-pese010, ziruni-05-fona846, zosaxa-86-mora157 (all 7) | `src/diagrams/class/class-badge-sized-glyphs.ts` (data + `lookupSizedGlyph`), `src/diagrams/class/class-badge.ts` (`badgeGlyphPath` fallback call, no logic change needed) | small-to-medium (data capture, no algorithm change) |

All seven fixtures resolve to the **same single mechanism**. There is no
second, `layout circo`-specific mechanism — see "ruled out" below.

### befasi-62-vimu310 (representative; ribove/soboro/zakuta/ziruni are
byte-identical repeats of this mechanism — see per-fixture confirmation below)

- mechanism-id: C-1
- mechanism: Every badge-bearing classifier in this fixture family sets
  `skinparam CircledCharacterFontSize 12`. Our badge-glyph outline table
  (`class-badge-sized-glyphs.ts`) only stores per-size captures for the
  letter `'C'`, and only for sizes 13-22. `lookupSizedGlyph` hard-gates on
  the letter (`if (letter !== 'C') return undefined;`), so every OTHER
  badge letter (`M`, `O`, `W`, `Q`, `A`, and even `C` itself at the
  out-of-range size 12) falls back to `BADGE_GLYPH_D[letter]`, an outline
  captured once at the DEFAULT font size 17
  (`DEFAULT_CIRCLED_CHARACTER_FONT_SIZE`). `badgeGlyphPath` then only
  **translates** that size-17 outline to the badge's center (`dx`/`dy`) —
  it never rescales it to the actual configured size. The badge ellipse
  itself IS sized correctly (`CircledCharacterRadius`/formula unaffected),
  so the glyph is drawn ~`17/12 ≈ 1.4167`x too large inside a
  correctly-sized circle, uniformly on every coordinate.
- java: `~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/font/FontParam.java:55`
  (`CIRCLED_CHARACTER(17, UFontFace.bold(), FontParamConstant.COLOR, "Monospaced")` —
  the default size the port's `BADGE_GLYPH_D` table was captured at) and
  `~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/svg/DriverCenteredCharacterSvg.java:72-81`
  (`final UFont font = characterCircled.getFont(); ... final TextLayout t = font.createTextLayout("" + c); ...
  svg.drawPathIterator(xpos, ypos, t.getOutline(null).getPathIterator(null));` —
  the jar draws a REAL AWT glyph outline at the configured font size, not a
  scaled reference shape; confirms there is no jar-side formula to port,
  only jar-side data to capture).
  Also ruled out the deterministic-text driver as the applicable path: `DriverCenteredCharacterSvg.java:65-70`'s
  `if (fileFormat == FileFormat.SVG_DETERMINISTIC)` branch (emit `<text>`)
  is NOT taken even under `-DPLANTUML_DETERMINISTIC_TEXT=true` — that flag
  only swaps the `StringBounder` (`FileFormat.java:185-187`), not the
  `FileFormatOption`'s `fileFormat` field the driver checks, so the cached
  oracle really does contain a real font-outline `<path>` (confirmed:
  `in.svg`'s glyphs are `<path>`, never `<text>`).
- ts: `src/diagrams/class/class-badge-sized-glyphs.ts:233`
  (`if (letter !== 'C') return undefined;` inside `lookupSizedGlyph`, the
  origin of the fallback) and `src/diagrams/class/class-badge.ts:391-395`
  (`badgeGlyphPath`: `const refD = sized?.d ?? BADGE_GLYPH_D[letter];` ...
  `const dx = cx - refCx * k; const dy = cy - refCy * k;` — translate-only,
  no scale term derived from `circledCharacterFontSize`).
- causal chain: `renderer-classifier-badge-tag.ts:117-127` passes
  `theme.colors.graph.circledCharacterFontSize` (12, from the skinparam)
  into `badgeGlyphPath`, which forwards it to `lookupSizedGlyph('M', 12, ...)`.
  Because the letter isn't `'C'`, `lookupSizedGlyph` returns `undefined`
  unconditionally (line 233) regardless of the size argument. `badgeGlyphPath`
  then falls back to `BADGE_GLYPH_D['M']` (`class-badge-glyph-data.ts:111-114`),
  a shape captured at font size 17, and only shifts it into place — the
  emitted `<path d="...">` is the size-17 `M` outline translated to the
  size-12 badge center, hence every coordinate in `svg/g[1]/g[8]/path[1]/@d`
  differs from the jar's real size-12 outline by a factor converging on
  `17/12`.
- ruled out:
  - **`skinparam layout circo`** (present in mububu/ribove/soboro/zakuta/
    ziruni, absent in befasi/zosaxa) as a contributing cause: all 7
    fixtures produce numerically-identical diff counts for the shared
    12-class badge set (818, or 886 for zosaxa's extra `dummy` class) and
    the diff set is confined to `g[N]/path[1]` (glyph) elements only — no
    edge/link (`lnkNN`) coordinates diverge. `mububu-79-nalu431`'s single
    `svek-1.dot` cache file (one cluster, not a top-level circo digraph —
    the nested-package structure routes through the normal cluster path
    regardless) confirms `layout circo` never reaches a code path that
    would perturb these coordinates. Evidence: `npx jiti .../render-diff.mts`
    on all 7 slugs (see probe below); diff-path grep restricted to
    `g[N]/path[1]`.
  - **Badge only affects classes with an explicit `<<(X,color)>>` stereotype**:
    disproved — `WaveModel`, `Lattice`, `Oscillator`, `WavePropagator`
    (plain `class`, no stereotype) and `Potential` (`abstract class`, no
    stereotype) also diverge, because upstream draws a badge for EVERY
    classifier (`getCircledChar(LeafType)` default), and the default
    letter (`'C'` for class, `'A'` for abstract) hits the SAME uncaptured-
    size gate. This is why the numeric-diff count (818) is close to
    13 badge classes x ~63 coordinate tokens each, not just the 12
    explicitly-stereotyped ones.
  - **A measurement/instrument artifact** (per prior mission learning that
    most "defects" are measurement artifacts): ruled out by probing actual
    bounding-box ratios directly from the two cached SVGs (not from
    `compareSvg`'s diff count) — see probe below. structural=0 confirms
    element/attribute-shape counts already match; only geometry is wrong.
  - **`resolveBadgeRadius`/ellipse sizing being wrong**: ruled out — jar
    and ours both emit `rx="8" ry="8"` at identical `cx`/`cy`
    (`ellipse cx="385.88"/"385.881" cy="393"`, sub-0.001 rounding only);
    the ellipse geometry is correct, only the glyph inside it is wrong.
- probe: `plans/class-divergence-drive-2/diagnosis/scratch/probe-badge-glyph-scale.py`
  (bbox-ratio check on the cached SVGs) run three ways:
  ```
  $ npx jiti plans/class-divergence-drive/tools/render-diff.mts befasi-62-vimu310
  ### befasi-62-vimu310  pass=false structural=0 numeric=818
    N svg/g[1]/g[8]/path[1]/@d[0]  exp=382.884 | act=381.595 (Δ1.289)
    ...

  $ python3 plans/class-divergence-drive-2/diagnosis/scratch/probe-badge-glyph-scale.py befasi-62-vimu310 ent0004   # DrawableAdapter, letter M
  jar  w,h = 6.217 8.748
  ours w,h = 8.807 12.393
  ratio w  = 1.41660   ratio h = 1.41667   (17/12 = 1.41667)

  $ python3 plans/class-divergence-drive-2/diagnosis/scratch/probe-badge-glyph-scale.py befasi-62-vimu310 ent0005   # WaterSurfaceGeom, letter O
  ratio w  = 1.41646   ratio h = 1.41670   (17/12 = 1.41667)

  $ python3 plans/class-divergence-drive-2/diagnosis/scratch/probe-badge-glyph-scale.py zosaxa-86-mora157 ent0064   # dummy, default letter C, size 12 (outside the 13-22 captured range)
  ratio w  = 1.41668   ratio h = 1.41670   (17/12 = 1.41667)
  ```
  Also confirmed the emitted `d` in our SVG is byte-identical (after
  translation) to `BADGE_GLYPH_D['M']` (`class-badge-glyph-data.ts:111-114`,
  `M17.7141,17.1069 L20.6361,17.1069 L22.1131,22.5439 ...`), and ran
  `render-diff.mts` on all remaining 6 slugs to confirm 818/818/818/818/818/886
  (zosaxa +68 from its one extra badge-bearing `dummy` class) with 0
  structural diffs each.
- fix shape: extend `class-badge-sized-glyphs.ts` to cover the badge
  letters this corpus family actually needs at size 12
  (`M`, `O`, `W`, `Q`, `A`, plus `C`-at-12 which the existing per-size
  table simply doesn't have yet). All of these are directly derivable
  from the ALREADY-CACHED oracle SVGs in this fixture family (no new
  `scripts/oracle-render.sh` probe needed) — e.g. `M` from
  `test-results/dot-cache/class/befasi-62-vimu310/in.svg` `ent0004`/`ent0018`,
  `O` from `ent0005`/`ent0006`/`ent0007`, `W` from `ent0014`/`ent0015`/`ent0016`,
  `Q` from `ent0025`/`ent0026`/`ent0027`/`ent0028`, `A` from
  `zosaxa`/any fixture's `Potential` entity, `C`-at-12 from `dummy`
  (`zosaxa-86-mora157/ent0064`) or any undecorated class. `lookupSizedGlyph`'s
  `letter !== 'C'` gate (line 233) needs generalizing to key on
  `(letter, size)` (and variant) the same way the existing `'C'` table
  does — this is squarely the same captured-table pattern G2 N38 already
  established, just extended to the other 16 letters. A LINEAR scale
  fallback (`k = fontSize / 17` applied to `BADGE_GLYPH_D`) was considered
  as a smaller interim fix, but the sized-glyph module's own doc comment
  (`class-badge-sized-glyphs.ts:14-22`) already measured that a linear
  scale of the size-17 capture misses AWT's per-size hinting by >1% of
  glyph extent — an order of magnitude past `compare.ts`'s tolerance — so
  it would shrink the diff deltas from ~40% to ~1%+ but not clear
  `compareSvg`'s conformance gate. Real per-size captures are the only
  path to `pass=true` here.
- owner: this mission (bounded data-capture extension of an existing,
  already-landed table/lookup mechanism in `src/diagrams/class/`; no
  upstream Java logic to port, no dot-engine involvement)
- confidence: HIGH (probe-verified: bbox ratio matches `17/12` to 4
  decimal places across 3 independent letters/fixtures; `d` string
  matched byte-for-byte to the named table entry after translation)

### mububu-79-nalu431 / ribove-58-tefu515 / soboro-52-pevi612 /
### zakuta-81-pese010 / ziruni-05-fona846

- mechanism-id: C-1 (same as befasi-62-vimu310)
- Confirmed independently, not assumed: each produced `structural=0
  numeric=818` via `render-diff.mts`, and the diff-path set (`grep -oP
  'svg/g\[1\]/g\[\d+\]/\w+\[\d+\]'`) for mububu-79-nalu431 was checked and
  is confined to the same 13 badge-glyph `path[1]` groups (12 explicitly
  stereotyped classes + the plain-class/abstract-class default-letter
  badges), with no edge/link divergence despite mububu's extra
  `skinparam layout circo` (see "ruled out" above — verified on this
  specific fixture, not inferred from befasi).
- confidence: HIGH (each fixture's `render-diff.mts` output and diff-path
  set was individually run and inspected, not assumed identical from the
  shared source diff).

### zosaxa-86-mora157

- mechanism-id: C-1 (same as befasi-62-vimu310), plus one additional
  instance of the SAME mechanism on its extra `class dummy` (added by this
  fixture's source diff vs. the other six: `class dummy` + 4 `note ... of
  dummy` lines, no stereotype). `dummy` has no `<<...>>` decoration, so it
  draws upstream's DEFAULT badge letter `'C'` (`getCircledChar(LeafType.CLASS)`)
  at the same `circledCharacterFontSize 12` — and size 12 is outside the
  existing `BADGE_GLYPH_C_BY_FONT_SIZE` table's captured range (13-22), so
  it ALSO falls back to the size-17 reference. This is why zosaxa measures
  886 numerics instead of 818 (+68 ≈ one more ~63-coordinate glyph path,
  plus a few incidental deltas).
- probe: `probe-badge-glyph-scale.py zosaxa-86-mora157 ent0064` → ratio
  1.4167/1.4167 (see above); `render-diff.mts zosaxa-86-mora157` →
  `structural=0 numeric=886`.
- confidence: HIGH (probe-verified).

## Notes for the orchestrator (T6)

- Single mechanism, single write-set: all 7 fixtures collapse into C-1.
  No fixture needs a separate diagnosis pass.
- The fix is purely additive data (new `(letter, size)` glyph captures) in
  `src/diagrams/class/class-badge-sized-glyphs.ts`, sourced from files
  already in `test-results/dot-cache/class/` for this fixture family — no
  new `scripts/oracle-render.sh` calls required for the 5 letters this
  group needs at size 12. Whether other class-corpus fixtures need
  additional (letter, size) pairs beyond what this group surfaces is
  outside T2's scope (would need a corpus-wide survey of
  `circledCharacterFontSize` skinparam values × badge letters actually
  used) — flag as a possible follow-up scope question for T6/the batch
  that lands this fix.
