/**
 * G2 N38: per-`circledCharacterFontSize` badge glyph captures.
 *
 * Split out of `class-badge.ts` purely to keep that file under the repo's
 * 500-line-per-file cap (mirrors `class-stereotype.ts`'s own split
 * precedent) -- `badgeGlyphPath` (class-badge.ts) is the only consumer.
 *
 * A captured glyph outline keyed by (letter, `circledCharacterFontSize`)
 * -- the default `Monospaced` family, default bold style (G2 N38 landed
 * 'C' only, 13-22; cdd2-T15 widened the size-12 row to every letter the
 * `circledCharacterFontSize 12` fixture family (befasi-62-vimu310 and its
 * 6 siblings) actually draws: M/O/W/Q/C/A). Each entry stores its OWN
 * reference center (the badge center of the fixture it was captured
 * from) since a bigger font size also has a bigger radius, hence a
 * different natural reference position.
 *
 * NOT a linear scale of `class-badge.ts#BADGE_GLYPH_D`'s size-17
 * reference: AWT's TrueType glyph-outline hinting rounds each point
 * size's contour independently. Empirically confirmed (G2 N38): scaling
 * the size-17 'C' outline by `18/17` and comparing to the jar's REAL
 * size-18 'C' outline (`defipi-14-xunu847`) misses by >1% of the glyph's
 * own extent at several control points -- an order of magnitude past
 * `compare.ts`'s 0.01 absolute-delta conformance tolerance. Sizes/letters
 * NOT in this table fall back to `BADGE_GLYPH_D`'s size-17 shape via
 * `badgeGlyphPath` -- wrong-but-present, matching `resolveBadgeLetter`'s
 * established precedent for an uncaptured letter rather than omitting the
 * `<path>` entirely (a missing element is a childCount mismatch, strictly
 * worse).
 *
 * Font FAMILY (`circledCharacterFontName`, e.g. Helvetica) and STYLE
 * (`circledCharacterFontStyle Italic`) are NOT captured per-letter here
 * either -- `datugo-88-sote552`/`gateja-70-losi738` (both set
 * `circledCharacterFontName Helvetica`) draw a STRUCTURALLY different
 * outline at fontSize 18 (32 coordinate pairs, x-extent 11.52) than the
 * Monospaced 'C' captured here (34 pairs, x-extent 8.17) -- confirmed by
 * direct point-count/extent comparison, not a shape this table can
 * approximate. `depulu-53-xoca727` (`circledCharacterFontStyle Italic`)
 * is the SAME kind of gap. Surveyed, NOT landed this iteration -- named
 * in `plans/g2-class-svg/ledger.md` N38 for a dedicated future
 * per-(family,style) capture pass. (The `circledCharacterFontSize 12`
 * fixture family also sets `CircledCharacterFontStyle Bold`, which is
 * ALREADY the jar's default style for `FontParam.CIRCLED_CHARACTER`
 * (`klimt/font/FontParam.java:55`, `UFontFace.bold()`) -- not a variant,
 * so these size-12 captures belong in the plain per-size table, not
 * {@link BADGE_GLYPH_VARIANT_BY_LETTER}.)
 */

interface SizedGlyph {
  refCx: number;
  refCy: number;
  d: string;
}

