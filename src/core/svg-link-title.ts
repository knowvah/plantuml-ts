/** Matches `<U+XXXX>` escapes in a link tooltip.
 *  @see ~/git/plantuml/.../klimt/drawing/svg/SvgGraphics.java:1144 (`p`) */
const UNICODE_ESCAPE = /<U\+([0-9A-Fa-f]+)>/g;

/** A literal backslash followed by `n` (two chars, not a newline).
 *  @see SvgGraphics.java:1158 (`replaceAll("\\\\n", "\n")`) */
const LITERAL_BACKSLASH_N = /\\n/g;

/**
 * The value the jar writes to both `title` and `xlink:title` of a link:
 * a null title yields the url; otherwise each `<U+XXXX>` becomes the UTF-16
 * code unit with that hex code (`(char) Integer.parseInt(num, 16)` truncates
 * to 16 bits, as `String.fromCharCode` does) and every literal two-char `\n`
 * becomes a newline.
 * @see ~/git/plantuml/.../klimt/drawing/svg/SvgGraphics.java:1147-1160
 *      (`LinkData#getXlinkTitle`), written twice at `:1170-1172`
 */
export function linkTitle(url: string, title: string | undefined): string {
  if (title === undefined) return url;
  return title
    .replace(UNICODE_ESCAPE, (_match, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(LITERAL_BACKSLASH_N, '\n');
}
