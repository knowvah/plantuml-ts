# add3-T3g — activity circle-spot glyphs — final report

## Commits
- `1e671f37e` fix(activity): draw circle-spot glyphs as jar's AWT path
  outlines -- single commit, one mechanism.

## Mechanism (Java -> ours)
- `FtileCircleSpot.java:99-111` (`drawU`): fills/strokes the 20x20
  circle, then `ug.apply(fc.getColor()).apply(new UTranslate(SIZE/2,
  SIZE/2)).draw(new UCenteredCharacter(spot.charAt(0), fc.getFont()))`.
  `fc` = `style.getFontConfiguration(...)` for `circle,spot`, which has
  no `FontSize`/`FontName` override in `plantuml.skin` (grepped) --
  inherits `root { FontSize 14; FontName SansSerif }` (`:6-16`), a
  DIFFERENT size than class's own circled-badge default (17).
- `DriverCenteredCharacterSvg.java:56-81`: the `<text>` shortcut
  (`:64-69`, `x-5,y+5, monospace, 14`) fires ONLY for
  `FileFormat.SVG_DETERMINISTIC`. `FileFormat.java:179-187`'s
  `-DPLANTUML_DETERMINISTIC_TEXT=true` (set by every oracle render,
  `scripts/oracle-render.sh`) swaps only the `StringBounder`, leaving
  the format `SVG` -- so that branch NEVER fires in this corpus's
  cached SVGs. The real branch (`:72-81`) always runs:
  `UnusedSpace.getUnusedSpace(font, c)`-centred `TextLayout.getOutline()`
  emitted as `<path d="..." fill="#000"/>` (`svg.setFillColor(fc
  .getColor())` at `:79`, independent of the circle's own `backColor`/
  `color` override -- verified: `vilecu-41-tete416`'s `#blue:(B)`/
  `#green:(G)` spots both still draw `fill="#000"` on the glyph).
- Ours (`activity-renderer-terminals.ts#renderSpot`) drew a plain
  `<text>` substitute instead (a pre-existing, documented D3-prime
  stand-in for the never-ported `UCenteredCharacter` AWT path). Fixed
  by capturing the real outlines and drawing them as `<path>`:
  - `src/diagrams/activity/activity-spot-glyph-data.ts` (new): `SPOT_GLYPH_D`
    table (A/B/G), reference centre `(10,10)` matching `SIZE/2`.
  - `src/diagrams/activity/activity-spot-glyph.ts` (new): `spotGlyphPath(letter,
    cx, cy)` -- per-token `(x,y)` shift + `formatDecimal`, same idiom
    `class-badge.ts#badgeGlyphPath` uses for its own table (not shared:
    see "Census" below for why).
  - `activity-renderer-terminals.ts#renderSpot`: captured letter -> `path(d,
    {fill})`; uncaptured letter -> `text(cx-5, cy+5, char, {fill,
    fontFamily:'monospace', fontSize:14})` (upstream's own deterministic
    branch geometry, kept as the documented fallback since there is no
    faithful answer for a platform AWT outline this table hasn't scraped).

## Census — the corpus's ONLY three circle-spot letters
Found by scanning every cached `test-results/dot-cache/activity/*/in.svg`
for `<ellipse rx="10" ry="10" .../>` immediately followed by one or more
`<path d="..." fill="#000"/>` siblings (23 naive `rx="10"` hits were
false positives -- the `start`/`stop` terminal circle is ALSO `rx="10"`
but at `stroke-width:1`, not `0.5`, and its neighbour is an unrelated
note/path, not a glyph; the `stroke-width:0.5` + `fill="#000"` pair is
what actually discriminates a spot glyph). Exactly 3 files, 5
occurrences, 3 unique letters:
- **A**: `nipuxu-11-tefa314` (`(A)` x2, cx=37.663, cy=117/147 -- the two
  occurrences are byte-identical after the `(10-cx,10-cy)` translate)
  and `zaloze-31-jibo311` (`(A)` in an `if`'s `else`, cx=105.675, cy=67
  -- matches within +/-0.001, jar float-layout noise). Nipuxu's capture
  is the table entry.
- **B**: `vilecu-41-tete416` (`#blue:(B)`, cx=78.388, cy=129) -- single
  occurrence, not independently cross-verified in this corpus.
- **G**: `vilecu-41-tete416` (`#green:(G)`, cx=78.388, cy=245) -- single
  occurrence, not independently cross-verified.

**Not a shared table with `class-badge-glyph-data.ts`**: normalized
class `A` (default size 17) vs this mission's `A` (size 14, no font-name
override) does NOT reduce by a uniform scale on both axes (y-extent
ratio ~0.82 vs x-extent ratio ~0.97, checked point-for-point against the
8-point outer outline) -- the two font configurations are genuinely
different, not a hinting variant of one glyph the way same-letter
different-SIZE class captures are. Kept as two independent tables per
the brief's own instruction ("if not, add an activity table with the
same structure").

