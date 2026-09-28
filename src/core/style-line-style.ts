/**
 * `PName.LineStyle` -- the dash half of a style's stroke, and the skinparam
 * front-end that writes it (`skinparam <sname>BorderStyle`). cdd6 T1a (D2).
 *
 * Upstream keeps LineStyle as a raw string and parses it only when a drawer
 * asks for the stroke (`Style#getStroke`, `Style.java:299-320`); the port's
 * flat element buckets store the parsed dash instead, because the bucket is
 * read by renderers that never see the raw style value. Thickness stays a
 * separate property (`PName.LineThickness`, `ElementColors.lineThickness`),
 * exactly as upstream resolves the two PNames independently.
 */

/**
 * The dash pattern of a `UStroke` (`klimt/UStroke.java`): `dashVisible` on,
 * `dashSpace` off. `{0, 0}` is a solid stroke -- `UStroke.withThickness`,
 * which is what `Style#getStroke` returns for an empty or unparseable value.
 */
export interface LineStyleDash {
  readonly dashVisible: number;
  readonly dashSpace: number;
}

const SOLID: LineStyleDash = { dashVisible: 0, dashSpace: 0 };

/** `new StringTokenizer(dash, "-;,")` -- empty tokens are skipped. */
const DASH_DELIMITERS = /[-;,]/;

/** `Double.parseDouble(token.trim())`, `undefined` where Java throws. */
function parseDashNumber(token: string): number | undefined {
  const trimmed = token.trim();
  if (trimmed === '') return undefined;
  const n = Number(trimmed);
  return Number.isNaN(n) ? undefined : n;
}

/**
 * `Style#getStroke(thicknessParam, styleParam)`'s dash half: an empty value
 * is solid; otherwise the first token is `dashVisible` and the second (if
 * any) `dashSpace`, which defaults to `dashVisible`; any parse failure falls
 * back to solid (the `catch` arm).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/Style.java:303-320
 */
export function lineStyleDash(dash: string): LineStyleDash {
  if (dash.length === 0) return SOLID;
  const tokens = dash.split(DASH_DELIMITERS).filter((t) => t.length > 0);
  const dashVisible = tokens[0] === undefined ? undefined : parseDashNumber(tokens[0]);
  if (dashVisible === undefined) return SOLID;
  if (tokens[1] === undefined) return { dashVisible, dashSpace: dashVisible };
  const dashSpace = parseDashNumber(tokens[1]);
  return dashSpace === undefined ? SOLID : { dashVisible, dashSpace };
}

/**
 * What a `<sname>BorderStyle` skinparam registers on `{<sname>}`: the
 * `LineStyle` raw value, plus the `LineThickness`/`FontColor` side effects
 * `readValue` adds for a complex (`;`-separated or `text:`) value.
 */
export interface BorderStyleConversion {
  lineStyle?: string;
  lineThickness?: number;
  fontColor?: string;
}

/** `readValue`'s `bold` arm: `LineThickness 2`. */
const BOLD_LINE_THICKNESS = 2;

/**
 * `FromSkinparamToStyle#readValue` for one token of a complex value. Each
 * arm writes the SAME datas (`{<sname>}`); later registrations overwrite
 * earlier ones for the same PName, as `StyleBuilder` merges them.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/FromSkinparamToStyle.java:361-376
 */
function readValue(read: string, out: BorderStyleConversion): void {
  if (read.startsWith('text:')) {
    // `read.split(":")[1]` -- Java's split drops the trailing empty string,
    // so a bare `text:` throws upstream; skip it rather than store ''.
    const color = read.split(':')[1];
    if (color !== undefined && color !== '') out.fontColor = color;
  } else if (read.startsWith('line.dotted')) {
    out.lineStyle = '1;3';
  } else if (read.startsWith('line.dashed')) {
    out.lineStyle = '7;7';
  } else if (read.toLowerCase().includes('bold')) {
    out.lineThickness = BOLD_LINE_THICKNESS;
  }
}

/** `convertNow`'s value rewrites that precede the knowledge lookup. */
function normaliseBorderStyleValue(value: string): string {
  if (value.toLowerCase() === 'right:right') return 'right';
  if (value.toLowerCase() === 'dotted') return '1;3';
  if (value.toLowerCase() === 'dashed') return '7;7';
  return value;
}

/**
 * `FromSkinparamToStyle#convertNow` for a key whose only registration is
 * `addConvert(cleanName + "BorderStyle", PName.LineStyle, sname)` (every
 * `addMagic` SName, `:277`). `dotted`/`dashed` are rewritten to `1;3`/`7;7`
 * FIRST, and the result is then a complex value: `convertNow` keeps only its
 * first `;` token as the LineStyle (so `dotted` draws `1,1`, jar-verified),
 * feeds the rest to `readValue`, and registers the main value last unless it
 * is the blank a leading `;` produces.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/FromSkinparamToStyle.java:305-359,378-384
 */
export function convertBorderStyleValue(raw: string): BorderStyleConversion {
  let value = normaliseBorderStyleValue(raw);
  const out: BorderStyleConversion = {};
  if (value.includes(';')) {
    if (value.startsWith(';')) value = ` ${value}`;
    const tokens = value.split(';').filter((t) => t.length > 0);
    value = tokens[0] ?? ' ';
    for (const read of tokens.slice(1)) readValue(read, out);
  } else if (value.startsWith('text:')) {
    readValue(value, out);
    return out;
  }
  if (value !== ' ') out.lineStyle = value;
  return out;
}
