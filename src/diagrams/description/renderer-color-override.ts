/**
 * renderer-color-override.ts -- per-entity inline `#color;line:..` parsing,
 * split out of `renderer-entity.ts` (already at the 500-line cap) so the note
 * renderer (`renderer-note.ts`) can share it without an import cycle. Pure
 * move: the code below is byte-identical to what lived in `renderer-entity.ts`.
 */
import type { Paint } from '../../core/paint.js';
import { parseColor } from '../../core/paint.js';
import { UStroke } from '../../core/klimt/UStroke.js';

/** Per-entity inline color/style override (`#orange;line:blue`,
 *  `#line.dashed`) — mirrors upstream `Colors` (klimt/color/Colors.java)
 *  token parsing: `;`-separated tokens, a bare no-colon/no-dot token is the
 *  mainType (BACK, `ColorParser.simpleColor(ColorType.BACK)` —
 *  CommandCreateElementFull.java:119) color, `name:value` tokens set
 *  `line`/`text`/`back` (ColorType.getType strips the `.dashed` suffix
 *  before matching, so `line.dashed:x` — never emitted by upstream syntax
 *  — would still key on `line`), and a bare `line.dashed`/`line.dotted`/
 *  `line.bold` token (excluded from the color map since it contains a
 *  `.`) sets the line STYLE (`Colors.java:117-122`). `shadowing:` and
 *  `header`/`arrow` keys have no consumer in this renderer (undocumented
 *  gap — no reachable description fixture exercises them; see
 *  `ColorOverride`'s own doc comment). Named CSS colors (`orange`, `blue`),
 *  bare hex without a leading `#` (stripped by this function's own
 *  `data = raw.toLowerCase().replace(/#/g, '')`), and already-`#RRGGBB`
 *  values all flow as plain `Paint` strings into `back`/`line`/`text` and
 *  are resolved to the jar's canonical uppercase hex at SVG-emission time
 *  by `svg-graphics-core.ts`'s `fixColor`/`createSvgGradient` (G1c: the
 *  ~150-name `klimt/color/ColorTrieNode.ts` table; I2, T19 closed).
 *  `back` (only) is additionally run through `paint.ts#parseColor` (G1 I5h):
 *  a compound two-color token (`red|green`, `yellow\ffffff`) resolves to a
 *  {@link Paint} `Gradient`, which `EntityImageDescriptionPaint.backcolor`
 *  already accepts (the klimt draw path was always Paint-aware — only this
 *  parse site never produced one). `line`/`text` stay plain strings: no
 *  reachable fixture exercises a border or text gradient, and
 *  `FontConfiguration.color` is `string | null`, not `Paint`. */
export interface ColorOverride {
  back?: Paint;
  line?: string;
  text?: string;
  lineStyle?: 'dashed' | 'dotted' | 'bold';
}

export function parseColorOverride(raw: string): ColorOverride {
  const data = raw.toLowerCase().replace(/#/g, '');
  const result: ColorOverride = {};
  for (const token of data.split(';')) {
    if (token.length === 0) continue;
    const colonIdx = token.indexOf(':');
    if (colonIdx === -1) {
      // G1 I5h: the bare (mainType/BACK) token may be a two-color gradient
      // (`red|green`, `yellow\ffffff`) -- upstream's `Colors.java` feeds
      // this same token straight into `ColorParser.simpleColor`, which
      // resolves through `HColorSet#getColorOrWhite` (gradient-aware,
      // klimt/color/HColorSet.java:107-119) exactly like a skinparam
      // background value already does (`skinparam.ts`'s `parseColor` call).
      if (!token.includes('.')) result.back = parseColor(token);
      continue;
    }
    const name = token.slice(0, colonIdx);
    const value = token.slice(colonIdx + 1);
    const dotIdx = name.indexOf('.');
    const key = dotIdx === -1 ? name : name.slice(0, dotIdx);
    if (key === 'line') result.line = value;
    else if (key === 'text') result.text = value;
    else if (key === 'back') result.back = parseColor(value);
  }
  if (data.includes('line.dashed')) result.lineStyle = 'dashed';
  else if (data.includes('line.dotted')) result.lineStyle = 'dotted';
  else if (data.includes('line.bold')) result.lineStyle = 'bold';
  return result;
}

/** `LinkStyle.getStroke3()` (decoration/LinkStyle.java:97-107) — the three fixed dash patterns upstream uses for
 *  `line.dashed`/`.dotted`/`.bold`, all with `nonZeroThickness()` = 1 (no thickness override syntax reaches element
 *  declarations). `undefined` when there is no inline line style: `Colors#getSpecificLineStroke()` is then null and the
 *  style's own stroke stands. */
export function lineStyleStroke(lineStyle: ColorOverride['lineStyle']): UStroke | undefined {
  if (lineStyle === 'dashed') return new UStroke(7, 7, 1);
  if (lineStyle === 'dotted') return new UStroke(1, 3, 1);
  if (lineStyle === 'bold') return UStroke.withThickness(2);
  return undefined;
}
