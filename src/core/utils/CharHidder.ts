/**
 * CharHidder — the '~' tile escape: `~X` (where X is a creole-active
 * character) and `\~` are remapped into the Unicode private-use area
 * (U+E000 + charCode) by {@link CharHidder.hide} so the creole layer
 * never sees them as markup, then restored by {@link CharHidder.unhide}
 * after parsing.
 *
 * Upstream: utils/CharHidder.java — ported in full (all 6 members).
 *
 * Overlap note (A2s F-G, `src/diagrams/class/class-layout-helpers.ts:159-162`):
 * the class engine documents its own equivalent of the leading-'#'
 * tilde-escape behavior inline. This class is the faithful BASE port
 * (SI1 T3); the class engine keeps its jar-verified path untouched until
 * its own migration mission adopts this module.
 *
 * Visibility deviation (reported): upstream's `hideChar`/`unhideChar`
 * are `private static` and, in the current upstream source, have no
 * intra-file caller (`hide`/`unhide` inline the same U+E000 arithmetic).
 * They are ported `public static` here so the ADR-1 "callerless is not
 * unreachable" members remain testable; behavior is identical.
 */
export class CharHidder {
  /** @see net/sourceforge/plantuml/utils/CharHidder.java#addTileAtBegin */
  static addTileAtBegin(s: string): string {
    return '~' + s;
  }

  /**
   * Hides `\~` as U+E000+'~' and `~X` (X in {@link CharHidder.isToBeHidden}'s
   * set) as U+E000+X; a `~` pair with any other follower passes through
   * with BOTH characters consumed (no re-scan of the second char).
   * Returns the SAME string when nothing was hidden (upstream returns
   * the original reference).
   *
   * @see net/sourceforge/plantuml/utils/CharHidder.java#hide
   */
  static hide(s: string): string {
    const len = s.length;
    let buf: string[] | null = null; // allocated lazily on first match
    let i = 0;
    while (i < len) {
      const c = s.charAt(i);
      if (c === '\\' && i + 1 < len && s.charAt(i + 1) === '~') {
        if (buf === null) buf = s.slice(0, i).split('');
        buf.push(String.fromCharCode(0xe000 + 0x7e)); // '' + '~'
        i += 2;
      } else if (c === '~' && i + 1 < len) {
        const c2 = s.charAt(i + 1);
        if (CharHidder.isToBeHidden(c2)) {
          if (buf === null) buf = s.slice(0, i).split('');
          buf.push(String.fromCharCode(0xe000 + c2.charCodeAt(0)));
          i += 2;
        } else {
          if (buf !== null) {
            buf.push(c);
            buf.push(c2);
          }
          i += 2;
        }
      } else {
        if (buf !== null) buf.push(c);
        i++;
      }
    }
    // #lizard forgives -- faithful port of upstream's single-pass scanner
    // (CharHidder.java#hide); the branch shape IS the ported behavior
    // (do-not-refactor-while-porting, CLAUDE.md).
    return buf === null ? s : buf.join('');
  }

  /** @see net/sourceforge/plantuml/utils/CharHidder.java#isToBeHidden */
  private static isToBeHidden(c: string): boolean {
    if (
      c === '_' ||
      c === '-' ||
      c === '\x22' || // the double-quote glyph (hex-escaped: lizard-safe, see memory)
      c === '#' ||
      c === ']' ||
      c === '[' ||
      c === '*' ||
      c === '.' ||
      c === '/' ||
      c === '<'
    )
      return true;

    // #lizard forgives -- faithful port of upstream's 10-way character
    // whitelist (CharHidder.java#isToBeHidden), one comparison per
    // hideable char (do-not-refactor-while-porting, CLAUDE.md).
    return false;
  }

  /**
   * @see net/sourceforge/plantuml/utils/CharHidder.java#hideChar
   * (upstream-private; see the module doc comment)
   */
  static hideChar(c: string): string {
    const code = c.charCodeAt(0);
    if (code > 255) throw new Error('IllegalArgumentException');

    return String.fromCharCode(0xe000 + code);
  }

  /**
   * @see net/sourceforge/plantuml/utils/CharHidder.java#unhideChar
   * (upstream-private; see the module doc comment)
   */
  static unhideChar(c: string): string {
    const code = c.charCodeAt(0);
    if (code >= 0xe000 && code <= 0xe0ff) return String.fromCharCode(code - 0xe000);

    return c;
  }

  /**
   * Restores every U+E000..U+E0FF char to its original; returns the SAME
   * string when none is present (upstream returns the original reference).
   *
   * @see net/sourceforge/plantuml/utils/CharHidder.java#unhide
   */
  static unhide(s: string): string {
    const len = s.length;
    for (let i = 0; i < len; i++) {
      const code = s.charCodeAt(i);
      if (code >= 0xe000 && code <= 0xe0ff) {
        // First hidden char found at position i.
        let out = s.substring(0, i);
        for (let j = i; j < len; j++) out += CharHidder.unhideChar(s.charAt(j));
        return out;
      }
    }
    return s;
  }
}