const BADGE_GLYPH_C_BY_FONT_SIZE: Partial<Record<number, SizedGlyph>> = {
  12: {
    // cdd2-T15 (mechanism C-1): befasi-62-vimu310 ent0034 (`WaveModel`,
    // a plain `class` with no stereotype -- upstream's default badge
    // letter for `LeafType.CLASS`).
    refCx: 225.03,
    refCy: 960,
    d:
      'M226.864,964.248 Q226.454,964.459 226.003,964.564 Q225.551,964.67 225.053,964.67 ' +
      'Q223.284,964.67 222.352,963.504 Q221.421,962.338 221.421,960.135 Q221.421,957.926 222.352,956.76 ' +
      'Q223.284,955.594 225.053,955.594 Q225.551,955.594 226.009,955.699 Q226.466,955.805 226.864,956.016 ' +
      'L226.864,957.938 Q226.419,957.527 226,957.337 Q225.581,957.146 225.135,957.146 ' +
      'Q224.186,957.146 223.703,957.899 Q223.219,958.652 223.219,960.135 Q223.219,961.611 223.703,962.364 ' +
      'Q224.186,963.117 225.135,963.117 Q225.581,963.117 226,962.927 Q226.419,962.736 226.864,962.326 Z',
  },
  13: {
    refCx: 21,
    refCy: 22,
    d:
      'M22.8618,26.2271 Q22.4175,26.4556 21.9287,26.5698 Q21.4399,26.6841 20.9004,26.6841 ' +
      'Q18.9834,26.6841 17.9741,25.4209 Q16.9648,24.1577 16.9648,21.771 Q16.9648,19.3779 17.9741,18.1147 ' +
      'Q18.9834,16.8516 20.9004,16.8516 Q21.4399,16.8516 21.9351,16.9658 Q22.4302,17.0801 22.8618,17.3086 ' +
      'L22.8618,19.3906 Q22.3794,18.9463 21.9255,18.74 Q21.4717,18.5337 20.9893,18.5337 ' +
      'Q19.9609,18.5337 19.4373,19.3494 Q18.9136,20.165 18.9136,21.771 Q18.9136,23.3706 19.4373,24.1863 ' +
      'Q19.9609,25.002 20.9893,25.002 Q21.4717,25.002 21.9255,24.7957 Q22.3794,24.5894 22.8618,24.145 Z',
  },
  14: {
    refCx: 21,
    refCy: 22,
    d:
      'M22.8896,26.9561 Q22.4111,27.2021 21.8848,27.3252 Q21.3584,27.4482 20.7773,27.4482 ' +
      'Q18.7129,27.4482 17.626,26.0879 Q16.5391,24.7275 16.5391,22.1572 Q16.5391,19.5801 17.626,18.2197 ' +
      'Q18.7129,16.8594 20.7773,16.8594 Q21.3584,16.8594 21.8916,16.9824 Q22.4248,17.1055 22.8896,17.3516 ' +
      'L22.8896,19.5938 Q22.3701,19.1152 21.8813,18.8931 Q21.3926,18.6709 20.873,18.6709 ' +
      'Q19.7656,18.6709 19.2017,19.5493 Q18.6377,20.4277 18.6377,22.1572 Q18.6377,23.8799 19.2017,24.7583 ' +
      'Q19.7656,25.6367 20.873,25.6367 Q21.3926,25.6367 21.8813,25.4146 Q22.3701,25.1924 22.8896,24.7139 Z',
  },
  15: {
    refCx: 22,
    refCy: 23,
    d:
      'M23.9175,28.1851 Q23.4048,28.4487 22.8408,28.5806 Q22.2769,28.7124 21.6543,28.7124 ' +
      'Q19.4424,28.7124 18.2778,27.2549 Q17.1133,25.7974 17.1133,23.0435 Q17.1133,20.2822 18.2778,18.8247 ' +
      'Q19.4424,17.3672 21.6543,17.3672 Q22.2769,17.3672 22.8481,17.499 Q23.4194,17.6309 23.9175,17.8945 ' +
      'L23.9175,20.2969 Q23.3608,19.7842 22.8372,19.5461 Q22.3135,19.3081 21.7568,19.3081 ' +
      'Q20.5703,19.3081 19.9661,20.2493 Q19.3618,21.1904 19.3618,23.0435 Q19.3618,24.8892 19.9661,25.8303 ' +
      'Q20.5703,26.7715 21.7568,26.7715 Q22.3135,26.7715 22.8372,26.5334 Q23.3608,26.2954 23.9175,25.7827 Z',
  },
  16: {
    refCx: 22,
    refCy: 23,
    d:
      'M24.4453,28.6641 Q23.8984,28.9453 23.2969,29.0859 Q22.6953,29.2266 22.0313,29.2266 ' +
      'Q19.6719,29.2266 18.4297,27.6719 Q17.1875,26.1172 17.1875,23.1797 Q17.1875,20.2344 18.4297,18.6797 ' +
      'Q19.6719,17.125 22.0313,17.125 Q22.6953,17.125 23.3047,17.2656 Q23.9141,17.4063 24.4453,17.6875 ' +
      'L24.4453,20.25 Q23.8516,19.7031 23.293,19.4492 Q22.7344,19.1953 22.1406,19.1953 ' +
      'Q20.875,19.1953 20.2305,20.1992 Q19.5859,21.2031 19.5859,23.1797 Q19.5859,25.1484 20.2305,26.1523 ' +
      'Q20.875,27.1563 22.1406,27.1563 Q22.7344,27.1563 23.293,26.9023 Q23.8516,26.6484 24.4453,26.1016 Z',
  },
  18: {
    refCx: 23,
    refCy: 24,
    d:
      'M25.501,30.1221 Q24.8857,30.4385 24.209,30.5967 Q23.5322,30.7549 22.7852,30.7549 ' +
      'Q20.1309,30.7549 18.7334,29.0059 Q17.3359,27.2568 17.3359,23.9521 Q17.3359,20.6387 18.7334,18.8896 ' +
      'Q20.1309,17.1406 22.7852,17.1406 Q23.5322,17.1406 24.2178,17.2988 Q24.9033,17.457 25.501,17.7734 ' +
      'L25.501,20.6563 Q24.833,20.041 24.2046,19.7554 Q23.5762,19.4697 22.9082,19.4697 ' +
      'Q21.4844,19.4697 20.7593,20.5991 Q20.0342,21.7285 20.0342,23.9521 Q20.0342,26.167 20.7593,27.2964 ' +
      'Q21.4844,28.4258 22.9082,28.4258 Q23.5762,28.4258 24.2046,28.1401 Q24.833,27.8545 25.501,27.2393 Z',
  },
  19: {
    refCx: 23,
    refCy: 24,
    d:
      'M25.5288,30.6011 Q24.8794,30.9351 24.165,31.1021 Q23.4507,31.269 22.6621,31.269 ' +
      'Q19.8604,31.269 18.3853,29.4229 Q16.9102,27.5767 16.9102,24.0884 Q16.9102,20.5908 18.3853,18.7446 ' +
      'Q19.8604,16.8984 22.6621,16.8984 Q23.4507,16.8984 24.1743,17.0654 Q24.8979,17.2324 25.5288,17.5664 ' +
      'L25.5288,20.6094 Q24.8237,19.96 24.1604,19.6584 Q23.4971,19.3569 22.792,19.3569 ' +
      'Q21.2891,19.3569 20.5237,20.5491 Q19.7583,21.7412 19.7583,24.0884 Q19.7583,26.4263 20.5237,27.6184 ' +
      'Q21.2891,28.8105 22.792,28.8105 Q23.4971,28.8105 24.1604,28.509 Q24.8237,28.2075 25.5288,27.5581 Z',
  },
  20: {
    refCx: 23,
    refCy: 24,
    d:
      'M25.8066,31.0801 Q25.123,31.4316 24.3711,31.6074 Q23.6191,31.7832 22.7891,31.7832 ' +
      'Q19.8398,31.7832 18.2871,29.8398 Q16.7344,27.8965 16.7344,24.2246 Q16.7344,20.543 18.2871,18.5996 ' +
      'Q19.8398,16.6563 22.7891,16.6563 Q23.6191,16.6563 24.3809,16.832 Q25.1426,17.0078 25.8066,17.3594 ' +
      'L25.8066,20.5625 Q25.0645,19.8789 24.3662,19.5615 Q23.668,19.2441 22.9258,19.2441 ' +
      'Q21.3438,19.2441 20.5381,20.499 Q19.7324,21.7539 19.7324,24.2246 Q19.7324,26.6855 20.5381,27.9404 ' +
      'Q21.3438,29.1953 22.9258,29.1953 Q23.668,29.1953 24.3662,28.8779 Q25.0645,28.5605 25.8066,27.877 Z',
  },
  21: {
    refCx: 24,
    refCy: 25,
    d:
      'M27.0845,32.3091 Q26.3667,32.6782 25.5771,32.8628 Q24.7876,33.0474 23.916,33.0474 ' +
      'Q20.8193,33.0474 19.189,31.0068 Q17.5586,28.9663 17.5586,25.1108 Q17.5586,21.2451 19.189,19.2046 ' +
      'Q20.8193,17.1641 23.916,17.1641 Q24.7876,17.1641 25.5874,17.3486 Q26.3872,17.5332 27.0845,17.9023 ' +
      'L27.0845,21.2656 Q26.3052,20.5479 25.572,20.2146 Q24.8389,19.8813 24.0596,19.8813 ' +
      'Q22.3984,19.8813 21.5525,21.199 Q20.7065,22.5166 20.7065,25.1108 Q20.7065,27.6948 21.5525,29.0125 ' +
      'Q22.3984,30.3301 24.0596,30.3301 Q24.8389,30.3301 25.572,29.9968 Q26.3052,29.6636 27.0845,28.9458 Z',
  },
  22: {
    refCx: 24,
    refCy: 25,
    d:
      'M27.1123,32.7881 Q26.3604,33.1748 25.5332,33.3682 Q24.7061,33.5615 23.793,33.5615 ' +
      'Q20.5488,33.5615 18.8408,31.4238 Q17.1328,29.2861 17.1328,25.2471 Q17.1328,21.1973 18.8408,19.0596 ' +
      'Q20.5488,16.9219 23.793,16.9219 Q24.7061,16.9219 25.5439,17.1152 Q26.3818,17.3086 27.1123,17.6953 ' +
      'L27.1123,21.2188 Q26.2959,20.4668 25.5278,20.1177 Q24.7598,19.7686 23.9434,19.7686 ' +
      'Q22.2031,19.7686 21.3169,21.1489 Q20.4307,22.5293 20.4307,25.2471 Q20.4307,27.9541 21.3169,29.3345 ' +
      'Q22.2031,30.7148 23.9434,30.7148 Q24.7598,30.7148 25.5278,30.3657 Q26.2959,30.0166 27.1123,29.2646 Z',
  },
};

