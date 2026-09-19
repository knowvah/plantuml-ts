/**
 * Shared SVG formatting rules — decimal precision, color shortening, and
 * opacity/percent formatting. Both SVG emitters import this module so the
 * six rules cannot drift between them (ADR-3,
 * `plans/svg-output-size-reduction/decisions.md`).
 *
 * Precision (`decimals`) is always threaded in by the caller (ADR-2) — this
 * module never applies a default or a scale factor itself.
 *
 * A leaf module: no imports from klimt or any diagram engine. T8 collapsed
 * `number-format.ts`'s duplicate `javaFixed4`/`trimTrailingZeros` rounding
 * into this module (ADR-3, single shared rules module) — `number-format.ts`
 * is now a thin re-export shim over this file, kept only for its handful of
 * pre-existing bare-side-effect importers.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/svg/SvgGraphics.java
 */

/** Upstream's `SvgOption.decimal` default (`SvgOption` constructor). */
export const DEFAULT_SVG_DECIMALS = 3;

/**
 * Renders `%.<decimals>f` (Locale.US, HALF_UP) the way Java's
 * `java.util.Formatter` does it — HALF_UP rounding applied to the value's
 * SHORTEST ROUND-TRIP DECIMAL STRING, not to its exact IEEE754 binary
 * value. Java's Formatter builds its decimal digits via
 * `FloatingDecimal`/`FormattedFloatingDecimal` (the same "shortest string
 * that reads back to this double" algorithm `Double.toString` uses), then
 * rounds THAT digit string HALF_UP. JS's `Number.prototype.toFixed`
 * instead rounds the double's true (long, often non-terminating) binary
 * expansion — for a value whose shortest decimal sits exactly on a
 * rounding boundary (e.g. 8.69375 at 4 places, whose real double is
 * 8.6937499999999996447...), `toFixed(4)` rounds DOWN ("8.6937") while
 * Java's `%.4f` rounds UP ("8.6938"): the last-decimal-digit divergence
 * jar-verified against `component/luniju-97-tuja870`'s `text/@textLength`
 * (mission G1/I4, originally isolated in the now-retired `number-format.ts
 * #javaFixed4`, T8 folded its 4-decimal-only predecessor into this
 * generalized `N`-decimal version).
 * `Number.prototype.toString()` already implements the same "shortest
 * round-trip decimal" class of algorithm `Double.toString` does, so
 * reusing it here — rather than re-deriving digits from the binary
 * mantissa — reproduces Java's rounding INPUT faithfully without a second
 * bespoke float-to-decimal implementation.
 */
function javaFixedN(x: number, decimals: number): string {
  const neg = x < 0;
  const shortest = Math.abs(x).toString();
  // `toString()` only switches to exponential notation for |x| >= 1e21 or
  // 0 < |x| < 1e-6 -- SVG pixel geometry never reaches either extreme (nor
  // does the jar's own %.<n>f range), so a plain decimal-notation string is
  // assumed below.
  /* v8 ignore next 3 -- unreachable for SVG geometry, see comment above */
  if (shortest.includes('e')) {
    return Math.abs(x).toFixed(decimals);
  }
  const dot = shortest.indexOf('.');
  const intPart = dot < 0 ? shortest : shortest.slice(0, dot);
  const fracPart = dot < 0 ? '' : shortest.slice(dot + 1);
  // Pad to (at least) decimals+1 fractional digits so there is always a
  // digit to make the HALF_UP round/no-round decision on.
  const padded = (fracPart + '0'.repeat(decimals + 1)).slice(0, Math.max(decimals + 1, fracPart.length));
  const keep = padded.slice(0, decimals);
  const roundUp = padded.charCodeAt(decimals) - 48 >= 5;
  let digits = intPart + keep; // decimal point implicitly `decimals` digits from the right
  if (roundUp) digits = (BigInt(digits) + 1n).toString();
  if (decimals === 0) {
    return (neg ? '-' : '') + digits;
  }
  const fracOut = digits.slice(-decimals);
  const intOut = digits.length > decimals ? digits.slice(0, digits.length - decimals) : '0';
  return (neg ? '-' : '') + intOut + '.' + fracOut;
}

/**
 * Trims the trailing zeros (and the decimal point itself, if nothing
 * follows it) off a `%.<n>f`-formatted numeric string.
 * @see .../klimt/drawing/svg/SvgGraphics.java#trimZeros
 */
export function trimZeros(s: string): string {
  const dot = s.indexOf('.');
  if (dot < 0) return s;
  let end = s.length - 1;
  while (end > dot && s[end] === '0') end--;
  if (end === dot) end--;
  return s.slice(0, end + 1);
}

/**
 * Formats a coordinate/length value at `decimals` places. `x === 0` short-
 * circuits to `"0"` (upstream keeps this even though the general path would
 * also reduce to `"0"`, matching upstream's own short-circuit exactly).
 * Does NOT apply a scale factor — upstream's `format(double)` multiplies by
 * `option.getScale()` before this step; that is the emitter's job.
 * @see .../klimt/drawing/svg/SvgGraphics.java#format
 */
export function formatDecimal(x: number, decimals: number): string {
  if (x === 0) return '0';
  return trimZeros(javaFixedN(x, decimals));
}

