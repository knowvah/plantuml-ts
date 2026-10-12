/**
 * JLaTeXMath's font parameters, styles and inter-atom glue: the numbers
 * `DefaultTeXFont`, `TeXEnvironment`, `Glue` and `SpaceAtom` hand to the box
 * builders. Glyph metrics are NOT here; they come from KaTeX
 * (`katex-glyphs.ts`), which ships the same Computer Modern TFM metrics.
 *
 * Source: JLaTeXMath 1.0.7 (`~/git/plantuml/gradle/libs.versions.toml:12`),
 * sources jar from Maven Central. File:line citations below are into that
 * jar's `org/scilab/forge/jlatexmath/`.
 */

// ---------------------------------------------------------------------------
// Styles (`TeXConstants.java:237-260`) and their transitions
// (`TeXEnvironment.java:150-295`)
// ---------------------------------------------------------------------------

export const STYLE_DISPLAY = 0;
export const STYLE_TEXT = 2;
export const STYLE_SCRIPT = 4;
export const STYLE_SCRIPT_SCRIPT = 6;

/** `TeXEnvironment#crampStyle` (java:150-154). */
export const crampStyle = (style: number): number => (style % 2 === 1 ? style : style + 1);
/** `TeXEnvironment#denomStyle` (java:160-164). */
export const denomStyle = (style: number): number => 2 * Math.trunc(style / 2) + 1 + 2 - 2 * Math.trunc(style / 6);
/** `TeXEnvironment#numStyle` (java:236-240). */
export const numStyle = (style: number): number => style + 2 - 2 * Math.trunc(style / 6);
/** `TeXEnvironment#subStyle` (java:281-285). */
export const subStyle = (style: number): number => 2 * Math.trunc(style / 4) + 4 + 1;
/** `TeXEnvironment#supStyle` (java:291-295). */
export const supStyle = (style: number): number => 2 * Math.trunc(style / 4) + 4 + (style % 2);
/** `TeXEnvironment#rootStyle` (java:255-259). */
export const ROOT_STYLE = STYLE_SCRIPT_SCRIPT;

/** `DefaultTeXFont.xml:60`: `scriptfactor="0.7"`. */
const SCRIPT_FACTOR = 0.7;
/** `DefaultTeXFont.xml:60`: `scriptscriptfactor="0.5"`. */
const SCRIPT_SCRIPT_FACTOR = 0.5;

/** `DefaultTeXFont#getSizeFactor` (java:571-580); `textfactor` is 1
 *  (`DefaultTeXFont.java:115`). */
export function sizeFactor(style: number): number {
  if (style < STYLE_SCRIPT) return 1;
  return style < STYLE_SCRIPT_SCRIPT ? SCRIPT_FACTOR : SCRIPT_SCRIPT_FACTOR;
}

// ---------------------------------------------------------------------------
// `DefaultTeXFont.xml:53-56` <Parameters>, each read through
// `getParameter(name) * getSizeFactor(style) * PIXELS_PER_POINT`
// (`DefaultTeXFont.java:241-477`); `PIXELS_PER_POINT` is 1
// (`TeXFormula.java:106`).
// ---------------------------------------------------------------------------

const PARAMETERS = {
  num1: 0.676508,
  num2: 0.393732,
  num3: 0.443731,
  denom1: 0.685951,
  denom2: 0.344841,
  sup1: 0.412892,
  sup2: 0.362892,
  sup3: 0.288889,
  sub1: 0.15,
  sub2: 0.247217,
  supdrop: 0.386108,
  subdrop: 0.05,
  axisheight: 0.25,
  defaultrulethickness: 0.039999,
  bigopspacing1: 0.111112,
  bigopspacing2: 0.166667,
  bigopspacing3: 0.2,
  bigopspacing4: 0.6,
  bigopspacing5: 0.1,
} as const;

export type FontParameter = keyof typeof PARAMETERS;

/** `DefaultTeXFont#get<Parameter>(style)`. */
export function param(name: FontParameter, style: number): number {
  return PARAMETERS[name] * sizeFactor(style);
}

/** x-height of `jlm_cmmi10`/`jlm_cmr10`/`jlm_cmsy10`/`jlm_cmex10`
 *  (`fonts/base/jlm_cmmi10.xml:2`, `fonts/latin/jlm_cmr10.xml:2`,
 *  `fonts/maths/jlm_cmsy10.xml:2`, `fonts/base/jlm_cmex10.xml:2`). */
export const XHEIGHT_CM = 0.430555;
/** x-height of `jlm_cmbx10`, the `\mathbf` font
 *  (`fonts/latin/optional/jlm_cmbx10.xml:2`). */
export const XHEIGHT_CMBX = 0.444445;
/** `quad` of `jlm_cmsy10`, the mu font (`DefaultTeXFont.xml:60`
 *  `mufontid="jlm_cmsy10"`; `fonts/maths/jlm_cmsy10.xml:2`). */
