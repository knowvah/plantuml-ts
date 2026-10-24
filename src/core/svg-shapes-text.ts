/**
 * SVG text emitters (`<text>`, stacked-`<tspan>` text, single `<tspan>`).
 * Split out of `svg-shapes.ts` (line cap); re-exported from there so existing
 * import sites are unchanged. Pure move -- no logic differs.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/svg/SvgGraphics.java#text
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/svg/DriverTextSvg.java
 */

import { attrs, escapeXmlText, resolvePaint, type TextStyle } from './svg.js';
import { textFontFamily, emittedTextForm } from './svg-text-font.js';
import { backColorFilterDef } from './svg-defs.js';

/**
 * `<text>` element with plain (un-tspan-wrapped) text content.
 *
 * G2 N4: previously ALWAYS wrapped content in a bare `<tspan>` -- removed.
 * jar's own single-run text draws (`SvgGraphicsCore#text`/
 * `svg-graphics-elements.ts`'s own `setTextContent`, which this port's
 * klimt path already mirrors with zero `<tspan>`) never wrap a simple
 * string in `<tspan>` at all -- `<tspan>` is reserved for MULTI-styled-run
 * or explicit multi-LINE text, each getting its OWN dedicated `<tspan
 * x="..." y="...">` (e.g. `diagrams/activity/renderer.ts`'s own multiline
 * builder, which never calls this function). Verified: 0/351+ cached jar
 * fixtures across `state`/`object` (the two other `core/svg.ts#text()`
 * consumers surveyed) contain a `<tspan>` for a single-run label; this was
 * a universal, cross-diagram-type divergence (`svg/g/g/text/tspan`,
 * 407/718 reach in class's own census alone, `plans/g2-class-svg/
 * ledger.md` N4) -- description/component/usecase are UNAFFECTED (klimt-
 * drawn, never call this function; their own census stays byte-identical).
 *
 * Content is XML-escaped. Style attributes are placed on the outer `<text>`.
 *
 * Leading spaces are trimmed WITHOUT moving `x` (this emitter has no measurer).
 * A caller whose run can start with a space must shift `x` by one space width
 * per space and measure `textLength` on the trimmed text, via
 * `driverTextPlacement` (DriverTextSvg.java:118-126); none of the core callers
 * (usymbol icon labels, node labels, the dispatcher notice) emit such a run.
 */
/**
 * Rule 5: a one-character label has no inter-character spacing to adjust, so
 * `textLength` is skipped for it (upstream's own `text.length() > 1` guard
 * and its rationale). `textLength` stays per-element otherwise — unlike
 * `lengthAdjust`, it is not inheritable.
 */
function textLengthOf(content: string, textLength: number | undefined): number | undefined {
  return content.length > 1 ? textLength : undefined;
}

/**
 * `for (Map.Entry e : attributes.entrySet()) elt.setAttribute(k, v)`
 * (`SvgGraphics.java:737-738`), after every other attribute: a key the
 * element already has keeps its position and takes the new value
 * (`XmlNode#setAttribute` is a map put), any other is appended.
 */
function withSvgAttributes(
  entries: ReadonlyArray<readonly [string, string | number | undefined]>,
  extra: ReadonlyMap<string, string> | undefined,
): ReadonlyArray<readonly [string, string | number | undefined]> {
  if (extra === undefined) return entries;
  // An entry holding `undefined` is an attribute never set.
  const merged = entries.filter(([, value]) => value !== undefined);
  for (const [name, value] of extra) {
    const at = merged.findIndex(([existing]) => existing === name);
    if (at < 0) merged.push([name, value]);
    else merged[at] = [name, value];
  }
  return merged;
}

export function text(x: number, y: number, rawContent: string, style: TextStyle = {}): string {
  const content = emittedTextForm(rawContent, style.fontFamily);
  const fillR = resolvePaint(style.fill);
  // `SvgGraphics#text`'s `textBackColor` arm (`SvgGraphics.java:733-736`):
  // register the `feFlood` filter for the colour and reference it. The def
  // rides inline next to the element, like `resolvePaint`'s gradient def;
  // `svg-defs.ts#extractFilterDefs` lifts and dedups it at assembly.
  const back = style.textBackColor === undefined ? undefined : backColorFilterDef(style.textBackColor);
  const set = [
    ['x', x],
    ['y', y],
    ['font-family', textFontFamily(style.fontFamily)],
    ['font-size', style.fontSize],
    ['font-weight', style.fontWeight],
    ['font-style', style.fontStyle],
    ['fill', fillR.value],
    ['text-anchor', style.textAnchor],
    ['transform', style.transform],
    ['dominant-baseline', style.dominantBaseline],
    ['text-decoration', style.textDecoration],
    // Rule 3: no `lengthAdjust` — hoisted onto the document root and
    // inherited. `TextStyle.lengthAdjust` is kept as a field (callers still
    // set it) but is no longer emitted per element.
    ['textLength', textLengthOf(content, style.textLength)],
    ['filter', back === undefined ? undefined : `url(#${back.id})`],
  ] as const;
  const a = attrs(withSvgAttributes(set, style.svgAttributes));
  return `${back?.def ?? ''}${fillR.def}<text${a}>${escapeXmlText(content)}</text>`;
}

/**
 * `<text>` with stacked `<tspan>` children -- one per line, advancing the
 * baseline by `lineHeight`. Upstream has no single element for this (its
 * `TextBlock` composes one `svgText` per line), but five byte-identical
 * hand-built copies existed in `activity-renderer-shapes.ts` alone, each
 * with its own `toFixed(1)` and its own three-`replace` XML escaping. This
 * is the one emitter they now share, so rules 1-3 reach them.
 *
 * The parent `<text>` carries the shared attributes only; `x`/`y` live on
 * the tspans, which is why this cannot just call {@link text}.
 */
export function multilineText(
  lines: readonly string[],
  x: number,
  firstBaselineY: number,
  lineHeight: number,
  style: TextStyle = {},
): string {
  const fillR = resolvePaint(style.fill);
  const a = attrs([
    ['text-anchor', style.textAnchor],
    ['font-family', textFontFamily(style.fontFamily)],
    ['font-size', style.fontSize],
    ['font-weight', style.fontWeight],
    ['font-style', style.fontStyle],
    ['fill', fillR.value],
  ] as const);
  const tspans = lines
    .map((ln, i) => {
      const ta = attrs([
        ['x', x],
        ['y', firstBaselineY + lineHeight * i],
      ] as const);
      return `<tspan${ta}>${escapeXmlText(ln)}</tspan>`;
    })
    .join('');
  return `${fillR.def}<text${a}>${tspans}</text>`;
}

/**
 * A single `<tspan>`. Same attribute choke point as {@link text}, so a color
 * inside a creole run shortens exactly like one on a plain label -- they did
 * not, and `spansToTspan` also emitted its content raw, producing invalid
 * XML for any text containing `&` or `<`.
 */
export function tspan(content: string, style: TextStyle = {}): string {
  const fillR = resolvePaint(style.fill);
  const a = attrs([
    ['fill', fillR.value],
    ['font-weight', style.fontWeight],
    ['font-style', style.fontStyle],
    ['text-decoration', style.textDecoration],
  ] as const);
  return `${fillR.def}<tspan${a}>${escapeXmlText(content)}</tspan>`;
}
