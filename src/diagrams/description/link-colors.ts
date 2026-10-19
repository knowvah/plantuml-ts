/**
 * link-colors.ts -- the trailing `#color` of a description link line (`A --> B #aaa`, `#line:blue;text:red`).
 *
 * `CommandLinkElement.java:118,124-126` captures it with `ColorParser.simpleColor(ColorType.LINE)` and
 * `:329` stores `Colors` on the link (`link.setColors(color().getColor(arg, ...))`); the bracket colour
 * is applied afterwards (`:330` `link.applyStyle`, `WithLinkType.setSpecificColor` -> `colors.add(LINE, c)`,
 * `WithLinkType.java:68-74`), so a bracket `[#c]` overrides the trailing LINE colour.
 * `SvekEdge.java:884-893` draws the line AND the arrowhead with `getColors().getColor(ARROW, LINE)`;
 * `:260-262` mutes the label font with the same `Colors` (TEXT); `:903-904` takes its specific stroke from
 * `Colors.getLineStyle()`. Parsing follows `Colors(String, HColorSet, ColorType)` (`Colors.java:95-124`).
 */

export interface LinkColors {
  /** `ColorType.LINE`: the bare token or `line:<c>`. */
  line?: string;
  /** `ColorType.ARROW` (`arrow:<c>`); wins over LINE in `getColor(ARROW, LINE)`. */
  arrow?: string;
  /** `ColorType.TEXT` (`text:<c>`): the label font colour. */
  text?: string;
  /** `line.dashed` / `line.dotted` / `line.bold` (`Colors.java:117-122`). */
  lineStyle?: 'dashed' | 'dotted' | 'bold';
}

const LINE_STYLE_RE = /line\.(dashed|dotted|bold)/;

/** @param raw the captured `color` group (no leading `#`), or undefined. */
export function parseLinkColors(raw: string | undefined): LinkColors {
  const result: LinkColors = {};
  if (raw === undefined) return result;
  const data = raw.toLowerCase().replaceAll('#', '');
  for (const token of data.split(';')) {
    if (token === '') continue;
    const colon = token.indexOf(':');
    if (colon === -1) {
      if (!token.includes('.')) result.line = token;
      continue;
    }
    const dot = token.indexOf('.');
    const key = token.slice(0, dot === -1 || dot > colon ? colon : dot);
    const value = token.slice(colon + 1);
    if (key === 'line' || key === 'arrow' || key === 'text') result[key] = value;
  }
  const style = LINE_STYLE_RE.exec(data)?.[1];
  if (style === 'dashed' || style === 'dotted' || style === 'bold') result.lineStyle = style;
  return result;
}