const MU_FONT_QUAD = 1.000003;
/** `space` of `jlm_cmr10`, the space font (`DefaultTeXFont.xml:60`
 *  `spacefontid="jlm_cmr10"`; `fonts/latin/jlm_cmr10.xml:2`). */
const SPACE_FONT_SPACE = 0.333334;

/** `DefaultTeXFont#getXHeight(style, fontCode)` (java:480-483); a missing
 *  font is the mu font (`ScriptsAtom.java:96-97`). */
export const xHeight = (style: number, fontXHeight: number | undefined): number =>
  (fontXHeight ?? XHEIGHT_CM) * sizeFactor(style);

/** `TeXEnvironment#getSpace` → `DefaultTeXFont#getSpace(style)`
 *  (java:446-450): the blank between words in text mode. */
export const interwordSpace = (style: number): number => SPACE_FONT_SPACE * sizeFactor(style);

// ---------------------------------------------------------------------------
// `SpaceAtom` units (`SpaceAtom.java` `unitConversions`;
// `TeXConstants.java:271-358`). `env.getSize()` is the icon's point size,
// 20 (`TeXIconBuilder.java:65`), so every absolute unit is relative to it.
// ---------------------------------------------------------------------------

/** `TeXIconBuilder.java:65`: `setSize((float) 20)`. */
export const TEX_ICON_SIZE = 20;

const ABSOLUTE_UNIT_PIXELS: Readonly<Record<string, number>> = {
  px: 1,
  bp: 1,
  pc: 12,
  cm: 28.346456693,
  mm: 2.8346456693,
  in: 72,
  sp: 65536,
  pt: 0.9962640099,
  dd: 1.0660349422,
  cc: 12.792419307,
};

/** `SpaceAtom.getFactor(unit, env)` for KaTeX's unit names; `undefined` for
 *  a unit JLaTeXMath does not know. */
export function unitFactor(unit: string, style: number): number | undefined {
  if (unit === 'em') return sizeFactor(style);
  if (unit === 'ex') return xHeight(style, undefined);
  if (unit === 'mu') return muUnit(style);
  const px = ABSOLUTE_UNIT_PIXELS[unit];
  return px === undefined ? undefined : px / TEX_ICON_SIZE;
}

/** `UNIT_MU`: `tf.getQuad(style, muFontId) / 18`. */
export const muUnit = (style: number): number => (MU_FONT_QUAD * sizeFactor(style)) / 18;

// ---------------------------------------------------------------------------
// Atom types (`TeXConstants.java:112-158`) and the glue table
// (`GlueSettings.xml:53-209`, read by `Glue.get`, `Glue.java`)
// ---------------------------------------------------------------------------

export const TYPE_ORDINARY = 0;
export const TYPE_BIG_OPERATOR = 1;
export const TYPE_BINARY_OPERATOR = 2;
export const TYPE_RELATION = 3;
export const TYPE_OPENING = 4;
export const TYPE_CLOSING = 5;
export const TYPE_PUNCTUATION = 6;
export const TYPE_INNER = 7;

/** `GlueSettings.xml:54-57`, in mu. */
const THIN = 3;
const MED = 4;
const THICK = 5;

/** Rows: left type ord..inner; columns: right type ord..inner. A positive
 *  entry applies in display and text style only; a negative entry (thin
 *  spaces next to an operator) applies in every style
 *  (`GlueSettings.xml:67-209`). */
const GLUE_TABLE: readonly (readonly number[])[] = [
  /* ord   */ [0, -THIN, MED, THICK, 0, 0, 0, THIN],
  /* op    */ [-THIN, -THIN, 0, THICK, 0, 0, 0, THIN],
  /* bin   */ [MED, MED, 0, 0, MED, 0, 0, MED],
  /* rel   */ [THICK, THICK, 0, 0, THICK, 0, 0, THICK],
  /* open  */ [0, 0, 0, 0, 0, 0, 0, 0],
  /* close */ [0, -THIN, MED, THICK, 0, 0, 0, THIN],
  /* punct */ [THIN, MED, 0, THICK, THIN, THIN, MED, THICK],
  /* inner */ [THIN, -THIN, MED, THICK, THIN, 0, THIN, THIN],
];

/** `Glue.get(lType, rType, env)`: types above INNER count as ORDINARY. */
export function glueWidth(left: number, right: number, style: number): number {
  const l = left > TYPE_INNER ? TYPE_ORDINARY : left;
  const r = right > TYPE_INNER ? TYPE_ORDINARY : right;
  const entry = GLUE_TABLE[l]?.[r] ?? 0;
  if (entry === 0) return 0;
  if (entry > 0 && style >= STYLE_SCRIPT) return 0;
  return Math.abs(entry) * muUnit(style);
}