## Rows before -> after
| slug | before (weightedScore) | after |
|---|---|---|
| nipuxu-11-tefa314 | 18 | 0 |
| vilecu-41-tete416 | 18 | 0 |
| zaloze-31-jibo311 | 9 | 0 |

All three: `mixed` -> `exact` in `activity-probe-elements.ts`'s own
classification.

## Probe Σ
- Targeted 3-row subset (`activity-probe.ts --slugs ...`): 45 -> 0.
- Full corpus aggregate: 9220 -> 9175 (same 45 delta; no other row
  moved). 0 risers, 3 fallers (the targeted rows, all intentional).

## Risers + mechanism
None. 0 risers in the full-corpus probe run.

## Census movers (equality pins)
`activity.style-baseline.test.ts` and `activity.text-baseline.test.ts`
both FAIL on these 3 rows as an expected, documented consequence:
- `text-baseline`: `textCount`/`fill`/`anchor` histograms for `ours`
  drop by exactly the glyph count removed (nipuxu 4->2, vilecu 7->5,
  zaloze 4->3).
- `style-baseline`: `ours.fontSize{14: N}` bucket drops to 0 (the
  glyph's own font-size-14 `<text>` is gone); `textCount` drops the
  same amounts.
- **Verified these moves land exactly on the pin's own `jar` column**
  (read directly from `oracle/goldens/svg-activity/{text,style}
  -baseline.json`): jar.textCount is already 2/5/3 for the three rows
  in both files -- our NEW `ours` measurement now equals it exactly.
  This is the pin catching a genuine fix, not a regression; confirmed
  independently by the probe's own 0-riser full-corpus run and the
  activity-probe-elements `exact` classification.
- `activity.swimlane-baseline.test.ts` and the two ratchet/harness-
  parity suites: all pass unchanged (337 + 337 + 3 extra tests, pins
  byte-equal).
- **Per rules.txt rule 5 ("Never edit oracle/goldens/** or baseline
  JSONs -- orchestrator re-pins"), these two JSONs were left untouched.**
  Re-pin `oracle/goldens/svg-activity/style-baseline.json` and
  `text-baseline.json` from a fresh measurement for
  `nipuxu-11-tefa314`/`vilecu-41-tete416`/`zaloze-31-jibo311`.

## Not done + why
- No `src/core/**` edit was made (only existing exports of
  `core/svg.ts`/`core/svg-format.ts` were imported), so rule 11's
  all-engine before/after survey does not apply to this task.
- Other activity fixtures/files outside the write-set (layout, tiles,
  creole, other renderer-shape files) were not touched, per rule 7 --
  no cross-write-set conflicts observed with other add3 batch-3 agents.
- The `SPOT_TEXT_FALLBACK_NOTE` export in `activity-spot-glyph.ts` is a
  documentation marker only (no letter currently exercises the
  fallback branch) -- left in place so a future uncaptured letter has
  a named spot to update, per the brief's "list which letters lack
  data" instruction.

## Quality gates run
- `npm run typecheck` (both tsconfigs): clean.
- `npx eslint <changed files>`: clean.
- `npx vitest run tests/unit/activity` (27 files, 579 tests): all pass.
- `npx vitest run tests/oracle/svg-conformance/activity.golden.ratchet
  .test.ts tests/oracle/svg-conformance/activity.harness-parity
  .test.ts tests/oracle/svg-conformance/render-fixture-activity
  .test.ts` (340 tests): all pass.
- `npx vitest run tests/oracle/svg-conformance/activity.{style,text,
  swimlane}-baseline.test.ts`: swimlane passes; style/text fail on the
  3 expected equality-pin movers above (documented, re-pin owed).
- `npm run build`: succeeds (declaration files + both bundles).