/**
 * {@link formatDecimal} at the default precision — for the numeric values
 * that get interpolated into markup directly rather than passed through
 * `svg.ts#attrs` (which threads `decimals` per ADR-2; these sites have no
 * options object to thread it from).
 *
 * Shared rather than redefined per module: upstream reaches SVG through a
 * single `SvgGraphics.format(double)`, so one formatting entry point here
 * is the faithful shape. Three byte-identical private copies of this
 * function had accumulated (`svg.ts`, `svg-shapes.ts`,
 * `class-visibility-icon.ts`) before it was hoisted.
 *
 * @see .../klimt/drawing/svg/SvgGraphics.java#format
 */
export function fmt(x: number): string {
  return formatDecimal(x, DEFAULT_SVG_DECIMALS);
}

/**
 * Shortens `#RRGGBB` into `#RGB` when each pair has two identical digits.
 * Longer forms (`#RRGGBBAA`) and named/url colors pass through unchanged.
 * Null/undefined-safe (mirrors Java's `String` nullability).
 * @see .../klimt/drawing/svg/SvgGraphics.java#shortenColor
 */
export function shortenColor(color: string): string {
  if (!color || color.length !== 7 || color.charAt(0) !== '#') {
    return color;
  }
  if (
    color.charAt(1) === color.charAt(2) &&
    color.charAt(3) === color.charAt(4) &&
    color.charAt(5) === color.charAt(6)
  ) {
    return '#' + color.charAt(1) + color.charAt(3) + color.charAt(5);
  }
  return color;
}

/**
 * Formats an opacity value (0..1) at `max(decimals, 2)` places, with
 * `<= 0 -> "0"` / `>= 1 -> "1"` short-circuits.
 * @see .../klimt/drawing/svg/SvgGraphics.java#formatOpacity
 */
export function formatOpacity(value: number, decimals: number): string {
  if (value <= 0) return '0';
  if (value >= 1) return '1';
  return trimZeros(javaFixedN(value, Math.max(decimals, 2)));
}

/**
 * Formats a fraction (0..1) as a percentage string at `max(decimals, 2)`
 * places, e.g. `0.5 -> "50%"`.
 * @see .../klimt/drawing/svg/SvgGraphics.java#formatPercent
 */
export function formatPercent(value: number, decimals: number): string {
  const percent = value * 100;
  return trimZeros(javaFixedN(percent, Math.max(decimals, 2))) + '%';
}

/**
 * Escapes characters that are special in an XML **attribute value** (always
 * double-quoted): `&`, `<`, and `"`. Line-for-line port of `XmlWriter.java`'s
 * private `escapeAttribute`; hoisted here (SI-saea T2/D1) so `xml-writer.ts`
 * has a single implementation instead of a private copy.
 * @see .../klimt/drawing/svg/XmlWriter.java#escapeAttribute (:244-275)
 */
export function escapeAttribute(input: string): string {
  return input.replace(ATTRIBUTE_ESCAPE_RE, (c) => XML_ENTITIES[c] ?? c);
}

// Entity table shared by both escapers. The regexes are built from strings,
// not literals: the complexity hook miscounts a regex literal containing `<`
// (same workaround `svg.ts` used). Expressed as `replace` over a character
// class rather than a hand-rolled loop so static analysis (CodeQL's HTML
// sanitizer model) can see WHICH characters are covered -- a loop is opaque
// to it and every attribute built on top of these was flagged as unsanitized
// (PR #59 review). Same bytes as the loop; pinned in svg-format.test.ts.
const XML_ENTITIES: Readonly<Record<string, string>> = { '&': '&amp;', '<': '&lt;', '"': '&quot;' };
const ATTRIBUTE_ESCAPE_RE = new RegExp('[&<"]', 'g');
const TEXT_ESCAPE_RE = new RegExp('[&<]', 'g');

/**
 * Escapes characters that are special in XML **text content**: only `&` and
 * `<` are mandatory -- `>` is special only as part of the `]]>` sequence,
 * which cannot occur in text content, so it is left unescaped. Line-for-line
 * port of `XmlWriter.java`'s private `escapeText`; hoisted here (SI-saea
 * T2/D1) alongside {@link escapeAttribute}.
 * @see .../klimt/drawing/svg/XmlWriter.java#escapeText (:244-275)
 */
export function escapeText(input: string): string {
  return input.replace(TEXT_ESCAPE_RE, (c) => XML_ENTITIES[c] ?? c);
}

/**
 * Defangs a value for use inside an XML **comment** (`<!--...-->`): `--`
 * (illegal inside a comment, and the mechanism a `-->` breakout payload
 * relies on) is replaced with `- -`; if the result then ends in `-`, a
 * single space is appended so the trailing `-` cannot merge with the
 * comment's own closing `-->`. Line-for-line port of `XmlWriter.java`'s
 * `comment(String)` body; hoisted here (SI-saea T3c/D8) so both
 * `xml-writer.ts#comment` and the plain-string `renderer-group.ts` comment
 * sinks share one implementation instead of `xml-writer.ts` alone mirroring
 * the jar.
 * @see .../klimt/drawing/svg/XmlWriter.java#comment (:114-127)
 */
export function escapeComment(value: string): string {
  const safe = value.split('--').join('- -');
  return safe.endsWith('-') ? safe + ' ' : safe;
}