/**
 * cdd2-T15 (mechanism C-1): per-`circledCharacterFontSize` captures for
 * every OTHER badge letter the `circledCharacterFontSize 12` fixture
 * family (befasi-62-vimu310 and its 6 siblings: mububu-79-nalu431,
 * ribove-58-tefu515, soboro-52-pevi612, zakuta-81-pese010,
 * ziruni-05-fona846, zosaxa-86-mora157) draws -- M/O/W/Q/A. Prior to this
 * table, `lookupSizedGlyph` hard-gated on `letter === 'C'`
 * unconditionally, so every one of these letters fell straight through
 * to `class-badge.ts#BADGE_GLYPH_D`'s size-17 default-size shape at ANY
 * configured `circledCharacterFontSize`, including 12. Only size 12 is
 * captured here (the sole size this fixture family exercises for these
 * letters) -- widening to other sizes is future, corpus-driven work, same
 * precedent {@link BADGE_GLYPH_C_BY_FONT_SIZE} itself set (13-22 only,
 * not every possible size). All 5 captured verbatim from
 * `test-results/dot-cache/class/befasi-62-vimu310/in.svg`'s own
 * `<ellipse cx/cy>` + `<path d>`, same "capture verbatim, translate by
 * reference center" methodology as every other table in this file.
 */
