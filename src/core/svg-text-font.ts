/**
 * Text emission rules that depend on the FONT FAMILY — the SVG-safe family
 * string, PlantUML's `monospaced` -> CSS `monospace` rename, and the two NBSP
 * substitutions.
 *
 * Split out of ./svg-shapes.ts at B10/M12, which pushed that file past the
 * repo's 500-line cap (it was already over). Pure move plus the rename fix;
 * every symbol keeps its name and its doc comment. Same `core/svg*.ts`
 * namespace the SVG-emission-seam fitness test scopes to
 * (`tests/architecture/svg-emission-seam.test.ts`).
 */
import { ROOT_FONT_FAMILY } from './svg.js';

/**
 * Normalize a raw skinparam font-family value for SVG attribute emission.
 *
 * `skinparam defaultFontName "Liberation Mono"` retains its surrounding
 * quotes as part of the theme's raw string (mirrors upstream's own
 * `FontStack#fullDefinition`, which keeps them too) -- but `attrs()` below
 * does no XML escaping, so embedding a literal `"` inside a `"`-delimited
 * attribute value produces malformed XML. Upstream's own SVG writer
 * (`FontStack#getSvgFamily`, klimt/font/FontStack.java:187) resolves this
 * the SAME way: swap `"` for `'` rather than stripping/escaping -- jar-
 * verified (`tipude-10-tizi427`: `font-family="'Liberation Mono'"`). G2 N12.
 */
// Built from a string (not a regex literal) — a regex literal containing a
// double quote makes the complexity checker mis-tokenize the rest of the
// file (same workaround as paint.ts / svg.ts).
const DQUOTE_RE = new RegExp('"', 'g');

function toSvgFontFamily(family: string | undefined): string | undefined {
  return family === undefined ? undefined : family.replace(DQUOTE_RE, "'");
}

/**
 * B10/M12: PlantUML's own LOGICAL font name `monospaced` is renamed to the
 * CSS generic `monospace` before anything else reads the family.
 *
 * Upstream does this once, inside `if (fontFamily != null)` and BEFORE both
 * of the two tests that follow it — the `DEFAULT_FONT_FAMILY` comparison that
 * decides whether to emit the attribute at all, and the
 * `monospace`/`courier` test that swaps spaces for NBSP
 * (`klimt/drawing/svg/SvgGraphics.java:716-729`, carrying its own link to
 * the `svg-monospace-output-has-wrong-font-family` QA report). Both consumers
 * must therefore see the renamed value, which is why this is its own function
 * rather than a branch inside either one.
 *
 * The comparison is `equalsIgnoreCase` against the WHOLE family, never a
 * substring: a CSS stack like `Courier, monospaced` does not qualify.
 *
 * This seam had the rename on the NBSP half only ({@link nbspIfMonospace}),
 * so `""monospaced""` creole emitted the raw logical name as the attribute
 * VALUE while correctly NBSP-substituting its text. The klimt-drawn engines'
 * copy of the rule (`core/klimt/drawing/svg/svg-graphics-elements.ts
 * #applyTextFontFamily`) already had both halves.
 */
function renameLogicalMonospace(family: string): string {
  return family.toLowerCase() === 'monospaced' ? 'monospace' : family;
}

/**
 * Rule 3, per-element half: `font-family` is emitted only when it DIFFERS
 * from the family hoisted onto the document root (`svg.ts#svgRoot`), compared
 * case-insensitively exactly as upstream does. Every `<text>` in the default
 * family inherits it and emits nothing.
 * @see .../klimt/drawing/svg/SvgGraphics.java#text
 */
export function textFontFamily(family: string | undefined): string | undefined {
  const svgFamily = toSvgFontFamily(family);
  if (svgFamily === undefined) return undefined;
  // B10/M12: upstream renames BEFORE this comparison — see
  // {@link renameLogicalMonospace}.
  const renamed = renameLogicalMonospace(svgFamily);
  if (renamed.toLowerCase() === ROOT_FONT_FAMILY) return undefined;
  return renamed;
}


/**
 * A whitespace-ONLY label has every space swapped for NBSP (U+00A0):
 *
 * ```java
 * if (text.matches("^\\s*$"))
 *     text = text.replace(' ', (char) 160);
 * ```
 * @see .../klimt/drawing/svg/DriverTextSvg.java:115-116
 *
 * The guard is what makes this narrow, and it is easy to get wrong in the
 * generous direction: ordinary labels keep their regular spaces (verified
 * across the cached class corpus — `'int size'`, `'some page header'`), so a
 * blanket substitution would corrupt every multi-word label in the port.
 *
 * It fires in practice for json's nested-value cell, whose display string is
 * three spaces (`TextBlockJson.java:194`); the jar writes `\xa0\xa0\xa0`.
 *
 * `core/klimt/drawing/svg/driver-text-svg.ts#leadingSpaceAdjust` carries the
 * same rule for the klimt-drawn engines. This is the copy for every engine
 * that emits through these shared shape functions.
 */
