/**
 * Glyph outline `d` data for the `circle,spot` connector's single character
 * (`(A)`, `#blue:(B)`, ...) -- captured verbatim from the jar's own SVG
 * output, the SAME scraping method `class-badge-glyph-data.ts` documents
 * (its own module doc comment is the fuller worked example).
 *
 * `FtileCircleSpot#drawU` (`FtileCircleSpot.java:99-111`) draws the circle,
 * then `ug.apply(fc.getColor()).apply(new UTranslate(SIZE / 2, SIZE / 2))
 * .draw(new UCenteredCharacter(spot.charAt(0), fc.getFont()))` -- `fc` is
 * `style.getFontConfiguration(...)` for the `circle,spot` style bucket,
 * which has no `FontSize`/`FontName` override anywhere in `plantuml.skin`
 * (grepped), so it inherits the bare `root { FontSize 14; FontName
 * SansSerif }` default (`plantuml.skin:6-16`) -- a DIFFERENT (smaller) size
 * than the class diagram's own circled-badge default
 * (`circledCharacterFontSize` 17, `class-badge-glyph-data.ts`).
 *
 * `DriverCenteredCharacterSvg#draw` (`:56-81`): its `<text>` shortcut
 * (`:64-69`, `x - 5, y + 5, "monospace", 14`) fires ONLY for
 * `FileFormat.SVG_DETERMINISTIC` -- a format value this port's oracle
 * renders never select (`FileFormat.java:179-187`'s
 * `-DPLANTUML_DETERMINISTIC_TEXT=true` swaps only the `StringBounder`,
 * leaving the format `SVG`), so every `(X)` spot in this corpus's cached
 * `in.svg` draws the REAL branch: `UnusedSpace.getUnusedSpace(font,
 * c)`-centred `TextLayout.getOutline()` as a `<path>`, filled in
 * `fc.getColor()` (`:79`, `svg.setFillColor` -- the plain root `FontColor
 * black`/`#000`, independent of the circle's own `backColor`/`color`
 * override: verified against `vilecu-41-tete416`'s `#blue:(B)`/`#green:(G)`
 * spots, both of which still draw `fill="#000"` on the glyph `<path>`).
 *
 * Reference centre {@link SPOT_REFERENCE_CX}/{@link SPOT_REFERENCE_CY} is
 * `(SIZE/2, SIZE/2) = (10, 10)` -- the SAME local offset
 * `FtileCircleSpot.java:110`'s own `UTranslate(SIZE / 2, SIZE / 2)` uses,
 * rather than reusing the class table's unrelated `(22, 23)` (that value is
 * specific to a single-classifier class fixture's badge position, not a
 * general convention). Translating a captured `d` by `(cx - 10, cy - 10)`
 * (this module's own inverse of {@link spotGlyphPath}'s forward shift)
 * reproduces the source fixture's raw path.
 *
 * Census (this mission, T3g -- the corpus's ONLY three `circle,spot`
 * letters, found by scanning every cached `test-results/dot-cache/
 * activity/*\/in.svg` for an `<ellipse rx="10" ry="10" .../>` immediately
 * followed by one or more `<path d="..." fill="#000"/>` siblings; no other
 * activity fixture matches):
 *   - A: `nipuxu-11-tefa314` (`(A)` x2, `cx=37.663`; `cy=117` and `cy=147`,
 *     byte-identical after the `(10-cx, 10-cy)` translate -- the SAME
 *     letter at two heights is a free cross-check of the translate itself)
 *     and `zaloze-31-jibo311` (`(A)` inside an `if`'s `else`, `cx=105.675,
 *     cy=67`), which reduces to the SAME outline within +/-0.001 (jar
 *     floating-point layout noise, the same tolerance class
 *     `-glyph-data.ts`'s own doc comment calls out for its cross-fixture
 *     checks) -- the nipuxu capture is the table entry; zaloze is the
 *     independent confirmation.
 *   - B: `vilecu-41-tete416` (`#blue:(B)`, `cx=78.388, cy=129`) -- single
 *     occurrence, not independently cross-verified in this corpus.
 *   - G: `vilecu-41-tete416` (`#green:(G)`, `cx=78.388, cy=245`) -- single
 *     occurrence, not independently cross-verified in this corpus.
 *
 * add4 T1d: E added -- `xovigi-85-rufa987` (`(E)` x2, `cx=130`; `cy=901.111`
 * and `cy=1022.722`), byte-identical after the `(10-cx, 10-cy)` translate.
 *
 * NOT a shared table with `class-badge-glyph-data.ts`: class's own
 * default-size-17 `A` outline, normalized to a common centre and checked
 * point-for-point against this module's `A` entry, does not reduce to a
 * uniform scale on both axes (y-extent ratio ~0.82 vs x-extent ratio
 * ~0.97) -- consistent with the two font configurations actually being
 * different (size 14 vs 17, and `circle,spot` carries no
 * `circledCharacterFontName` override the class table's own font does),
 * not a hinting-only variant of the same glyph the way same-letter
 * different-SIZE class captures are (`class-badge-sized-glyphs.ts`). A
 * letter this table and the class table both define (only `A`, so far) is
 * therefore two independent entries, not one shared value.
 */