const BADGE_GLYPH_OTHER_LETTERS_BY_FONT_SIZE: Partial<Record<string, Partial<Record<number, SizedGlyph>>>> = {
  M: {
    // ent0004, `DrawableAdapter << (M, brown) >>`.
    12: {
      refCx: 385.88,
      refCy: 393,
      d:
        'M382.884,388.752 L384.946,388.752 L385.989,392.59 L387.026,388.752 L389.101,388.752 ' +
        'L389.101,397.5 L387.612,397.5 L387.612,390.492 L386.687,394.318 L385.31,394.318 ' +
        'L384.372,390.492 L384.372,397.5 L382.884,397.5 Z',
    },
  },
  O: {
    // ent0005, `WaterSurfaceGeom << (O,lightblue) >>`.
    12: {
      refCx: 541.23,
      refCy: 495,
      d:
        'M541.339,492.146 Q540.677,492.146 540.373,492.853 Q540.068,493.559 540.068,495.135 ' +
        'Q540.068,496.705 540.373,497.411 Q540.677,498.117 541.339,498.117 Q542.007,498.117 542.312,497.411 ' +
        'Q542.617,496.705 542.617,495.135 Q542.617,493.559 542.312,492.853 Q542.007,492.146 541.339,492.146 Z ' +
        'M538.269,495.135 Q538.269,492.891 539.045,491.742 Q539.822,490.594 541.339,490.594 ' +
        'Q542.863,490.594 543.639,491.742 Q544.416,492.891 544.416,495.135 Q544.416,497.373 543.639,498.521 ' +
        'Q542.863,499.67 541.339,499.67 Q539.822,499.67 539.045,498.521 Q538.269,497.373 538.269,495.135 Z',
    },
  },
  W: {
    // ent0015, `EWSMainWindow << (W,orange) >>`.
    12: {
      refCx: 443.91,
      refCy: 128,
      d:
        'M440.41,124.252 L441.922,124.252 L442.549,130.674 L443.305,126.52 L444.74,126.52 ' +
        'L445.619,130.674 L446.111,124.252 L447.635,124.252 L446.627,133 L445.015,133 ' +
        'L444.019,128.406 L443.088,133 L441.488,133 Z',
    },
  },
  Q: {
    // ent0025, `SimulationState <<(Q,orchid)>>`.
    12: {
      refCx: 117.96,
      refCy: 613.5,
      d:
        'M117.304,617.635 Q117.222,617.652 117.166,617.661 Q117.11,617.67 117.058,617.67 ' +
        'Q115.552,617.67 114.775,616.521 Q113.999,615.373 113.999,613.135 Q113.999,610.891 114.775,609.742 ' +
        'Q115.552,608.594 117.069,608.594 Q118.593,608.594 119.369,609.742 Q120.146,610.891 120.146,613.135 ' +
        'Q120.146,614.676 119.776,615.716 Q119.407,616.756 118.704,617.201 L119.794,618.268 L118.61,619.146 Z ' +
        'M117.069,610.146 Q116.407,610.146 116.103,610.853 Q115.798,611.559 115.798,613.135 ' +
        'Q115.798,614.705 116.103,615.411 Q116.407,616.117 117.069,616.117 Q117.737,616.117 118.042,615.411 ' +
        'Q118.347,614.705 118.347,613.135 Q118.347,611.559 118.042,610.853 Q117.737,610.146 117.069,610.146 Z',
    },
  },
  A: {
    // ent0043, `abstract class Potential` (default letter, no
    // stereotype override -- upstream's `getCircledChar(LeafType)`).
    12: {
      refCx: 244.74,
      refCy: 1164,
      d:
        'M244.349,1160.834 L243.535,1164.414 L245.17,1164.414 Z M243.295,1159.252 L245.41,1159.252 ' +
        'L247.771,1168 L246.043,1168 L245.504,1165.838 L243.189,1165.838 L242.662,1168 L240.933,1168 Z',
    },
  },
};

