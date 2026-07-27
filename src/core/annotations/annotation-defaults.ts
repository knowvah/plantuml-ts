/**
 * Base defaults — plantuml.skin document{} / mainframe{} blocks, verbatim.
 *
 * @see ~/git/plantuml/src/main/resources/skin/plantuml.skin:1-90 (root {},
 *   document {}, mainframe {} — the verbatim base values below)
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/font/FontParam.java
 *   (HEADER/FOOTER hardcode defaultColor "#888888" — matches plantuml.skin's
 *   `#8` shorthand; TITLE/CAPTION/LEGEND fall back to FontParamConstant.COLOR
 *   "black", i.e. the root default)
 */

import { HorizontalAlignment } from '../klimt/geom/HorizontalAlignment.js';
import type { AnnotationBoxStyle, AnnotationElement } from './annotation-style-types.js';
import { expandGrayShorthand } from './annotation-color.js';
import { ZERO_SIDES } from './annotation-clockwise.js';

/** G2 N45: `plantuml.skin`'s own literal `FontName SansSerif` is Java's
 *  INTERNAL AWT logical-font name, not the CSS-ready value the jar's SVG
 *  writer actually emits (`FontStack#getSvgFamily` maps the logical name to
 *  the CSS generic family at serialization time -- `klimt/font/FontStack
 *  .java:187`). Every OTHER font-family default in this port already
 *  resolved to the CSS name (`theme.ts#defaultTheme.fontFamily ===
 *  'sans-serif'`) -- this was the one remaining raw-logical-name literal,
 *  discovered via `svg/g/g/text/@font-family` (85-fixture reach in the
 *  class census alone, `plans/g2-class-svg/ledger.md` N45). `blocks.ts
 *  #drawLine` passes this straight through to `core/svg.ts#text()`, which
 *  does no logical->CSS mapping of its own (`toSvgFontFamily` only swaps
 *  quote characters) -- the value must already be CSS-ready at the source.
 *  Measurement is UNAFFECTED: neither `WidthTableMeasurer`
 *  (`DeterministicMeasurer`, font-agnostic) nor `JarMeasurer` (selects its
 *  metrics table by `font.weight`, never `font.family`) reads this string
 *  for width lookup -- see `measurer.ts`/`measurer-jar.ts`'s own doc
 *  comments. */
const ROOT_FONT_FAMILY = 'sans-serif';
const ROOT_FONT_COLOR = 'black';
const ROOT_FONT_STYLE = 'plain' as const;
const ROOT_ROUND_CORNER = 0;
const ROOT_LINE_COLOR = '#181818';
/** `plantuml.skin:15` (`root{}`'s own `LineThickness 1.0`). */
const ROOT_LINE_THICKNESS = 1;

export const BASE_DEFAULTS: Record<AnnotationElement, AnnotationBoxStyle> = {
  // plantuml.skin:30-38
  title: {
    horizontalAlignment: HorizontalAlignment.CENTER,
    fontSize: 14,
    fontStyle: 'bold',
    fontColor: ROOT_FONT_COLOR,
    fontFamily: ROOT_FONT_FAMILY,
    backgroundColor: null,
    lineColor: null,
    roundCorner: ROOT_ROUND_CORNER,
    lineThickness: ROOT_LINE_THICKNESS,
    documentBackground: '',
    padding: { top: 5, right: 5, bottom: 5, left: 5 },
    margin: { top: 5, right: 5, bottom: 5, left: 5 },
  },
  // plantuml.skin:23-29 (Padding/Margin unset anywhere in the cascade -> 0)
  header: {
    horizontalAlignment: HorizontalAlignment.RIGHT,
    fontSize: 10,
    fontStyle: ROOT_FONT_STYLE,
    fontColor: expandGrayShorthand('#8'),
    fontFamily: ROOT_FONT_FAMILY,
    backgroundColor: null,
    lineColor: null,
    roundCorner: ROOT_ROUND_CORNER,
    lineThickness: ROOT_LINE_THICKNESS,
    documentBackground: '',
    padding: ZERO_SIDES,
    margin: ZERO_SIDES,
  },
  // plantuml.skin:39-45
  footer: {
    horizontalAlignment: HorizontalAlignment.CENTER,
    fontSize: 10,
    fontStyle: ROOT_FONT_STYLE,
    fontColor: expandGrayShorthand('#8'),
    fontFamily: ROOT_FONT_FAMILY,
    backgroundColor: null,
    lineColor: null,
    roundCorner: ROOT_ROUND_CORNER,
    lineThickness: ROOT_LINE_THICKNESS,
    documentBackground: '',
    padding: ZERO_SIDES,
    margin: ZERO_SIDES,
  },
  // plantuml.skin:54-61
  caption: {
    horizontalAlignment: HorizontalAlignment.CENTER,
    fontSize: 14,
    fontStyle: ROOT_FONT_STYLE,
    fontColor: ROOT_FONT_COLOR,
    fontFamily: ROOT_FONT_FAMILY,
    backgroundColor: null,
    lineColor: null,
    roundCorner: ROOT_ROUND_CORNER,
    lineThickness: ROOT_LINE_THICKNESS,
    documentBackground: '',
    padding: ZERO_SIDES,
    margin: { top: 1, right: 1, bottom: 1, left: 1 },
  },
  // plantuml.skin:46-53 (HorizontalAlignment unset here and in document{} ->
  // falls back to root{}'s "HorizontalAlignment left", plantuml.skin:12)
  legend: {
    horizontalAlignment: HorizontalAlignment.LEFT,
    fontSize: 14,
    fontStyle: ROOT_FONT_STYLE,
    fontColor: ROOT_FONT_COLOR,
    fontFamily: ROOT_FONT_FAMILY,
    backgroundColor: expandGrayShorthand('#D'),
    lineColor: 'black',
    roundCorner: 15,
    lineThickness: ROOT_LINE_THICKNESS,
    documentBackground: '',
    padding: { top: 5, right: 5, bottom: 5, left: 5 },
    margin: { top: 12, right: 12, bottom: 12, left: 12 },
  },
  // plantuml.skin:85-89 (mainframe is a root{} sibling, not a document{}
  // child — unset fields fall back straight to root{}, not through
  // document{}'s BackGroundColor white; LineThickness 1.5 is out of scope,
  // no `lineThickness` field on AnnotationBoxStyle per the T2 contract)
  mainframe: {
    horizontalAlignment: HorizontalAlignment.LEFT,
    fontSize: 14,
    fontStyle: ROOT_FONT_STYLE,
    fontColor: ROOT_FONT_COLOR,
    fontFamily: ROOT_FONT_FAMILY,
    backgroundColor: null,
    lineColor: ROOT_LINE_COLOR,
    roundCorner: ROOT_ROUND_CORNER,
    // plantuml.skin:85 -- mainframe's OWN LineThickness override (1.5),
    // not root's 1.0 -- see this field's doc comment on the interface.
    lineThickness: 1.5,
    documentBackground: '',
    padding: { top: 1, right: 5, bottom: 1, left: 5 },
    margin: { top: 10, right: 5, bottom: 10, left: 5 },
  },
};

export function cloneBoxStyle(style: AnnotationBoxStyle): AnnotationBoxStyle {
  return { ...style, padding: { ...style.padding }, margin: { ...style.margin } };
}