const NBSP = ' ';
const WHITESPACE_ONLY_RE = new RegExp('^\\s*$');

function nbspIfBlank(content: string): string {
  return WHITESPACE_ONLY_RE.test(content) ? content.split(' ').join(NBSP) : content;
}

/**
 * `StringUtils.trin(String)` — trims only characters whose code point is
 * <= U+0020, from both ends. Deliberately NOT JS's `.trim()`, which also
 * strips U+00A0 per the ECMAScript WhiteSpace production: that would swallow
 * the very NBSPs {@link nbspIfBlank} just inserted (0xA0 > 0x20).
 *
 * `core/klimt/drawing/svg/driver-text-svg.ts#trin` is the same port for the
 * klimt-drawn engines; this is the copy for the shared shape emitters.
 * @see .../klimt/drawing/svg/DriverTextSvg.java:125
 */
function trin(text: string): string {
  let start = 0;
  let end = text.length - 1;
  while (start <= end && text.charCodeAt(start) <= 0x20) start++;
  while (end >= start && text.charCodeAt(end) <= 0x20) end--;
  return text.slice(start, end + 1);
}

/**
 * The exact string the jar puts inside a `<text>`, given the raw label.
 *
 * ORDER IS LOAD-BEARING and matches `DriverTextSvg#draw` (`:114-125`):
 * whitespace-only → NBSP FIRST, then `trin`. Reversed, a whitespace-only label
 * would be trimmed to nothing before it could become NBSP, and json's
 * three-space nested cell (`TextBlockJson.java:194`) would vanish instead of
 * rendering as `\xa0\xa0\xa0`.
 *
 * Exported because the value that reaches `textLength` must be measured from
 * THIS form, not the raw one — upstream measures after both steps
 * (`dim = calculateDimension(font, trimmed)`, `:126`). Any caller computing a
 * width for a label it will emit through {@link text} has to agree with it.
 *
 * Not ported: `leadingSpaceAdjust`'s conversion of leading spaces into an `x`
 * advance (`:118-124`). It needs a measurer, which these emitters do not have.
 * Verified unexercised by the current corpus — across 3,548 jar `<text>`
 * elements in the json/yaml goldens, ZERO carry leading or trailing
 * whitespace, so nothing in it survives to be positioned.
 */
export function emittedTextForm(content: string, fontFamily?: string): string {
  return nbspIfMonospace(trin(nbspIfBlank(content)), fontFamily);
}

/**
 * The SECOND, independent NBSP rule — and the one whose absence here made a
 * monospace label look like the whitespace-only rule was mis-scoped:
 *
 * ```java
 * if ("monospaced".equalsIgnoreCase(fontFamily))
 *     fontFamily = "monospace";
 * …
 * if (fontFamily.equalsIgnoreCase("monospace") || fontFamily.equalsIgnoreCase("courier"))
 *     text = text.replace(' ', (char) 160);
 * ```
 * @see .../klimt/drawing/svg/SvgGraphics.java:720-728
 *
 * EVERY space becomes NBSP under a monospace or courier family, whitespace-only
 * or not — which is why the jar writes
 * `Your\xa0data\xa0does\xa0not\xa0sound\xa0like\xa0JSON\xa0data` for a message
 * that {@link nbspIfBlank} would leave completely alone.
 *
 * Three details, all load-bearing:
 *  - The comparison is `equalsIgnoreCase` against the WHOLE family, not a
 *    substring. A CSS stack like `"Courier, monospace"` does NOT qualify.
 *  - `monospaced` (PlantUML's own logical font name) is renamed to `monospace`
 *    BEFORE the test, so it qualifies through the rename.
 *  - Upstream applies this in `SvgGraphics#text`, AFTER `DriverTextSvg` has
 *    already measured and passed `textLength` down. So it is emission-only:
 *    the width still reflects the SPACE-bearing string. Hence its position
 *    here, outside anything a caller measures.
 *
 * `core/klimt/drawing/svg/svg-graphics-elements.ts#applyTextFontFamily` is the
 * same rule for the klimt-drawn engines, which already had it; this is the
 * copy for every engine emitting through these shared shape functions.
 */
function nbspIfMonospace(content: string, fontFamily: string | undefined): string {
  if (fontFamily === undefined) return content;
  const lower = (fontFamily.toLowerCase() === 'monospaced' ? 'monospace' : fontFamily).toLowerCase();
  if (lower !== 'monospace' && lower !== 'courier') return content;
  return content.split(' ').join(NBSP);
}