/**
 * G2 N47: per-(fontSize, fontFamily, bold, italic) 'C' glyph captures --
 * the {@link BADGE_GLYPH_C_BY_FONT_SIZE} table above assumes the default
 * `Monospaced`, non-bold, non-italic outline (this module's own doc
 * comment: a different family/style is a STRUCTURALLY different AWT
 * glyph outline, not a scaled one). Captured VERBATIM from the jar's own
 * SVG output, same methodology as {@link BADGE_GLYPH_C_BY_FONT_SIZE} --
 * `datugo-88-sote552` (size 18, Helvetica, plain), `depulu-53-xoca727`
 * (size 20, default family, italic), `gateja-70-losi738` (size 30,
 * Helvetica, plain). Narrow, named reach (these 3 exact combinations) --
 * any OTHER (size, family, style) combination falls through to
 * {@link BADGE_GLYPH_C_BY_FONT_SIZE} (size-only match) or ultimately
 * `class-badge.ts#BADGE_GLYPH_D`'s default-size shape, matching the
 * established "wrong-but-present" precedent for an uncaptured
 * combination rather than omitting the `<path>` entirely.
 */
const BADGE_GLYPH_C_BY_VARIANT: Partial<Record<string, SizedGlyph>> = {
  '18|helvetica|0|0': {
    refCx: 23,
    refCy: 29,
    d:
      'M27.0117,34.5332 Q25.5615,35.8604 23.3027,35.8604 Q20.5078,35.8604 18.9082,34.0674 ' +
      'Q17.3086,32.2656 17.3086,29.1279 Q17.3086,25.7354 19.1279,23.8984 Q20.71,22.2988 23.1533,22.2988 ' +
      'Q26.4229,22.2988 27.9346,24.4434 Q28.7695,25.6475 28.8311,26.8604 L26.124,26.8604 ' +
      'Q25.8604,25.9287 25.4473,25.4541 Q24.709,24.6104 23.2588,24.6104 Q21.7822,24.6104 20.9297,25.8013 ' +
      'Q20.0771,26.9922 20.0771,29.1719 Q20.0771,31.3516 20.978,32.437 Q21.8789,33.5225 23.2676,33.5225 ' +
      'Q24.6914,33.5225 25.4385,32.5908 Q25.8516,32.0898 26.124,31.0879 L28.8047,31.0879 ' +
      'Q28.4531,33.2061 27.0117,34.5332 Z',
  },
  '20|default|0|1': {
    refCx: 24,
    refCy: 34,
    d:
      'M26.2188,40.9824 Q25.3984,41.3828 24.5635,41.583 Q23.7285,41.7832 22.8398,41.7832 ' +
      'Q20.5938,41.7832 19.3584,40.4844 Q18.123,39.1855 18.123,36.8418 Q18.123,34.6934 18.8066,32.584 ' +
      'Q19.4902,30.4746 20.6035,29.1367 Q21.6484,27.8672 22.9082,27.2617 Q24.168,26.6563 25.7793,26.6563 ' +
      'Q26.5605,26.6563 27.332,26.8613 Q28.1035,27.0664 28.8359,27.457 L28.4355,29.4785 ' +
      'Q27.8105,28.8633 27.1172,28.5605 Q26.4238,28.2578 25.6426,28.2578 Q24.7148,28.2578 23.9238,28.6533 ' +
      'Q23.1328,29.0488 22.4395,29.8594 Q21.4238,31.0605 20.8037,32.9355 Q20.1836,34.8105 20.1836,36.6953 ' +
      'Q20.1836,38.3848 20.9453,39.2832 Q21.707,40.1816 23.1426,40.1816 Q23.9727,40.1816 24.8564,39.8691 ' +
      'Q25.7402,39.5566 26.5996,38.9609 Z',
  },
  '30|helvetica|0|0': {
    refCx: 29,
    refCy: 30,
    d:
      'M35.5195,38.8887 Q33.1025,41.1006 29.3379,41.1006 Q24.6797,41.1006 22.0137,38.1123 ' +
      'Q19.3477,35.1094 19.3477,29.8799 Q19.3477,24.2256 22.3799,21.1641 Q25.0166,18.498 29.0889,18.498 ' +
      'Q34.5381,18.498 37.0576,22.0723 Q38.4492,24.0791 38.5518,26.1006 L34.04,26.1006 ' +
      'Q33.6006,24.5479 32.9121,23.7568 Q31.6816,22.3506 29.2646,22.3506 Q26.8037,22.3506 25.3828,24.3354 ' +
      'Q23.9619,26.3203 23.9619,29.9531 Q23.9619,33.5859 25.4634,35.395 Q26.9648,37.2041 29.2793,37.2041 ' +
      'Q31.6523,37.2041 32.8975,35.6514 Q33.5859,34.8164 34.04,33.1465 L38.5078,33.1465 ' +
      'Q37.9219,36.6768 35.5195,38.8887 Z',
  },
};

