/**
 * BackSlash — line-separator/escape constants and the `\n`
 * hide/reveal-via-private-use-block round trip `preproc/Define.java`
 * uses to protect a literal `\n` inside a `!define` macro body from the
 * preprocessor's own line splitting.
 *
 * Upstream: text/BackSlash.java. Ported: `BS_BS_N`, `NEWLINE`,
 * `CHAR_NEWLINE`, `lineSeparator`, `hiddenNewLine`,
 * `translateBackSlashes`, `untranslateBackSlashes`.
 *
 * `lineSeparator()` (java:50-52, `System.lineSeparator()`): this port has
 * no OS/platform line-ending concept (`src/` is browser-only, `CLAUDE.md`
 * — no Node `os`/`process`), so this always returns `"\n"`, matching the
 * value every non-Windows JVM (and every browser) already produces —
 * this port never diverges from a Windows JVM's `"\r\n"`, since no
 * caller in this port's reachable scope needs that value (T9a's own
 * `.agent-notes/T9a-creoleparser.md` audit trail establishes the same
 * "no OS-specific behavior" precedent for this port's whole `src/`).
 *
 * `hiddenNewLine()` (java:54-57) returns `Jaws.BLOCK_E1_NEWLINE`
 * (`jaws/Jaws.java:47`, the private-use sentinel `''`) — NOT the
 * SAME constant as `src/core/tim/builtin/jaws-constants.ts`'s own
 * `BLOCK_E1_NEWLINE` export (that file pins the empty-string PLACEHOLDER
 * value deliberately, because `USE_BLOCK_E1_IN_NEWLINE_FUNCTION` is
 * FALSE for its own TIM-preprocessor `%newline()`/`%breakline()`
 * builtins — see that file's own doc comment). Every real caller of
 * `BackSlash.hiddenNewLine()` (`klimt/creole/Display.java:337`,
 * `klimt/creole/legacy/StripeTable.java:184`,
 * `utils/BlocLines.java:300`) uses it UNCONDITIONALLY, not gated behind
 * that flag, so the genuine sentinel value is defined locally here
 * instead of reusing that unrelated placeholder.
 *
 * `translateBackSlashes`/`untranslateBackSlashes` (java:59-95) use
 * `StringUtils.PRIVATE_BLOCK` (`StringUtils.java:116`, `''`).
 * `StringUtils.java` (588 lines) is a large, general string-utility class
 * with dozens of unrelated responsibilities and no TS counterpart
 * anywhere in this port (grep-verified) — porting it whole to relocate
 * one constant would silently widen this task's write-set, the same
 * "scoped reimplementation, not a full port" call `utils/
 * SignatureUtils.ts`'s MD5 relocation already established (T8b). The one
 * constant this file actually needs is defined locally instead.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/text/BackSlash.java
 */

/** `jaws/Jaws.java:47` — `BLOCK_E1_NEWLINE`. See the module doc comment
 *  for why this is NOT `tim/builtin/jaws-constants.ts`'s own export. */
const BLOCK_E1_NEWLINE = '';

/** `StringUtils.java:116` — `PRIVATE_BLOCK`. */
const PRIVATE_BLOCK_CODE = 0xe000;

/** Upstream: `BackSlash#isEnglishLetterOfBackSlash` (java:77-80) — the
 *  Java itself only accepts `'n'` (the `a-zA-Z` general case is commented
 *  out upstream, java:79), ported verbatim including that restriction. */
function isEnglishLetterOfBackSlash(c: string): boolean {
  return c === 'n';
}

/** Upstream: `BackSlash#translateChar` (java:97-102). */
function translateChar(c: string): string {
  const code = c.charCodeAt(0);
  if (code > 128) throw new Error('IllegalArgumentException');
  return String.fromCharCode(PRIVATE_BLOCK_CODE + code);
}

export class BackSlash {
  static readonly BS_BS_N = '\\n';
  static readonly NEWLINE = '\n';
  static readonly CHAR_NEWLINE = '\n';

  /** Upstream: `BackSlash#lineSeparator` (java:50-52). See the module doc
   *  comment for why this always returns `"\n"` in this port. */
  static lineSeparator(): string {
    return '\n';
  }

  /** Upstream: `BackSlash#hiddenNewLine` (java:54-57). */
  static hiddenNewLine(): string {
    return BLOCK_E1_NEWLINE;
  }

  /** Upstream: `BackSlash#translateBackSlashes` (java:59-75) — replaces
   *  every `\n` (backslash followed by the letter `n`) with a
   *  private-use-block-shifted `n`, so a later line-split pass cannot
   *  mistake it for a real newline escape. */
  static translateBackSlashes(s: string | null): string | null {
    if (s === null) return null;

    let result = '';
    for (let i = 0; i < s.length; i++) {
      const c = s.charAt(i);
      const next = i < s.length - 1 ? s.charAt(i + 1) : '';
      if (c === '\\' && i < s.length - 1 && isEnglishLetterOfBackSlash(next)) {
        result += '\\';
        result += translateChar(next);
        i++;
      } else {
        result += c;
      }
    }
    return result;
  }

  /** Upstream: `BackSlash#untranslateBackSlashes` (java:82-95) — reverses
   *  {@link translateBackSlashes}'s private-use-block shift on every
   *  character that falls inside that block's range. */
  static untranslateBackSlashes(s: string | null): string | null {
    if (s === null) return null;

    let result = '';
    for (let i = 0; i < s.length; i++) {
      let c = s.charAt(i);
      const code = c.charCodeAt(0);
      if (code > PRIVATE_BLOCK_CODE && code < 0xe07f) {
        c = String.fromCharCode(code - PRIVATE_BLOCK_CODE);
      }
      result += c;
    }
    return result;
  }
}
