import type { UGraphic } from '../../UGraphic.js';
import type { ResolvedColor } from '../../color/HColorSet.js';
import { PragmaKey } from '../../../skin/PragmaKey.js';
import type { Pragma } from '../../../skin/Pragma.js';
import { SvgNanoParser } from '../SvgNanoParser.js';
import { SvgSaxParser } from './SvgSaxParser.js';

/**
 * Which SVG sprite parser draws a sprite: `nano` (the default) or `sax`
 * (`!pragma svgparser sax`). As-const object, not an enum: the values cross
 * declaration boundaries.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svg/parser/SvgSpriteParserFactory.java:99-105
 */
export const SvgParserSelector = {
  NANO: 'nano',
  SAX: 'sax',
} as const;
export type SvgParserSelector = (typeof SvgParserSelector)[keyof typeof SvgParserSelector];

/**
 * The part of `ISvgSpriteParser` the sprite draw sites call; both
 * {@link SvgNanoParser} and {@link SvgSaxParser} satisfy it.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svg/parser/SvgSpriteParserFactory.java:79 (ISvgSpriteParser)
 */
export interface SvgSpriteParser {
  drawU(
    ug: UGraphic,
    scale: number,
    fontColor: ResolvedColor | undefined,
    forcedColor: ResolvedColor | undefined,
  ): void;
}

/** `String#trim` strips every char `<= U+0020`, not JS's wider whitespace set. */
const JAVA_TRIM_RE = /^[\u0000- ]+|[\u0000- ]+$/g;

/**
 * The selector for a pragma: `sax` only when `svgparser` is defined with a
 * value that, trimmed and lower-cased, is `sax`; a missing pragma, an undefined
 * key, a `null` or blank value, or any other value is `nano`
 * (`getParserSelector` returns the raw value and `create` compares it with
 * `"sax"`; every non-`sax` string reaches the `SvgNanoParser` return).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svg/parser/SvgSpriteParserFactory.java:109-121
 */
export function getParserSelector(pragma: Pragma | undefined): SvgParserSelector {
  if (pragma === undefined || !pragma.isDefine(PragmaKey.SVG_PARSER)) return SvgParserSelector.NANO;
  const value = pragma.getValue(PragmaKey.SVG_PARSER);
  if (value === null) return SvgParserSelector.NANO;
  const selector = value.replace(JAVA_TRIM_RE, '').toLowerCase();
  return selector === SvgParserSelector.SAX ? SvgParserSelector.SAX : SvgParserSelector.NANO;
}

/**
 * `SvgSpriteParserFactory#create` after the selector is known: `SvgSaxParser`
 * for `sax`, `SvgNanoParser` otherwise. The fragment concatenation and the
 * `md5map` placeholder replacement (`:82-89`) have no work to do here: the
 * port's sprite definitions arrive as one string whose `data:image/png;base64,`
 * runs were never replaced by `;md5,` placeholders (that replacement only
 * feeds `UmlSource`'s seed, `uml-source-lines.ts#patchBase64Line`). The
 * `TeaVM.isTeaVM()` nano override (`:95-96`) has no analogue: this port never
 * runs under TeaVM and `SvgSaxParser` has no JVM-only dependency here.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svg/parser/SvgSpriteParserFactory.java:79-107
 */
export function createSvgSpriteParser(svg: string, selector: SvgParserSelector): SvgSpriteParser {
  return selector === SvgParserSelector.SAX ? new SvgSaxParser(svg) : new SvgNanoParser(svg);
}