/** Composite lookup key for {@link BADGE_GLYPH_C_BY_VARIANT} -- family
 *  lower-cased (skinparam values are case-sensitive strings upstream, but
 *  every corpus sample this table draws from happens to already be
 *  canonical-cased; lower-casing is defensive, not load-bearing). */
function variantKey(fontSize: number, fontFamily: string | undefined, bold: boolean, italic: boolean): string {
  const family = fontFamily === undefined ? 'default' : fontFamily.toLowerCase();
  return `${fontSize}|${family}|${bold ? 1 : 0}|${italic ? 1 : 0}`;
}

/**
 * Look up the size-specific glyph capture for a given letter +
 * `circledCharacterFontSize` (+ optional family/bold/italic, G2 N47, 'C'
 * only), if one was corpus-captured.
 *
 * 'C' keeps its own pre-existing two-table path (cdd2-T15: unchanged --
 * every pre-existing call site/behavior for 'C' is untouched): the
 * variant table (family/style-aware) is checked FIRST -- it only has
 * entries for a non-default family/style, so a plain Monospaced/
 * non-bold/non-italic lookup always falls through to the size-only
 * table unchanged. Every OTHER letter (cdd2-T15) looks up
 * {@link BADGE_GLYPH_OTHER_LETTERS_BY_FONT_SIZE} by (letter, fontSize)
 * directly -- family/bold/italic variants for non-'C' letters are not
 * corpus-captured yet, same scope boundary this module's own doc
 * comment already draws for 'C'.
 */
export function lookupSizedGlyph(
  letter: string,
  fontSize: number,
  fontFamily?: string,
  bold?: boolean,
  italic?: boolean,
): SizedGlyph | undefined {
  if (letter === 'C') {
    const variant = BADGE_GLYPH_C_BY_VARIANT[variantKey(fontSize, fontFamily, bold ?? false, italic ?? false)];
    return variant ?? BADGE_GLYPH_C_BY_FONT_SIZE[fontSize];
  }
  return BADGE_GLYPH_OTHER_LETTERS_BY_FONT_SIZE[letter]?.[fontSize];
}