export type ActivitySpotLetter = 'A' | 'B' | 'E' | 'G';

/** Reference spot centre every {@link SPOT_GLYPH_D} entry is captured at
 *  -- `FtileCircleSpot.java:110`'s own local `UTranslate(SIZE / 2, SIZE /
 *  2)` offset (`SIZE = 20`, `:60`). */
export const SPOT_REFERENCE_CX = 10;
export const SPOT_REFERENCE_CY = 10;

export const SPOT_GLYPH_D: Record<ActivitySpotLetter, string> = {
  A:
    'M11.432,10.631 L9.709,6.27 L7.98,10.631 Z M12.95,14.5 L11.849,11.697 L7.563,11.697 ' +
    'L6.449,14.5 L5.116,14.5 L9.128,4.383 L10.55,4.383 L14.501,14.5 Z',
  B:
    'M7.305,15.5 L7.305,5.383 L9.93,5.383 Q11.448,5.383 12.258,5.957 Q13.068,6.531 13.068,7.611 ' +
    'Q13.068,9.45 10.99,10.229 Q13.471,10.988 13.471,12.971 Q13.471,14.201 12.651,14.851 ' +
    'Q11.831,15.5 10.286,15.5 Z M8.727,14.427 L9.021,14.427 Q10.6,14.427 11.065,14.229 ' +
    'Q11.954,13.853 11.954,12.834 Q11.954,11.932 11.147,11.333 Q10.34,10.735 9.13,10.735 ' +
    'L8.727,10.735 Z M8.727,9.826 L9.185,9.826 Q10.333,9.826 10.966,9.334 Q11.598,8.842 11.598,7.946 ' +
    'Q11.598,6.456 9.288,6.456 L8.727,6.456 Z',
  E:
    'M6.806,15.5 L6.806,5.383 L12.459,5.383 L12.459,6.456 L8.241,6.456 L8.241,9.703 L11.775,9.703 ' +
    'L11.775,10.763 L8.241,10.763 L8.241,14.427 L12.753,14.427 L12.753,15.5 Z',
  G:
    'M13.157,15.227 Q11.318,15.753 9.951,15.753 Q7.538,15.753 6.249,14.379 Q4.96,13.005 4.96,10.441 ' +
    'Q4.96,7.926 6.266,6.528 Q7.572,5.13 9.93,5.13 Q11.475,5.13 13.143,5.588 L13.143,6.914 ' +
    'Q11.051,6.203 9.937,6.203 Q8.296,6.203 7.391,7.317 Q6.485,8.432 6.485,10.455 Q6.485,12.458 7.456,13.569 ' +
    'Q8.426,14.68 10.176,14.68 Q10.894,14.68 11.728,14.427 L11.728,11.132 L13.157,11.132 Z',
};

/** Every letter {@link SPOT_GLYPH_D} has a captured outline for. */
export const CAPTURED_SPOT_LETTERS = new Set<string>(Object.keys(SPOT_GLYPH_D));
